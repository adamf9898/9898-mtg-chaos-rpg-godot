## CardData.gd
## Resource class representing a single Magic: The Gathering card,
## populated from the Scryfall API JSON response.
class_name CardData
extends Resource

# ── Identity ──────────────────────────────────────────────────────────────────
@export var scryfall_id: String = ""
@export var oracle_id: String = ""
@export var name: String = ""
@export var set_code: String = ""
@export var collector_number: String = ""
@export var lang: String = "en"

# ── Rules text ────────────────────────────────────────────────────────────────
@export var mana_cost: String = ""
@export var cmc: float = 0.0
@export var type_line: String = ""
@export var oracle_text: String = ""
@export var flavor_text: String = ""

# ── Combat stats (creatures) ──────────────────────────────────────────────────
@export var power: String = ""
@export var toughness: String = ""

# ── Loyalty (planeswalkers) ────────────────────────────────────────────────────
@export var loyalty: String = ""

# ── Colors ────────────────────────────────────────────────────────────────────
@export var colors: Array[String] = []
@export var color_identity: Array[String] = []

# ── Legalities ────────────────────────────────────────────────────────────────
## Dictionary mapping format name → legality string (e.g. "legal", "banned")
@export var legalities: Dictionary = {}

# ── Image URIs ────────────────────────────────────────────────────────────────
@export var image_uri_normal: String = ""
@export var image_uri_small: String = ""
@export var image_uri_art_crop: String = ""

# ── Chaos RPG stats (computed / assigned at runtime) ─────────────────────────
## Chaos value: a combined score used by the Chaos RPG format engine.
@export var chaos_value: int = 0
## Random chaos effect assigned when the card enters play.
@export var chaos_effect: String = ""


## Populate this resource from a raw Scryfall API card JSON dictionary.
static func from_scryfall_json(json: Dictionary) -> CardData:
	var card := CardData.new()

	card.scryfall_id      = json.get("id", "")
	card.oracle_id        = json.get("oracle_id", "")
	card.name             = json.get("name", "")
	card.set_code         = json.get("set", "")
	card.collector_number = json.get("collector_number", "")
	card.lang             = json.get("lang", "en")
	card.mana_cost        = json.get("mana_cost", "")
	card.cmc              = json.get("cmc", 0.0)
	card.type_line        = json.get("type_line", "")
	card.oracle_text      = json.get("oracle_text", "")
	card.flavor_text      = json.get("flavor_text", "")
	card.power            = json.get("power", "")
	card.toughness        = json.get("toughness", "")
	card.loyalty          = json.get("loyalty", "")
	card.legalities       = json.get("legalities", {})

	# Colors are arrays in the Scryfall response
	var raw_colors: Array = json.get("colors", [])
	for c in raw_colors:
		card.colors.append(str(c))

	var raw_ci: Array = json.get("color_identity", [])
	for c in raw_ci:
		card.color_identity.append(str(c))

	# Image URIs may be nested or at the top level (double-faced cards differ)
	var image_uris: Dictionary = json.get("image_uris", {})
	card.image_uri_normal   = image_uris.get("normal", "")
	card.image_uri_small    = image_uris.get("small", "")
	card.image_uri_art_crop = image_uris.get("art_crop", "")

	return card


## Returns true when the card is a creature type.
func is_creature() -> bool:
	return "Creature" in type_line


## Returns true when the card is an instant or sorcery.
func is_spell() -> bool:
	return "Instant" in type_line or "Sorcery" in type_line


## Returns true when the card is a land.
func is_land() -> bool:
	return "Land" in type_line


## Returns a human-readable summary for debug purposes.
func to_string() -> String:
	return "%s [%s] {%s} — CMC %.0f" % [name, type_line, mana_cost, cmc]
