import { DriverPage } from "@/components/DriverPage";
import { DriverPhoto } from "@/components/DriverPhoto";
import { StatusBadge } from "@/components/StatusBadge";
import { documentTypeLabel } from "@/lib/displayLabels";
import { rideStyles } from "@/components/rideStyles";
import { Button, Card, CustomDatePickerModal, GroupedList, PaperTextInput as TextInput, SettingsListItem, Typography as Text, typography, useThemeColors, useThemedStyles } from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Dialog, HelperText, Portal, ProgressBar } from "react-native-paper";
import { useDocuments } from "../hooks/useDocuments";
import { documentExpiry, documentNumber } from "../onboardingValidation";

const instructions: Record<string, string> = {
  CCCD: "Chụp đủ bốn góc, thấy rõ số căn cước và ảnh trên thẻ.",
  CCCD_BACK: "Chụp toàn bộ mặt sau, tránh ánh sáng phản chiếu.",
  SELFIE: "Nhìn thẳng vào camera, để mặt rõ và đủ ánh sáng.",
  DRIVER_LICENSE: "Đặt bằng trên mặt phẳng, chụp rõ số bằng và hạng bằng.",
  DRIVER_LICENSE_BACK: "Chụp đầy đủ mặt sau của cùng giấy phép.",
};
const validationMessage = (validate: () => unknown) => {
  try { validate(); return ""; }
  catch (error) { return error instanceof Error ? error.message : "Kiểm tra lại thông tin."; }
};

export function DocumentForm({ identity = false }: { identity?: boolean }) {
  const s = useThemedStyles(rideStyles);
  const colors = useThemeColors();
  const h = useDocuments(identity);
  const { document } = useLocalSearchParams<{ document?: string }>();
  const [datePicker, setDatePicker] = useState(false);
  const [review, setReview] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const busy = Boolean(h.picking) || Boolean(h.extracting) || h.save.isPending;
  const ready = Boolean(h.documents.data && h.profile.data && (identity || h.skills.data));
  const documents = h.documents.data ?? [];
  const types = [...h.types].sort((a, b) => Number(b === document) - Number(a === document));
  const photoCount = types.filter((type) => h.images[type] || documents.some((doc) => doc.document_type === type && doc.secure_url)).length;
  const numberError = validationMessage(() => documentNumber(h.number, identity));
  const dateError = identity ? "" : validationMessage(() => documentExpiry(h.expiry));
  const yearsError = !identity && (!/^\d+$/.test(h.years) || !Number.isSafeInteger(Number(h.years)));
  const licenseError = !identity && !h.licenseClass.trim();
  const expiry = h.expiry ? new Date(`${h.expiry}T00:00:00`) : null;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const validationSummary = !attempted ? ""
    : numberError
    || (licenseError ? "Nhập hạng bằng ghi trên giấy phép." : "")
    || (yearsError ? "Nhập số năm kinh nghiệm hợp lệ." : "")
    || dateError
    || (photoCount < types.length ? "Bổ sung đủ ảnh giấy tờ trước khi gửi hồ sơ." : "");
  const submit = () => {
    setAttempted(true);
    if (!numberError && !dateError && !yearsError && !licenseError && photoCount === types.length) h.save.mutate();
  };

  return (
    <DriverPage form title={identity ? "Căn cước và ảnh chân dung" : "Giấy phép lái xe"}
      loading={h.documents.isLoading || h.profile.isLoading || (!identity && h.skills.isLoading)}
      error={h.error} retry={() => Promise.all([h.documents.refetch(), h.profile.refetch(), h.skills.refetch()])}>
      <Card style={s.card}>
        <Text style={[styles.stepBadge, { color: colors.primary }]}>
          {identity ? "Bước 3/4 · Xác minh danh tính" : "Bước 2/4 · Giấy phép và kỹ năng"}
        </Text>
        <ProgressBar progress={identity ? 0.75 : 0.5} />
        <Text style={[styles.stepLead, { color: colors.onSurface }]}>
          {identity ? "Chuẩn bị căn cước hai mặt và ảnh chân dung." : "Dùng thông tin đúng như trên giấy phép lái xe."}
        </Text>
      </Card>
      {validationSummary ? (
        <View style={[styles.errorBanner, { backgroundColor: colors.errorContainer }]} accessibilityRole="alert">
          <MaterialIcons name="error-outline" size={22} color={colors.onErrorContainer} importantForAccessibility="no" />
          <Text style={[styles.alertText, { color: colors.onErrorContainer }]}>{validationSummary}</Text>
        </View>
      ) : null}
      <GroupedList title={`Ảnh giấy tờ · ${photoCount}/${types.length}`}>
        <ProgressBar progress={photoCount / types.length} accessibilityLabel={`Đã có ${photoCount} trên ${types.length} ảnh`} />
        {!review && types.map((type) => {
          const current = documents.find((doc) => doc.document_type === type);
          const uri = h.images[type] ?? current?.secure_url;
          const label = documentTypeLabel(type);
          const typeWarnings = h.warnings[type] ?? [];
          const showInstruction = current?.verification_status !== "APPROVED" || Boolean(h.images[type]);
          const showAutofill = (type === "DRIVER_LICENSE" || type === "CCCD") && Boolean(uri)
            && (Boolean(h.images[type]) || current?.verification_status !== "APPROVED");
          return (
            <View key={type} style={[styles.docCard, { backgroundColor: colors.surfaceContainerHigh }]}>
              <View style={styles.docHeader}>
                <Text style={[styles.docTitle, { color: colors.onSurface }]}>{label}</Text>
                {h.images[type] ? (
                  <View style={[styles.pill, { backgroundColor: colors.primaryContainer }]}>
                    <Text style={[styles.pillText, { color: colors.onPrimaryContainer }]}>Ảnh mới · Chưa lưu</Text>
                  </View>
                ) : current ? (
                  <StatusBadge kind="documentReview" value={current.verification_status} contextLabel="Xét duyệt giấy tờ" />
                ) : (
                  <View style={[styles.pill, { backgroundColor: colors.warningContainer }]}>
                    <Text style={[styles.pillText, { color: colors.onWarningContainer }]}>Chưa có ảnh</Text>
                  </View>
                )}
              </View>
              {showInstruction ? <Text style={[styles.instructionText, { color: colors.onSurfaceVariant }]}>{instructions[type]}</Text> : null}
              {uri ? <DriverPhoto uri={uri} label={label} /> : null}
              {current?.rejection_reason ? (
                <View style={[styles.errorBanner, { backgroundColor: colors.errorContainer }]} accessibilityRole="alert">
                  <MaterialIcons name="error-outline" size={22} color={colors.onErrorContainer} importantForAccessibility="no" />
                  <Text style={[styles.alertText, { color: colors.onErrorContainer }]}>Lý do từ chối: {current.rejection_reason}</Text>
                </View>
              ) : null}
              {h.pickError?.type === type ? (
                <View style={[styles.errorBanner, { backgroundColor: colors.errorContainer }]} accessibilityRole="alert">
                  <MaterialIcons name="error-outline" size={22} color={colors.onErrorContainer} importantForAccessibility="no" />
                  <Text style={[styles.alertText, { color: colors.onErrorContainer }]}>{h.pickError.message}</Text>
                </View>
              ) : null}
              {typeWarnings.length ? (
                <View style={[styles.warningBox, { backgroundColor: colors.warningContainer }]} accessibilityRole="alert">
                  <View style={styles.warningHeader}>
                    <MaterialIcons name="warning-amber" size={22} color={colors.onWarningContainer} importantForAccessibility="no" />
                    <Text style={[styles.warningTitle, { color: colors.onWarningContainer }]}>Lưu ý từ hệ thống đọc ảnh</Text>
                  </View>
                  {typeWarnings.map((msg, idx) => (
                    <Text key={idx} style={[styles.warningText, { color: colors.onWarningContainer }]}>{msg}</Text>
                  ))}
                </View>
              ) : null}
              {showAutofill ? (
                <Button variant="secondary" icon="auto-fix-high" iconPosition="leading"
                  label={h.extracting === type ? "Đang đọc thông tin từ ảnh…" : "Điền tự động từ ảnh"}
                  loading={h.extracting === type}
                  disabled={busy} onPress={() => void h.extract(type)} />
              ) : null}
              <Button variant="secondary" icon="add-a-photo" iconPosition="leading" label={uri ? "Thay ảnh" : "Thêm ảnh"}
                accessibilityLabel={`${uri ? "Thay ảnh" : "Thêm ảnh"} · ${label}`}
                loading={h.picking === type || h.uploading === type} loadingLabel="Đang xử lý ảnh…"
                disabled={busy} onPress={() => h.setSource(type)} />
            </View>
          );
        })}
      </GroupedList>
      {!review ? <Button label="Kiểm tra thông tin" disabled={!ready || busy || photoCount !== types.length}
        onPress={() => setReview(true)} /> : <>
      <Button variant="ghost" label="Xem hoặc thay ảnh" disabled={busy} onPress={() => setReview(false)} />
      <GroupedList title={identity ? "Thông tin căn cước" : "Thông tin giấy phép"}>
        <View style={styles.fields}>
          <TextInput label={identity ? "Số căn cước" : "Số giấy phép lái xe"} mode="flat" underlineColor={colors.transparent}
            keyboardType={identity ? "number-pad" : "default"} editable={!busy}
            style={[styles.input, { backgroundColor: colors.surfaceContainerHigh }]}
            value={identity ? h.number : undefined} draftValue={identity ? undefined : h.number} maxLength={identity ? 16 : 50}
            onChangeText={(number) => h.update({ number: identity ? number.replace(/\D/g, "").slice(0, 12) : number })}
            error={attempted && Boolean(numberError)} />
          {attempted && numberError ? <HelperText type="error">{numberError}</HelperText> : null}
          {!identity ? (
            <>
              <TextInput label="Hạng bằng" placeholder="Ví dụ B2, A1" mode="flat" underlineColor={colors.transparent}
                style={[styles.input, { backgroundColor: colors.surfaceContainerHigh }]}
                draftValue={h.licenseClass} autoCapitalize="characters" maxLength={10} editable={!busy}
                onChangeText={(licenseClass) => h.update({ licenseClass })} error={attempted && licenseError} />
              {attempted && licenseError ? <HelperText type="error">Nhập hạng bằng ghi trên giấy phép.</HelperText> : null}
              <TextInput label="Số năm kinh nghiệm" mode="flat" underlineColor={colors.transparent}
                style={[styles.input, { backgroundColor: colors.surfaceContainerHigh }]}
                draftValue={h.years} keyboardType="number-pad" editable={!busy}
                onChangeText={(years) => h.update({ years })} error={attempted && yearsError} />
              {attempted && yearsError ? <HelperText type="error">Nhập số năm kinh nghiệm hợp lệ.</HelperText> : null}
              <SettingsListItem title="Ngày hết hạn" description={expiry && Number.isFinite(expiry.getTime())
                ? expiry.toLocaleDateString("vi-VN") : "Để trống nếu không ghi ngày hết hạn"} icon="event"
                disabled={busy} onPress={() => setDatePicker(true)} />
              {h.expiry ? <Button variant="ghost" label="Bỏ ngày hết hạn" disabled={busy} onPress={() => h.update({ expiry: "" })} /> : null}
              {dateError ? <HelperText type="error">{dateError}</HelperText> : null}
            </>
          ) : null}
        </View>
      </GroupedList>
      <Button label={identity ? "Gửi hồ sơ xét duyệt" : "Lưu và tiếp tục"} disabled={!ready || busy}
        loading={h.save.isPending} loadingLabel="Đang gửi hồ sơ…" onPress={submit} />
      </>}
      <Portal>
        <Dialog visible={Boolean(h.source)} onDismiss={() => h.setSource(null)}
          style={{ borderRadius: 28, backgroundColor: colors.surfaceContainerHigh }}>
          <Dialog.Title>Chọn nguồn ảnh</Dialog.Title>
          <Dialog.Content style={styles.fields}>
            <Button label="Chụp ảnh" onPress={() => { if (h.source) void h.pick(h.source, true); }} />
            <Button variant="secondary" label="Chọn từ thư viện" onPress={() => { if (h.source) void h.pick(h.source, false); }} />
            <Button variant="ghost" label="Quay lại" onPress={() => h.setSource(null)} />
          </Dialog.Content>
        </Dialog>
      </Portal>
      {!identity ? (
        <CustomDatePickerModal title="Chọn ngày hết hạn" visible={datePicker} minimumDate={tomorrow}
          value={expiry && Number.isFinite(expiry.getTime()) ? expiry : null} onCancel={() => setDatePicker(false)}
          onConfirm={(date) => {
            h.update({ expiry: [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-") });
            setDatePicker(false);
          }} />
      ) : null}
    </DriverPage>
  );
}

const styles = StyleSheet.create({
  fields: { gap: 12 },
  stepBadge: { ...typography.badge },
  stepLead: { ...typography.cardTitle },
  input: { ...typography.body, borderRadius: 12 },
  subGroupTitle: { ...typography.label, paddingHorizontal: 16, paddingTop: 8 },
  radioLabel: { ...typography.cardTitle },
  docCard: { padding: 14, borderRadius: 20, gap: 12 },
  docHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 },
  docTitle: { ...typography.sectionTitle, flex: 1 },
  pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  pillText: { ...typography.badge },
  instructionText: { ...typography.body },
  errorBanner: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, borderRadius: 14 },
  alertText: { ...typography.label, flex: 1 },
  warningBox: { padding: 14, borderRadius: 14, gap: 6 },
  warningHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  warningTitle: { ...typography.cardTitle },
  warningText: { ...typography.bodySecondary },
});
