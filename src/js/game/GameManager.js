/**
 * GameManager.js
 * Manages the overall game state for a Chaos RPG match.
 *
 * Phases:
 *   DECK_BUILD  – Players search Scryfall and assemble their decks.
 *   MULLIGAN    – Players may take a free mulligan (draw a new hand of 7).
 *   MAIN        – Normal turn structure: draw → play cards → attack → end.
 *   COMBAT      – Champion attacks are resolved.
 *   END         – One player's Champion HP has reached 0; display result.
 */
import { EventEmitter } from '../EventEmitter.js';
import { Champion } from './Champion.js';
import { GameStats } from './GameStats.js';
import * as ChaosFormat from './ChaosFormat.js';

/** @enum {string} */
export const Phase = {
  DECK_BUILD: 'DECK_BUILD',
  MULLIGAN: 'MULLIGAN',
  MAIN: 'MAIN',
  COMBAT: 'COMBAT',
  END: 'END',
};

/** Delay (ms) between AI actions to give the player time to see what happens. */
const AI_ACTION_DELAY_MS = 800;

export class GameManager extends EventEmitter {
  constructor() {
    super();
    this.currentPhase = Phase.DECK_BUILD;
    this.currentPlayerIndex = 0;
    this.turnNumber = 0;

    /** @type {Champion[]} */
    this.champions = [];

    /** @type {import('./CardData.js').CardData[][]} */
    this.decks = [[], []];
    /** @type {import('./CardData.js').CardData[][]} */
    this.hands = [[], []];
    /** @type {import('./CardData.js').CardData[][]} */
    this.battlefields = [[], []];
    /** @type {import('./CardData.js').CardData[][]} */
    this.graveyards = [[], []];

    /** @type {string[]} */
    this.gameLog = [];

    /** Session-level statistics for the local player (index 0). */
    this.stats = new GameStats();

    this._resetState();
  }

  // ── Setup ───────────────────────────────────────────────────────────────────

  _resetState() {
    this.champions = [
      new Champion('Player 1'),
      new Champion('Player 2'),
    ];
    this.decks = [[], []];
    this.hands = [[], []];
    this.battlefields = [[], []];
    this.graveyards = [[], []];
    this.currentPlayerIndex = 0;
    this.turnNumber = 0;
    this.gameLog = [];
  }

  /**
   * Configure champion names before starting a game.
   * @param {number} playerIndex
   * @param {string} playerName
   */
  setPlayerName(playerIndex, playerName) {
    if (playerIndex >= 0 && playerIndex < this.champions.length) {
      this.champions[playerIndex].playerName = playerName;
    }
  }

  /**
   * Load a finalized deck (from DeckBuilder.finalizeForGame()) for a player.
   * @param {number} playerIndex
   * @param {import('./CardData.js').CardData[]} deck
   */
  loadDeck(playerIndex, deck) {
    this.decks[playerIndex] = deck;
    this._log(`Deck loaded for ${this.champions[playerIndex].playerName} (${deck.length} cards).`);
  }

  // ── Phase transitions ───────────────────────────────────────────────────────

  /** Begin the game: deal opening hands and move to the Mulligan phase. */
  startGame() {
    if (this.decks[0].length === 0 || this.decks[1].length === 0) {
      console.error('GameManager: Cannot start game — one or both decks are empty.');
      return;
    }
    this._setPhase(Phase.MULLIGAN);
    for (let i = 0; i < 2; i++) {
      ChaosFormat.drawCards(this.decks[i], this.hands[i], ChaosFormat.STARTING_HAND_SIZE);
      this._log(`${this.champions[i].playerName} draws opening hand.`);
    }
    this.turnNumber = 1;
    this.emit('turnStarted', this.currentPlayerIndex);
  }

  /**
   * The active player takes a free mulligan.
   * @param {number} playerIndex
   */
  takeMulligan(playerIndex) {
    if (this.currentPhase !== Phase.MULLIGAN) return;
    // Return hand to deck and reshuffle
    while (this.hands[playerIndex].length > 0) {
      this.decks[playerIndex].push(this.hands[playerIndex].pop());
    }
    ChaosFormat.shuffleDeck(this.decks[playerIndex]);
    ChaosFormat.drawCards(this.decks[playerIndex], this.hands[playerIndex], ChaosFormat.STARTING_HAND_SIZE);
    this._log(`${this.champions[playerIndex].playerName} mulligans and draws a new hand.`);
  }

  /** Both players are satisfied; begin the first main phase. */
  beginMainPhase() {
    this._setPhase(Phase.MAIN);
    this._log(`Turn ${this.turnNumber} begins. ${this.champions[this.currentPlayerIndex].playerName}'s turn.`);
    // Active player draws a card (except turn 1 for player 0)
    if (this.turnNumber > 1 || this.currentPlayerIndex === 1) {
      this._drawForActivePlayer();
    }
  }

  // ── Turn actions ────────────────────────────────────────────────────────────

  /**
   * Play a card from the active player's hand onto the battlefield.
   * @param {number} handIndex
   * @returns {boolean}
   */
  playCard(handIndex) {
    if (this.currentPhase !== Phase.MAIN) {
      this._log('Cards can only be played during the Main phase.');
      return false;
    }
    const playerHand = this.hands[this.currentPlayerIndex];
    if (handIndex < 0 || handIndex >= playerHand.length) return false;

    const card = playerHand.splice(handIndex, 1)[0];

    // Trigger chaos effect
    this._log(`⚡ Chaos Effect for ${card.name}: ${card.chaosEffect}`);

    if (card.isLand()) {
      this.battlefields[this.currentPlayerIndex].push(card);
    } else {
      this.graveyards[this.currentPlayerIndex].push(card);
      if (card.isCreature()) {
        this.battlefields[this.currentPlayerIndex].push(card);
      }
    }

    if (this.currentPlayerIndex === 0) {
      this.stats.recordCardPlayed();
    }
    this.emit('cardPlayed', this.currentPlayerIndex, card);
    this._log(`${this.champions[this.currentPlayerIndex].playerName} plays ${card.name}.`);
    return true;
  }

  /**
   * Move to Combat phase; the active player's Champion attacks.
   * @returns {boolean}
   */
  declareAttack() {
    if (this.currentPhase !== Phase.MAIN) return false;
    this._setPhase(Phase.COMBAT);

    const attacker = this.champions[this.currentPlayerIndex];
    const defenderIndex = 1 - this.currentPlayerIndex;
    const defender = this.champions[defenderIndex];

    defender.takeDamage(attacker.attack);
    if (this.currentPlayerIndex === 0) {
      this.stats.recordDamage(attacker.attack);
    }
    this.emit('championDamaged', defenderIndex, attacker.attack);
    this._log(
      `${attacker.playerName} attacks for ${attacker.attack} damage! ` +
      `${defender.playerName} now has ${defender.hp} HP.`
    );

    if (!defender.isAlive()) {
      this.stats.recordGame(this.currentPlayerIndex === 0);
      this._setPhase(Phase.END);
      this.emit('gameOver', this.currentPlayerIndex);
      this._log(`🏆 ${attacker.playerName} wins!`);
      return true;
    }

    // Return to main for post-combat actions
    this._setPhase(Phase.MAIN);
    return true;
  }

  /** End the active player's turn and pass to the other player. */
  endTurn() {
    if (this.currentPhase !== Phase.MAIN) return;
    this.currentPlayerIndex = 1 - this.currentPlayerIndex;
    if (this.currentPlayerIndex === 0) {
      this.turnNumber++;
    }
    this._drawForActivePlayer();
    this._log(`--- Turn ${this.turnNumber}: ${this.champions[this.currentPlayerIndex].playerName}'s turn ---`);
    this.emit('turnStarted', this.currentPlayerIndex);

    // If it is now the AI player's turn, run auto-turn after a short delay.
    if (this.currentPlayerIndex === 1 && this.currentPhase === Phase.MAIN) {
      this._scheduleAITurn();
    }
  }

  // ── AI auto-turn ──────────────────────────────────────────────────────────

  /** Schedule the AI to take its turn after a visible delay. */
  _scheduleAITurn() {
    setTimeout(() => this._runAITurn(), AI_ACTION_DELAY_MS);
  }

  /** Execute a simple AI turn: play one card, then attack or end turn. */
  _runAITurn() {
    if (this.currentPhase !== Phase.MAIN || this.currentPlayerIndex !== 1) return;

    // AI plays up to one card from its hand
    if (this.hands[1].length > 0) {
      const idx = Math.floor(Math.random() * this.hands[1].length);
      this.playCard(idx);
    }

    // AI always declares an attack if possible
    if (this.currentPhase === Phase.MAIN) {
      this.declareAttack();
    }

    // If the game hasn't ended, end the AI turn
    if (this.currentPhase === Phase.MAIN) {
      this.endTurn();
    }
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  _drawForActivePlayer() {
    const drawn = ChaosFormat.drawCards(
      this.decks[this.currentPlayerIndex],
      this.hands[this.currentPlayerIndex]
    );
    if (drawn === 0) {
      this._log(`${this.champions[this.currentPlayerIndex].playerName} cannot draw — deck is empty!`);
    } else {
      this._log(`${this.champions[this.currentPlayerIndex].playerName} draws a card.`);
    }
  }

  /** @param {string} newPhase */
  _setPhase(newPhase) {
    this.currentPhase = newPhase;
    this.emit('phaseChanged', newPhase);
  }

  /** @param {string} message */
  _log(message) {
    console.log('[GameManager]', message);
    this.gameLog.push(message);
    this.emit('logMessage', message);
  }
}
