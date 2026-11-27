export const AGGREGATE_METRICS = Object.freeze([
  'install.reported', 'launch.installed', 'launch.browser', 'layout.small', 'layout.large',
  ...['players_filter', 'favourites', 'roster_schedule', 'daily_chat_open', 'daily_chat_send'].map(name => `feature.${name}`),
  ...['lcp', 'inp', 'cls'].flatMap(name => ['good', 'needs_improvement', 'poor'].map(rating => `vital.${name}.${rating}`)),
  ...['join', 'bid', 'trade', 'page_load'].flatMap(name => ['success', 'failure'].map(result => `action.${name}.${result}`)),
]);
