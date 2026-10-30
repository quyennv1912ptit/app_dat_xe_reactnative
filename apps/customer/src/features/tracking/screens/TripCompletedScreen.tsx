import { getLocale , translate as i18nT } from '@datxe/shared';
import { useLanguage , useThemeColors , useThemedStyles  } from '@datxe/ui';
import { ScreenHeader } from '@/components/ScreenHeader';
import { MaterialIcons } from '@expo/vector-icons';
import { ActivityIndicator,Pressable,ScrollView,Text,TextInput,View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles as base_styles } from '../components/TripCompletedScreenParts';
import { useTripCompleted } from '../hooks/useTripCompleted';
export default function TripCompletedScreen() {
 useLanguage();

 const colors=useThemeColors();

 const styles=useThemedStyles(base_styles);

const { router, ride, stars, setStars, comment, setComment, saving, error, finish } = useTripCompleted();
return <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
    <ScreenHeader title={i18nT("Hoàn thành chuyến")} backIcon="home" backAccessibilityLabel={i18nT("Về trang chủ")} onBack={() => router.replace('/(tabs)/home')} />
    <ScrollView contentContainerStyle={styles.content}>
      {ride?.status==='COMPLETED'?<View style={styles.success}><MaterialIcons name="check-circle" size={54} color={colors.primary} /><Text style={styles.heading}>{i18nT("Chuyến đi đã hoàn thành")}</Text></View>:null}
      {ride ? <View style={styles.card}><Text style={styles.section}>{i18nT("Chuyến #")}{' '}{i18nT(ride.id)}</Text><Text style={styles.meta}>{i18nT(new Date(ride.completedAt ?? ride.updatedAt).toLocaleString(getLocale()))}</Text><Text style={styles.body}>{i18nT("Điểm đón:")}{' '}{(ride.pickupAddress || i18nT('—'))}</Text><Text style={styles.body}>{i18nT("Điểm đến:")}{' '}{(ride.dropoffAddress || i18nT('—'))}</Text><View style={styles.divider} /><View style={styles.priceRow}><Text style={styles.section}>{i18nT("Tổng thanh toán")}</Text><Text style={styles.price}>{i18nT(new Intl.NumberFormat(getLocale()).format(ride.finalFare ?? ride.estimatedFare))} {i18nT("đ")}</Text></View></View> : error ? <Text style={styles.error}>{i18nT(error)}</Text> : <ActivityIndicator color={colors.primary} />}
      <View style={styles.card}><Text style={styles.section}>{i18nT("Đánh giá chuyến đi")}</Text><View style={styles.stars}>{[1, 2, 3, 4, 5].map((value) => <Pressable key={value} accessibilityLabel={i18nT(`${value} sao`)} onPress={() => setStars(value)}><MaterialIcons name={value <= stars ? 'star' : 'star-border'} size={34} color={colors.tertiary} /></Pressable>)}</View><TextInput multiline value={comment} onChangeText={setComment} placeholder={i18nT("Nhận xét (không bắt buộc)")} style={styles.input} maxLength={2000} /><Text style={styles.counter}>{i18nT(comment.length)}/2000</Text></View>
      {ride && ride.status !== 'COMPLETED' ? <Text style={styles.error}>{i18nT("Chỉ có thể đánh giá chuyến đã hoàn thành.")}</Text> : null}
      <Pressable disabled={saving || !ride || ride.status !== 'COMPLETED' || !ride.driverId} onPress={() => void finish()} style={[styles.primary, (saving || !ride || ride.status !== 'COMPLETED' || !ride.driverId) && styles.disabled]}>{saving ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={styles.primaryText}>{i18nT("Gửi đánh giá")}</Text>}</Pressable>
      <Pressable disabled={saving} onPress={() => void finish(true)} style={styles.skip}><Text style={styles.skipText}>{i18nT("Bỏ qua và về trang chủ")}</Text></Pressable>
    </ScrollView>
  </SafeAreaView>;
}
