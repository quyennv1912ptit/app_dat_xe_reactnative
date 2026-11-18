import { DriverPage } from "@/components/DriverPage";
import { Button, Card, Typography as Text, spacing, typography, useThemeColors } from "@datxe/ui";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Linking, StyleSheet } from "react-native";

const emergencyNumber = "112";

export default function DriverSafetyScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const [error, setError] = useState("");
  const openPhone = async () => {
    setError("");
    try {
      await Linking.openURL(`tel:${emergencyNumber}`);
    } catch {
      setError(`Chưa mở được ứng dụng điện thoại. Hãy quay số ${emergencyNumber} trên điện thoại tại Việt Nam.`);
    }
  };
  return (
    <DriverPage title="An toàn chuyến đi">
      <Card style={styles.card}>
        <Text accessibilityRole="header" style={styles.title}>Hỗ trợ khẩn cấp tại Việt Nam</Text>
        <Text style={[typography.bodySecondary, { color: colors.onSurfaceVariant }]}>
          Nếu đang gặp tình huống nguy cấp, hãy gọi tổng đài khẩn cấp quốc gia và cung cấp vị trí hiện tại của bạn.
        </Text>
        <Button
          label={`Gọi khẩn cấp · ${emergencyNumber}`}
          icon="call"
          iconPosition="leading"
          dimWhenDisabled={false}
          style={{ backgroundColor: colors.error }}
          contentColor={colors.onError}
          onPress={() => void openPhone()}
        />
        <Button
          variant="secondary"
          label="Mở Trung tâm hỗ trợ"
          icon="support-agent"
          iconPosition="leading"
          onPress={() => router.push("/support")}
        />
        {error ? <Text accessibilityRole="alert" style={{ color: colors.error }}>{error}</Text> : null}
      </Card>
    </DriverPage>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.spaceLg, gap: spacing.px3 },
  title: { ...typography.sectionTitle },
});
