import { useRouter } from 'expo-router';
import { Pressable,Text,View } from 'react-native';
import { formatMoney } from '@datxe/shared';
import { DriverPage } from '@/components/DriverPage';
import { rideStyles as s } from '@/components/rideStyles';
import { useHistory } from '../hooks/useHistory';
export default function HistoryScreen(){const q=useHistory(),router=useRouter();const trips=q.data?.pages.flatMap(page=>page?.content??[])??[];return <DriverPage title="Lịch sử chuyến" tabs loading={q.isLoading} error={q.error?.message} retry={q.refetch}>{trips.map(trip=><Pressable key={trip.id} style={s.card} onPress={()=>router.push({pathname:'/ride/complete',params:{rideId:String(trip.id)}})}><Text style={s.label}>#{trip.id} · {trip.status}</Text><Text style={s.text}>{trip.pickupAddress??'Chưa có địa chỉ'} → {trip.dropoffAddress??'Chưa có địa chỉ'}</Text><Text style={s.text}>{formatMoney(trip.finalFare??trip.estimatedFare)}</Text><Text style={s.label}>{new Date(trip.createdAt).toLocaleString('vi-VN')}</Text></Pressable>)}{!q.isLoading&&!q.error&&!trips.length?<View style={s.card}><Text style={s.text}>Bạn chưa có chuyến đi.</Text></View>:null}{q.hasNextPage?<Pressable disabled={q.isFetchingNextPage} onPress={()=>void q.fetchNextPage()}><Text style={s.link}>{q.isFetchingNextPage?'Đang tải…':'Xem thêm'}</Text></Pressable>:null}</DriverPage>;}
