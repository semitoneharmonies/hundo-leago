import { RealtimeProvider } from "../../shared/realtime/RealtimeProvider.jsx";

export function TransactionInvalidationProvider(props) {
  return <RealtimeProvider {...props} />;
}
