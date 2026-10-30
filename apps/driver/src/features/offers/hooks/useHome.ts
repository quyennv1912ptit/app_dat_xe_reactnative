import { useMutation,useQuery,useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useSessionStore } from '@/lib/store';
import { useRefreshOnFocus } from '@/lib/useRefreshOnFocus';
import { getPendingOffer,getHomeSession,getHomeActiveRide,setDriverAvailability,getHomeVerification } from '../api';
export function useHome(){const router=useRouter(),client=useQueryClient();const session=useQuery({queryKey:['driver','session'],queryFn:getHomeSession});const verification=useQuery({queryKey:['driver','verification'],queryFn:getHomeVerification});const active=useQuery({queryKey:['driver','activeRide'],queryFn:getHomeActiveRide});const offer=useQuery({queryKey:['driver','pendingOffer'],queryFn:getPendingOffer});useRefreshOnFocus(session.refetch);useRefreshOnFocus(verification.refetch);useRefreshOnFocus(active.refetch);useRefreshOnFocus(offer.refetch);useEffect(()=>{if(session.data)useSessionStore.getState().setUser(session.data);},[session.data]);const availability=useMutation({mutationFn:setDriverAvailability,onSuccess:async result=>{const user=useSessionStore.getState().user;if(user&&result)useSessionStore.getState().setUser({...user,status:result.status});await client.invalidateQueries({queryKey:['driver']});}});return {router,session,verification,active,offer,availability};}
