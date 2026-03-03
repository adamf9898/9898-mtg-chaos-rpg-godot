/**
 * CardData.js
 * Data model representing a single Magic: The Gathering card,
 * populated from the Scryfall API JSON response.
 */
export class CardData {
  constructor() {
    // Identity
    this.scryfallId = '';
    this.oracleId = '';
    this.name = '';
    this.setCode = '';
    this.collectorNumber = '';
    this.lang = 'en';

    // Rules text
    this.manaCost = '';
    this.cmc = 0;
    this.typeLine = '';
    this.oracleText = '';
    this.flavorText = '';

    // Combat stats (creatures)
    this.power = '';
    this.toughness = '';

    // Loyalty (planeswalkers)
    this.loyalty = '';

    // Colors
    this.colors = [];
    this.colorIdentity = [];

    // Legalities
    this.legalities = {};

    // Image URIs
    this.imageUriNormal = '';
    this.imageUriSmall = '';
    this.imageUriArtCrop = '';

    // Chaos RPG stats (assigned at runtime)
    this.chaosValue = 0;
    this.chaosEffect = '';
  }

  /**
   * Create a CardData instance from a raw Scryfall API JSON object.
   * @param {Object} json - Scryfall card JSON
   * @returns {CardData}
   */
  static fromScryfallJson(json) {
    const card = new CardData();

    card.scryfallId = json.id || '';
    card.oracleId = json.oracle_id || '';
    card.name = json.name || '';
    card.setCode = json.set || '';
    card.collectorNumber = json.collector_number || '';
    card.lang = json.lang || 'en';
    card.manaCost = json.mana_cost || '';
    card.cmc = json.cmc || 0;
    card.typeLine = json.type_line || '';
    card.oracleText = json.oracle_text || '';
    card.flavorText = json.flavor_text || '';
    card.power = json.power || '';
    card.toughness = json.toughness || '';
    card.loyalty = json.loyalty || '';
    card.legalities = json.legalities || {};

    card.colors = Array.isArray(json.colors) ? [...json.colors] : [];
    card.colorIdentity = Array.isArray(json.color_identity) ? [...json.color_identity] : [];

    const imageUris = json.image_uris || {};
    card.imageUriNormal = imageUris.normal || '';
    card.imageUriSmall = imageUris.small || '';
    card.imageUriArtCrop = imageUris.art_crop || '';

    return card;
  }

  /** @returns {boolean} True if the card is a creature type. */
  isCreature() {
    return this.typeLine.includes('Creature');
  }

  /** @returns {boolean} True if the card is an instant or sorcery. */
  isSpell() {
    return this.typeLine.includes('Instant') || this.typeLine.includes('Sorcery');
  }

  /** @returns {boolean} True if the card is a land. */
  isLand() {
    return this.typeLine.includes('Land');
  }

  /**
   * Returns a deep copy of this card.
   * @returns {CardData}
   */
  duplicate() {
    const copy = new CardData();
    Object.assign(copy, {
      ...this,
      colors: [...this.colors],
      colorIdentity: [...this.colorIdentity],
      legalities: { ...this.legalities },
    });
    return copy;
  }

  /** @returns {string} Human-readable summary for debug purposes. */
  toString() {
    return `${this.name} [${this.typeLine}] {${this.manaCost}} — CMC ${this.cmc}`;
  }
}
