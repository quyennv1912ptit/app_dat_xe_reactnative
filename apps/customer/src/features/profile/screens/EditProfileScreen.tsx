import { localizedAlert , useLanguage , Button,useThemeColors } from '@datxe/ui';
import { translate as i18nT } from '@datxe/shared';
import { ScreenHeader } from '@/components/ScreenHeader';
import type { CustomerProfile } from '@datxe/shared';
import { useRouter , usePreventRemove } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator,KeyboardAvoidingView,Platform,Pressable,ScrollView,Text,TextInput,View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfileEditor } from '../hooks/useProfileEditor';
import { accountStyles } from '../components/AccountScreenStyles';
export default function EditProfileScreen(){
 useLanguage();
const h=useProfileEditor();const c=useThemeColors();const s=accountStyles(c);const router=useRouter();return <SafeAreaView style={s.safe}><ScreenHeader title={i18nT("Chỉnh sửa thông tin")} onBack={()=>router.back()}/>{h.query.data?<ProfileForm initial={h.query.data}/>:<View style={s.content}>{h.query.isLoading?<ActivityIndicator color={c.primary}/>:<><Text style={s.error}>{i18nT("Không tải được hồ sơ.")}</Text><Button label={i18nT("Thử lại")} onPress={()=>void h.query.refetch()}/></>}</View>}</SafeAreaView>;}
function ProfileForm({initial}:{initial:CustomerProfile}){
 useLanguage();

 const c=useThemeColors(),s=accountStyles(c),router=useRouter();const {save}=useProfileEditor();
 const seed={name:initial.full_name??'',email:initial.email??'',birthDate:initial.date_of_birth??'',gender:initial.gender??''};
 const [draft,setDraft]=useState(seed);const [saved,setSaved]=useState(false);
 const dirty=Object.keys(seed).some(key=>draft[key as keyof typeof draft]!==seed[key as keyof typeof seed]);
 usePreventRemove((dirty||save.isPending)&&!saved,({repeat})=>{if(save.isPending)return;localizedAlert(i18nT("Bỏ thay đổi?"),i18nT("Thông tin bạn vừa chỉnh sửa chưa được lưu."),[{text:'Tiếp tục sửa',style:'cancel'},{text:'Bỏ thay đổi',style:'destructive',onPress:()=>{setSaved(true);repeat();}}]);});
 const submit=async()=>{if(save.isPending)return;try{await save.mutateAsync(draft);setSaved(true);localizedAlert(i18nT("Đã lưu thông tin"),i18nT("Hồ sơ của bạn đã được cập nhật."),[{text:'Hoàn tất',onPress:()=>router.back()}]);}catch{}};
 const field=(key:'name'|'email'|'birthDate',label:string,placeholder:string)=><View style={s.field}><Text style={s.label}>{i18nT(label)}</Text><TextInput accessibilityLabel={i18nT(label)} value={draft[key]} onChangeText={value=>setDraft(p=>({...p,[key]:value}))} editable={!save.isPending} placeholder={i18nT(placeholder)} placeholderTextColor={c.onSurfaceVariant} selectionColor={c.primary} maxLength={key==='birthDate'?10:255} keyboardType={key==='email'?'email-address':key==='birthDate'?'numbers-and-punctuation':'default'} autoCapitalize={key==='name'?'words':'none'} style={s.input}/></View>;
 return <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}><Text style={s.intro}>{i18nT("Cập nhật thông tin để chúng tôi hỗ trợ bạn tốt hơn.")}</Text><Text style={s.section}>{i18nT("THÔNG TIN CÁ NHÂN")}</Text><View style={s.card}>{field('name',i18nT("Họ và tên"),i18nT("Nhập họ và tên"))}{field('email','Email','email@example.com')}{field('birthDate',i18nT("Ngày sinh"),'YYYY-MM-DD')}<View style={s.field}><Text style={s.label}>{i18nT("Giới tính")}</Text><View style={s.choices}>{[['MALE','Nam'],['FEMALE',i18nT("Nữ")],['OTHER',i18nT("Khác")]].map(([value,label])=><Pressable key={value} disabled={save.isPending} accessibilityRole="radio" accessibilityState={{selected:draft.gender===value}} onPress={()=>setDraft(p=>({...p,gender:p.gender===value?'':value}))} style={[s.choice,draft.gender===value&&s.selected]}><Text style={[s.choiceText,draft.gender===value&&{color:c.primary}]}>{i18nT(label)}</Text></Pressable>)}</View></View></View><Text style={s.section}>{i18nT("SỐ ĐIỆN THOẠI")}</Text><View style={s.card}><Text style={s.title}>{initial.phone_number||i18nT('Chưa có số điện thoại')}</Text><Text style={s.intro}>{i18nT("Số điện thoại đã xác minh được dùng để đăng nhập và liên hệ trong chuyến đi.")}</Text></View>{save.error?<Text accessibilityRole="alert" style={s.error}>{i18nT(save.error.message)}</Text>:null}</ScrollView><View style={s.footer}><Button label={i18nT(saved?'Đã lưu':'Lưu thay đổi')} loading={save.isPending} disabled={!dirty||saved} onPress={()=>void submit()}/></View></KeyboardAvoidingView>;
}
