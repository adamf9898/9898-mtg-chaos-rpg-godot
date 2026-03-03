/**
 * CardSearchUI.js
 * UI component for searching Scryfall cards and viewing results.
 */
import * as ScryfallAPI from '../api/ScryfallAPI.js';

export class CardSearchUI {
  /**
   * @param {HTMLElement} container - Parent element to render into
   * @param {Function} onAddCard - Callback when a card is added to deck
   */
  constructor(container, onAddCard) {
    this.container = container;
    this.onAddCard = onAddCard;
    /** @type {import('../game/CardData.js').CardData[]} */
    this.searchResults = [];
    this.selectedIndex = -1;
    this._render();
    this._bindEvents();
  }

  _render() {
    this.container.innerHTML = `
      <div class="card-search">
        <h2>🔍 Card Search</h2>
        <div class="search-bar">
          <input type="text" id="search-input" placeholder="Search for cards (e.g., 'lightning bolt', 't:creature c:red')..." autocomplete="off" />
          <button id="search-btn" class="btn btn-primary">Search</button>
        </div>
        <p id="search-status" class="status-text">Enter a card name or Scryfall query and press Search.</p>
        <div id="search-results" class="search-results"></div>
        <div id="card-preview" class="card-preview hidden"></div>
      </div>
    `;
  }

  _bindEvents() {
    const searchInput = this.container.querySelector('#search-input');
    const searchBtn = this.container.querySelector('#search-btn');

    searchBtn.addEventListener('click', () => this._onSearch());
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this._onSearch();
    });
  }

  async _onSearch() {
    const input = this.container.querySelector('#search-input');
    const status = this.container.querySelector('#search-status');
    const query = input.value.trim();

    if (!query) {
      status.textContent = 'Please enter a search term.';
      return;
    }

    status.textContent = 'Searching…';
    this.searchResults = [];
    this.selectedIndex = -1;
    this._renderResults();

    try {
      const result = await ScryfallAPI.searchCards(query);
      this.searchResults = result.cards;
      status.textContent = `${result.totalCards} card(s) found.`;
      this._renderResults();
    } catch (err) {
      status.textContent = `Error: ${err.message}`;
    }
  }

  _renderResults() {
    const resultsEl = this.container.querySelector('#search-results');
    if (this.searchResults.length === 0) {
      resultsEl.innerHTML = '<p class="empty-message">No results to display.</p>';
      return;
    }

    resultsEl.innerHTML = this.searchResults.map((card, i) => `
      <div class="search-result-item${this.selectedIndex === i ? ' selected' : ''}" data-index="${i}">
        <div class="result-info">
          <span class="card-name">${this._escapeHtml(card.name)}</span>
          <span class="card-type">${this._escapeHtml(card.typeLine)}</span>
          <span class="card-mana">${this._formatManaCost(card.manaCost)}</span>
        </div>
        <button class="btn btn-small btn-add" data-index="${i}">+ Add</button>
      </div>
    `).join('');

    // Bind click events
    resultsEl.querySelectorAll('.search-result-item').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-add')) return;
        this.selectedIndex = parseInt(el.dataset.index, 10);
        this._renderResults();
        this._showPreview(this.searchResults[this.selectedIndex]);
      });
    });

    resultsEl.querySelectorAll('.btn-add').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index, 10);
        if (this.onAddCard) {
          this.onAddCard(this.searchResults[idx]);
        }
      });
    });
  }

  _showPreview(card) {
    const previewEl = this.container.querySelector('#card-preview');
    previewEl.classList.remove('hidden');
    previewEl.innerHTML = `
      <div class="preview-content">
        ${card.imageUriNormal
          ? `<img src="${this._escapeHtml(card.imageUriNormal)}" alt="${this._escapeHtml(card.name)}" class="preview-image" />`
          : '<div class="preview-placeholder">No image available</div>'
        }
        <div class="preview-details">
          <h3>${this._escapeHtml(card.name)}</h3>
          <p class="mana-cost">${this._formatManaCost(card.manaCost)}</p>
          <p class="type-line">${this._escapeHtml(card.typeLine)}</p>
          <p class="oracle-text">${this._escapeHtml(card.oracleText)}</p>
          ${card.flavorText ? `<p class="flavor-text"><em>${this._escapeHtml(card.flavorText)}</em></p>` : ''}
          ${card.isCreature() ? `<p class="stats">${card.power}/${card.toughness}</p>` : ''}
        </div>
      </div>
    `;
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
