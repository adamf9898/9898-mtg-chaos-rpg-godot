/**
 * DeckBuilder.js
 * Manages a player's deck during the deck-building phase.
 * Provides add/remove helpers and validates against Chaos RPG format rules.
 */
import * as ChaosFormat from './ChaosFormat.js';
import { EventEmitter } from '../EventEmitter.js';

export class DeckBuilder extends EventEmitter {
  constructor() {
    super();
    /** @type {import('./CardData.js').CardData[]} */
    this._deck = [];
  }

  // ── Read-only access ──────────────────────────────────────────────────────

  /** Returns a copy of the current deck list. */
  getDeck() {
    return [...this._deck];
  }

  /** Returns the total number of cards currently in the deck. */
  size() {
    return this._deck.length;
  }

  /**
   * Returns how many copies of a card (by oracle ID or name) are in the deck.
   * @param {import('./CardData.js').CardData} card
   * @returns {number}
   */
  countCopies(card) {
    const key = this._keyFor(card);
    return this._deck.filter(c => this._keyFor(c) === key).length;
  }

  // ── Mutation ────────────────────────────────────────────────────────────────

  /**
   * Attempt to add a card to the deck.
   * @param {import('./CardData.js').CardData} card
   * @returns {boolean} True on success.
   */
  addCard(card) {
    if (this._deck.length >= ChaosFormat.MAX_DECK_SIZE) {
      console.warn('DeckBuilder: Deck is already at maximum size.');
      return false;
    }
    if (!card.isLand() && this.countCopies(card) >= 4) {
      console.warn(`DeckBuilder: Cannot add more than 4 copies of '${card.name}'.`);
      return false;
    }
    this._deck.push(card);
    this.emit('deckChanged', this.getDeck());
    return true;
  }

  /**
   * Remove the first copy of a card from the deck.
   * @param {import('./CardData.js').CardData} card
   * @returns {boolean}
   */
  removeCard(card) {
    const key = this._keyFor(card);
    const idx = this._deck.findIndex(c => this._keyFor(c) === key);
    if (idx === -1) return false;
    this._deck.splice(idx, 1);
    this.emit('deckChanged', this.getDeck());
    return true;
  }

  /** Remove all cards from the deck. */
  clear() {
    this._deck = [];
    this.emit('deckChanged', this.getDeck());
  }

  // ── Validation ──────────────────────────────────────────────────────────────

  /** Returns a validation message for the current deck state. */
  validate() {
    return ChaosFormat.validateDeck(this._deck);
  }

  /** Returns true when the deck is legal for the Chaos RPG format. */
  isLegal() {
    return ChaosFormat.isDeckLegal(this._deck);
  }

  // ── Deck finalization ───────────────────────────────────────────────────────

  /**
   * Shuffles the deck and assigns a chaos effect to every card.
   * Returns a new array of deep-copied CardData objects.
   * @returns {import('./CardData.js').CardData[]}
   */
  finalizeForGame() {
    const gameDeck = this._deck.map(card => card.duplicate());
    for (const card of gameDeck) {
      ChaosFormat.assignChaosEffect(card);
    }
    ChaosFormat.shuffleDeck(gameDeck);
    return gameDeck;
  }

  // ── Private ─────────────────────────────────────────────────────────────────

  /** @param {import('./CardData.js').CardData} card */
  _keyFor(card) {
    return card.oracleId || card.name;
  }
}
