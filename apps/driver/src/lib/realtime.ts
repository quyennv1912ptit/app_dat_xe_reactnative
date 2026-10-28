import { createStompClient, stompBrokerUrl } from '@datxe/shared';
import { env } from '@/config/env';
export const driverRealtime = createStompClient(stompBrokerUrl(env.apiUrl), 'DRIVER');
