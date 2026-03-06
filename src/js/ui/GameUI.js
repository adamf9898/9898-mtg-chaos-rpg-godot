/**
 * GameUI.js
 * Main UI coordinator — manages screen transitions between
 * deck building, mulligan, and battle phases.
 */
import { GameManager, Phase } from '../game/GameManager.js';
import { DeckBuilder } from '../game/DeckBuilder.js';
import { CardSearchUI } from './CardSearchUI.js';
import { DeckBuilderUI } from './DeckBuilderUI.js';
import { BattleUI } from './BattleUI.js';
import * as ScryfallAPI from '../api/ScryfallAPI.js';

export class GameUI {
  constructor() {
    this.gameManager = new GameManager();
    this.deckBuilder = new DeckBuilder();

    /** @type {CardSearchUI|null} */
    this.cardSearchUI = null;
    /** @type {DeckBuilderUI|null} */
    this.deckBuilderUI = null;
    /** @type {BattleUI|null} */
    this.battleUI = null;
  }

  /** Initialize the game UI and show the deck building screen. */
  init() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <header class="game-header">
        <h1>⚡ MTG Chaos RPG</h1>
        <p class="tagline">Build a deck. Unleash chaos. Defeat your opponent.</p>
      </header>
      <main id="game-content"></main>
    `;
    this._showDeckBuildScreen();
  }

  _showDeckBuildScreen() {
    const content = document.getElementById('game-content');
    content.innerHTML = `
      <div class="deck-build-screen">
        <div class="deck-build-left" id="search-container"></div>
        <div class="deck-build-right" id="deck-container"></div>
      </div>
    `;

    this.cardSearchUI = new CardSearchUI(
      document.getElementById('search-container'),
      (card) => this._onAddCard(card)
    );

    this.deckBuilderUI = new DeckBuilderUI(
      document.getElementById('deck-container'),
      this.deckBuilder
    );

    this.deckBuilderUI.onStartGame = () => this._onStartGame();
  }

  /**
   * Called when the user adds a card from search results to the deck.
   * @param {import('../game/CardData.js').CardData} card
   */
  _onAddCard(card) {
    const status = document.getElementById('search-status');
    if (this.deckBuilder.addCard(card)) {
      if (status) status.textContent = `Added '${card.name}' to deck (${this.deckBuilder.size()} cards).`;
    } else {
      if (status) status.textContent = `Could not add '${card.name}': ${this.deckBuilder.validate()}`;
    }
  }

  /** Transition from deck building to the game. */
  async _onStartGame() {
    // Finalize player deck
    const playerDeck = this.deckBuilder.finalizeForGame();
    this.gameManager.setPlayerName(0, 'You');
    this.gameManager.setPlayerName(1, 'Chaos Bot');
    this.gameManager.loadDeck(0, playerDeck);

    // Build an AI opponent deck from random cards
    const content = document.getElementById('game-content');
    content.innerHTML = `
      <div class="loading-screen">
        <h2>⏳ Preparing opponent deck…</h2>
        <p id="loading-status">Fetching random cards from Scryfall…</p>
        <div class="progress-bar-container">
          <div class="progress-bar-fill" id="loading-progress" style="width: 0%"></div>
        </div>
        <p id="loading-percent" class="loading-percent">0%</p>
        <div class="spinner"></div>
      </div>
    `;

    try {
      const opponentDeck = await this._buildOpponentDeck();
      this.gameManager.loadDeck(1, opponentDeck);
      this._showMulliganScreen();
    } catch (err) {
      content.innerHTML = `
        <div class="error-screen">
          <h2>❌ Error building opponent deck</h2>
          <p>${this._escapeHtml(err.message)}</p>
          <button class="btn btn-primary" id="retry-btn">Try Again</button>
        </div>
      `;
      content.querySelector('#retry-btn').addEventListener('click', () => {
        window.location.reload();
      });
    }
  }

  /**
   * Build a simple opponent deck from random creatures and spells.
   * @returns {Promise<import('../game/CardData.js').CardData[]>}
   */
  async _buildOpponentDeck() {
    const statusEl = document.getElementById('loading-status');
    const progressEl = document.getElementById('loading-progress');
    const percentEl = document.getElementById('loading-percent');
    const opponentBuilder = new DeckBuilder();

    // Search for creatures and spells to build a deck
    const queries = ['t:creature', 't:instant', 't:sorcery', 't:land'];
    const cardsPerQuery = [20, 8, 7, 5];

    for (let q = 0; q < queries.length; q++) {
      const pct = Math.round(((q) / queries.length) * 100);
      if (statusEl) statusEl.textContent = `Searching: ${queries[q]}…`;
      if (progressEl) progressEl.style.width = `${pct}%`;
      if (percentEl) percentEl.textContent = `${pct}%`;
      try {
        const result = await ScryfallAPI.searchCards(queries[q]);
        const shuffled = [...result.cards].sort(() => Math.random() - 0.5);
        let added = 0;
        for (const card of shuffled) {
          if (added >= cardsPerQuery[q]) break;
          if (opponentBuilder.addCard(card)) added++;
        }
      } catch {
        // If a specific search fails, continue with others
      }
    }

    if (progressEl) progressEl.style.width = '100%';
    if (percentEl) percentEl.textContent = '100%';
    if (statusEl) statusEl.textContent = 'Opponent deck ready!';

    return opponentBuilder.finalizeForGame();
  }

  _showMulliganScreen() {
    this.gameManager.startGame();

    const content = document.getElementById('game-content');
    content.innerHTML = `
      <div class="mulligan-screen">
        <h2>🔄 Mulligan Phase</h2>
        <p>Your opening hand:</p>
        <div id="mulligan-hand" class="mulligan-hand"></div>
        <div class="mulligan-actions">
          <button id="mulligan-btn" class="btn btn-secondary">Mulligan (redraw)</button>
          <button id="keep-btn" class="btn btn-primary">Keep Hand</button>
        </div>
      </div>
    `;

    this._renderMulliganHand();

    content.querySelector('#mulligan-btn').addEventListener('click', () => {
      this.gameManager.takeMulligan(0);
      this._renderMulliganHand();
    });

    content.querySelector('#keep-btn').addEventListener('click', () => {
      // AI keeps its hand
      this.gameManager.beginMainPhase();
      this._showBattleScreen();
    });
  }

  _renderMulliganHand() {
    const handEl = document.getElementById('mulligan-hand');
    const hand = this.gameManager.hands[0];
    handEl.innerHTML = hand.map(card => `
      <div class="mulligan-card">
        ${card.imageUriSmall && this._sanitizeUrl(card.imageUriSmall)
          ? `<img src="${this._sanitizeUrl(card.imageUriSmall)}" alt="${this._escapeHtml(card.name)}" />`
          : `<div class="card-text-preview">
              <strong>${this._escapeHtml(card.name)}</strong><br/>
              ${this._escapeHtml(card.manaCost)}<br/>
              ${this._escapeHtml(card.typeLine)}
            </div>`
        }
      </div>
    `).join('');
  }

  _showBattleScreen() {
    const content = document.getElementById('game-content');
    content.innerHTML = '<div id="battle-container"></div>';
    this.battleUI = new BattleUI(
      document.getElementById('battle-container'),
      this.gameManager
    );
    this.battleUI.refresh();
  }

  _escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /** Validate that a URL uses a safe protocol. */
  _sanitizeUrl(url) {
    if (!url) return '';
    try {
      const parsed = new URL(url);
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') return url;
    } catch { /* invalid URL */ }
    return '';
  }
}
