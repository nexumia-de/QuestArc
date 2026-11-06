// Every journey file in content/journeys/, built by journeys.mjs.
declare module 'virtual:questarc-journeys' {
  import type { Journey } from '@questarc/engine';

  const journeys: readonly Journey[];
  export default journeys;
}
