import { useRefreshOnFocus } from '@/lib/useRefreshOnFocus';
import { useInfiniteQuery,useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { getCustomerRides,getUnreadNotificationCount } from '../api';
import type { Filter } from '../components/TripHistoryScreenParts';
export function useTripHistory() {
 const router=useRouter();
 const [filter,setFilter]=useState<Filter>('all');
 const status=filter==='completed'?'COMPLETED':filter==='cancelled'?'CANCELLED,NO_DRIVER_FOUND,EXPIRED':undefined;
 const query=useInfiniteQuery({queryKey:['customer','getCustomerRides',status],initialPageParam:0,queryFn:({pageParam})=>getCustomerRides(pageParam,20,status),getNextPageParam:last=>last.hasNext?last.page+1:undefined});
 const unread=useQuery({queryKey:['customer','getUnreadNotificationCount'],queryFn:getUnreadNotificationCount});
 useRefreshOnFocus(query.refetch);useRefreshOnFocus(unread.refetch);
 const pages=query.data?.pages ?? [];
 const load=(_nextPage=0,append=false)=>append?query.fetchNextPage():query.refetch();
 return {router,filter,setFilter,rides:pages.flatMap(page=>page.content),total:pages[0]?.totalElements ?? 0,page:pages.at(-1)?.page ?? 0,hasNext:query.hasNextPage,loading:query.isLoading,loadingMore:query.isFetchingNextPage,error:query.error?.message ?? '',unreadCount:unread.data ?? 0,load};
}
