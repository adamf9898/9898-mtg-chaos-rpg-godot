/**
 * DeckBuilderUI.js
 * UI component for building and managing the player's deck.
 */
import { DeckBuilder } from '../game/DeckBuilder.js';

export class DeckBuilderUI {
  /**
   * @param {HTMLElement} container
   * @param {DeckBuilder} deckBuilder
   */
  constructor(container, deckBuilder) {
    this.container = container;
    this.deckBuilder = deckBuilder;
    this._render();

    this.deckBuilder.on('deckChanged', () => this.refresh());
  }

  _render() {
    this.container.innerHTML = `
      <div class="deck-builder">
        <h2>📋 Deck Builder</h2>
        <div class="deck-info">
          <span id="deck-count">0 / 40–60 cards</span>
          <span id="deck-status" class="status-text"></span>
        </div>
        <div class="deck-actions">
          <button id="clear-deck-btn" class="btn btn-danger">Clear Deck</button>
          <button id="validate-deck-btn" class="btn btn-secondary">Validate</button>
          <button id="finalize-deck-btn" class="btn btn-primary" disabled>Start Game</button>
        </div>
        <div id="deck-list" class="deck-list"></div>
      </div>
    `;
    this._bindEvents();
    this.refresh();
  }

  _bindEvents() {
    this.container.querySelector('#clear-deck-btn').addEventListener('click', () => {
      this.deckBuilder.clear();
    });
    this.container.querySelector('#validate-deck-btn').addEventListener('click', () => {
      const status = this.container.querySelector('#deck-status');
      status.textContent = this.deckBuilder.validate();
    });
    this.container.querySelector('#finalize-deck-btn').addEventListener('click', () => {
      if (this.onStartGame) this.onStartGame();
    });
  }

  /** Callback to invoke when the player clicks Start Game. */
  onStartGame = null;

  /** Re-render the deck list and update counts. */
  refresh() {
    const deck = this.deckBuilder.getDeck();
    const countEl = this.container.querySelector('#deck-count');
    const statusEl = this.container.querySelector('#deck-status');
    const listEl = this.container.querySelector('#deck-list');
    const finalizeBtn = this.container.querySelector('#finalize-deck-btn');

    countEl.textContent = `${deck.length} / 40–60 cards`;
    finalizeBtn.disabled = !this.deckBuilder.isLegal();

    if (deck.length === 0) {
      listEl.innerHTML = '<p class="empty-message">No cards in deck. Search and add cards above.</p>';
      statusEl.textContent = '';
      return;
    }

    // Group cards by name for display
    const grouped = {};
    for (const card of deck) {
      const key = card.oracleId || card.name;
      if (!grouped[key]) {
        grouped[key] = { card, count: 0 };
      }
      grouped[key].count++;
    }

    listEl.innerHTML = Object.values(grouped).map(({ card, count }) => `
      <div class="deck-item">
        <span class="deck-card-count">${count}×</span>
        <span class="deck-card-name">${this._escapeHtml(card.name)}</span>
        <span class="deck-card-type">${this._escapeHtml(card.typeLine)}</span>
        <span class="deck-card-mana">${this._formatManaCost(card.manaCost)}</span>
        <button class="btn btn-small btn-remove" data-name="${this._escapeHtml(card.name)}" data-oracle="${this._escapeHtml(card.oracleId)}">−</button>
      </div>
    `).join('');

    listEl.querySelectorAll('.btn-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const cardToRemove = deck.find(c =>
          (c.oracleId || c.name) === (btn.dataset.oracle || btn.dataset.name)
        );
        if (cardToRemove) this.deckBuilder.removeCard(cardToRemove);
      });
    });
  }

  _formatManaCost(manaCost) {
    if (!manaCost) return '';
    return manaCost.replace(/\{([^}]+)\}/g, '<span class="mana mana-$1">$1</span>');
  }

  _escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
