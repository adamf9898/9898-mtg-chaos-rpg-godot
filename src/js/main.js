/**
 * main.js
 * Application entry point for the MTG Chaos RPG web game.
 */
import { GameUI } from './ui/GameUI.js';

document.addEventListener('DOMContentLoaded', () => {
  const gameUI = new GameUI();
  gameUI.init();
});
