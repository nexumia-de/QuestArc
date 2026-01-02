import { QuestArcState } from '../types/state';
import { PluginService } from './PluginService';

export class HeaderService {
    static updateHeader(state: QuestArcState) {
        // Note: Header buttons can't be dynamically updated after registration
        // This is called once during init. For dynamic updates, users should open the plugin UI

        const onClick = () => PluginService.api.showIndexHtmlAsView();

        if (state.activeBoss && !state.activeBoss.isDead) {
            PluginService.api.registerHeaderButton({
                label: `👹 ${state.activeBoss.hp}/${state.activeBoss.maxHp} HP`,
                icon: 'skull',
                onClick,
            });
        } else {
            PluginService.api.registerHeaderButton({
                label: `Lvl ${state.profile.level}`,
                icon: 'trending_up',
                onClick,
            });
        }
    }
}
