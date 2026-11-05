import type { Context, Route, Screen } from '../screen';
import { chooseScreen } from './choose';
import { homeScreen } from './home';
import { previewScreen } from './preview';
import { settingsScreen } from './settings';
import { welcomeScreen } from './welcome';

/** The screen for a route (docs/behaviour.md, screens). */
export const screenFor = (route: Route, ctx: Context): Screen => {
  switch (route.name) {
    case 'welcome':
      return welcomeScreen(ctx);
    case 'home':
      return homeScreen(ctx);
    case 'choose':
      return chooseScreen(ctx);
    case 'preview':
      return previewScreen(ctx, route.journeyId);
    case 'settings':
      return settingsScreen(ctx);
  }
};
