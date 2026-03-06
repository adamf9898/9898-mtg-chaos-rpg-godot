/**
 * GameStats.js
 * Tracks session-level game statistics: wins, games played, damage dealt, etc.
 * All state is in-memory (no persistence) to match the project's security model.
 */
export class GameStats {
  constructor() {
    this.gamesPlayed = 0;
    this.wins = 0;
    this.losses = 0;
    this.winStreak = 0;
    this.bestWinStreak = 0;
    this.totalDamageDealt = 0;
    this.totalCardsPlayed = 0;
  }

  /**
   * Record the result of a completed game.
   * @param {boolean} playerWon - True if the local player won.
   */
  recordGame(playerWon) {
    this.gamesPlayed++;
    if (playerWon) {
      this.wins++;
      this.winStreak++;
      if (this.winStreak > this.bestWinStreak) {
        this.bestWinStreak = this.winStreak;
      }
    } else {
      this.losses++;
      this.winStreak = 0;
    }
  }

  /**
   * Record damage dealt by the local player.
   * @param {number} amount
   */
  recordDamage(amount) {
    this.totalDamageDealt += amount;
  }

  /** Record that the local player played a card. */
  recordCardPlayed() {
    this.totalCardsPlayed++;
  }

  /**
   * Returns a human-readable summary of the stats.
   * @returns {string}
   */
  toString() {
    return (
      `Games: ${this.gamesPlayed} | Wins: ${this.wins} | Losses: ${this.losses} | ` +
      `Streak: ${this.winStreak} | Best Streak: ${this.bestWinStreak} | ` +
      `Damage: ${this.totalDamageDealt} | Cards Played: ${this.totalCardsPlayed}`
    );
  }
}
