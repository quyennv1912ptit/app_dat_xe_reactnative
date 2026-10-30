import { getLocale , translate as i18nT } from '@datxe/shared';
import { useLanguage , useThemeColors , useThemedStyles, useThemeColor  } from '@datxe/ui';
import { ScreenHeader } from '@/components/ScreenHeader';
import { MaterialIcons } from '@expo/vector-icons';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DEFAULT_MAP_CENTER, money } from '../bookingUtils';
import { BookingMap } from '@/components/map/BookingMap';
import { bookingStyles as base_s } from '../components/bookingStyles';
import { FareDetails } from '../components/FareDetails';
import { RouteSummary } from '../components/RouteSummary';
import { SchedulePickerModal } from '../components/SchedulePickerModal';
import { VoucherPickerModal } from '../components/VoucherPickerModal';
import { useBookingConfirmation } from '../hooks/useBookingConfirmation';
export default function BookingConfirmationScreen() {
 useLanguage();

 const colors=useThemeColors();

 const s=useThemedStyles(base_s);
 const themeColor=useThemeColor();

  const h = useBookingConfirmation();
  return <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
    <ScreenHeader title={i18nT("Xác nhận chuyến đi")} onBack={() => h.router.back()} />
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 18 }}>
        <View style={{ height: 190, overflow: 'hidden' }}><BookingMap key={`${h.draft.pickup?.id}-${h.draft.dropoff?.id}`} center={h.draft.pickup?.coordinate ?? DEFAULT_MAP_CENTER} pickup={h.draft.pickup} dropoff={h.draft.dropoff} route={h.route} interactive={false} /></View>
        <View style={s.page}>
          <View style={s.between}><Text style={s.label}>{i18nT("BƯỚC 4/4 · KIỂM TRA CHUYẾN ĐI")}</Text><Pressable onPress={h.openSchedule} style={[s.row, s.chip]}><MaterialIcons name={h.scheduledAt ? 'event' : 'schedule'} size={17} color={colors.primary} /><Text style={s.link}>{i18nT(h.scheduledAt ? 'Đặt lịch' : 'Đi ngay')}</Text><MaterialIcons name="expand-more" size={18} color={colors.primary} /></Pressable></View>
          {h.scheduledAt ? <Text style={s.text}>{i18nT("Đón lúc")}{' '}{i18nT(new Date(h.scheduledAt).toLocaleString(getLocale()))}</Text> : null}
          <RouteSummary pickup={h.draft.pickup} dropoff={h.draft.dropoff} onPickup={() => h.router.push({ pathname: '/ride/pickup', params: { edit: '1' } })} onDropoff={() => h.router.push({ pathname: '/ride/destination', params: { edit: '1' } })} />
          <View style={s.card}><Text style={s.section}>{i18nT("Ghi chú điểm đón")}</Text><TextInput accessibilityLabel={i18nT("Ghi chú điểm đón")} value={h.draft.pickupNote} onChangeText={h.draft.setPickupNote} maxLength={500} multiline placeholder={i18nT("Ví dụ: chờ ở đầu ngõ 165, cổng số 2, sảnh A…")} style={[s.text, { minHeight: 64, textAlignVertical: 'top' }]} /><Pressable onPress={() => h.router.push({ pathname: '/ride/map-picker', params: { kind: 'pickup', edit: '1' } })}><Text style={s.link}>{i18nT("Chỉnh ghim điểm đón trên bản đồ")}</Text></Pressable></View>
          <Pressable onPress={() => h.router.push({ pathname: '/ride/vehicle', params: { edit: '1' } })} style={[s.card, s.row]}><View style={s.icon}><MaterialIcons name={h.vehicle?.vehicle_type === 'MOTORCYCLE' ? 'two-wheeler' : 'directions-car'} size={26} color={colors.primary} /></View><View style={s.flex}><Text style={s.label}>{i18nT("PHƯƠNG TIỆN CỦA BẠN")}</Text><Text style={[s.text, { fontWeight: '700' }]}>{h.vehicle ? `${[h.vehicle.brand, h.vehicle.model].filter(Boolean).join(' ') || i18nT('Xe')} · ${h.vehicle.plate_number ?? ''}` : i18nT("Chọn phương tiện")}</Text></View><MaterialIcons name="chevron-right" size={22} color={themeColor("#667085","color")} /></Pressable>
          <View style={s.card}><View style={s.row}><MaterialIcons name="payments" size={24} color={themeColor("#039855","color")} /><View style={s.flex}><Text style={s.text}>{i18nT("Tiền mặt")}</Text><Text style={s.muted}>{i18nT("Thanh toán cho tài xế khi kết thúc chuyến")}</Text></View><MaterialIcons name="check-circle" size={20} color={colors.primary} /></View><View style={s.divider} /><Pressable accessibilityLabel={i18nT("Chọn ưu đãi cho chuyến đi")} onPress={() => h.setVoucherVisible(true)} style={s.row}><MaterialIcons name="local-offer" size={24} color={colors.primary} /><View style={s.flex}><Text style={[s.text, { fontWeight: '600' }]}>{i18nT(h.draft.voucherCode ? h.selectedVoucher?.code ?? h.draft.voucherCode : 'Chọn ưu đãi')}</Text><Text style={s.muted}>{i18nT(h.draft.voucherCode ? 'Nhấn để đổi hoặc bỏ ưu đãi' : 'Xem ưu đãi dành cho chuyến đi này')}</Text></View><MaterialIcons name="chevron-right" size={22} color={themeColor("#667085","color")} /></Pressable></View>
          {h.activeRide ? <View style={s.errorBox}><Text style={s.error}>{i18nT("Bạn đang có một chuyến chưa hoàn tất.")}</Text><Pressable onPress={() => h.router.replace({ pathname: '/ride/tracking', params: { rideId: String(h.activeRide!.id) } })}><Text style={s.link}>{i18nT("Theo dõi chuyến hiện tại")}</Text></Pressable></View> : null}
          <FareDetails estimate={h.estimate} loading={h.estimating} error={h.error} retry={() => void h.retryPrice()} />
          {h.error && h.draft.voucherCode ? <Pressable onPress={() => h.draft.setVoucher('')}><Text style={s.link}>{i18nT("Bỏ ưu đãi và tính lại giá")}</Text></Pressable> : null}
          <View style={s.card}><Text style={s.section}>{i18nT("Ghi chú cho tài xế")}</Text><TextInput accessibilityLabel={i18nT("Ghi chú cho tài xế")} value={h.note} onChangeText={h.setNote} maxLength={500} multiline placeholder={i18nT("Ví dụ: đón ở cổng chính, xe đỗ tầng B1…")} style={[s.text, { minHeight: 70, textAlignVertical: 'top' }]} /><Text style={[s.muted, { alignSelf: 'flex-end' }]}>{i18nT(h.note.length)}/500</Text></View>
        </View>
      </ScrollView>
      <View style={s.footer}><View style={s.between}><Text style={s.muted}>{i18nT("Tổng thanh toán")}</Text><Text style={[s.title, { fontSize: 23 }]}>{i18nT(h.estimate && !h.error ? money(h.estimate.payableFare) : 'Chưa có giá')}</Text></View><Pressable disabled={!h.ready || h.submitting} onPress={h.book} style={[s.primary, (!h.ready || h.submitting) && s.disabled]}>{h.submitting ? <ActivityIndicator color={themeColor("#FFFFFF","color")} /> : <><Text style={s.primaryText}>{i18nT(h.scheduledAt ? 'Xác nhận đặt lịch' : 'Đặt chuyến lái hộ')}</Text><MaterialIcons name="arrow-forward" size={21} color={themeColor("#FFFFFF","color")} /></>}</Pressable></View>
    </KeyboardAvoidingView>
    <VoucherPickerModal visible={h.voucherVisible} close={() => h.setVoucherVisible(false)} vouchers={h.vouchers} loading={h.vouchersLoading} error={h.vouchersError} applyError={h.voucherError} selectedCode={h.draft.voucherCode} applyingCode={h.applyingCode} subtotal={h.estimate?.estimatedFare} onApply={code => void h.applyVoucher(code)} onRetry={() => void h.retryVouchers()} />
    <SchedulePickerModal visible={h.scheduleVisible} close={() => h.setScheduleVisible(false)} selected={h.scheduledAt} slots={h.slots} onSelect={slot => { h.setScheduledAt(slot); h.setScheduleVisible(false); }} />
  </SafeAreaView>;
}
