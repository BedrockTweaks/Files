# This is an all in one function to avoid players to execute unneeded functions

## Setup
scoreboard objectives add ms_config dummy
scoreboard objectives add ms_time dummy
scoreboard objectives add ms_colors dummy
scoreboard players add setup ms_config 0
# Display Chat 0, Action Bar 1, Hidden 2
execute if score setup ms_config matches 0 run scoreboard players set display ms_config 0
execute if score setup ms_config matches 0 run scoreboard players set always_reset_weather ms_config 0
execute if score setup ms_config matches 0 run scoreboard players set required_percent ms_config 0
execute if score setup ms_config matches 0 run scoreboard players set sleeping_players ms_config 0
execute if score setup ms_config matches 0 run scoreboard players set total_players ms_config 0
execute if score setup ms_config matches 0 run scoreboard players set required_players ms_config 0
execute if score setup ms_config matches 0 run scoreboard players set left_players ms_config 0
execute if score setup ms_config matches 0 run scoreboard players set slept_time ms_config 0
execute if score setup ms_config matches 0 run scoreboard players set N100 ms_config 100
execute if score setup ms_config matches 0 run scoreboard players set N60 ms_config 60
execute if score setup ms_config matches 0 run scoreboard players set display_chat ms_colors 2
execute if score setup ms_config matches 0 run scoreboard players set display_action_bar ms_colors 4
execute if score setup ms_config matches 0 run scoreboard players set display_hidden ms_colors 4
execute if score setup ms_config matches 0 run scoreboard players set always_reset_weather ms_colors 4

execute if score setup ms_config matches 0 run scoreboard players set setup ms_config 1


## Sleeping Check
# If any entity has ms_sleeping tag
execute as @a[tag=ms_sleeping] run scoreboard players set sleep_check ms_config 1

# Add dimension tags to players
execute if score sleep_check ms_config matches 1 run event entity @a set_dimension

# Store total players and sleeping players
execute if score sleep_check ms_config matches 1 run scoreboard players set total_players ms_config 0
execute if score sleep_check ms_config matches 1 run scoreboard players set sleeping_players ms_config 0
execute if score sleep_check ms_config matches 1 run execute as @a[tag=!in_the_nether,tag=!in_the_end,m=survival] run scoreboard players add total_players ms_config 1
execute if score sleep_check ms_config matches 1 run execute as @a[tag=!in_the_nether,tag=!in_the_end,m=adventure] run scoreboard players add total_players ms_config 1
execute if score sleep_check ms_config matches 1 run execute as @a[tag=ms_sleeping] run scoreboard players add sleeping_players ms_config 1

# Calculate required players to pass night
# If left_players (amount of more players that need to be in a bed) <= 0 -> Enough Players to pass night
execute if score sleep_check ms_config matches 1 run scoreboard players operation required_players ms_config = total_players ms_config
execute if score sleep_check ms_config matches 1 run scoreboard players operation required_players ms_config *= required_percent ms_config
execute if score sleep_check ms_config matches 1 run scoreboard players operation required_players ms_config /= N100 ms_config
execute if score sleep_check ms_config matches 1 run scoreboard players operation left_players ms_config = required_players ms_config
execute if score sleep_check ms_config matches 1 run scoreboard players operation left_players ms_config -= sleeping_players ms_config

# Check if all players have been in bed enough time
execute if score sleep_check ms_config matches 1 run scoreboard players operation needed_time ms_time = required_players ms_config
execute if score sleep_check ms_config matches 1 run scoreboard players operation needed_time ms_time *= N60 ms_config
execute if score sleep_check ms_config matches 1 if score needed_time ms_time matches ..59 run scoreboard players set needed_time ms_time 60
execute if score sleep_check ms_config matches 1 run scoreboard players set total_time ms_time 0
execute if score sleep_check ms_config matches 1 as @a[tag=ms_sleeping] run scoreboard players operation total_time ms_time += @s ms_time
execute if score sleep_check ms_config matches 1 if score left_players ms_config matches ..0 if score total_time ms_time >= needed_time ms_time run scoreboard players set sleep_execute ms_config 1


## Display sleep messages
execute as @a[tag=ms_check] run scoreboard players operation @s ms_config = left_players ms_config
# If Display Chat (0)
execute as @a[tag=ms_check] if score display ms_config matches 0 if score @s ms_config matches 1.. run tellraw @a {"rawtext":[{"translate":"bt.ms.sleeping_players","with":{"rawtext":[{"score":{"name":"sleeping_players","objective":"ms_config"}},{"score":{"name":"required_players","objective":"ms_config"}}]}}]}
execute as @a[tag=ms_check] if score display ms_config matches 0 if score @s ms_config matches ..0 run tellraw @a {"rawtext":[{"translate":"bt.ms.slept_players"}]}

# If Display Action Bar (1)
execute as @a[tag=ms_check] if score display ms_config matches 1 if score @s ms_config matches 1.. run titleraw @a actionbar {"rawtext":[{"translate":"bt.ms.sleeping_players","with":{"rawtext":[{"score":{"name":"sleeping_players","objective":"ms_config"}},{"score":{"name":"required_players","objective":"ms_config"}}]}}]}
execute as @a[tag=ms_check] if score display ms_config matches 1 if score @s ms_config matches ..0 run titleraw @a actionbar {"rawtext":[{"translate":"bt.ms.slept_players"}]}

execute as @a[tag=ms_check] run tag @s remove ms_check

## Pass night
execute if score sleep_execute ms_config matches 1 run time set sunrise
execute if score sleep_execute ms_config matches 1 run time add 1000

# If Always Reset Weather
execute if score sleep_execute ms_config matches 1 if score always_reset_weather ms_config matches 1 run weather rain
execute if score sleep_execute ms_config matches 1 if score always_reset_weather ms_config matches 1 run weather clear

scoreboard players set sleep_check ms_config 0
scoreboard players set sleep_execute ms_config 0
