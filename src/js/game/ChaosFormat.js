/**
 * ChaosFormat.js
 * Defines the rules and mechanics of the custom "MTG Chaos RPG" format.
 *
 * Format Overview:
 *   • Each player controls a Champion — a persistent hero with HP and Attack.
 *   • Players build a 40–60 card deck using any cards from the Scryfall database.
 *   • When a card is played, a random Chaos Effect triggers alongside its normal rules.
 *   • Victory: reduce the opposing Champion's HP to 0.
 */

// ── Format constants ──────────────────────────────────────────────────────────
export const MIN_DECK_SIZE = 40;
export const MAX_DECK_SIZE = 60;
export const STARTING_HAND_SIZE = 7;
export const CHAMPION_STARTING_HP = 20;
export const CHAMPION_STARTING_ATTACK = 2;

// ── Chaos effect pool ─────────────────────────────────────────────────────────
export const CHAOS_EFFECTS = [
  'Double Strike: This card deals double damage this turn.',
  'Arcane Surge: Draw an additional card.',
  'Mana Void: Your opponent loses 1 mana next turn.',
  'Time Warp: Take an additional mini-turn after this one.',
  'Cursed Aura: The played card gains -1/-1 until end of turn.',
  'Blessed Aura: The played card gains +1/+1 until end of turn.',
  'Chaos Rift: Shuffle a random card from each hand back into its owner\'s deck.',
  'Wild Growth: Gain 2 HP.',
  'Dark Bargain: Deal 3 damage to any target; lose 1 HP.',
  'Spectral Echo: Copy the effect of this card once.',
  'Temporal Flux: The top card of your deck is exiled face-down until end of turn.',
  'Mana Flood: Add 2 colorless mana to your pool.',
  'Reckless Charge: Your Champion attacks for +3 damage this turn.',
  'Arcane Mirror: Reflect the next spell cast back at its caster.',
  'Pandemonium: Each player draws 2 cards and discards 1.',
  'Luck of the Draw: Scry 2.',
  'Rally: All your creatures get +1/+0 until end of turn.',
  'Hex: Target creature gets -2/-0 until end of turn.',
  'Inspiration: Reduce the mana cost of your next spell by 1.',
  'Entropy: Randomly swap the top cards of each player\'s library.',
];

// ── Deck validation ───────────────────────────────────────────────────────────

/**
 * Returns true if the given array of CardData objects forms a legal Chaos RPG deck.
 * @param {import('./CardData.js').CardData[]} deck
 * @returns {boolean}
 */
export function isDeckLegal(deck) {
  if (deck.length < MIN_DECK_SIZE || deck.length > MAX_DECK_SIZE) {
    return false;
  }
  const counts = {};
  for (const card of deck) {
    const key = card.oracleId || card.name;
    if (!card.isLand()) {
      counts[key] = (counts[key] || 0) + 1;
      if (counts[key] > 4) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Returns a human-readable validation message for a deck.
 * @param {import('./CardData.js').CardData[]} deck
 * @returns {string}
 */
export function validateDeck(deck) {
  if (deck.length < MIN_DECK_SIZE) {
    return `Deck is too small (${deck.length} cards; minimum ${MIN_DECK_SIZE}).`;
  }
  if (deck.length > MAX_DECK_SIZE) {
    return `Deck is too large (${deck.length} cards; maximum ${MAX_DECK_SIZE}).`;
  }
  const counts = {};
  for (const card of deck) {
    const key = card.oracleId || card.name;
    if (!card.isLand()) {
      counts[key] = (counts[key] || 0) + 1;
      if (counts[key] > 4) {
        return `Too many copies of '${card.name}' (${counts[key]}; maximum 4).`;
      }
    }
  }
  return 'Deck is legal.';
}

// ── Chaos effect assignment ───────────────────────────────────────────────────

/**
 * Assigns a random chaos effect to a card and computes its chaos_value.
 * @param {import('./CardData.js').CardData} card
 */
export function assignChaosEffect(card) {
  card.chaosEffect = CHAOS_EFFECTS[Math.floor(Math.random() * CHAOS_EFFECTS.length)];
  card.chaosValue = computeChaosValue(card);
}

/**
 * Derives a numeric chaos value from the card's properties.
 * Higher CMC and more colors yield higher chaos potential.
 * @param {import('./CardData.js').CardData} card
 * @returns {number}
 */
export function computeChaosValue(card) {
  let base = Math.floor(card.cmc);
  base += card.colors.length * 2;
  if (card.isCreature()) {
    const p = parseInt(card.power, 10) || 0;
    const t = parseInt(card.toughness, 10) || 0;
    base += Math.floor((p + t) / 2);
  }
  return base;
}

// ── Turn helpers ──────────────────────────────────────────────────────────────

/**
 * Shuffles an array in place using Fisher-Yates.
 * @param {Array} deck
 */
export function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

/**
 * Draws `count` cards from a deck into a hand array.
 * @param {Array} deck
 * @param {Array} hand
 * @param {number} [count=1]
 * @returns {number} Number of cards actually drawn.
 */
export function drawCards(deck, hand, count = 1) {
  let drawn = 0;
  for (let i = 0; i < count; i++) {
    if (deck.length === 0) break;
    hand.push(deck.pop());
    drawn++;
  }
  return drawn;
}
