## ChaosFormat.gd
## Defines the rules and mechanics of the custom "MTG Chaos RPG" format.
##
## Format Overview:
## ─────────────────
## • Each player controls a Champion — a persistent hero with HP and Attack.
## • Players build a 40-card deck using any cards from the Scryfall database.
## • When a card is played, a random Chaos Effect triggers alongside its normal rules.
## • Victory: reduce the opposing Champion's HP to 0.
##
## Chaos Effects add unexpected interactions each game, ensuring no two games
## play out the same way.
class_name ChaosFormat
extends RefCounted

# ── Format constants ───────────────────────────────────────────────────────────
const MIN_DECK_SIZE := 40
const MAX_DECK_SIZE := 60
const STARTING_HAND_SIZE := 7
const CHAMPION_STARTING_HP := 20
const CHAMPION_STARTING_ATTACK := 2

# ── Chaos effect pool ──────────────────────────────────────────────────────────
## All possible chaos effects that can trigger when a card is played.
const CHAOS_EFFECTS: Array[String] = [
	"Double Strike: This card deals double damage this turn.",
	"Arcane Surge: Draw an additional card.",
	"Mana Void: Your opponent loses 1 mana next turn.",
	"Time Warp: Take an additional mini-turn after this one.",
	"Cursed Aura: The played card gains -1/-1 until end of turn.",
	"Blessed Aura: The played card gains +1/+1 until end of turn.",
	"Chaos Rift: Shuffle a random card from each hand back into its owner's deck.",
	"Wild Growth: Gain 2 HP.",
	"Dark Bargain: Deal 3 damage to any target; lose 1 HP.",
	"Spectral Echo: Copy the effect of this card once.",
	"Temporal Flux: The top card of your deck is exiled face-down until end of turn.",
	"Mana Flood: Add 2 colorless mana to your pool.",
	"Reckless Charge: Your Champion attacks for +3 damage this turn.",
	"Arcane Mirror: Reflect the next spell cast back at its caster.",
	"Pandemonium: Each player draws 2 cards and discards 1.",
	"Luck of the Draw: Scry 2.",
	"Rally: All your creatures get +1/+0 until end of turn.",
	"Hex: Target creature gets -2/-0 until end of turn.",
	"Inspiration: Reduce the mana cost of your next spell by 1.",
	"Entropy: Randomly swap the top cards of each player's library.",
]

# ── Champion data class ────────────────────────────────────────────────────────
class Champion:
	var player_name: String
	var hp: int
	var max_hp: int
	var attack: int

	func _init(p_name: String, p_hp: int = ChaosFormat.CHAMPION_STARTING_HP,
			p_attack: int = ChaosFormat.CHAMPION_STARTING_ATTACK) -> void:
		player_name = p_name
		hp = p_hp
		max_hp = p_hp
		attack = p_attack

	func is_alive() -> bool:
		return hp > 0

	func take_damage(amount: int) -> void:
		hp = max(0, hp - amount)

	func heal(amount: int) -> void:
		hp = min(max_hp, hp + amount)

	func to_string() -> String:
		return "%s — HP: %d/%d  ATK: %d" % [player_name, hp, max_hp, attack]


# ── Deck validation ────────────────────────────────────────────────────────────

## Returns true if the given list of CardData objects forms a legal Chaos RPG deck.
static func is_deck_legal(deck: Array) -> bool:
	if deck.size() < MIN_DECK_SIZE or deck.size() > MAX_DECK_SIZE:
		return false

	# No more than 4 copies of any non-basic-land card (standard rule)
	var counts: Dictionary = {}
	for card: CardData in deck:
		var key: String = card.oracle_id if card.oracle_id != "" else card.name
		if not card.is_land():
			counts[key] = counts.get(key, 0) + 1
			if counts[key] > 4:
				return false

	return true


## Returns a human-readable validation message for a deck.
static func validate_deck(deck: Array) -> String:
	if deck.size() < MIN_DECK_SIZE:
		return "Deck is too small (%d cards; minimum %d)." % [deck.size(), MIN_DECK_SIZE]
	if deck.size() > MAX_DECK_SIZE:
		return "Deck is too large (%d cards; maximum %d)." % [deck.size(), MAX_DECK_SIZE]

	var counts: Dictionary = {}
	for card: CardData in deck:
		var key: String = card.oracle_id if card.oracle_id != "" else card.name
		if not card.is_land():
			counts[key] = counts.get(key, 0) + 1
			if counts[key] > 4:
				return "Too many copies of '%s' (%d; maximum 4)." % [card.name, counts[key]]

	return "Deck is legal."


# ── Chaos effect assignment ────────────────────────────────────────────────────

## Assigns a random chaos effect to a card and computes its chaos_value.
static func assign_chaos_effect(card: CardData) -> void:
	var rng := RandomNumberGenerator.new()
	rng.randomize()
	card.chaos_effect = CHAOS_EFFECTS[rng.randi() % CHAOS_EFFECTS.size()]
	card.chaos_value  = _compute_chaos_value(card)


## Derives a numeric chaos value from the card's properties.
## Higher CMC and more colors yield higher chaos potential.
static func _compute_chaos_value(card: CardData) -> int:
	var base: int = int(card.cmc)
	base += card.colors.size() * 2
	if card.is_creature():
		var p := card.power.to_int()
		var t := card.toughness.to_int()
		base += (p + t) / 2
	return base


# ── Turn helpers ───────────────────────────────────────────────────────────────

## Shuffles a deck (Array[CardData]) in place using Fisher-Yates.
static func shuffle_deck(deck: Array) -> void:
	var rng := RandomNumberGenerator.new()
	rng.randomize()
	for i in range(deck.size() - 1, 0, -1):
		var j := rng.randi_range(0, i)
		var tmp = deck[i]
		deck[i] = deck[j]
		deck[j] = tmp


## Draws `count` cards from a deck into a hand array.
## Returns the number of cards actually drawn.
static func draw_cards(deck: Array, hand: Array, count: int = 1) -> int:
	var drawn := 0
	for _i in range(count):
		if deck.is_empty():
			break
		hand.append(deck.pop_back())
		drawn += 1
	return drawn
