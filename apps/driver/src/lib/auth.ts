import { env } from '@/config/env';
import { configureAuth } from '@datxe/shared';
import { queryClient } from './queryClient';
import { useSessionStore } from './store';
configureAuth({...env,onAuthenticated:profile=>useSessionStore.getState().setUser(profile),onSignedOut:()=>{queryClient.clear();useSessionStore.getState().reset();}});
