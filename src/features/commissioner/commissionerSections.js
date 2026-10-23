export const commissionerSections = [
  ['calendar','League calendar','Matchup dates, playoffs and trade deadline'],
  ['scoring','Scoring values','Points and effective weeks'],
  ['auctions','Auction schedule','Closing times and new-auction cutoff'],
  ['rosters','Roster operations','Players, contracts and team legality'],
  ['fad','Free Agent Draft','Candidate Cards, reminders and draft timing'],
  ['communications','Announcements and reminders','Messages for your league'],
  ['readiness','League readiness','Setup and operations needing attention'],
  ['history','Change history','Who changed what and when'],
  ['help','Manager help requests','Private requests and replies'],
  ['recovery','Recovery and corrections','Retries, missing picks and reversals'],
  ['pause','Pause or resume','Competition processing and deadlines'],
  ['season','Next season and preseason reset','Season preview and eligible recovery'],
  ['export','Export data (JSON)','Download a current-season data reference'],
];
export const commissionerSectionPath=(leagueId,key)=>'/leagues/'+encodeURIComponent(leagueId)+'/commissioner/'+key;
