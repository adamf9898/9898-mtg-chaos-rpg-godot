## GameManager.gd
## Autoload singleton that manages the overall game state for a Chaos RPG match.
##
## Phases
## ──────
##   DECK_BUILD  – Players search Scryfall and assemble their decks.
##   MULLIGAN    – Players may take a free mulligan (draw a new hand of 7).
##   MAIN        – Normal turn structure: draw → play cards → attack → end.
##   COMBAT      – Champion attacks are resolved.
##   END         – One player's Champion HP has reached 0; display result.
extends Node

# ── Signals ────────────────────────────────────────────────────────────────────
signal phase_changed(new_phase: Phase)
signal turn_started(player_index: int)
signal card_played(player_index: int, card: CardData)
signal champion_damaged(player_index: int, amount: int)
signal game_over(winner_index: int)
signal log_message(message: String)

# ── Enums ──────────────────────────────────────────────────────────────────────
enum Phase { DECK_BUILD, MULLIGAN, MAIN, COMBAT, END }

# ── State ──────────────────────────────────────────────────────────────────────
var current_phase: Phase = Phase.DECK_BUILD
var current_player_index: int = 0
var turn_number: int = 0

## Two champions — index 0 is the local player, index 1 is the opponent.
var champions: Array[ChaosFormat.Champion] = []

## Decks as arrays of CardData (after finalize_for_game).
var decks: Array[Array] = [[], []]

## Hands as arrays of CardData.
var hands: Array[Array] = [[], []]

## Cards currently in play for each player.
var battlefields: Array[Array] = [[], []]

## Graveyard for each player.
var graveyards: Array[Array] = [[], []]


# ── Setup ──────────────────────────────────────────────────────────────────────

func _ready() -> void:
	_reset_state()


func _reset_state() -> void:
	champions.clear()
	for i in range(2):
		champions.append(ChaosFormat.Champion.new("Player %d" % (i + 1)))
	decks    = [[], []]
	hands    = [[], []]
	battlefields = [[], []]
	graveyards   = [[], []]
	current_player_index = 0
	turn_number = 0


## Configure champion names before starting a game.
func set_player_name(player_index: int, player_name: String) -> void:
	if player_index >= 0 and player_index < champions.size():
		champions[player_index].player_name = player_name


## Load a finalized deck (from DeckBuilder.finalize_for_game) for a player.
func load_deck(player_index: int, deck: Array) -> void:
	decks[player_index] = deck
	_log("Deck loaded for %s (%d cards)." % [champions[player_index].player_name, deck.size()])


# ── Phase transitions ──────────────────────────────────────────────────────────

## Begin the game: deal opening hands and move to the Mulligan phase.
func start_game() -> void:
	if decks[0].is_empty() or decks[1].is_empty():
		push_error("GameManager: Cannot start game — one or both decks are empty.")
		return
	_set_phase(Phase.MULLIGAN)
	for i in range(2):
		ChaosFormat.draw_cards(decks[i], hands[i], ChaosFormat.STARTING_HAND_SIZE)
		_log("%s draws opening hand." % champions[i].player_name)
	turn_number = 1
	turn_started.emit(current_player_index)


## The active player takes a free mulligan (shuffle hand back, draw 7 again).
func take_mulligan(player_index: int) -> void:
	if current_phase != Phase.MULLIGAN:
		return
	# Return hand to deck and reshuffle
	for card in hands[player_index]:
		decks[player_index].append(card)
	hands[player_index].clear()
	ChaosFormat.shuffle_deck(decks[player_index])
	ChaosFormat.draw_cards(decks[player_index], hands[player_index], ChaosFormat.STARTING_HAND_SIZE)
	_log("%s mulligans and draws a new hand." % champions[player_index].player_name)


## Both players are satisfied with their hands; begin the first main phase.
func begin_main_phase() -> void:
	_set_phase(Phase.MAIN)
	_log("Turn %d begins. %s's turn." % [turn_number, champions[current_player_index].player_name])
	# Active player draws a card (except turn 1 for player 0 by rule)
	if turn_number > 1 or current_player_index == 1:
		_draw_for_active_player()


# ── Turn actions ───────────────────────────────────────────────────────────────

## Play a card from the active player's hand onto the battlefield.
## Returns true if the card was successfully played.
func play_card(hand_index: int) -> bool:
	if current_phase != Phase.MAIN:
		_log("Cards can only be played during the Main phase.")
		return false
	var player_hand: Array = hands[current_player_index]
	if hand_index < 0 or hand_index >= player_hand.size():
		return false

	var card: CardData = player_hand[hand_index]
	player_hand.remove_at(hand_index)

	# Trigger chaos effect
	_log("⚡ Chaos Effect for %s: %s" % [card.name, card.chaos_effect])

	if card.is_land():
		# Lands go to the battlefield permanently
		battlefields[current_player_index].append(card)
	else:
		# Non-permanents resolve and go to the graveyard (simplified)
		graveyards[current_player_index].append(card)
		if card.is_creature():
			battlefields[current_player_index].append(card)

	card_played.emit(current_player_index, card)
	_log("%s plays %s." % [champions[current_player_index].player_name, card.name])
	return true


## Move to the Combat phase; the active player's Champion attacks.
func declare_attack() -> bool:
	if current_phase != Phase.MAIN:
		return false
	_set_phase(Phase.COMBAT)
	var attacker: ChaosFormat.Champion = champions[current_player_index]
	var defender_index: int = 1 - current_player_index
	var defender: ChaosFormat.Champion = champions[defender_index]

	defender.take_damage(attacker.attack)
	champion_damaged.emit(defender_index, attacker.attack)
	_log("%s attacks for %d damage! %s now has %d HP." % [
		attacker.player_name, attacker.attack,
		defender.player_name, defender.hp
	])

	if not defender.is_alive():
		_set_phase(Phase.END)
		game_over.emit(current_player_index)
		_log("🏆 %s wins!" % attacker.player_name)
		return true

	# Return to main for post-combat actions
	_set_phase(Phase.MAIN)
	return true


## End the active player's turn and pass to the other player.
func end_turn() -> void:
	if current_phase != Phase.MAIN:
		return
	current_player_index = 1 - current_player_index
	if current_player_index == 0:
		turn_number += 1
	_draw_for_active_player()
	_log("--- Turn %d: %s's turn ---" % [turn_number, champions[current_player_index].player_name])
	turn_started.emit(current_player_index)


# ── Private helpers ────────────────────────────────────────────────────────────

func _draw_for_active_player() -> void:
	var drawn := ChaosFormat.draw_cards(decks[current_player_index], hands[current_player_index])
	if drawn == 0:
		_log("%s cannot draw — deck is empty!" % champions[current_player_index].player_name)
	else:
		_log("%s draws a card." % champions[current_player_index].player_name)


func _set_phase(new_phase: Phase) -> void:
	current_phase = new_phase
	phase_changed.emit(new_phase)


func _log(message: String) -> void:
	print("[GameManager] ", message)
	log_message.emit(message)
