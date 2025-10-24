import {
	GameRule,
	GameRuleChangeAfterEvent,
	world
} from '@minecraft/server';

world.afterEvents.gameRuleChange.subscribe(({ rule, value }: GameRuleChangeAfterEvent): void => {
	if (rule === GameRule.KeepInventory && value === false) {
		world.sendMessage({ translate: 'bt.graves.keep_inventory' });

		world.gameRules.keepInventory = true;
	}
});
