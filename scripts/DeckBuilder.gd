## DeckBuilder.gd
## Manages a player's deck during the deck-building phase.
## Provides add/remove helpers and integrates with ScryfallAPI for card lookup.
class_name DeckBuilder
extends RefCounted

# ── Signals ───────────────────────────────────────────────────────────────────
signal deck_changed(deck: Array)

# ── State ─────────────────────────────────────────────────────────────────────
var _deck: Array[CardData] = []


# ── Read-only access ───────────────────────────────────────────────────────────

## Returns a copy of the current deck list.
func get_deck() -> Array[CardData]:
	return _deck.duplicate()


## Returns the total number of cards currently in the deck.
func size() -> int:
	return _deck.size()


## Returns how many copies of a card (identified by oracle_id or name) are in the deck.
func count_copies(card: CardData) -> int:
	var key := _key_for(card)
	var n := 0
	for c: CardData in _deck:
		if _key_for(c) == key:
			n += 1
	return n


# ── Mutation ───────────────────────────────────────────────────────────────────

## Attempt to add a card to the deck.
## Returns true on success, false if the card would violate format rules.
func add_card(card: CardData) -> bool:
	if _deck.size() >= ChaosFormat.MAX_DECK_SIZE:
		push_warning("DeckBuilder: Deck is already at maximum size.")
		return false

	if not card.is_land() and count_copies(card) >= 4:
		push_warning("DeckBuilder: Cannot add more than 4 copies of '%s'." % card.name)
		return false

	_deck.append(card)
	deck_changed.emit(get_deck())
	return true


## Remove the first copy of a card from the deck.
## Returns true if a copy was found and removed, false otherwise.
func remove_card(card: CardData) -> bool:
	var key := _key_for(card)
	for i in range(_deck.size()):
		if _key_for(_deck[i]) == key:
			_deck.remove_at(i)
			deck_changed.emit(get_deck())
			return true
	return false


## Remove all cards from the deck.
func clear() -> void:
	_deck.clear()
	deck_changed.emit(get_deck())


# ── Validation ─────────────────────────────────────────────────────────────────

## Returns a validation message for the current deck state.
func validate() -> String:
	return ChaosFormat.validate_deck(_deck)


## Returns true when the deck is legal for the Chaos RPG format.
func is_legal() -> bool:
	return ChaosFormat.is_deck_legal(_deck)


# ── Deck finalization ──────────────────────────────────────────────────────────

## Shuffles the deck and assigns a chaos effect to every card.
## Uses deep-duplicated CardData objects so the builder's original list is unmodified.
## Call this once before starting a game.
func finalize_for_game() -> Array[CardData]:
	var game_deck: Array = []
	for card: CardData in _deck:
		game_deck.append(card.duplicate(true))
	for card: CardData in game_deck:
		ChaosFormat.assign_chaos_effect(card)
	ChaosFormat.shuffle_deck(game_deck)
	return game_deck


# ── Private ────────────────────────────────────────────────────────────────────

func _key_for(card: CardData) -> String:
	return card.oracle_id if card.oracle_id != "" else card.name
