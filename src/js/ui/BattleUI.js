/**
 * BattleUI.js
 * UI component for the battle / gameplay phase.
 * Renders the game board: champions, hands, battlefield, game log.
 */
import { Phase } from '../game/GameManager.js';

export class BattleUI {
  /**
   * @param {HTMLElement} container
   * @param {import('../game/GameManager.js').GameManager} gameManager
   */
  constructor(container, gameManager) {
    this.container = container;
    this.gm = gameManager;
    this._render();
    this._bindGameEvents();
  }

  _render() {
    this.container.innerHTML = `
      <div class="battle-screen">
        <!-- Opponent area -->
        <div class="player-area opponent-area">
          <div class="champion-info" id="opponent-champion"></div>
          <div class="battlefield" id="opponent-battlefield"></div>
          <div class="hand opponent-hand" id="opponent-hand"></div>
        </div>

        <!-- Center info -->
        <div class="battle-center">
          <div id="phase-display" class="phase-display"></div>
          <div id="turn-display" class="turn-display"></div>
          <div id="chaos-effect-display" class="chaos-effect-display hidden"></div>
        </div>

        <!-- Player area -->
        <div class="player-area player-area-self">
          <div class="hand player-hand" id="player-hand"></div>
          <div class="battlefield" id="player-battlefield"></div>
          <div class="champion-info" id="player-champion"></div>
        </div>

        <!-- Action bar -->
        <div class="action-bar">
          <button id="attack-btn" class="btn btn-danger">⚔️ Attack</button>
          <button id="end-turn-btn" class="btn btn-primary">End Turn</button>
        </div>

        <!-- Game log -->
        <div class="game-log">
          <h3>📜 Game Log</h3>
          <div id="game-log-content" class="log-content"></div>
        </div>
      </div>
    `;
    this._bindActions();
  }

  _bindActions() {
    this.container.querySelector('#attack-btn').addEventListener('click', () => {
      this.gm.declareAttack();
      this.refresh();
    });
    this.container.querySelector('#end-turn-btn').addEventListener('click', () => {
      this.gm.endTurn();
      this.refresh();
    });
  }

  _bindGameEvents() {
    this.gm.on('phaseChanged', () => this.refresh());
    this.gm.on('turnStarted', () => this.refresh());
    this.gm.on('cardPlayed', () => this.refresh());
    this.gm.on('championDamaged', () => this.refresh());
    this.gm.on('logMessage', (msg) => this._appendLog(msg));
    this.gm.on('gameOver', (winnerIndex) => this._showGameOver(winnerIndex));
  }

  /** Play a card by hand index. */
  playCardFromHand(handIndex) {
    this.gm.playCard(handIndex);
    this.refresh();
  }

  /** Full refresh of the battle UI. */
  refresh() {
    this._renderChampion(0);
    this._renderChampion(1);
    this._renderHand(0);
    this._renderHand(1);
    this._renderBattlefield(0);
    this._renderBattlefield(1);
    this._renderPhase();
    this._updateActionButtons();
  }

  _renderChampion(playerIndex) {
    const isOpponent = playerIndex === 1;
    const elementId = isOpponent ? 'opponent-champion' : 'player-champion';
    const champion = this.gm.champions[playerIndex];
    const el = this.container.querySelector(`#${elementId}`);
    const hpPercent = Math.round((champion.hp / champion.maxHp) * 100);
    const hpClass = hpPercent > 50 ? 'hp-high' : hpPercent > 25 ? 'hp-mid' : 'hp-low';

    el.innerHTML = `
      <div class="champion-card">
        <span class="champion-name">${this._escapeHtml(champion.playerName)}</span>
        <div class="hp-bar">
          <div class="hp-fill ${hpClass}" style="width: ${hpPercent}%"></div>
          <span class="hp-text">${champion.hp}/${champion.maxHp} HP</span>
        </div>
        <span class="champion-attack">⚔️ ATK: ${champion.attack}</span>
        <span class="deck-remaining">📚 Deck: ${this.gm.decks[playerIndex].length}</span>
      </div>
    `;
  }

  _renderHand(playerIndex) {
    const isOpponent = playerIndex === 1;
    const elementId = isOpponent ? 'opponent-hand' : 'player-hand';
    const hand = this.gm.hands[playerIndex];
    const el = this.container.querySelector(`#${elementId}`);

    if (isOpponent) {
      // Show card backs for opponent
      el.innerHTML = hand.map(() =>
        '<div class="card card-back">🂠</div>'
      ).join('');
    } else {
      // Show actual cards for the player
      el.innerHTML = hand.map((card, i) => `
        <div class="card card-in-hand" data-index="${i}" title="${this._escapeHtml(card.toString())}">
          ${card.imageUriSmall && this._sanitizeUrl(card.imageUriSmall)
            ? `<img src="${this._sanitizeUrl(card.imageUriSmall)}" alt="${this._escapeHtml(card.name)}" />`
            : `<div class="card-text">
                <div class="card-name-small">${this._escapeHtml(card.name)}</div>
                <div class="card-mana-small">${card.manaCost}</div>
                <div class="card-type-small">${this._escapeHtml(card.typeLine)}</div>
              </div>`
          }
        </div>
      `).join('');

      // Click to play card
      el.querySelectorAll('.card-in-hand').forEach(cardEl => {
        cardEl.addEventListener('click', () => {
          const idx = parseInt(cardEl.dataset.index, 10);
          this.playCardFromHand(idx);
        });
      });
    }
  }

  _renderBattlefield(playerIndex) {
    const isOpponent = playerIndex === 1;
    const elementId = isOpponent ? 'opponent-battlefield' : 'player-battlefield';
    const battlefield = this.gm.battlefields[playerIndex];
    const el = this.container.querySelector(`#${elementId}`);

    el.innerHTML = battlefield.map(card => `
      <div class="card card-on-field" title="${this._escapeHtml(card.toString())}">
        <div class="card-name-small">${this._escapeHtml(card.name)}</div>
        ${card.isCreature() ? `<div class="card-stats-small">${card.power}/${card.toughness}</div>` : ''}
      </div>
    `).join('') || '<span class="empty-field">No cards in play</span>';
  }

  _renderPhase() {
    const phaseEl = this.container.querySelector('#phase-display');
    const turnEl = this.container.querySelector('#turn-display');
    const phaseLabels = {
      [Phase.DECK_BUILD]: '🔨 Deck Building',
      [Phase.MULLIGAN]: '🔄 Mulligan',
      [Phase.MAIN]: '🎴 Main Phase',
      [Phase.COMBAT]: '⚔️ Combat',
      [Phase.END]: '🏁 Game Over',
    };
    phaseEl.textContent = phaseLabels[this.gm.currentPhase] || this.gm.currentPhase;
    turnEl.textContent = `Turn ${this.gm.turnNumber} — ${this.gm.champions[this.gm.currentPlayerIndex].playerName}`;
  }

  _updateActionButtons() {
    const attackBtn = this.container.querySelector('#attack-btn');
    const endTurnBtn = this.container.querySelector('#end-turn-btn');
    const isMainPhase = this.gm.currentPhase === Phase.MAIN;
    const isPlayerTurn = this.gm.currentPlayerIndex === 0;

    attackBtn.disabled = !(isMainPhase && isPlayerTurn);
    endTurnBtn.disabled = !(isMainPhase && isPlayerTurn);
  }

  _appendLog(message) {
    const logEl = this.container.querySelector('#game-log-content');
    if (!logEl) return;
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.textContent = message;
    logEl.appendChild(entry);
    logEl.scrollTop = logEl.scrollHeight;
  }

  _showGameOver(winnerIndex) {
    const winner = this.gm.champions[winnerIndex];
    const stats = this.gm.stats;
    const overlay = document.createElement('div');
    overlay.className = 'game-over-overlay';
    overlay.innerHTML = `
      <div class="game-over-content">
        <h1>🏆 Game Over!</h1>
        <h2>${this._escapeHtml(winner.playerName)} Wins!</h2>
        <div class="game-over-stats">
          <p>Games Played: ${stats.gamesPlayed}</p>
          <p>Wins: ${stats.wins} | Losses: ${stats.losses}</p>
          <p>Win Streak: ${stats.winStreak} | Best: ${stats.bestWinStreak}</p>
          <p>Total Damage Dealt: ${stats.totalDamageDealt}</p>
          <p>Total Cards Played: ${stats.totalCardsPlayed}</p>
        </div>
        <button class="btn btn-primary" id="new-game-btn">New Game</button>
      </div>
    `;
    this.container.appendChild(overlay);
    overlay.querySelector('#new-game-btn').addEventListener('click', () => {
      window.location.reload();
    });
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
