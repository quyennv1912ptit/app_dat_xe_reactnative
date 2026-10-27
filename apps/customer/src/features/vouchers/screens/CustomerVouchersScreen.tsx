import { ScreenHeader } from '@/components/ScreenHeader';
import { colors } from '@datxe/ui';
import { MaterialIcons } from '@expo/vector-icons';
import { ActivityIndicator,Pressable,ScrollView,Text,View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { date,money,styles } from '../components/CustomerVouchersScreenParts';
import { useCustomerVouchers } from '../hooks/useCustomerVouchers';
export default function CustomerVouchersScreen() {
const { router, vouchers, loading, error } = useCustomerVouchers();
return <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
    <ScreenHeader title="Ưu đãi của tôi" onBack={() => router.back()} />
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.intro}>Mã ưu đãi áp dụng được hiển thị khi hệ thống tính giá chuyến.</Text>
      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!loading && !error && vouchers.length === 0 ? <View style={styles.empty}><MaterialIcons name="confirmation-number" size={38} color={colors.primary} /><Text style={styles.heading}>Chưa có ưu đãi</Text><Text style={styles.meta}>Ưu đãi khả dụng sẽ xuất hiện tại đây.</Text></View> : null}
      {vouchers.map((voucher) => <View key={voucher.id} style={styles.voucher}>
        <View style={styles.voucherIcon}><MaterialIcons name="local-offer" size={24} color={colors.primary} /></View>
        <View style={styles.details}><Text style={styles.code}>{voucher.code}</Text><Text style={styles.discount}>{voucher.discountType === 'PERCENT' ? `Giảm ${voucher.value}%${voucher.maxDiscount ? ` tối đa ${money(voucher.maxDiscount)}` : ''}` : `Giảm ${money(voucher.value)}`}</Text><Text style={styles.meta}>Đơn tối thiểu {money(voucher.minimumOrderAmount)}</Text><Text style={styles.meta}>Hiệu lực: {date(voucher.validFrom)} – {date(voucher.validTo)}</Text>{voucher.usageLimit !== null ? <Text style={styles.meta}>Đã dùng {voucher.usageCount}/{voucher.usageLimit} lượt</Text> : null}<Pressable onPress={() => router.push({ pathname: '/ride/route-selection', params: { voucherCode: voucher.code } })} style={styles.use}><Text style={styles.useText}>Dùng ưu đãi này</Text></Pressable></View>
      </View>)}
    </ScrollView>
  </SafeAreaView>;
}
