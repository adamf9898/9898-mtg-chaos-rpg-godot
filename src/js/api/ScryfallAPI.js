/**
 * ScryfallAPI.js
 * Wraps the Scryfall REST API for card searching and lookup.
 * All requests are asynchronous and return Promises.
 *
 * Scryfall API documentation: https://scryfall.com/docs/api
 */
import { CardData } from '../game/CardData.js';

const BASE_URL = 'https://api.scryfall.com';
const REQUEST_DELAY_MS = 100;

let lastRequestTime = 0;

/**
 * Ensures polite rate-limiting between API requests.
 * @returns {Promise<void>}
 */
async function rateLimit() {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < REQUEST_DELAY_MS) {
    await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY_MS - elapsed));
  }
  lastRequestTime = Date.now();
}

/**
 * Generic fetch wrapper with error handling.
 * @param {string} url
 * @returns {Promise<Object>}
 */
async function apiFetch(url) {
  await rateLimit();
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.details || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Search for cards using a Scryfall search query.
 * @param {string} query - Scryfall search syntax
 * @param {number} [page=1]
 * @returns {Promise<{cards: CardData[], hasMore: boolean, totalCards: number}>}
 */
export async function searchCards(query, page = 1) {
  const url = `${BASE_URL}/cards/search?q=${encodeURIComponent(query)}&page=${page}`;
  const data = await apiFetch(url);
  const cards = (data.data || []).map(json => CardData.fromScryfallJson(json));
  return {
    cards,
    hasMore: data.has_more || false,
    totalCards: data.total_cards || cards.length,
  };
}

/**
 * Look up a single card by its exact name.
 * @param {string} cardName
 * @param {boolean} [fuzzy=false]
 * @returns {Promise<CardData>}
 */
export async function getCardByName(cardName, fuzzy = false) {
  const param = fuzzy ? 'fuzzy' : 'exact';
  const url = `${BASE_URL}/cards/named?${param}=${encodeURIComponent(cardName)}`;
  const data = await apiFetch(url);
  return CardData.fromScryfallJson(data);
}

/**
 * Fetch a random card, optionally filtered by query.
 * @param {string} [query='']
 * @returns {Promise<CardData>}
 */
export async function getRandomCard(query = '') {
  let url = `${BASE_URL}/cards/random`;
  if (query) {
    url += `?q=${encodeURIComponent(query)}`;
  }
  const data = await apiFetch(url);
  return CardData.fromScryfallJson(data);
}

/**
 * Fetch a card by its Scryfall UUID.
 * @param {string} scryfallId
 * @returns {Promise<CardData>}
 */
export async function getCardById(scryfallId) {
  const url = `${BASE_URL}/cards/${encodeURIComponent(scryfallId)}`;
  const data = await apiFetch(url);
  return CardData.fromScryfallJson(data);
}

/**
 * Autocomplete card names.
 * @param {string} query
 * @returns {Promise<string[]>}
 */
export async function autocomplete(query) {
  const url = `${BASE_URL}/cards/autocomplete?q=${encodeURIComponent(query)}`;
  const data = await apiFetch(url);
  return data.data || [];
}
