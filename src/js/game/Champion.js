/**
 * Champion.js
 * Represents a player's Champion — a persistent hero with HP and Attack.
 */
import { CHAMPION_STARTING_HP, CHAMPION_STARTING_ATTACK } from './ChaosFormat.js';

export class Champion {
  /**
   * @param {string} playerName
   * @param {number} [hp=CHAMPION_STARTING_HP]
   * @param {number} [attack=CHAMPION_STARTING_ATTACK]
   */
  constructor(playerName, hp = CHAMPION_STARTING_HP, attack = CHAMPION_STARTING_ATTACK) {
    this.playerName = playerName;
    this.hp = hp;
    this.maxHp = hp;
    this.attack = attack;
  }

  /** @returns {boolean} True if the champion is still alive. */
  isAlive() {
    return this.hp > 0;
  }

  /** @param {number} amount - Damage to deal. */
  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
  }

  /** @param {number} amount - HP to restore. */
  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  /** @returns {string} */
  toString() {
    return `${this.playerName} — HP: ${this.hp}/${this.maxHp}  ATK: ${this.attack}`;
  }
}
