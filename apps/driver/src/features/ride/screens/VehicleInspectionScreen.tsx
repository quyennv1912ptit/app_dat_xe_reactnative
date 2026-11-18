import { useState } from "react";
import { DriverConfirmationDialog } from "@/components/DriverConfirmationDialog";
import { DriverPage } from "@/components/DriverPage";
import { DriverPhoto } from "@/components/DriverPhoto";
import { rideStyles as s } from "@/components/rideStyles";
import {
  Button,
  Card,
  HandoverHistory,
  Typography as Text,
  PaperTextInput as TextInput,
  spacing,
  typography,
  useThemeColors,
  useThemedStyles,
} from "@datxe/ui";
import { StyleSheet, View } from "react-native";
import { Appbar } from "react-native-paper";

import { RideStopCard } from "../components/RideStopCard";
import { RideStatusBanner } from "../components/RideStatusBanner";
import { HandoverSummary } from "../components/HandoverSummary";
import { HandoverPhotoChecklist, requiredHandoverAngles } from "../components/HandoverPhotoChecklist";
import { useVehicleInspection } from "../hooks/useVehicleInspection";

export default function VehicleInspectionScreen() {
  const themed_s = useThemedStyles(s);
  const h = useVehicleInspection();
  const colors = useThemeColors();
  const model = h.presentation;
  const reviewing = !h.editable ? h.existing : undefined;
  const fieldStyle = [styles.field, { backgroundColor: colors.rideInset }];
  const missing = requiredHandoverAngles.filter(([angle]) => !h.photos.some((photo) => photo.angle === angle));
  const odometerBelowPickup = h.pickupOdometer != null && /^\d+$/.test(h.odometer.trim()) && Number(h.odometer) < h.pickupOdometer;
  const odometerValid = /^\d+$/.test(h.odometer.trim()) && Number.isSafeInteger(Number(h.odometer)) && !odometerBelowPickup;
  const fuelValid = !h.fuelLevel || (/^\d+$/.test(h.fuelLevel) && Number(h.fuelLevel) <= 100);
  const [reviewKey, setReviewKey] = useState<string | null>(null);
  const nextRevision = model?.nextRevision ?? 1;
  const draftKey = `${h.ride?.id}:${h.phase}:${nextRevision}`;
  const formComplete = !h.uploading && !h.pending.length && odometerValid && fuelValid && missing.length === 0;
  const canReview = h.editable && h.canSubmitOnline && formComplete;

  const progressHint = h.pending.length
    ? "Còn ảnh chờ tải lên. Hãy bấm Tải lại ảnh."
    : missing.length
      ? `Còn thiếu ${missing.length} ảnh bắt buộc`
      : !odometerValid || !fuelValid
        ? (odometerBelowPickup ? "Số km trả xe phải lớn hơn hoặc bằng lúc nhận xe" : "Kiểm tra số km và mức nhiên liệu")
        : !h.canSubmitOnline && model?.submitDisabledReason
          ? model.submitDisabledReason
          : `Sẵn sàng gửi phiên bản ${nextRevision}`;

  return (
    <DriverPage
      title={model?.title ?? (h.phase === "dropoff" ? "Biên bản trả xe" : "Biên bản nhận xe")}
      appearance="ride"
      loading={h.loading}
      error={h.submit.error?.message || (!h.editable ? h.error : undefined)}
      retry={!h.editable && h.error ? h.refresh : undefined}
      headerAction={h.ride ? (
        <Appbar.Action
          icon="help-outline"
          style={styles.headerAction}
          accessibilityLabel="Trợ giúp về chuyến này"
          onPress={() => h.router.push({ pathname: "/support", params: { rideId: String(h.ride!.id) } })}
        />
      ) : undefined}
      footer={h.editable ? (
        <>
          <Text style={themed_s.label} accessibilityLiveRegion="polite">
            {progressHint}
          </Text>
          <Button
            label="Xem lại trước khi gửi"
            disabled={!canReview}
            loading={h.submit.isPending}
            onPress={() => setReviewKey(draftKey)}
          />
        </>
      ) : model && (model.mode === "waiting_customer" || model.mode === "confirmed_view") ? (
        <View style={styles.footerActions}>
          {model.mode === "waiting_customer" ? (
            <Button
              variant="secondary"
              label="Kiểm tra xác nhận của khách"
              loading={h.isFetching}
              onPress={() => void h.refresh()}
            />
          ) : null}
          <Button
            variant={model.mode === "confirmed_view" ? "primary" : "ghost"}
            label={model.fallbackLabel}
            onPress={() => h.router.dismissTo(model.fallbackRoute)}
          />
        </View>
      ) : undefined}
    >
      {model ? (
        <RideStatusBanner
          banner={model.statusBanner}
          action={
            h.editable && !h.canSubmitOnline ? (
              <Button
                variant="secondary"
                label="Đồng bộ lại"
                loading={h.isFetching}
                onPress={() => void h.refresh()}
              />
            ) : undefined
          }
        >
          {h.editable && h.existing?.correctionImages?.length ? (
            <View style={styles.correctionImages}>
              {h.existing.correctionImages.map((image) => (
                <DriverPhoto key={image.publicId} uri={image.fileUrl} label="Ảnh khách yêu cầu điều chỉnh" />
              ))}
            </View>
          ) : null}
        </RideStatusBanner>
      ) : null}

      {h.ride ? <RideStopCard ride={h.ride} phase={h.phase} showDirections={false} /> : null}

      {h.editable ? (
        <Text style={themed_s.label}>Bản nháp · Phiên bản {nextRevision}</Text>
      ) : h.existing ? (
        <Text style={themed_s.label}>Đã gửi · Phiên bản {h.existing.revision ?? 1}</Text>
      ) : null}

      {reviewing ? (
        <HandoverSummary report={reviewing} status={h.ride?.status} />
      ) : h.editable ? (
        <>
          <Card style={[styles.form, { backgroundColor: colors.rideSurface }]}>
            <Text accessibilityRole="header" style={styles.heading}>Tình trạng xe</Text>
            <TextInput
              mode="flat"
              underlineColor={colors.transparent}
              label="Số km đồng hồ"
              draftValue={h.odometer}
              onChangeText={h.setOdometer}
              keyboardType="number-pad"
              style={fieldStyle}
              placeholder="Ví dụ 12500"
              error={!odometerValid && h.odometer.trim().length > 0}
            />
            {h.pickupOdometer != null ? (
              <Text style={themed_s.label}>Số ODO lúc nhận xe: {h.pickupOdometer} km</Text>
            ) : null}
            {odometerBelowPickup ? (
              <Text accessibilityRole="alert" style={[themed_s.label, { color: colors.error }]}>
                Số km trả xe phải lớn hơn hoặc bằng lúc nhận xe ({h.pickupOdometer} km).
              </Text>
            ) : null}
            <TextInput
              mode="flat"
              underlineColor={colors.transparent}
              label="Nhiên liệu (%) · Tùy chọn"
              draftValue={h.fuelLevel}
              onChangeText={h.setFuelLevel}
              keyboardType="number-pad"
              style={fieldStyle}
              placeholder="0–100"
              error={!fuelValid}
            />
            <TextInput
              mode="flat"
              underlineColor={colors.transparent}
              label="Ghi chú biên bản"
              draftValue={h.notes}
              onChangeText={h.setNotes}
              multiline
              maxLength={2000}
              style={fieldStyle}
              placeholder="Tình trạng xe khi bàn giao…"
            />
          </Card>
          <HandoverPhotoChecklist
            photos={h.photos}
            pending={h.pending}
            uploading={h.uploading}
            saving={h.submit.isPending}
            error={h.photoError}
            onCapture={(angle) => void h.capture(angle)}
          />
          <DriverConfirmationDialog
            visible={reviewKey === draftKey}
            busy={h.submit.isPending}
            title={`Xem lại phiên bản ${nextRevision}`}
            description={`Biên bản ${h.phase === "pickup" ? "nhận xe" : "trả xe"} · ${requiredHandoverAngles.length - missing.length}/${requiredHandoverAngles.length} ảnh bắt buộc`}
            confirmLabel="Gửi cho khách xác nhận"
            dismissLabel="Sửa tiếp"
            destructive={false}
            disabled={!canReview}
            error={h.submit.error?.message || (!h.canSubmitOnline ? model?.submitDisabledReason : undefined)}
            onDismiss={() => setReviewKey(null)}
            onConfirm={() => h.send(() => setReviewKey(null))}
          >
            <Text>Số km đồng hồ · {h.odometer} km</Text>
            <Text>Nhiên liệu · {h.fuelLevel ? `${h.fuelLevel}%` : "Chưa ghi"}</Text>
            {h.notes.trim() ? <Text>{h.notes}</Text> : null}
          </DriverConfirmationDialog>
        </>
      ) : !h.loading && (!model || model.mode === "unavailable") ? (
        <Button
          variant="secondary"
          label={model?.fallbackLabel ?? "Về trang chủ"}
          onPress={() => h.router.replace(model?.fallbackRoute ?? "/(tabs)/home")}
        />
      ) : null}

      {h.revisions.error ? (
        <Button label="Thử tải lại phiên bản cũ" variant="secondary" onPress={() => void h.revisions.refetch()} />
      ) : null}
      <HandoverHistory revisions={h.revisions.data ?? []} />
    </DriverPage>
  );
}

const styles = StyleSheet.create({
  headerAction: { width: 48, height: 48, borderRadius: 24, margin: 0 },
  correctionImages: { gap: spacing.spaceSm, marginTop: spacing.spaceXs },
  heading: { ...typography.cardTitle },
  form: { padding: spacing.spaceLg, gap: spacing.px3 },
  field: { minHeight: 52 },
  footerActions: { gap: spacing.spaceSm },
});
