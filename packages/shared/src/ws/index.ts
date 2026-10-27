import { Client,type IMessage,type StompSubscription } from '@stomp/stompjs';
import { getFirebaseUser } from '../firebase/authService';
import type { Role } from '../types';
// Destinations and message contracts must come from the backend, not inferred here.
export function createStompClient(brokerURL: string, role: Role) {
  const listeners = new Map<string, (message: IMessage) => void>();
  const subscriptions = new Map<string, StompSubscription>();
  const client = new Client({ brokerURL, reconnectDelay: 5000, heartbeatIncoming: 10000, heartbeatOutgoing: 10000 });
  client.beforeConnect = async () => {
    const user = getFirebaseUser();
    if (!user) { await client.deactivate(); return; }
    client.connectHeaders = { Authorization: 'Bearer ' + await user.getIdToken(), 'X-Role': role };
  };
  client.onConnect = () => { subscriptions.clear(); listeners.forEach((listener, destination) => subscriptions.set(destination, client.subscribe(destination, listener))); };
  return {
    connect: () => client.activate(),
    disconnect: () => client.deactivate(),
    subscribe(destination: string, listener: (message: IMessage) => void) {
      subscriptions.get(destination)?.unsubscribe();
      listeners.set(destination, listener);
      if (client.connected) subscriptions.set(destination, client.subscribe(destination, listener));
      return () => { listeners.delete(destination); subscriptions.get(destination)?.unsubscribe(); subscriptions.delete(destination); };
    },
  };
}
