# Detects if boats have a rider
execute @e[type=boat] ~ ~ ~ execute @e[type=!boat,r=1] ~ ~ ~ tag @e[type=boat,c=1] add kb_has_rider

# Kills all boats that do not have a rider / are empty
execute @e[type=boat,tag=!kb_has_rider] ~ ~ ~ kill @s

# Send message
tellraw @s {"rawtext":[{"text":"§eAll loaded empty boats have been removed"}]}

# Reset
execute @e[type=boat] ~ ~ ~ tag @s remove kb_has_rider