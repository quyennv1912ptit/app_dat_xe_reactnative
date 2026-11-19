import { translate as t } from "@datxe/shared";
import { Button, Card, MoneyText as SharedMoneyText, typography, Typography as Text, useThemeColors, useLanguage } from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type TextStyle } from "react-native";

export const customerType = StyleSheet.create({
  heading: { ...typography.sectionTitle },
  address: { ...typography.body },
  meta: { ...typography.bodySecondary },
  amount: { ...typography.moneyDisplay },
  metric: { ...typography.sectionTitle, fontVariant: ["tabular-nums"] },
  numbers: { fontVariant: ["tabular-nums"] },
  target: { minWidth: 48, minHeight: 48, justifyContent: "center" },
});

export function MoneyText({ value, signed, style }: { value: number; signed?: boolean; style?: StyleProp<TextStyle> }) {
  useLanguage();
  return <SharedMoneyText value={value} signed={signed} variant="display" style={[customerType.amount, style]} />;
}

export function RideEndpoints({ pickup, dropoff }: { pickup?: string | null; dropoff?: string | null }) {
  useLanguage();
  const c = useThemeColors();
  return (
    <View style={styles.route}>
      {([
        { label: "Điểm đón", address: pickup, icon: "radio-button-checked" },
        { label: "Điểm đến", address: dropoff, icon: "place" },
      ] as const).map(({ label, address, icon }, index) => (
        <View key={label} style={styles.stop}>
          {index === 0 ? (
            <View style={styles.rail} importantForAccessibility="no">
              {[0, 1, 2, 3].map((dash) => <View key={dash} style={[styles.dash, { backgroundColor: c.outline }]} />)}
            </View>
          ) : null}
          <MaterialIcons name={icon} color={c.onSurfaceVariant} size={20} importantForAccessibility="no" />
          <View style={styles.copy}>
            <Text style={[customerType.meta, { color: c.onSurfaceVariant }]}>{t(label)}</Text>
            <Text style={customerType.address}>{address || t("Chưa có địa chỉ")}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export function CustomerNotice({ children, tone = "error", onRetry }: {
  children: ReactNode;
  tone?: "error" | "warning";
  onRetry?: () => void;
}) {
  const c = useThemeColors();
  const warning = tone === "warning";
  return (
    <Card style={[styles.notice, { backgroundColor: warning ? c.warningContainer : c.errorContainer }]}>
      <View style={styles.stop}>
        <MaterialIcons name={warning ? "warning-amber" : "error-outline"} size={22}
          color={warning ? c.onWarningContainer : c.onErrorContainer} importantForAccessibility="no" />
        <Text accessibilityRole="alert" style={[customerType.address, styles.copy, { color: warning ? c.onWarningContainer : c.onErrorContainer }]}>
          {children}
        </Text>
      </View>
      {onRetry ? <Button variant="secondary" label="Thử lại" onPress={onRetry} /> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  route: { gap: 16 },
  stop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  rail: { position: "absolute", left: 9, top: 24, bottom: -12, justifyContent: "space-evenly" },
  dash: { width: 2, height: 2 },
  copy: { flex: 1, minWidth: 0 },
  notice: { gap: 12 },
});
