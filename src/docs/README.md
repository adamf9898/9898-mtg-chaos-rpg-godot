# MTG Chaos RPG — Web Game

A browser-based **Magic: The Gathering Chaos RPG** card game built with vanilla HTML, CSS, and JavaScript. No build tools or frameworks required.

## Quick Start

1. Open `src/index.html` in any modern web browser.
2. **Build your deck** by searching for MTG cards via the Scryfall API.
3. Once your deck reaches 40–60 cards, click **Start Game**.
4. Choose to **keep** or **mulligan** your opening hand.
5. **Play cards**, **attack**, and **end your turn** to defeat the Chaos Bot!

## Project Structure

```
src/
├── index.html               # Entry point — open in a browser
├── css/
│   └── style.css            # Complete game stylesheet
├── js/
│   ├── main.js              # Application bootstrap
│   ├── EventEmitter.js      # Minimal event system
│   ├── game/
│   │   ├── CardData.js      # Card data model (Scryfall mapping)
│   │   ├── Champion.js      # Champion class (HP, ATK)
│   │   ├── ChaosFormat.js   # Format rules, chaos effects, helpers
│   │   ├── DeckBuilder.js   # Deck management with validation
│   │   └── GameManager.js   # Turn-based game state machine
│   ├── api/
│   │   └── ScryfallAPI.js   # Async Scryfall REST API wrapper
│   └── ui/
│       ├── CardSearchUI.js  # Card search panel
│       ├── DeckBuilderUI.js # Deck list panel
│       ├── BattleUI.js      # Game board (champions, hands, battlefield)
│       └── GameUI.js        # Screen coordinator
├── docs/
│   ├── README.md            # This file
│   ├── ARCHITECTURE.md      # Architecture overview
│   ├── GAME_RULES.md        # Complete game rules
│   └── FLOWCHARTS.md        # Mermaid game flow diagrams
└── tests/
    └── test.html            # In-browser unit test runner
```

## Technology

| Component         | Technology                  |
| ----------------- | --------------------------- |
| Language          | Vanilla JavaScript (ES Modules) |
| Markup            | HTML5                       |
| Styling           | CSS3 (custom properties, grid, flexbox) |
| Card API          | [Scryfall REST API](https://scryfall.com/docs/api) |
| Build tools       | None — zero dependencies    |
| Test runner       | In-browser test page        |

## Features

- **Real-time card search** via Scryfall API with rate limiting
- **Deck building** with 40–60 card validation and 4-copy rule
- **20 unique Chaos Effects** that trigger on every card play
- **Turn-based combat** with champions, attacks, and HP tracking
- **AI opponent** built from random Scryfall cards
- **Mulligan phase** with opening hand preview
- **Responsive design** for desktop and mobile browsers
- **Dark theme** game UI

## Browser Support

- Chrome 80+
- Firefox 78+
- Safari 14+
- Edge 80+

All modern browsers with ES Module support.

## API Attribution

Card data is provided by [Scryfall](https://scryfall.com/). This project follows Scryfall's API guidelines, including rate limiting (100ms between requests).

## License

This project is for educational and personal use.
