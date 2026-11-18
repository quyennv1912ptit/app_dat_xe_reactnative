import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { List } from 'react-native-paper';
import { MoneyText } from '@/components/CustomerRideUI';
import { MapSheetLayout } from '@datxe/ui/goong-map';
import { getLocale, translate as i18nT } from '@datxe/shared';
import {
  Button,
  Card,
  type ThemeColors,
  MotionPressable as Pressable,
  Typography as Text,
  typography,
  ThemedTextInput as TextInput,
  useLanguage,
  useThemeColors,
  useThemedStyles,
} from '@datxe/ui';
import { MaterialIcons } from '@expo/vector-icons';
import { useState, type ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { BookingMap } from '@/components/map/BookingMap';
import { activeRideDestination, DEFAULT_MAP_CENTER, voucherDisplayName } from '../bookingUtils';
import { bookingStyles as base_s } from '../components/bookingStyles';
import { checkoutStyles } from '../components/checkoutStyles';
import { FareDetails } from '../components/FareDetails';
import { PaymentMethodModal } from '../components/PaymentMethodModal';
import { RideRouteBar } from '../components/RideRouteBar';
import { SchedulePickerModal } from '../components/SchedulePickerModal';
import { VoucherPickerModal } from '../components/VoucherPickerModal';
import { useBookingConfirmation } from '../hooks/useBookingConfirmation';
// The sheet uses Gesture Handler's native TextInput. Its adapter forwards the
// same editor used by the uncontrolled draft component, with an optional ref value.
const SheetDraftInput = BottomSheetTextInput as unknown as NonNullable<ComponentProps<typeof TextInput>["inputComponent"]>;

export default function BookingConfirmationScreen() {
  const extra = useThemedStyles(extraStyles);

  useLanguage();

  const colors = useThemeColors();

  const s = useThemedStyles(base_s);
  const checkout = useThemedStyles(checkoutStyles);

  const h = useBookingConfirmation();
  const [paymentVisible, setPaymentVisible] = useState(false);
  const scheduleTime = h.scheduledAt
    ? new Date(h.scheduledAt).toLocaleTimeString(getLocale(), { hour: '2-digit', minute: '2-digit', hour12: false })
    : '';
  const voucherLabel = h.selectedVoucher
    ? voucherDisplayName(h.selectedVoucher)
    : h.draft.voucherCode || (h.draft.voucherId != null ? i18nT("Đã chọn ưu đãi") : "");

  return (
    <>
      <MapSheetLayout
        initialSnap={0}
        snapPoints={["72%", "95%"]}
        topContent={(
          <RideRouteBar
            pickup={h.draft.pickup}
            dropoff={h.draft.dropoff}
            onBack={() => h.router.back()}
            onPickup={() => h.router.push({ pathname: '/ride/pickup', params: { edit: '1' } })}
            onDropoff={() => h.router.push({ pathname: '/ride/destination', params: { edit: '1' } })}
          />
        )}
        renderMap={viewport => (
          <BookingMap
            center={h.draft.pickup?.coordinate ?? DEFAULT_MAP_CENTER}
            pickup={h.draft.pickup}
            dropoff={h.draft.dropoff}
            route={h.route}
            viewport={viewport}
          />
        )}
        footer={(
          <View style={checkout.footerPanel}>
            <View style={checkout.totalRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={i18nT("Phương thức thanh toán")}
                disabled={h.submitting}
                onPress={() => setPaymentVisible(true)}
                style={extra.paymentCompact}
              >
                <MaterialIcons
                  name={h.paymentMethod === 'CASH' ? 'payments' : 'account-balance-wallet'}
                  size={18}
                  color={colors.primary}
                />
                <Text style={checkout.optionLabel}>
                  {i18nT(h.paymentMethod === 'CASH' ? 'Tiền mặt' : 'Ví ứng dụng')}
                </Text>
                <MaterialIcons name="expand-more" size={16} color={colors.onSurfaceVariant} />
              </Pressable>
              <View style={extra.totalCopy}>
                <Text style={checkout.totalLabel}>{i18nT("Tổng thanh toán")}</Text>
                {h.estimating ? (
                  <Text style={s.muted}>{i18nT("Đang tính…")}</Text>
                ) : h.estimate && !h.error ? (
                  <MoneyText value={h.estimate.payableFare} style={checkout.totalAmount} />
                ) : (
                  <Text style={s.muted}>{i18nT("Chưa có giá")}</Text>
                )}
              </View>
            </View>
            {h.paymentMethod === 'WALLET' && h.paymentError ? (
              <Text accessibilityRole="alert" style={s.error}>{i18nT(h.paymentError)}</Text>
            ) : null}
            {h.schedulePendingSelection ? (
              <View style={extra.scheduleActions}>
                <Button
                  label="Chọn giờ đón"
                  disabled={h.submitting}
                  onPress={h.openSchedule}
                  icon="schedule"
                  style={extra.flexAction}
                />
                <Button
                  variant="secondary"
                  label="Đặt ngay"
                  disabled={h.submitting}
                  onPress={() => h.draft.clearScheduleRequest()}
                  style={extra.flexAction}
                />
              </View>
            ) : (
              <Button
                label={h.scheduledAt ? "Xác nhận đặt lịch" : "Đặt chuyến lái hộ"}
                disabled={!h.ready}
                loading={h.submitting}
                onPress={h.book}
                icon="arrow-forward"
                style={checkout.footerCta}
              />
            )}
          </View>
        )}
      >
        <View style={extra.details}>
          <Text style={s.label}>
            {i18nT("Bước 4/4 · Kiểm tra chuyến đi")}
          </Text>
          {h.schedulePendingSelection ? (
            <View style={[s.card, { backgroundColor: colors.warningContainer }]}>
              <Text style={[s.label, { color: colors.onWarningContainer }]}>
                {i18nT("Bạn đang chọn đặt chuyến hẹn giờ. Vui lòng chọn giờ đón hoặc chuyển sang Đặt ngay.")}
              </Text>
            </View>
          ) : null}
          {h.activeRide ? (
            <View style={s.errorBox}>
              <Text style={s.error}>
                {i18nT("Bạn đang có một chuyến chưa hoàn tất.")}
              </Text>
              <Pressable
                accessibilityRole="button"
                style={extra.targetLink}
                onPress={() =>
                  h.router.replace(activeRideDestination(h.activeRide!))
                }
              >
                <Text style={s.link}>
                  {i18nT("Theo dõi chuyến hiện tại")}
                </Text>
              </Pressable>
            </View>
          ) : null}
          <View style={checkout.footerOptions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={i18nT("Chọn thời gian tài xế đến đón")}
              disabled={h.submitting}
              onPress={h.openSchedule}
              style={[checkout.optionCell, (Boolean(h.scheduledAt) || h.schedulePendingSelection) && checkout.optionCellActive]}
            >
              <MaterialIcons name="event" size={18} color={colors.primary} />
              <Text style={[checkout.optionLabel, (Boolean(h.scheduledAt) || h.schedulePendingSelection) && checkout.optionLabelActive]}>
                {h.scheduledAt ? scheduleTime : h.schedulePendingSelection ? i18nT("Chọn giờ đón") : i18nT("Đặt ngay")}
              </Text>
              <MaterialIcons name="chevron-right" size={16} color={colors.onSurfaceVariant} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={i18nT("Chọn ưu đãi cho chuyến đi")}
              disabled={h.submitting}
              onPress={() => h.setVoucherVisible(true)}
              style={[checkout.optionCell, Boolean(voucherLabel) && checkout.optionCellActive]}
            >
              <MaterialIcons name="local-offer" size={18} color={colors.primary} />
              <Text style={[checkout.optionLabel, Boolean(voucherLabel) && checkout.optionLabelActive]}>
                {voucherLabel || i18nT('Ưu đãi')}
              </Text>
              <MaterialIcons name="chevron-right" size={16} color={colors.onSurfaceVariant} />
            </Pressable>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              h.router.push({
                pathname: "/ride/vehicle",
                params: { edit: "1" },
              })
            }
            style={[s.card, s.row]}
          >
            <View style={s.flex}>
              <Text style={s.label}>
                {i18nT("Phương tiện của bạn")}
                {h.vehicle ? ` · ${i18nT(h.vehicle.vehicle_type === "MOTORCYCLE" ? "Xe máy" : "Ô tô")}` : ""}
              </Text>
              <Text style={[s.text, extra.item4]}>
                {h.vehicle
                  ? `${[h.vehicle.brand, h.vehicle.model].filter(Boolean).join(" ") || i18nT("Xe")} · ${h.vehicle.plate_number ?? ""}`
                  : i18nT("Chọn phương tiện")}
              </Text>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={22}
              color={colors.onSurfaceVariant}
            />
          </Pressable>
          <FareDetails
            estimate={h.estimate}
            loading={h.estimating}
            error={h.error}
            retry={() => void h.retryPrice()}
          />
          {h.error && (h.draft.voucherCode || h.draft.voucherId != null) ? (
            <Pressable accessibilityRole="button" style={extra.targetLink} onPress={() => h.draft.setVoucher("", null)}>
              <Text style={s.link}>{i18nT("Bỏ ưu đãi và tính lại giá")}</Text>
            </Pressable>
          ) : null}
          <Card style={s.card}>
            <List.Accordion title={i18nT("Ghi chú cho tài xế")} style={extra.noteToggle}
              description={h.draft.pickupNote || h.note ? i18nT("Đã thêm ghi chú") : undefined}
              theme={{ colors: { background: colors.transparent } }}>
              <View style={extra.notes}>
                <Text style={s.section}>{i18nT("Ghi chú điểm đón")}</Text>
                <TextInput
                  inputComponent={SheetDraftInput}
                  accessibilityLabel={i18nT("Ghi chú điểm đón")}
                  draftValue={h.draft.pickupNote}
                  onChangeText={h.draft.setPickupNote}
                  maxLength={500}
                  multiline
                  placeholder={i18nT(
                    "Ví dụ: chờ ở đầu ngõ 165, cổng số 2, sảnh A…",
                  )}
                  style={[s.text, extra.item3]}
                />
                <Text style={s.section}>{i18nT("Ghi chú cho tài xế")}</Text>
                <TextInput
                  inputComponent={SheetDraftInput}
                  accessibilityLabel={i18nT("Ghi chú cho tài xế")}
                  draftValue={h.note}
                  onChangeText={h.setNote}
                  maxLength={500}
                  multiline
                  placeholder={i18nT("Ví dụ: đón ở cổng chính, xe đỗ tầng B1…")}
                  style={[s.text, extra.item6]}
                />
                <Text style={[s.muted, extra.item7]}>
                  {i18nT(h.note.length)}/500
                </Text>
              </View>
            </List.Accordion>
          </Card>
        </View>
      </MapSheetLayout>
      <PaymentMethodModal
        visible={paymentVisible}
        close={() => setPaymentVisible(false)}
        method={h.paymentMethod}
        onChange={h.setPaymentMethod}
        balance={h.walletBalance}
        error={h.paymentError}
        submitting={h.submitting}
        onTopUp={() => {
          setPaymentVisible(false);
          h.router.push('/wallet/top-up');
        }}
        onRetryWallet={() => void h.retryWallet()}
      />
      <VoucherPickerModal
        visible={h.voucherVisible}
        close={() => h.setVoucherVisible(false)}
        vouchers={h.vouchers}
        loading={h.vouchersLoading}
        error={h.vouchersError}
        applyError={h.voucherError}
        selectedCode={h.draft.voucherCode}
        selectedId={h.draft.voucherId}
        applyingKey={h.applyingKey}
        subtotal={h.estimate?.estimatedFare}
        onApply={(selection) => void h.applyVoucher(selection)}
        onRetry={() => void h.retryVouchers()}
      />
      <SchedulePickerModal
        key={h.scheduleVisible ? 'schedule-open' : 'schedule-closed'}
        visible={h.scheduleVisible}
        close={() => h.setScheduleVisible(false)}
        selected={h.scheduledAt}
        slots={h.slots}
        onSelect={(slot) => {
          h.setScheduledAt(slot);
          h.setScheduleVisible(false);
        }}
      />
    </>
  );
}

const extraStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    noteToggle: { minHeight: 48 },
    notes: { gap: 12 },
    details: { gap: 16 },
    paymentCompact: {
      minHeight: 48,
      flexGrow: 1,
      flexBasis: 140,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: colors.surfaceContainerHigh,
    },
    totalCopy: { flexGrow: 1, flexBasis: 140, alignItems: "flex-end", gap: 2 },
    scheduleActions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    flexAction: { flexGrow: 1, flexBasis: 140 },
    targetLink: { minHeight: 48, minWidth: 48, justifyContent: "center" },
    item3: { minHeight: 72, textAlignVertical: "top", padding: 12, borderRadius: 16, backgroundColor: colors.inputSurface },
    item4: { ...typography.cardTitle },
    item6: { minHeight: 72, textAlignVertical: "top", padding: 12, borderRadius: 16, backgroundColor: colors.inputSurface },
    item7: { alignSelf: "flex-end" },
  });
