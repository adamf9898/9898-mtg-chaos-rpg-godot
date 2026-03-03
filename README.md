# MTG Chaos RPG

A custom **Magic: The Gathering** format built with [Godot 4](https://godotengine.org/) and powered by the [Scryfall API](https://scryfall.com/docs/api).

---

## Overview

**MTG Chaos RPG** is a custom MTG format that adds RPG-style elements to your favourite card game:

- **Champion** – Each player controls a persistent hero with HP and Attack stats.
- **Chaos Effects** – Every card that enters play triggers a random Chaos Effect, making no two games identical.
- **Scryfall Integration** – Search the entire MTG card database in-game using the Scryfall API to build your deck on the fly.

### Format Rules

| Rule | Value |
|------|-------|
| Minimum deck size | 40 cards |
| Maximum deck size | 60 cards |
| Opening hand | 7 cards |
| Maximum copies of any non-basic land | 4 |
| Champion starting HP | 20 |
| Champion starting Attack | 2 |
| Victory condition | Reduce opposing Champion's HP to 0 |

---

## Project Structure

```
project.godot            ← Godot 4 project file
scenes/
  Main.tscn              ← Entry-point scene
  ui/
    CardSearch.tscn      ← Scryfall search & deck-builder UI
scripts/
  autoloads/
    ScryfallAPI.gd       ← Scryfall REST API singleton (HTTPRequest wrapper)
    GameManager.gd       ← Match state machine (phases, turns, champions)
  CardData.gd            ← MTG card resource (populated from Scryfall JSON)
  ChaosFormat.gd         ← Format rules, chaos-effect pool, deck validation
  DeckBuilder.gd         ← Deck management (add/remove/validate)
  CardSearch.gd          ← UI controller for the card search panel
  Main.gd                ← Root scene script
```

---

## Getting Started

### Prerequisites

- [Godot 4.2+](https://godotengine.org/download)

### Running the Project

1. Clone this repository.
2. Open Godot 4, click **Import**, and select the `project.godot` file.
3. Click **Play** (F5) to launch the game.

> **Note:** The Scryfall API is queried over HTTPS. Ensure your device has an active internet connection when using the card-search features.

---

## Scryfall API

All card data is fetched live from the [Scryfall API](https://scryfall.com/docs/api) via the `ScryfallAPI` autoload singleton.

### Available Methods

```gdscript
# Search for cards using Scryfall's full query syntax
ScryfallAPI.search_cards("t:creature c:red cmc<=3")

# Look up a card by exact name
ScryfallAPI.get_card_by_name("Lightning Bolt")

# Fuzzy name match
ScryfallAPI.get_card_by_name("lightning bolt", true)

# Fetch a random card (optionally filtered)
ScryfallAPI.get_random_card()
ScryfallAPI.get_random_card("t:dragon")

# Fetch by Scryfall UUID
ScryfallAPI.get_card_by_id("e3285e6b-3e79-4d7c-bf96-d920f973b122")
```

### Signals

```gdscript
ScryfallAPI.search_completed(cards: Array)   # Array[CardData]
ScryfallAPI.card_found(card: CardData)
ScryfallAPI.random_card_fetched(card: CardData)
ScryfallAPI.request_failed(error_message: String)
```

---

## Custom Format — Chaos Effects

When a card enters play, one of the following **20 Chaos Effects** triggers at random:

- Double Strike, Arcane Surge, Mana Void, Time Warp, Cursed Aura, Blessed Aura,
  Chaos Rift, Wild Growth, Dark Bargain, Spectral Echo, Temporal Flux, Mana Flood,
  Reckless Charge, Arcane Mirror, Pandemonium, Luck of the Draw, Rally, Hex,
  Inspiration, Entropy.

Each card also receives a **Chaos Value** — a numeric score based on CMC, colours, and combat stats — used by future format mechanics.

---

## License

This project is released under the [MIT License](LICENSE).

Magic: The Gathering card data is provided by [Scryfall](https://scryfall.com) under their [terms of service](https://scryfall.com/docs/api/ethics). This project is not affiliated with or endorsed by Wizards of the Coast.
