import { DriverPage } from "@/components/DriverPage";
import { StatusBadge } from "@/components/StatusBadge";
import { documentTypeLabel } from "@/lib/displayLabels";
import { serverErrorCopy } from "@/lib/errorCopy";
import { rideStyles } from "@/components/rideStyles";
import { Button, Card, GroupedList, Typography as Text, borderRadius, spacing, typography, useThemeColors, useThemedStyles } from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { ProgressBar } from "react-native-paper";
import { useApprovalStatus } from "../hooks/useApprovalStatus";

export default function ApprovalStatusScreen() {
  const s = useThemedStyles(rideStyles);
  const colors = useThemeColors();
  const { verification: v, documents: d } = useApprovalStatus();
  const router = useRouter();
  const managed = v.data?.verification_workflow === "EKYC";
  const reload = () => Promise.all([v.refetch(), managed ? Promise.resolve() : d.refetch()]);
  const approved = v.data?.verification_status === "APPROVED";
  const rejected = v.data?.verification_status === "REJECTED";
  // Backend eKYC không trả unverified_skills: phải dùng optional chaining, không đọc .length trực tiếp.
  const unverifiedSkillCount = v.data?.unverified_skills?.length ?? 0;
  const types = [...new Set([...(v.data?.required_document_types ?? []), ...(d.data ?? []).map((doc) => doc.document_type)])];
  const documents = types.map((type) => ({ type, document: d.data?.find((doc) => doc.document_type === type) }));
  const rank = (value?: string) => value === "APPROVED" ? 2 : value === "PENDING" ? 1 : 0;
  documents.sort((a, b) => rank(a.document?.verification_status) - rank(b.document?.verification_status));
  const needsChanges = documents.some(({ document }) => !document || document.verification_status === "REJECTED");
  const openVerification = () => router.push("/profile/verification");

  return (
    <DriverPage title="Xét duyệt hồ sơ" loading={v.isLoading || d.isLoading}
      error={serverErrorCopy(v.error?.message || (managed ? undefined : d.error?.message))} retry={reload}>
      {v.data ? (
        <Card style={s.card}>
          <Text style={[styles.stepBadge, { color: colors.primary }]}>Theo dõi kết quả xét duyệt</Text>
          <ProgressBar
            progress={1}
            color={colors.primary}
            style={[styles.progressBar, { backgroundColor: colors.surfaceContainerHigh }]}
          />
          <StatusBadge kind="approval" value={v.data.verification_status} />
          <Text style={[styles.summaryHeadline, { color: colors.onSurface }]}>
            {approved ? "Hồ sơ của bạn đã sẵn sàng"
              : rejected && managed ? "Hồ sơ eKYC chưa được duyệt"
              : managed ? "Hồ sơ đang xác minh eKYC"
              : d.data && needsChanges ? "Hồ sơ cần bổ sung giấy tờ"
              : "Đang chờ quản trị viên xét duyệt"}
          </Text>
          <Text style={s.text}>
            {approved ? "Vào Trang chủ để bật nhận chuyến."
              : rejected && managed ? "Mở hồ sơ eKYC để xem lý do từ chối và tạo yêu cầu mới."
              : managed ? "Mở hồ sơ eKYC để xem kết quả hoặc bổ sung thông tin."
              : d.data && needsChanges ? "Xem các giấy tờ cần bổ sung hoặc thay ảnh bên dưới."
              : "Bạn có thể kiểm tra lại kết quả tại đây sau khi hồ sơ được xem xét."}
          </Text>
          {unverifiedSkillCount > 0 ? (
            <View style={[styles.infoBanner, { backgroundColor: colors.warningContainer }]}>
              <MaterialIcons name="info-outline" size={20} color={colors.onWarningContainer} importantForAccessibility="no" />
              <Text style={[styles.bannerText, { color: colors.onWarningContainer }]}>
                {unverifiedSkillCount} kỹ năng chưa được duyệt
              </Text>
            </View>
          ) : null}
          {approved ? <Button label="Chọn loại xe nhận lái hộ" onPress={() => router.push("/profile/capabilities")} /> : null}
          {approved ? <Button variant="secondary" label="Vào trang chủ" onPress={() => router.replace("/(tabs)/home")} /> : null}
          <Button variant={approved ? "ghost" : "primary"} label={approved ? "Xem hồ sơ xác minh" : rejected ? "Tạo yêu cầu hồ sơ mới" : "Mở xác minh tài xế"} onPress={openVerification} />
        </Card>
      ) : null}
      {!managed && documents.length && d.data ? (
        <GroupedList title="Checklist giấy tờ">
          {documents.map(({ type, document }) => (
            <View key={type} style={styles.row}>
              <View style={styles.rowHeader}>
                <Text style={[styles.docName, { color: colors.onSurface }]}>{documentTypeLabel(type)}</Text>
                {document ? <StatusBadge kind="documentReview" value={document.verification_status} contextLabel="Xét duyệt giấy tờ" />
                  : (
                    <View style={[styles.missingPill, { backgroundColor: colors.warningContainer }]}>
                      <Text style={[styles.missingText, { color: colors.onWarningContainer }]}>Chưa nộp</Text>
                    </View>
                  )}
              </View>
              {document?.rejection_reason ? (
                <View style={[styles.errorBanner, { backgroundColor: colors.errorContainer }]} accessibilityRole="alert">
                  <MaterialIcons name="error-outline" size={20} color={colors.onErrorContainer} importantForAccessibility="no" />
                  <Text style={[styles.bannerText, { color: colors.onErrorContainer }]}>Lý do: {document.rejection_reason}</Text>
                </View>
              ) : null}
              {document?.expires_at ? <Text style={s.label}>Hạn trên giấy tờ · {new Date(`${document.expires_at.slice(0, 10)}T00:00:00`).toLocaleDateString("vi-VN")}</Text> : null}
              {!document || document.verification_status === "REJECTED" ? (
                <Button variant="ghost" label={document ? "Cập nhật trong xác minh tài xế" : "Bổ sung trong xác minh tài xế"}
                  accessibilityLabel={`Cập nhật ${documentTypeLabel(type)}`} onPress={openVerification} />
              ) : null}
            </View>
          ))}
        </GroupedList>
      ) : null}
      <Button variant="secondary" label="Kiểm tra lại kết quả" loading={v.isFetching || d.isFetching}
        onPress={() => void reload()} />
    </DriverPage>
  );
}

const styles = StyleSheet.create({
  stepBadge: { ...typography.label },
  progressBar: { height: 4, borderRadius: borderRadius.full },
  summaryHeadline: { ...typography.screenTitle, marginTop: spacing.spaceXs },
  row: { gap: spacing.spaceSm, paddingVertical: spacing.px3 },
  rowHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.spaceSm },
  docName: { ...typography.cardTitle, flex: 1 },
  missingPill: { paddingHorizontal: spacing.px3, paddingVertical: spacing.py1_5, borderRadius: borderRadius.full },
  missingText: { ...typography.badge },
  infoBanner: { flexDirection: "row", alignItems: "center", gap: spacing.spaceSm, padding: spacing.px3, borderRadius: spacing.spaceMd },
  errorBanner: { flexDirection: "row", alignItems: "flex-start", gap: spacing.spaceSm, padding: spacing.px3, borderRadius: spacing.spaceMd },
  bannerText: { ...typography.label, flex: 1 },
});
