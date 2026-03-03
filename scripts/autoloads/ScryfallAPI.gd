## ScryfallAPI.gd
## Autoload singleton that wraps the Scryfall REST API.
## All requests are asynchronous; listen to the emitted signals for results.
##
## Scryfall API documentation: https://scryfall.com/docs/api
extends Node

# ── Constants ─────────────────────────────────────────────────────────────────
const BASE_URL := "https://api.scryfall.com"

## Scryfall recommends a small delay between requests to be a polite client.
const REQUEST_DELAY_MS := 100

# ── Signals ───────────────────────────────────────────────────────────────────
## Emitted when a card search completes successfully.
## @param cards  Array[CardData]
signal search_completed(cards: Array)

## Emitted when a single card lookup completes successfully.
## @param card  CardData
signal card_found(card: CardData)

## Emitted when a random card is fetched successfully.
## @param card  CardData
signal random_card_fetched(card: CardData)

## Emitted on any API error.
## @param error_message  String
signal request_failed(error_message: String)

# ── Internal state ─────────────────────────────────────────────────────────────
var _http: HTTPRequest = null
var _pending_request_type: String = ""


func _ready() -> void:
	_http = HTTPRequest.new()
	add_child(_http)
	_http.request_completed.connect(_on_request_completed)


# ── Public API ─────────────────────────────────────────────────────────────────

## Search for cards using a full Scryfall search query.
## See https://scryfall.com/docs/syntax for query syntax.
func search_cards(query: String, page: int = 1) -> void:
	var url := BASE_URL + "/cards/search?q=" + query.uri_encode() + "&page=" + str(page)
	_make_request(url, "search")


## Look up a single card by its exact name.
func get_card_by_name(card_name: String, fuzzy: bool = false) -> void:
	var param := "fuzzy" if fuzzy else "exact"
	var url := BASE_URL + "/cards/named?" + param + "=" + card_name.uri_encode()
	_make_request(url, "card")


## Fetch a completely random card (optionally filtered by a Scryfall query).
func get_random_card(query: String = "") -> void:
	var url := BASE_URL + "/cards/random"
	if query != "":
		url += "?q=" + query.uri_encode()
	_make_request(url, "random")


## Fetch a card by its Scryfall UUID.
func get_card_by_id(scryfall_id: String) -> void:
	var url := BASE_URL + "/cards/" + scryfall_id
	_make_request(url, "card")


# ── Internals ──────────────────────────────────────────────────────────────────

func _make_request(url: String, request_type: String) -> void:
	if _http.get_http_client_status() != HTTPClient.STATUS_DISCONNECTED:
		push_warning("ScryfallAPI: A request is already in progress; ignoring new request.")
		return
	_pending_request_type = request_type
	var headers := PackedStringArray(["User-Agent: MTGChaosRPG/1.0", "Accept: application/json"])
	var err := _http.request(url, headers)
	if err != OK:
		request_failed.emit("HTTPRequest error code: %d" % err)


func _on_request_completed(
		result: int,
		response_code: int,
		_headers: PackedStringArray,
		body: PackedByteArray) -> void:

	if result != HTTPRequest.RESULT_SUCCESS:
		request_failed.emit("Network error (result=%d)" % result)
		return

	if response_code < 200 or response_code >= 300:
		# Try to surface the Scryfall error message
		var json := JSON.new()
		if json.parse(body.get_string_from_utf8()) == OK:
			var data: Dictionary = json.get_data()
			request_failed.emit(data.get("details", "HTTP %d" % response_code))
		else:
			request_failed.emit("HTTP %d" % response_code)
		return

	var json := JSON.new()
	if json.parse(body.get_string_from_utf8()) != OK:
		request_failed.emit("Failed to parse JSON response")
		return

	var data = json.get_data()

	match _pending_request_type:
		"search":
			var cards: Array = []
			var card_list: Array = data.get("data", [])
			for card_json in card_list:
				cards.append(CardData.from_scryfall_json(card_json))
			search_completed.emit(cards)

		"card", "random":
			var card := CardData.from_scryfall_json(data)
			if _pending_request_type == "random":
				random_card_fetched.emit(card)
			else:
				card_found.emit(card)

		_:
			push_warning("ScryfallAPI: Unknown request type '%s'" % _pending_request_type)
