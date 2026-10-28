import type { CustomerVoucher } from '@datxe/shared';
import { colors } from '@datxe/ui';
import { MaterialIcons } from '@expo/vector-icons';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { money, voucherUnavailable } from '../bookingUtils';
import { bookingStyles as s } from './bookingStyles';
type Props = { visible: boolean; close: () => void; vouchers: CustomerVoucher[]; loading: boolean; error?: string; applyError: string; selectedCode: string; applyingCode: string | null; subtotal?: number; onApply: (code: string) => void; onRetry: () => void };
export function VoucherPickerModal(p: Props) {
  return <Modal visible={p.visible} transparent animationType="slide" onRequestClose={p.close}>
    <View style={{ flex: 1, backgroundColor: '#10182888', justifyContent: 'flex-end' }}><Pressable accessibilityLabel="Đóng ưu đãi" style={{ flex: 1, minHeight: 40 }} onPress={p.close} /><SafeAreaView edges={['bottom']} style={[s.sheet, { maxHeight: '85%' }]}>
      <View style={s.handle} /><View style={s.between}><View style={s.flex}><Text style={s.title}>Ưu đãi cho chuyến đi</Text><Text style={s.muted}>Chọn một ưu đãi phù hợp với bạn</Text></View><Pressable accessibilityLabel="Đóng" onPress={p.close} hitSlop={12}><MaterialIcons name="close" size={25} color="#344054" /></Pressable></View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 12, paddingBottom: 12 }}>
        {p.applyError ? <View style={s.errorBox}><Text accessibilityRole="alert" style={s.error}>{p.applyError}</Text></View> : null}
        <Pressable disabled={p.applyingCode !== null} onPress={() => p.onApply('')} style={[s.card, s.row, !p.selectedCode && s.selected]}><MaterialIcons name={!p.selectedCode ? 'radio-button-checked' : 'radio-button-unchecked'} size={23} color={colors.primary} /><Text style={[s.text, s.flex]}>Không dùng ưu đãi</Text>{p.applyingCode === '' ? <ActivityIndicator /> : null}</Pressable>
        {p.loading ? <ActivityIndicator color={colors.primary} /> : null}
        {p.error ? <View style={s.errorBox}><Text style={s.error}>{p.error}</Text><Pressable onPress={p.onRetry}><Text style={s.link}>Tải lại ưu đãi</Text></Pressable></View> : null}
        {!p.loading && !p.error && !p.vouchers.length ? <View style={s.empty}><MaterialIcons name="local-offer" size={42} color="#98A2B3" /><Text style={s.section}>Chưa có ưu đãi khả dụng</Text><Text style={s.muted}>Bạn vẫn có thể tiếp tục đặt chuyến.</Text></View> : null}
        {p.vouchers.map(voucher => {
          const reason = voucherUnavailable(voucher, p.subtotal);
          return <Pressable key={voucher.id} disabled={Boolean(reason) || p.applyingCode !== null} onPress={() => p.onApply(voucher.code)} accessibilityRole="radio" accessibilityState={{ selected: p.selectedCode === voucher.code, disabled: Boolean(reason) }} style={[s.card, p.selectedCode === voucher.code && s.selected, reason ? { opacity: 0.5 } : null]}>
            <View style={s.row}><View style={[s.icon, { backgroundColor: '#EDF6FF' }]}><MaterialIcons name="local-offer" size={24} color={colors.primary} /></View><View style={s.flex}><Text style={s.section}>{voucher.discountType === 'PERCENT' ? `Giảm ${voucher.value}%` : `Giảm ${money(voucher.value)}`}</Text><Text style={s.muted}>{voucher.code}{voucher.maxDiscount !== null ? ` · Tối đa ${money(voucher.maxDiscount)}` : ''}</Text></View>{p.applyingCode === voucher.code ? <ActivityIndicator /> : <MaterialIcons name={p.selectedCode === voucher.code ? 'radio-button-checked' : 'radio-button-unchecked'} size={23} color={colors.primary} />}</View>
            <Text style={s.muted}>Chuyến từ {money(voucher.minimumOrderAmount)} · Hết hạn {new Date(voucher.validTo).toLocaleDateString('vi-VN')}</Text>{reason ? <Text style={s.error}>{reason}</Text> : <Text style={s.link}>Chọn ưu đãi này</Text>}
          </Pressable>;
        })}
      </ScrollView>
    </SafeAreaView></View>
  </Modal>;
}
