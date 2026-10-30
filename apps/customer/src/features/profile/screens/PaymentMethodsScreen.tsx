import { localizedAlert , useLanguage , Button,useThemeColors } from '@datxe/ui';
import { translate as i18nT } from '@datxe/shared';
import { ScreenHeader } from '@/components/ScreenHeader';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ActivityIndicator,Pressable,ScrollView,Text,View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfileEditor } from '../hooks/useProfileEditor';
import { accountStyles } from '../components/AccountScreenStyles';
export default function PaymentMethodsScreen(){
 useLanguage();

 const c=useThemeColors(),s=accountStyles(c),router=useRouter();const {query,save}=useProfileEditor();const selected=query.data?.default_payment_method==='CASH';
 const confirm=async()=>{if(save.isPending)return;try{await save.mutateAsync('CASH');localizedAlert(i18nT("Đã cập nhật"),i18nT("Tiền mặt là phương thức thanh toán mặc định."));}catch{}};
 return <SafeAreaView style={s.safe}><ScreenHeader title={i18nT("Phương thức thanh toán")} onBack={()=>router.back()}/><ScrollView contentContainerStyle={s.content}><Text style={s.intro}>{i18nT("Chọn cách thanh toán cho những chuyến đi của bạn.")}</Text><Text style={s.section}>{i18nT("PHƯƠNG THỨC KHẢ DỤNG")}</Text><Pressable onPress={()=>{if(!selected&&query.data&&!save.isPending)void confirm();}} disabled={!query.data||save.isPending} style={[s.card,{borderColor:selected?c.primary:c.outlineVariant}]} accessibilityRole="radio" accessibilityState={{selected}} accessibilityLabel={i18nT("Tiền mặt")}><View style={s.row}><View style={s.icon}><MaterialIcons name="payments" size={26} color={c.primary}/></View><View style={{flex:1,gap:5}}><Text style={s.title}>{i18nT("Tiền mặt")}</Text><Text style={s.intro}>{i18nT(selected?'Đang dùng mặc định':'Thanh toán trực tiếp cho tài xế')}</Text></View><MaterialIcons name={selected?'radio-button-checked':'radio-button-unchecked'} size={24} color={selected?c.primary:c.outline}/></View><Text style={s.intro}>{i18nT("Thanh toán cho tài xế khi kết thúc chuyến đi, theo số tiền hiển thị trong ứng dụng.")}</Text></Pressable>{query.isLoading?<ActivityIndicator color={c.primary}/>:null}{query.error?<><Text style={s.error}>{i18nT(query.error.message)}</Text><Button label={i18nT("Thử lại")} onPress={()=>void query.refetch()}/></>:null}{save.error?<Text accessibilityRole="alert" style={s.error}>{i18nT(save.error.message)}</Text>:null}</ScrollView><View style={s.footer}><Button label={i18nT(selected?'Đã chọn tiền mặt':'Dùng tiền mặt mặc định')} disabled={selected||!query.data} loading={save.isPending} onPress={()=>void confirm()}/></View></SafeAreaView>;
}
