import {render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {it,expect,vi} from 'vitest';
import {OperationsHealthPanel} from './OperationsHealthPanel.jsx';

const health={lifecycle:'ready',scheduler:{enabled:true,state:'running'},accountEmailDelivery:{enabled:false},
  lastValidStatisticsRefresh:null,lastVerifiedBackup:null,backupSchedule:{enabled:true},outbox:{pending:2,publishing:1,failed:1},
  arbitrarySecret:'DO_NOT_RENDER',databaseIdSuffix:'PRIVATE_DATABASE_ID'};

it('loads administrative health on demand with a read-only request and displays only selected public status fields',async()=>{
  const request=vi.fn().mockResolvedValue({data:health});render(<OperationsHealthPanel httpClient={{request}}/>);
  expect(request).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole('button',{name:'Check site health'}));
  expect(await screen.findByRole('status')).toHaveTextContent('2 waiting · 1 publishing · 1 failed');
  expect(screen.getByRole('status')).toHaveTextContent('No successful run recorded');
  expect(document.body).not.toHaveTextContent('DO_NOT_RENDER');expect(document.body).not.toHaveTextContent('PRIVATE_DATABASE_ID');
  expect(request).toHaveBeenCalledWith('/api/v1/operations/health',expect.objectContaining({method:'GET',authenticated:true}));
});

it('clears prior status on a failed or revoked refresh and does not show raw diagnostic errors',async()=>{
  const request=vi.fn().mockResolvedValueOnce({data:health}).mockRejectedValueOnce(Error('PRIVATE_SERVER_DETAIL'));
  render(<OperationsHealthPanel httpClient={{request}}/>);
  await userEvent.click(screen.getByRole('button',{name:'Check site health'}));await screen.findByRole('status');
  await userEvent.click(screen.getByRole('button',{name:'Check site health'}));
  expect(await screen.findByRole('alert')).toHaveTextContent('Check your administrator access');
  expect(screen.queryByRole('status')).not.toBeInTheDocument();expect(document.body).not.toHaveTextContent('PRIVATE_SERVER_DETAIL');
});

it('rejects incomplete health data',async()=>{
  render(<OperationsHealthPanel httpClient={{request:vi.fn().mockResolvedValue({data:{...health,outbox:{failed:-1}}})}}/>);
  await userEvent.click(screen.getByRole('button',{name:'Check site health'}));
  await screen.findByRole('alert');expect(screen.queryByRole('status')).not.toBeInTheDocument();
});

it('displays bounded email and operation counts and the latest backup outcome',async()=>{
 const request=vi.fn().mockResolvedValue({data:{...health,accountEmailDelivery:{enabled:true,pending:3,publishing:1,failed:2},jobs:{pending:7,running:2,failed:4,interrupted:1},backupSchedule:{enabled:true,latestRun:{status:'failed',nextAttemptAtMs:null}}}});
 render(<OperationsHealthPanel httpClient={{request}}/>);await userEvent.click(screen.getByRole('button',{name:'Check site health'}));
 expect(await screen.findByRole('status')).toHaveTextContent('3 waiting · 1 sending · 2 failed');expect(screen.getByRole('status')).toHaveTextContent('7 waiting · 2 running · 4 failed · 1 interrupted');expect(screen.getByText('Latest backup attempt')).toBeInTheDocument();
});
