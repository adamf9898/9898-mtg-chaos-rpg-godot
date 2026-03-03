## CardSearch.gd
## UI controller for the Scryfall card-search panel.
## Connects to ScryfallAPI signals and displays results in a list.
extends Control

# Node references (assigned in the scene)
@onready var search_input: LineEdit   = $VBoxContainer/SearchInput
@onready var search_button: Button    = $VBoxContainer/SearchButton
@onready var results_list: ItemList   = $VBoxContainer/ResultsList
@onready var status_label: Label      = $VBoxContainer/StatusLabel
@onready var add_to_deck_button: Button = $VBoxContainer/AddToDeckButton

var _search_results: Array[CardData] = []
var _deck_builder: DeckBuilder = DeckBuilder.new()


func _ready() -> void:
	search_button.pressed.connect(_on_search_pressed)
	add_to_deck_button.pressed.connect(_on_add_to_deck_pressed)
	results_list.item_selected.connect(_on_result_selected)

	ScryfallAPI.search_completed.connect(_on_search_completed)
	ScryfallAPI.request_failed.connect(_on_request_failed)

	add_to_deck_button.disabled = true
	status_label.text = "Enter a card name or Scryfall query and press Search."


func _on_search_pressed() -> void:
	var query := search_input.text.strip_edges()
	if query.is_empty():
		status_label.text = "Please enter a search term."
		return
	status_label.text = "Searching…"
	results_list.clear()
	_search_results.clear()
	add_to_deck_button.disabled = true
	ScryfallAPI.search_cards(query)


func _on_search_completed(cards: Array) -> void:
	_search_results.clear()
	results_list.clear()
	for card: CardData in cards:
		_search_results.append(card)
		results_list.add_item("%s  [%s]  CMC %.0f" % [card.name, card.type_line, card.cmc])
	status_label.text = "%d card(s) found." % _search_results.size()


func _on_request_failed(error_message: String) -> void:
	status_label.text = "Error: " + error_message


func _on_result_selected(_index: int) -> void:
	add_to_deck_button.disabled = false


func _on_add_to_deck_pressed() -> void:
	var idx := results_list.get_selected_items()
	if idx.is_empty():
		return
	var card: CardData = _search_results[idx[0]]
	if _deck_builder.add_card(card):
		status_label.text = "Added '%s' to deck (%d cards)." % [card.name, _deck_builder.size()]
	else:
		status_label.text = "Could not add '%s': %s" % [card.name, _deck_builder.validate()]
