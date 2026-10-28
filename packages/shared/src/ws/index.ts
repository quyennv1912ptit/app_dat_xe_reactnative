import { Client,type IMessage,type StompSubscription } from '@stomp/stompjs';
import { getFirebaseUser } from '../firebase/authService';
import type { Role } from '../types';
export * from './location';
// Destinations and message contracts must come from the backend, not inferred here.
export function createStompClient(brokerURL: string, role: Role) {
  const listeners = new Map<string, Set<(message: IMessage) => void>>();
  const connectionListeners = new Set<(connected: boolean) => void>();
  const pending = new Map<string, { body: string; expires: number }>();
  const subscriptions = new Map<string, StompSubscription>();
  const client = new Client({ brokerURL, reconnectDelay: 5000, heartbeatIncoming: 10000, heartbeatOutgoing: 10000 });
  client.beforeConnect = async () => {
    const user = getFirebaseUser();
    if (!user) { await client.deactivate(); return; }
    client.connectHeaders = { Authorization: 'Bearer ' + await user.getIdToken(), 'X-Role': role };
  };
  const watch = (destination: string) => subscriptions.set(destination, client.subscribe(destination, message => listeners.get(destination)?.forEach(listener => listener(message))));
  client.onConnect = () => {
    subscriptions.clear(); listeners.forEach((_, destination) => watch(destination));
    pending.forEach((value, destination) => { if (value.expires > Date.now()) client.publish({ destination, body: value.body }); }); pending.clear();
    connectionListeners.forEach(listener => listener(true));
  };
  client.onWebSocketClose = () => connectionListeners.forEach(listener => listener(false));
  client.onStompError = () => { connectionListeners.forEach(listener => listener(false)); client.forceDisconnect(); };
  return {
    connect: () => client.activate(),
    disconnect: () => { pending.clear(); connectionListeners.forEach(listener => listener(false)); return client.deactivate(); },
    onConnection(listener: (connected: boolean) => void) { connectionListeners.add(listener); listener(client.connected); return () => { connectionListeners.delete(listener); }; },
    publish(destination: string, value: unknown, retainForMs = 0) {
      const body = JSON.stringify(value);
      if (client.connected) { client.publish({ destination, body }); return true; }
      if (retainForMs > 0) { pending.set(destination, { body, expires: Date.now() + retainForMs }); return true; }
      return false;
    },
    subscribe(destination: string, listener: (message: IMessage) => void) {
      const group = listeners.get(destination) ?? new Set(); group.add(listener); listeners.set(destination, group);
      if (client.connected && !subscriptions.has(destination)) watch(destination);
      return () => { group.delete(listener); if (!group.size) { listeners.delete(destination); subscriptions.get(destination)?.unsubscribe(); subscriptions.delete(destination); } };
    },
  };
}
