import { DriverPage } from "@/components/DriverPage";
import { uploadDriverImage } from "@/lib/uploadImage";
import { Button, Card, Typography as Text, localizedAlert, spacing, typography, useThemeColors, useThemedStyles, type ThemeColors } from "@datxe/ui";
import type { DriverProfile } from "@datxe/shared";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Image } from "expo-image";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Linking, StyleSheet, View } from "react-native";
import { updateDriverAvatar } from "../api";

type Portrait = { uri: string; mimeType: string; fileName: string };

export default function AvatarCaptureScreen() {
  const colors = useThemeColors();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const client = useQueryClient();
  const camera = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [portrait, setPortrait] = useState<Portrait | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const takePhoto = useCallback(async () => {
    if (!camera.current || !ready || busy) return;
    setBusy(true);
    setError("");
    try {
      const picture = await camera.current.takePictureAsync({
        quality: 0.9,
        exif: false,
        skipProcessing: false,
        shutterSound: true,
      });
      setPortrait({
        uri: picture.uri,
        mimeType: "image/jpeg",
        fileName: `driver-avatar-${Date.now()}.jpg`,
      });
    } catch {
      setError("Không chụp được ảnh. Hãy thử lại.");
    } finally {
      setBusy(false);
    }
  }, [busy, ready]);

  const savePortrait = useCallback(async () => {
    if (!portrait || busy) return;
    setBusy(true);
    setError("");
    try {
      const uploaded = await uploadDriverImage({
        uri: portrait.uri,
        fileName: portrait.fileName,
        mimeType: portrait.mimeType,
      }, "DEFAULT");
      const profile = await updateDriverAvatar({
        secure_url: uploaded.secureUrl,
        public_id: uploaded.publicId,
      });
      if (!profile) throw new Error("Không nhận được hồ sơ sau khi lưu ảnh.");
      // Hủy refetch đang chạy để nó không ghi đè ảnh vừa lưu, rồi cập nhật cache ngay.
      await client.cancelQueries({ queryKey: ["driver", "profile"] });
      client.setQueryData<DriverProfile>(["driver", "profile"], profile);
      void client.invalidateQueries({ queryKey: ["driver", "dailySummary"] });
      localizedAlert("Đã cập nhật ảnh", "Ảnh đại diện mới của bạn đã được lưu.");
      router.back();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không lưu được ảnh. Hãy thử lại.");
    } finally {
      setBusy(false);
    }
  }, [busy, client, portrait, router]);

  const retake = useCallback(() => {
    setPortrait(null);
    setReady(false);
    setError("");
  }, []);

  const permissionBlocked = Boolean(permission && !permission.granted && !permission.canAskAgain);
  const permissionMissing = Boolean(permission && !permission.granted && permission.canAskAgain);

  return (
    <DriverPage
      title="Chụp ảnh chân dung"
      backFallback="/(tabs)/profile"
      footer={
        <View style={styles.actions}>
          {portrait ? (
            <>
              <Button label="Dùng ảnh này" icon="check" loading={busy} disabled={busy}
                accessibilityLabel="Dùng ảnh chân dung vừa chụp làm ảnh đại diện" onPress={() => void savePortrait()} />
              <Button label="Chụp lại" variant="secondary" icon="replay" disabled={busy}
                accessibilityLabel="Chụp lại ảnh chân dung" onPress={retake} />
            </>
          ) : (
            <Button label="Chụp ảnh" icon="photo-camera" loading={busy}
              disabled={busy || permissionMissing || permissionBlocked || !ready}
              accessibilityLabel="Chụp ảnh chân dung bằng camera trước" onPress={() => void takePhoto()} />
          )}
        </View>
      }
    >
      <Card style={styles.card}>
        <Text style={[typography.body, { color: colors.onSurface }]}>
          Nhìn thẳng vào camera, giữ khuôn mặt ở giữa khung và đảm bảo đủ sáng. Ảnh vừa chụp sẽ trở thành ảnh đại diện của bạn.
        </Text>
        <View style={styles.frame}>
          {portrait ? (
            <Image
              accessibilityLabel="Ảnh chân dung vừa chụp"
              source={{ uri: portrait.uri }}
              contentFit="cover"
              cachePolicy="memory"
              style={StyleSheet.absoluteFill}
            />
          ) : permissionMissing || permissionBlocked || !permission ? (
            <View style={styles.placeholder}>
              <ActivityIndicator color={colors.primary} />
              <Text style={[typography.bodySecondary, { color: colors.onSurfaceVariant }]}>
                {permissionBlocked
                  ? "Quyền camera đã bị từ chối. Hãy bật lại trong Cài đặt để chụp ảnh chân dung."
                  : permissionMissing
                    ? "Cần quyền camera để chụp ảnh chân dung."
                    : "Đang chuẩn bị camera…"}
              </Text>
              {permissionBlocked ? (
                <Button label="Mở Cài đặt" variant="secondary" icon="settings"
                  accessibilityLabel="Mở cài đặt để cấp quyền camera"
                  onPress={() => void Linking.openSettings().catch(() => setError("Không mở được Cài đặt."))} />
              ) : permissionMissing ? (
                <Button label="Cấp quyền camera" variant="secondary" icon="camera"
                  accessibilityLabel="Cấp quyền chụp ảnh chân dung"
                  onPress={() => void requestPermission()} />
              ) : null}
            </View>
          ) : (
            <>
              <CameraView
                ref={camera}
                style={StyleSheet.absoluteFill}
                facing="front"
                ratio="4:3"
                mirror
                onCameraReady={() => setReady(true)}
                onMountError={() => setError("Không khởi động được camera. Hãy thử lại.")}
              />
              {!ready ? (
                <View style={styles.placeholder} accessible={false} importantForAccessibility="no-hide-descendants">
                  <ActivityIndicator color={colors.primary} />
                </View>
              ) : null}
            </>
          )}
        </View>
        {error ? (
          <Text accessibilityRole="alert" style={[typography.bodySecondary, { color: colors.error }]}>{error}</Text>
        ) : null}
      </Card>
    </DriverPage>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  card: { gap: spacing.spaceMd, padding: spacing.px3 },
  frame: {
    width: "100%",
    aspectRatio: 3 / 4,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: spacing.spaceMd,
    overflow: "hidden",
  },
  placeholder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.spaceSm,
    padding: spacing.spaceMd,
  },
  actions: { gap: spacing.spaceSm },
});
