## Main.gd
## Entry point for the MTG Chaos RPG game.
## Coordinates navigation between the Deck Builder, game board, and end screen.
extends Node


func _ready() -> void:
	GameManager.game_over.connect(_on_game_over)
	GameManager.log_message.connect(_on_log_message)
	print("MTG Chaos RPG — ready. Open the Deck Builder to begin.")


func _on_game_over(winner_index: int) -> void:
	var winner_name: String = GameManager.champions[winner_index].player_name
	print("Game Over! Winner: %s" % winner_name)


func _on_log_message(message: String) -> void:
	# In a full implementation this would push to an on-screen log UI element.
	pass
