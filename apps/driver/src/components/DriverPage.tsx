import type { ReactNode } from 'react';
import { ActivityIndicator,Pressable,ScrollView,Text,View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useThemedStyles } from '@datxe/ui';
import { rideStyles } from './rideStyles';
export function DriverPage({title,children,loading,error,retry,tabs=false}:{title:string;children:ReactNode;loading?:boolean;error?:string|null;retry?:()=>unknown;tabs?:boolean}){
 const s=useThemedStyles(rideStyles),router=useRouter();
 return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.page}>{!tabs?<Pressable onPress={()=>router.canGoBack()?router.back():router.replace('/(tabs)/home')}><Text style={s.link}>‹ Quay lại</Text></Pressable>:null}<Text style={s.title}>{title}</Text>{loading?<ActivityIndicator/>:null}{error?<View style={s.card}><Text accessibilityRole="alert" style={s.error}>{error}</Text>{retry?<Pressable onPress={()=>void retry()}><Text style={s.link}>Thử lại</Text></Pressable>:null}</View>:null}{children}</ScrollView>{tabs?<View style={{flexDirection:'row',padding:12,justifyContent:'space-around'}}>{([['home','Trang chủ'],['history','Lịch sử'],['notifications','Thông báo'],['profile','Hồ sơ']] as const).map(([route,label])=><Pressable key={route} onPress={()=>router.navigate(('/(tabs)/'+route) as never)}><Text style={s.link}>{label}</Text></Pressable>)}</View>:null}</SafeAreaView>;
}
