import {
  Entity,
  Player
} from '@minecraft/server';
import { ActionFormData, ActionFormResponse } from '@minecraft/server-ui';
import { getSettings } from '../../Functions/Graves/settings';
import { GravesSettings } from '../../Models';
import { openGraveLocatingInterface } from './GraveLocating';
import { openGraveRobbingInterface } from './GraveRobbing';
import { openXPCollectionInterface } from './XPCollection';
import { openDespawnTimeInterface } from './DespawnTime';

export const openConfigInterface = (entity: Entity | undefined): void => {
  const gravesSettings: GravesSettings = getSettings();

  if (entity) {
    const player = entity as Player;

    const form = new ActionFormData()
      .title({ translate: 'bt.graves.settings.title' })
      .button({
        rawtext: [
          { translate: `bt.graves.settings.${gravesSettings.graveRobbing ? 'enabled_color' : 'disabled_color'}`, with: [' '] },
          { translate: 'bt.graves.settings.grave_robbing' },
        ],
      })
      .button({
        rawtext: [
          { translate: `bt.graves.settings.${gravesSettings.xpCollection ? 'enabled_color' : 'disabled_color'}`, with: [' '] },
          { translate: 'bt.graves.settings.xp_collection' },
        ],
      })
      .button({
        rawtext: [
          { translate: `bt.graves.settings.${gravesSettings.graveLocating ? 'enabled_color' : 'disabled_color'}`, with: [' '] },
          { translate: 'bt.graves.settings.grave_locating' },
        ],
      })
      .button({
        rawtext: [
          { translate: 'bt.graves.settings.edit_color', with: [' '] },
          { translate: 'bt.graves.settings.despawn_time' },
          { translate: 'bt.graves.settings.despawn_time.current', with: ['\n', gravesSettings.despawnTime + ''] },
        ],
      })
      .button({ translate: 'bt.graves.settings.list_all_graves' })
      .button({ translate: 'bt.graves.settings.receive_grave_key' });

    form.show(player).then((response: ActionFormResponse): void => {
      switch (response.selection) {
        case 0:
          openGraveRobbingInterface(player);
          break;

        case 1:
          openXPCollectionInterface(player);
          break;

        case 2:
          openGraveLocatingInterface(player);
          break;

        case 3:
          openDespawnTimeInterface(player);

          break;
        case 4:
          // list all graves

          break;
        case 5:
          // receive grave key

          break;
        default:
          break;
      }
    });
  }
};
