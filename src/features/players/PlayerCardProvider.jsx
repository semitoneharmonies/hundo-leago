import { useCallback, useContext, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { SessionContext } from '../session/sessionContext.js';
import { useRealtime } from '../../shared/realtime/realtimeContext.js';
import { PlayerCardContext } from './playerCardContext.js';
import { PlayerHockeyCard } from './PlayerHockeyCard.jsx';

export function PlayerCardProvider({ children, httpClient }) {
  const session = useContext(SessionContext);
  const realtime = useRealtime();
  const location = useLocation();
  const [selected, setSelected] = useState(null);
  const close = useCallback(() => setSelected(null), []);
  const open = useCallback(player => setSelected(current => ({ ...player,
    returnFocus: current?.locationKey === location.key && current?.userId === session?.user?.id ? current.returnFocus : player.anchor,
    locationKey: location.key, userId: session?.user?.id, privacyEpoch: realtime.privacyEpoch,
  })), [location.key, session?.user?.id, realtime.privacyEpoch]);
  const context = useMemo(() => ({ open }), [open]);
  // Never retain a previous league/account's private card across navigation.
  const visible = selected && selected.locationKey === location.key && selected.userId === session?.user?.id &&
    selected.privacyEpoch === realtime.privacyEpoch && realtime.status !== 'reauthorizing' && (!session || session.status === 'authenticated');
  return <PlayerCardContext.Provider value={context}>
    {children}
    {visible && <PlayerHockeyCard key={`${selected.leagueId}:${selected.playerId}`} selected={selected}
      httpClient={selected.httpClient || httpClient || session?.httpClient} onClose={close} />}
  </PlayerCardContext.Provider>;
}
