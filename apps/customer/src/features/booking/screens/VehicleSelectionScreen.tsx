import { customerType } from "@/components/CustomerRideUI";
import { ActivityIndicator } from "react-native-paper";
import { MapSheetLayout } from "@datxe/ui/goong-map";
import { translate as i18nT } from "@datxe/shared";
import {
  Button,
  GroupedList,
  MotionPressable as Pressable,
  Typography as Text,
  typography,
  useLanguage,
  useThemeColors,
  useThemedStyles,
} from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { BookingMap } from "@/components/map/BookingMap";
import { activeRideDestination, DEFAULT_MAP_CENTER, formatScheduledPickup } from "../bookingUtils";
import { bookingStyles as base_s } from "../components/bookingStyles";
import { checkoutStyles } from "../components/checkoutStyles";
import { PaymentMethodModal } from "../components/PaymentMethodModal";
import { RideRouteBar } from "../components/RideRouteBar";
import { SchedulePickerModal } from "../components/SchedulePickerModal";
import { VoucherPickerModal } from "../components/VoucherPickerModal";
import { useVehicleSelection } from "../hooks/useVehicleSelection";
import { getVoucherPresentation } from "@/lib/voucherPresentation";

export default function VehicleSelectionScreen() {
  const extra = useThemedStyles(extraStyles);

  useLanguage();

  const colors = useThemeColors();

  const s = useThemedStyles(base_s);
  const checkout = useThemedStyles(checkoutStyles);

  const h = useVehicleSelection();
  const [paymentVisible, setPaymentVisible] = useState(false);
  const scheduleTime = h.scheduledAt ? formatScheduledPickup(h.scheduledAt) : '';
  const voucherLabel = h.selectedVoucher
    ? getVoucherPresentation(h.selectedVoucher).title
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
            onPickup={() => h.router.push('/ride/pickup')}
            onDropoff={() => h.router.push('/ride/destination')}
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
            <View style={checkout.footerOptions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={i18nT("Phương thức thanh toán")}
                onPress={() => setPaymentVisible(true)}
                style={checkout.optionCell}
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
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={i18nT("Chọn ưu đãi cho chuyến đi")}
                onPress={() => h.setVoucherVisible(true)}
                style={checkout.optionCell}
              >
                <MaterialIcons name="local-offer" size={18} color={colors.primary} />
                <Text style={checkout.optionLabel}>
                  {voucherLabel || i18nT('Ưu đãi')}
                </Text>
                <MaterialIcons name="chevron-right" size={16} color={colors.onSurfaceVariant} />
              </Pressable>
            </View>
            <View style={checkout.modeRow}>
              {(() => {
                const instantSelected = !h.scheduledAt && !h.draft.scheduleRequested;
                const scheduleSelected = Boolean(h.scheduledAt || h.draft.scheduleRequested);
                return (
                  <>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected: instantSelected }}
                      onPress={() => {
                        h.draft.clearScheduleRequest?.();
                        h.setScheduledAt(null);
                      }}
                      style={[checkout.modeCell, instantSelected && checkout.modeCellActive]}
                    >
                      <MaterialIcons
                        name="bolt"
                        size={18}
                        color={instantSelected ? colors.primary : colors.onSurfaceVariant}
                      />
                      <Text style={[checkout.modeText, instantSelected && checkout.modeTextActive]}>
                        {i18nT('Đi ngay')}
                      </Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected: scheduleSelected }}
                      onPress={h.openSchedule}
                      style={[checkout.modeCell, scheduleSelected && checkout.modeCellActive]}
                    >
                      <MaterialIcons
                        name="schedule"
                        size={18}
                        color={scheduleSelected ? colors.primary : colors.onSurfaceVariant}
                      />
                      <Text style={[checkout.modeText, scheduleSelected && checkout.modeTextActive]}>
                        {h.scheduledAt ? scheduleTime : h.draft.scheduleRequested ? i18nT('Chọn giờ đón') : i18nT('Đặt trước')}
                      </Text>
                    </Pressable>
                  </>
                );
              })()}
            </View>
            <Button
              label="Tiếp tục · Xem giá chuyến"
              disabled={!h.canContinue}
              onPress={h.continueBooking}
              icon="arrow-forward"
              style={checkout.footerCta}
            />
          </View>
        )}
      >
        <View style={extra.details}>
          <Text style={s.label}>{i18nT("Bước 3/4 · Phương tiện của bạn")}</Text>
          <View style={s.between}>
            <View style={s.flex}>
              <Text style={s.section}>{i18nT("Tài xế sẽ lái xe nào?")}</Text>
            </View>
            <Pressable
              onPress={() => h.router.push("/add-vehicle")}
              accessibilityRole="button"
              style={customerType.target}
            >
              <Text style={s.link}>{i18nT("+ Thêm xe")}</Text>
            </Pressable>
          </View>
          {h.loading ? <ActivityIndicator color={colors.primary} /> : null}
          {h.error ? (
            <View style={s.errorBox}>
              <Text style={s.error}>{i18nT(h.error)}</Text>
              <Pressable accessibilityRole="button" style={customerType.target} onPress={h.refresh}>
                <Text style={s.link}>{i18nT("Thử lại")}</Text>
              </Pressable>
            </View>
          ) : null}
          {h.activeRide ? (
            <View style={s.errorBox}>
              <Text style={s.text}>
                {i18nT("Bạn đang có một chuyến chưa hoàn tất.")}
              </Text>
              <Pressable
                onPress={() =>
                  h.router.push(activeRideDestination(h.activeRide!))
                }
              >
                <Text style={s.link}>{i18nT("Xem chuyến đang diễn ra")}</Text>
              </Pressable>
            </View>
          ) : null}
          {!h.draft.pickup || !h.draft.dropoff ? (
            <View style={s.errorBox}>
              <Text style={s.error}>
                {i18nT("Hãy chọn đủ điểm đón và điểm đến để tiếp tục.")}
              </Text>
              <Pressable
                onPress={() =>
                  h.router.push(
                    h.draft.pickup ? "/ride/destination" : "/ride/pickup",
                  )
                }
              >
                <Text style={s.link}>{i18nT("Chọn địa điểm")}</Text>
              </Pressable>
            </View>
          ) : null}
          {h.vehicles.length ? <GroupedList>{h.vehicles.map((vehicle) => (
            <Pressable
              key={vehicle.id}
              onPress={() => h.setSelectedId(vehicle.id)}
              style={[
                s.row,
                extra.vehicleRow,
                h.selected?.id === vehicle.id && s.selected,
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: h.selected?.id === vehicle.id }}
            >
              <View style={s.flex}>
                <Text style={[s.text, extra.item4]}>
                  {i18nT(
                    [vehicle.brand, vehicle.model].filter(Boolean).join(" ") ||
                      (vehicle.vehicle_type === "MOTORCYCLE"
                        ? h.vehicleLabels?.MOTORCYCLE ?? "Xe máy"
                        : h.vehicleLabels?.CAR ?? "Ô tô"),
                  )}
                </Text>
                <Text style={[s.text, extra.item5]}>
                  {vehicle.plate_number || i18nT("Chưa có biển số")}
                </Text>
                <Text style={s.muted}>
                  {i18nT(
                    vehicle.vehicle_type === "MOTORCYCLE"
                      ? h.vehicleLabels?.MOTORCYCLE ?? "Xe máy"
                      : h.vehicleLabels?.CAR ?? "Ô tô",
                  )}
                  {" · "}
                  {i18nT(
                    vehicle.transmission_type === "AUTO"
                      ? "Số tự động"
                      : vehicle.transmission_type === "MANUAL"
                        ? "Số sàn"
                        : "Chưa rõ hộp số",
                  )}
                  {i18nT(vehicle.color ? ` · ${vehicle.color}` : "")}
                </Text>
              </View>
              <MaterialIcons
                name={
                  h.selected?.id === vehicle.id
                    ? "radio-button-checked"
                    : "radio-button-unchecked"
                }
                size={23}
                color={
                  h.selected?.id === vehicle.id
                    ? colors.primary
                    : colors.outline
                }
              />
            </Pressable>
          ))}</GroupedList> : null}
          {!h.loading && !h.error && !h.vehicles.length ? (
            <View style={[s.card, s.empty]}>
              <MaterialIcons name="add-road" size={42} color={colors.outline} />
              <Text style={s.section}>
                {i18nT("Bạn chưa thêm phương tiện")}
              </Text>
              <Text style={s.muted}>
                {i18nT("Thêm xe của bạn để xem giá chuyến lái hộ.")}
              </Text>
              <Pressable accessibilityRole="button" style={customerType.target} onPress={() => h.router.push("/add-vehicle")}>
                <Text style={s.link}>{i18nT("Thêm phương tiện đầu tiên")}</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </MapSheetLayout>
      <PaymentMethodModal
        visible={paymentVisible}
        close={() => setPaymentVisible(false)}
        method={h.paymentMethod}
        onChange={h.setPaymentMethod}
        balance={h.walletBalance}
        error={h.paymentError}
        submitting={false}
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
        onApply={(selection) => h.applyVoucher(selection)}
        onRetry={() => void h.retryVouchers()}
        campaigns={h.campaigns}
        campaignsLoading={h.campaignsLoading}
        campaignsError={h.campaignsError}
        retryCampaigns={() => void h.retryCampaigns()}
        claimVoucher={(id) => void h.claimVoucher(id)}
        claimingCampaignId={h.claimingCampaignId}
      />
      <SchedulePickerModal
        key={h.scheduleVisible ? 'schedule-open' : 'schedule-closed'}
        visible={h.scheduleVisible}
        close={h.closeSchedule}
        selected={h.scheduledAt}
        session={h.schedulePicker}
        onSelect={h.selectSchedule}
      />
    </>
  );
}

const extraStyles = () =>
  StyleSheet.create({
    details: { gap: 8 },
    item4: { ...typography.cardTitle },
    item5: { letterSpacing: 1 },
    vehicleRow: { minHeight: 64, paddingVertical: 8, paddingHorizontal: 8, borderRadius: 16 },
  });
