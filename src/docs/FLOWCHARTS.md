# Game Flowcharts

All diagrams use [Mermaid](https://mermaid.js.org/) syntax and can be rendered in GitHub, VS Code, or any Mermaid-compatible viewer.

## 1. Overall Game Flow

```mermaid
flowchart TD
    A[Start Application] --> B[Deck Building Phase]
    B --> C{Deck Legal?<br/>40–60 cards}
    C -->|No| B
    C -->|Yes| D[Build Opponent Deck<br/>from Scryfall API]
    D --> E[Mulligan Phase]
    E --> F{Keep Hand?}
    F -->|Mulligan| G[Shuffle & Redraw 7]
    G --> F
    F -->|Keep| H[Begin Main Phase]
    H --> I[Game Loop]
    I --> J{Champion HP > 0?}
    J -->|Yes| I
    J -->|No| K[Game Over Screen]
    K --> L{Play Again?}
    L -->|Yes| A
    L -->|No| M[End]
```

## 2. Turn Structure

```mermaid
flowchart TD
    A[Start of Turn] --> B[Draw a Card]
    B --> C{Cards in Hand?}
    C -->|Yes| D[Player Decides Action]
    C -->|No| D
    D --> E{Play a Card?}
    E -->|Yes| F[Remove Card from Hand]
    F --> G[Assign to Battlefield/Graveyard]
    G --> H[Trigger Random Chaos Effect]
    H --> I[Log Chaos Effect]
    I --> D
    E -->|No| J{Declare Attack?}
    J -->|Yes| K[Champion Attacks Opponent]
    K --> L[Deal ATK Damage]
    L --> M{Defender HP = 0?}
    M -->|Yes| N[Game Over — Attacker Wins]
    M -->|No| O[Return to Main Phase]
    O --> D
    J -->|No| P{End Turn?}
    P -->|Yes| Q[Pass to Other Player]
    Q --> A
    P -->|No| D
```

## 3. Deck Building Flow

```mermaid
flowchart TD
    A[Open Deck Builder] --> B[Enter Search Query]
    B --> C[Call Scryfall API]
    C --> D{Results Found?}
    D -->|No| E[Show Error Message]
    E --> B
    D -->|Yes| F[Display Card List]
    F --> G[Select a Card]
    G --> H{Add to Deck?}
    H -->|Yes| I{Deck < 60 cards?}
    I -->|Yes| J{Non-land < 4 copies?}
    J -->|Yes| K[Add Card to Deck]
    K --> L[Update Deck Display]
    J -->|No| M[Show Copy Limit Error]
    I -->|No| N[Show Max Size Error]
    H -->|No| B
    L --> O{Deck >= 40 cards?}
    O -->|Yes| P[Enable Start Game Button]
    O -->|No| B
    P --> Q{Start Game?}
    Q -->|Yes| R[Finalize Deck]
    R --> S[Assign Chaos Effects]
    S --> T[Shuffle Deck]
    T --> U[Proceed to Game]
    Q -->|No| B
```

## 4. Chaos Effect Assignment

```mermaid
flowchart TD
    A[Card Played] --> B[Select Random Chaos Effect]
    B --> C[Calculate Chaos Value]
    C --> D[base = floor CMC]
    D --> E[base += colors × 2]
    E --> F{Is Creature?}
    F -->|Yes| G[base += floor of P+T / 2]
    F -->|No| H[Skip]
    G --> I[Assign Chaos Value]
    H --> I
    I --> J[Display Effect in Log]
    J --> K[Apply Effect]
```

## 5. Scryfall API Flow

```mermaid
flowchart TD
    A[API Request] --> B{Rate Limit OK?<br/>100ms since last}
    B -->|No| C[Wait for Delay]
    C --> B
    B -->|Yes| D[Send HTTP Request]
    D --> E{Response OK?}
    E -->|No| F[Parse Error Message]
    F --> G[Display Error to User]
    E -->|Yes| H[Parse JSON Response]
    H --> I{Request Type?}
    I -->|Search| J[Map Array to CardData]
    I -->|Single Card| K[Map to CardData]
    I -->|Random| L[Map to CardData]
    J --> M[Return Results]
    K --> M
    L --> M
```

## 6. Component Communication

```mermaid
flowchart LR
    subgraph UI Layer
        A[GameUI]
        B[CardSearchUI]
        C[DeckBuilderUI]
        D[BattleUI]
    end

    subgraph Game Logic
        E[GameManager]
        F[DeckBuilder]
        G[ChaosFormat]
    end

    subgraph API
        H[ScryfallAPI]
    end

    A --> B
    A --> C
    A --> D
    B -->|search| H
    B -->|add card| F
    C -->|display| F
    C -->|start game| A
    D -->|play/attack/end| E
    E -->|events| D
    E -->|rules| G
    F -->|finalize| G
    H -->|cards| B
```

## 7. State Machine

```mermaid
stateDiagram-v2
    [*] --> DECK_BUILD
    DECK_BUILD --> MULLIGAN : Decks loaded
    MULLIGAN --> MAIN : Keep hand
    MAIN --> COMBAT : Declare attack
    COMBAT --> MAIN : Defender alive
    COMBAT --> END : Defender HP = 0
    MAIN --> MAIN : Play card / End turn
    END --> [*]
```
