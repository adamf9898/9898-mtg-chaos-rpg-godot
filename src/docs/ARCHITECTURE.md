# Architecture Overview

## High-Level Design

The MTG Chaos RPG web game follows a clean **Model–View–Controller** pattern using vanilla JavaScript ES Modules with no external dependencies.

```
┌──────────────────────────────────────────────────────────┐
│                    Browser (index.html)                   │
├──────────────────────────────────────────────────────────┤
│  UI Layer          │  Game Logic          │  API Layer   │
│  ─────────         │  ──────────          │  ─────────   │
│  GameUI.js         │  GameManager.js      │  ScryfallAPI │
│  CardSearchUI.js   │  ChaosFormat.js      │              │
│  DeckBuilderUI.js  │  DeckBuilder.js      │              │
│  BattleUI.js       │  CardData.js         │              │
│                    │  Champion.js         │              │
├──────────────────────────────────────────────────────────┤
│                    EventEmitter.js                        │
└──────────────────────────────────────────────────────────┘
```

## Layers

### 1. Game Logic (`js/game/`)

Pure business logic with no DOM dependencies. All game rules, state management, and data models live here.

| Module            | Responsibility                                        |
| ----------------- | ----------------------------------------------------- |
| `CardData.js`     | Data model for a single MTG card (mapped from Scryfall JSON) |
| `Champion.js`     | Player champion with HP, ATK, damage, and heal methods |
| `ChaosFormat.js`  | Format constants, chaos effects pool, deck validation, shuffling, card draw |
| `DeckBuilder.js`  | Deck management: add/remove cards, validate, finalize for game |
| `GameManager.js`  | Central state machine: phases, turns, combat, win conditions |

### 2. API Layer (`js/api/`)

Async wrapper around the Scryfall REST API with built-in rate limiting.

| Module            | Responsibility                                        |
| ----------------- | ----------------------------------------------------- |
| `ScryfallAPI.js`  | `searchCards`, `getCardByName`, `getRandomCard`, `getCardById`, `autocomplete` |

### 3. UI Layer (`js/ui/`)

DOM manipulation and user interaction handling. Each UI component owns its own HTML rendering and event binding.

| Module              | Responsibility                                      |
| ------------------- | --------------------------------------------------- |
| `GameUI.js`         | Top-level coordinator: screen transitions, state wiring |
| `CardSearchUI.js`   | Search input, results list, card preview            |
| `DeckBuilderUI.js`  | Deck list, card counts, validation, start game      |
| `BattleUI.js`       | Game board: champions, hands, battlefield, log, game over |

### 4. Infrastructure (`js/`)

| Module              | Responsibility                                      |
| ------------------- | --------------------------------------------------- |
| `EventEmitter.js`   | Minimal pub/sub for decoupled communication         |
| `main.js`           | Entry point — bootstraps `GameUI`                   |

## Data Flow

```
User Action → UI Component → Game Logic → EventEmitter → UI Update
                                  ↓
                           Scryfall API (for card data)
```

### Example: Playing a Card

1. Player clicks a card in their hand (`BattleUI`)
2. `BattleUI` calls `gameManager.playCard(index)`
3. `GameManager` removes card from hand, assigns to battlefield/graveyard
4. `GameManager` emits `cardPlayed` and `logMessage` events
5. `BattleUI` listens for events and re-renders the board

## State Machine

The `GameManager` uses a phase-based state machine:

```
DECK_BUILD → MULLIGAN → MAIN ⇄ COMBAT → END
                          ↑        ↓
                          └── (if defender alive)
```

## Module Dependencies

```
main.js
  └── GameUI.js
        ├── GameManager.js
        │     ├── Champion.js
        │     ├── ChaosFormat.js
        │     └── EventEmitter.js
        ├── DeckBuilder.js
        │     ├── ChaosFormat.js
        │     └── EventEmitter.js
        ├── CardSearchUI.js
        │     └── ScryfallAPI.js
        │           └── CardData.js
        ├── DeckBuilderUI.js
        │     └── DeckBuilder.js
        └── BattleUI.js
              └── GameManager.js
```

## Security Considerations

- All user-provided text is escaped via `textContent` before rendering to prevent XSS
- Scryfall API requests use `encodeURIComponent` for query parameters
- No cookies, localStorage, or authentication — all state is in-memory
- Rate limiting protects against Scryfall API abuse
