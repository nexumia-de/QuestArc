import type { Context, Route, Screen } from '../screen';
import { checkinScreen } from './checkin';
import { chooseScreen } from './choose';
import { continueScreen } from './continue';
import { finishedScreen } from './finished';
import { homeScreen } from './home';
import { motivatesScreen } from './motivates';
import { pickTaskScreen } from './pick-task';
import { previewScreen } from './preview';
import { settingsScreen } from './settings';
import { setupScreen } from './setup';
import { shelfScreen } from './shelf';
import { startScreen } from './start';
import { stationScreen } from './station';
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
    case 'station':
      return stationScreen(ctx, route.index);
    case 'start':
      return startScreen(ctx, route.journeyId);
    case 'setup':
      return setupScreen(ctx);
    case 'pick-task':
      return pickTaskScreen(ctx);
    case 'continue':
      return continueScreen(ctx);
    case 'finished':
      return finishedScreen(ctx, route.journeyId);
    case 'checkin':
      return checkinScreen(ctx);
    case 'shelf':
      return shelfScreen(ctx);
    case 'motivates':
      return motivatesScreen();
  }
};
