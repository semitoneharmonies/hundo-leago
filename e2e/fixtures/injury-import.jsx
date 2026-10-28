import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { InjuryListImport } from '../../src/features/injuries/InjuryListImport.jsx';
import '../../src/index.css';

// Test-only loopback requests are intercepted by the browser spec. No league API.
const client = { request: async (path, options) => {
  const response = await fetch(`/__ir-fixture/${path.endsWith('/apply-list') ? 'apply' : 'preview'}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(options.body),
  });
  if (!response.ok) throw new Error('Local fixture request failed');
  return { data: await response.json() };
} };
createRoot(document.getElementById('root')).render(<QueryClientProvider client={new QueryClient()}>
  <main className="hl-page" style={{ maxWidth: 760, margin: 'auto', padding: 24 }}>
    <p>Local IR import test · synthetic players only</p><InjuryListImport httpClient={client} />
  </main>
</QueryClientProvider>);
