import { CustomerNotice } from "@/components/CustomerRideUI";
import { HandoverGallery } from "@/components/HandoverGallery";
import { ActivityIndicator } from "react-native-paper";
import { ScreenHeader } from "@/components/ScreenHeader";
import { getLocale, translate as i18nT } from "@datxe/shared";
import {
  Card,
  Button,
  EvidenceEditor,
  HandoverHistory,
  PaperTextInput as TextInput,
  ScreenWrapper as SafeAreaView,
  Typography as Text,
  useLanguage,
  useThemeColors,
  useThemedStyles,
} from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useRef, type ComponentRef } from "react";
import { KeyboardAvoidingView, ScrollView, View } from "react-native";

import {
  Metric,
  styles as base_styles,
} from "../components/VehicleInspectionScreenParts";
import { useVehicleInspection } from "../hooks/useVehicleInspection";
export default function VehicleInspectionScreen() {
  useLanguage();

  const colors = useThemeColors();

  const styles = useThemedStyles(base_styles);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);

  const h = useVehicleInspection();
  const { router, phase, ride, loading, saving, error, report, presentation, confirm } = h;
  useEffect(() => {
    if (h.correctionOpen) {
      const timer = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
      return () => clearTimeout(timer);
    }
  }, [h.correctionOpen]);
  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    if (ride?.id) {
      router.replace({ pathname: "/ride/tracking", params: { rideId: String(ride.id) } });
      return;
    }
    router.replace("/(tabs)/home");
  };
  const bannerSurface =
    presentation.banner.tone === "error"
      ? { bg: colors.errorContainer, fg: colors.onErrorContainer, icon: "error-outline" as const }
      : presentation.banner.tone === "warning"
        ? { bg: colors.warningContainer, fg: colors.onWarningContainer, icon: "warning-amber" as const }
        : presentation.banner.tone === "success"
          ? { bg: colors.successContainer, fg: colors.onSuccessContainer, icon: "verified" as const }
          : { bg: colors.surfaceContainerHigh, fg: colors.onSurface, icon: "info-outline" as const };
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScreenHeader
        title={i18nT(presentation.screenTitle)}
        onBack={goBack}
      />
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <Text style={styles.subtitle}>
            {i18nT(
              phase === "PICKUP"
                ? "Kiểm tra hiện trạng trước khi bắt đầu chuyến."
                : "Kiểm tra hiện trạng khi tài xế hoàn trả xe.",
            )}
          </Text>
          {loading ? <ActivityIndicator color={colors.primary} /> : null}
          {!loading && !error ? (
            <Card style={[styles.card, { backgroundColor: bannerSurface.bg }]}>
              <View style={styles.confirmed}>
                <MaterialIcons name={bannerSurface.icon} size={20} color={bannerSurface.fg} />
                <Text style={[styles.section, { color: bannerSurface.fg, flexShrink: 1 }]}>{i18nT(presentation.banner.title)}</Text>
              </View>
              <Text style={[styles.body, { color: bannerSurface.fg }]}>{i18nT(presentation.banner.message)}</Text>
            </Card>
          ) : null}
          {ride ? (
            <Card style={styles.card}>
              <Text style={styles.section}>
                {i18nT(
                  phase === "PICKUP"
                    ? "Bàn giao lúc đón"
                    : "Hoàn trả tại điểm đến",
                )}
                {report ? ` · ${i18nT("Phiên bản {0}", { 0: presentation.currentRevision })}` : ""}
              </Text>
              {report ? (
                <>
                  <View style={styles.metrics}>
                    <Metric
                      label="Số km đồng hồ"
                      value={`${report.odometer.toLocaleString(getLocale())} km`}
                    />
                    {report.fuelLevel !== null ? (
                      <Metric
                        label={i18nT("Nhiên liệu")}
                        value={`${report.fuelLevel}%`}
                      />
                    ) : null}
                  </View>
                  {report.notes ? (
                    <Text style={styles.body}>{report.notes}</Text>
                  ) : null}
                  <Text style={styles.section}>{i18nT("Ảnh bàn giao")} · {report.photos.length}</Text>
                  <HandoverGallery photos={report.photos} />
                  {report.confirmedByCustomer ? (
                    <View style={styles.confirmed}>
                      <MaterialIcons
                        name="verified"
                        size={20}
                        color={colors.successStrong}
                      />
                      <Text style={styles.confirmedText}>
                        {i18nT("Bạn đã xác nhận biên bản này.")}
                      </Text>
                    </View>
                  ) : null}
                </>
              ) : (
                <Text style={styles.body}>
                  {i18nT("Tài xế chưa gửi biên bản")}{" "}
                  {i18nT(phase === "PICKUP" ? "nhận xe" : "trả xe")}.
                </Text>
              )}
            </Card>
          ) : null}
          {error ? <CustomerNotice onRetry={h.valid ? () => void h.refresh() : undefined}>{i18nT(error)}</CustomerNotice> : null}
          {h.correctionOpen && h.canReview ? <Card style={styles.card}>
            <Text style={styles.section}>{i18nT("Yêu cầu sửa biên bản phiên bản {0}", { 0: presentation.currentRevision })}</Text>
            <TextInput
              mode="outlined"
              label={i18nT("Lý do yêu cầu điều chỉnh")}
              style={{ backgroundColor: colors.inputSurface }}
              accessibilityLabel="Lý do yêu cầu điều chỉnh"
              placeholder="Thông tin nào chưa đúng? Ít nhất 10 ký tự"
              draftValue={h.reason}
              onChangeText={h.setReason}
              onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120)}
              multiline
              maxLength={2000}
              editable={!h.correction.isPending}
            />
            <EvidenceEditor images={h.images} onChange={h.setImages} pick={h.pickSupportImage} disabled={h.correction.isPending} onBusyChange={h.setUploading} />
            {h.correction.error ? <Text style={styles.error}>{h.correction.error.message}</Text> : null}
            <Button label={h.correction.isPending ? 'Đang gửi…' : 'Gửi yêu cầu điều chỉnh'} disabled={saving || h.uploading || h.correction.isPending || h.reason.trim().length < 10} onPress={() => h.correction.mutate()} />
          </Card> : null}
          {h.revisions.error ? <Button label="Chưa tải được phiên bản cũ · Thử lại" variant="secondary" onPress={() => void h.revisions.refetch()} /> : null}
          <HandoverHistory revisions={h.revisions.data ?? []} />
          {ride ? <Button label="Cần bộ phận hỗ trợ" variant="ghost" onPress={() => router.push({ pathname: '/support', params: { rideId: String(ride.id) } })} /> : null}
        </ScrollView>
        {presentation.mode === "stale_revision" ? (
          <View style={styles.footer}>
            <Button
              label={i18nT("Xem phiên bản {0}", { 0: presentation.currentRevision })}
              onPress={h.acknowledgeLatestRevision}
            />
          </View>
        ) : h.canReview ? (
          <View style={styles.footer}>
            {!h.correctionOpen ? (
              <Button label="Xác nhận tình trạng xe" loading={saving}
                disabled={h.correction.isPending || h.uploading} onPress={() => void confirm()} />
            ) : null}
            <Button label={h.correctionOpen ? "Đóng yêu cầu điều chỉnh" : "Yêu cầu điều chỉnh"} variant="secondary"
              disabled={saving || h.correction.isPending || h.uploading}
              onPress={() => h.setCorrectionOpen(!h.correctionOpen)} />
          </View>
        ) : !h.synchronized && report ? (
          <View style={styles.footer}>
            <Button label="Làm mới biên bản" onPress={() => void h.refresh()} />
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
