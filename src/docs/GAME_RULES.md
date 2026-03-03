# Game Rules — MTG Chaos RPG

## Overview

MTG Chaos RPG is a custom Magic: The Gathering format where players build decks from real MTG cards (via the Scryfall database), control a Champion hero, and experience random Chaos Effects on every card played. No two games play out the same way.

## Champions

Each player controls a **Champion** — a persistent hero that represents them on the battlefield.

| Stat       | Starting Value |
| ---------- | -------------- |
| HP         | 20             |
| Max HP     | 20             |
| Attack     | 2              |

**Victory Condition:** Reduce the opponent's Champion HP to **0**.

## Deck Building

- **Deck size:** 40–60 cards
- **Card sources:** Any card from the complete MTG card database (via Scryfall)
- **Copy limit:** Maximum **4 copies** of any non-basic-land card
- **Basic lands:** Unlimited copies allowed

## Game Phases

### 1. Deck Building Phase (`DECK_BUILD`)

Players search for MTG cards using the Scryfall API and build their decks. The deck must be between 40 and 60 cards to be legal.

### 2. Mulligan Phase (`MULLIGAN`)

- Each player draws an opening hand of **7 cards**
- Players may take a **free mulligan** (shuffle hand back, draw 7 new cards)
- No penalty for mulligans in Chaos RPG format

### 3. Main Phase (`MAIN`)

On each turn, the active player may:

1. **Draw a card** (automatic at start of turn; player 1 skips draw on turn 1)
2. **Play cards** from hand — each card triggers a random **Chaos Effect**
3. **Declare an attack** — the Champion deals its ATK value as damage to the opponent

### 4. Combat Phase (`COMBAT`)

- The active player's Champion attacks the opponent's Champion
- Damage equals the attacker's ATK stat
- If the defender's HP reaches 0, the game ends
- Otherwise, play returns to the Main Phase

### 5. End Phase (`END`)

The game is over. The player whose Champion's HP reached 0 loses.

## Turn Structure

```
Start of Turn
  → Draw a card (except Player 1 on Turn 1)
  → Play cards (optional, triggers chaos effects)
  → Declare Attack (optional)
  → End Turn (pass to opponent)
```

## Card Types

| Type      | Behavior                                            |
| --------- | --------------------------------------------------- |
| Land      | Enters the battlefield permanently                  |
| Creature  | Enters the battlefield + goes to graveyard          |
| Instant   | Resolves immediately, goes to graveyard             |
| Sorcery   | Resolves immediately, goes to graveyard             |
| Other     | Resolves immediately, goes to graveyard             |

## Chaos Effects

Every time a card is played, a random **Chaos Effect** triggers. There are 20 possible effects:

| # | Effect | Description |
|---|--------|-------------|
| 1 | **Double Strike** | This card deals double damage this turn |
| 2 | **Arcane Surge** | Draw an additional card |
| 3 | **Mana Void** | Your opponent loses 1 mana next turn |
| 4 | **Time Warp** | Take an additional mini-turn after this one |
| 5 | **Cursed Aura** | The played card gains -1/-1 until end of turn |
| 6 | **Blessed Aura** | The played card gains +1/+1 until end of turn |
| 7 | **Chaos Rift** | Shuffle a random card from each hand back into its deck |
| 8 | **Wild Growth** | Gain 2 HP |
| 9 | **Dark Bargain** | Deal 3 damage to any target; lose 1 HP |
| 10 | **Spectral Echo** | Copy the effect of this card once |
| 11 | **Temporal Flux** | Top card of deck is exiled face-down until end of turn |
| 12 | **Mana Flood** | Add 2 colorless mana to your pool |
| 13 | **Reckless Charge** | Your Champion attacks for +3 damage this turn |
| 14 | **Arcane Mirror** | Reflect the next spell cast back at its caster |
| 15 | **Pandemonium** | Each player draws 2 cards and discards 1 |
| 16 | **Luck of the Draw** | Scry 2 |
| 17 | **Rally** | All your creatures get +1/+0 until end of turn |
| 18 | **Hex** | Target creature gets -2/-0 until end of turn |
| 19 | **Inspiration** | Reduce the mana cost of your next spell by 1 |
| 20 | **Entropy** | Randomly swap the top cards of each player's library |

## Chaos Value

Each card receives a **Chaos Value** score based on its properties:

```
Chaos Value = floor(CMC) + (number of colors × 2) + (creature P+T)/2
```

Higher chaos values indicate more impactful chaos effects.

## AI Opponent (Chaos Bot)

The built-in AI opponent ("Chaos Bot") builds a deck from random Scryfall search results:
- 20 random creatures
- 8 random instants
- 7 random sorceries
- 5 random lands

The AI does not mulligan and plays automatically.
