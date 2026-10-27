import { ScreenHeader } from '@/components/ScreenHeader';
import { colors } from '@datxe/ui';
import { MaterialIcons } from '@expo/vector-icons';
import { ActivityIndicator,Pressable,ScrollView,Text,TextInput,View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatLocalDateTime,money,paymentMethods,PriceRow,styles } from '../components/ConfirmTripScreenParts';
import { useConfirmTrip } from '../hooks/useConfirmTrip';
export default function ConfirmTripScreen() {
const { router, pickupAddress, dropoffAddress, paymentMethod, setPaymentMethod, rideType, setRideType, scheduledLocal, setScheduledLocal, note, setNote, voucherCode, setVoucherCode, vouchers, estimate, estimating, submitting, error, refreshEstimate, handleConfirm, selectVoucher } = useConfirmTrip();
return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenHeader title="Xác nhận chuyến" onBack={() => router.back()} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Thời gian chuyến đi</Text>
          <View style={styles.typeOptions}>
            <Pressable onPress={() => setRideType('INSTANT')} style={[styles.typeOption, rideType === 'INSTANT' && styles.typeOptionActive]}>
              <MaterialIcons name={rideType === 'INSTANT' ? 'radio-button-checked' : 'radio-button-unchecked'} size={20} color={rideType === 'INSTANT' ? colors.primary : colors.outline} />
              <Text style={[styles.typeOptionText, rideType === 'INSTANT' && styles.typeOptionTextActive]}>Đặt ngay</Text>
            </Pressable>
            <Pressable onPress={() => {
              setRideType('SCHEDULED');
              if (!scheduledLocal) setScheduledLocal(formatLocalDateTime(new Date(Date.now() + 60 * 60 * 1000)));
            }} style={[styles.typeOption, rideType === 'SCHEDULED' && styles.typeOptionActive]}>
              <MaterialIcons name={rideType === 'SCHEDULED' ? 'radio-button-checked' : 'radio-button-unchecked'} size={20} color={rideType === 'SCHEDULED' ? colors.primary : colors.outline} />
              <Text style={[styles.typeOptionText, rideType === 'SCHEDULED' && styles.typeOptionTextActive]}>Đặt lịch</Text>
            </Pressable>
          </View>
          {rideType === 'SCHEDULED' ? <>
            <TextInput
              accessibilityLabel="Thời gian đón đã đặt"
              value={scheduledLocal}
              onChangeText={setScheduledLocal}
              placeholder="YYYY-MM-DD HH:mm"
              autoCapitalize="none"
              style={styles.voucherInput}
            />
            <Text style={styles.helper}>Giờ địa phương. Ví dụ: 2026-10-25 18:30. Backend sẽ bắt đầu tìm tài xế trước giờ hẹn theo lịch hệ thống.</Text>
          </> : null}
        </View>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Lộ trình</Text>
          <Text style={styles.label}>Điểm đón</Text><Text style={styles.address}>{pickupAddress || 'Chưa có điểm đón'}</Text>
          <View style={styles.divider} />
          <Text style={styles.label}>Điểm đến</Text><Text style={styles.address}>{dropoffAddress || 'Chưa có điểm đến'}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Thanh toán</Text>
          {paymentMethods.map((method) => (
            <Pressable key={method.id} onPress={() => setPaymentMethod(method.id)} style={styles.option}>
              <MaterialIcons name={paymentMethod === method.id ? 'radio-button-checked' : 'radio-button-unchecked'} size={21} color={paymentMethod === method.id ? colors.primary : colors.outline} />
              <Text style={styles.optionText}>{method.label}</Text>
            </Pressable>
          ))}
          <Text style={styles.helper}>Backend hiện chỉ hỗ trợ thanh toán tiền mặt cho chuyến đi.</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Mã ưu đãi</Text>
          <View style={styles.voucherRow}>
            <TextInput value={voucherCode} onChangeText={setVoucherCode} autoCapitalize="characters" placeholder="Nhập mã ưu đãi" style={styles.voucherInput} />
            <Pressable onPress={() => void refreshEstimate(voucherCode)} style={styles.apply}><Text style={styles.applyText}>Áp dụng</Text></Pressable>
          </View>
          {vouchers.map((voucher) => <Pressable key={voucher.id} onPress={() => selectVoucher(voucher.code)} style={styles.voucher}><Text style={styles.voucherCode}>{voucher.code}</Text><Text style={styles.voucherMeta}>{voucher.discountType === 'PERCENT' ? `${voucher.value}%` : money(voucher.value)} · Tối thiểu {money(voucher.minimumOrderAmount)}</Text></Pressable>)}
        </View>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Ghi chú cho tài xế</Text>
          <TextInput value={note} onChangeText={setNote} maxLength={500} placeholder="Hướng dẫn điểm đón hoặc lưu ý khác (không bắt buộc)" style={styles.voucherInput} />
          <Text style={styles.helper}>{note.length}/500 ký tự</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Chi tiết giá từ backend</Text>
          {estimating ? <ActivityIndicator color={colors.primary} /> : null}
          {estimate ? <>
            <PriceRow label="Quãng đường" value={`${estimate.distanceKm.toFixed(1)} km · khoảng ${estimate.estimatedDurationMinutes} phút`} />
            <PriceRow label="Cước cơ bản" value={money(estimate.baseFare)} />
            <PriceRow label="Theo quãng đường" value={money(estimate.distanceFare)} />
            {estimate.waitingFare > 0 ? <PriceRow label="Phí chờ" value={money(estimate.waitingFare)} /> : null}
            {estimate.nightSurcharge > 0 ? <PriceRow label="Phụ phí ban đêm" value={money(estimate.nightSurcharge)} /> : null}
            {estimate.returnFee > 0 ? <PriceRow label="Phí đưa xe về" value={money(estimate.returnFee)} /> : null}
            {estimate.discountAmount > 0 ? <PriceRow label="Giảm giá" value={`− ${money(estimate.discountAmount)}`} /> : null}
            <View style={styles.divider} /><PriceRow label="Tổng thanh toán" value={money(estimate.payableFare)} strong />
          </> : <Text style={styles.error}>{error || 'Đang chờ dữ liệu giá.'}</Text>}
        </View>
      </ScrollView>
      <Pressable disabled={!estimate || estimating || submitting} onPress={() => void handleConfirm()} style={[styles.primary, (!estimate || estimating || submitting) && styles.disabled]}>
        {submitting ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={styles.primaryText}>{estimate ? `Đặt chuyến · ${money(estimate.payableFare)}` : 'Chưa thể đặt chuyến'}</Text>}
      </Pressable>
    </SafeAreaView>
  );
}
