import {createRoot} from 'react-dom/client';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {CommissionerAdministrationPanel} from '../../src/features/auctions/AuctionPages.jsx';
import {OperationsHealthPanel} from '../../src/features/leagues/OperationsHealthPanel.jsx';
import '../../src/styles/theme-a.css';

const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const allowed=()=>({allowed:true,reasonCode:null});
const now=Date.now();
const auction={auctionId:id(1),leagueId:id(2),seasonId:id(3),version:1,
  player:{playerId:id(4),fullName:'Synthetic Player',positionGroup:'F'},status:'active',openedAtMs:now-60000,
  resolvesAtMs:now+86400000,resolvedAtMs:null,updatedAtMs:now,bidCount:1,participatingTeamCount:1,
  sourceKind:'ordinary_weekly',fadOrigin:null,fadId:null,fadRolloverId:null,targetRolloverAtMs:null,
  creationCutoffAtMs:null,eligibleTeams:[],minimumContract:null,drawCommitment:null,viewerTeams:[],administrativeBids:[],result:null,
  capabilities:{view:allowed(),adminCancel:allowed(),adminResolve:{allowed:false,reasonCode:'PHASE_CLOSED'}}};
const team={teamId:id(5),name:'Private Competitor',primaryColour:'#123456',secondaryColour:'#ffffff',tertiaryColour:null,patternTemplate:'solid',logoReference:null};
const bid={bidId:id(6),teamId:team.teamId,team,version:1,status:'active',participantStatus:null,
  capabilities:{adminEditBid:allowed(),adminRemoveBid:allowed()}};
window.privateReviewRequests=[];
const httpClient={async request(url,options){
  window.privateReviewRequests.push({url,body:options.body});
  if(url==='/api/v1/operations/health')return {data:{lifecycle:'ready',scheduler:{enabled:true,state:'running'},
    accountEmailDelivery:{enabled:true},lastVerifiedBackup:{verifiedAtMs:now-86400000},backupSchedule:{enabled:true},
    lastValidStatisticsRefresh:{completedAtMs:now-60000},outbox:{pending:2,publishing:0,failed:1}}};
  if(!url.endsWith('/administration/reveal'))throw Error('Unexpected fixture request');
  const data={leagueId:auction.leagueId,auctionId:auction.auctionId,revealId:id(7),expiresAtMs:Date.now()+300000,
    auction:{...auction,administrativeBids:[bid]},terms:options.body.bidId?{bidId:bid.bidId,version:1,totalValueCents:600,termYears:2}:null};
  options.validateData(data);
  return {data};
}};
createRoot(document.getElementById('root')).render(<QueryClientProvider client={new QueryClient()}>
  <main style={{maxWidth:1000,margin:'24px auto',padding:16}}><h1>Auction privacy preview</h1>
    <CommissionerAdministrationPanel auction={auction} leagueId={auction.leagueId} context={{session:{httpClient}}}/>
    <OperationsHealthPanel httpClient={httpClient}/>
  </main>
</QueryClientProvider>);
