import { translate as i18nT } from "@datxe/shared";
import {
  Button,
  Typography as Text,
  borderRadius,
  spacing,
  typography,
  useThemeColors,
  useThemedStyles,
  type ThemeColors,
} from "@datxe/ui";
import { Image } from "expo-image";
import { MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { ProgressBar } from "react-native-paper";

/** Cùng bộ góc ảnh với bên tài, nhưng khách được gửi 0–5 ảnh. */
export const CORRECTION_PHOTO_SLOTS = [
  ["FRONT", "Đầu xe"],
  ["BACK", "Đuôi xe"],
  ["LEFT", "Bên trái"],
  ["RIGHT", "Bên phải"],
  ["DASHBOARD", "Đồng hồ (tùy chọn)"],
] as const;

export type CorrectionPhoto = { angle: string; fileUrl: string; publicId: string };

export function CorrectionPhotoChecklist({
  photos,
  uploadingAngle,
  error,
  saving,
  onCapture,
}: {
  photos: CorrectionPhoto[];
  uploadingAngle: string | null;
  error: { angle: string; message: string } | null;
  saving: boolean;
  onCapture: (angle: string) => void;
}) {
  const colors = useThemeColors();
  const s = useThemedStyles(styles);
  const busyElsewhere = uploadingAngle !== null;
  const done = CORRECTION_PHOTO_SLOTS.filter(([angle]) =>
    photos.some((photo) => photo.angle === angle),
  ).length;
  const total = CORRECTION_PHOTO_SLOTS.length;

  return (
    <View style={s.group}>
      <Text style={s.heading}>
        {i18nT("Ảnh đính kèm · {0}/{1}", { 0: done, 1: total })}
      </Text>
      <ProgressBar
        progress={done / total}
        color={colors.primary}
        style={[s.progress, { backgroundColor: colors.surfaceContainerHigh }]}
        accessibilityLabel={i18nT("Đã đính kèm {0} trên {1} ảnh", { 0: done, 1: total })}
      />
      {CORRECTION_PHOTO_SLOTS.map(([angle, label]) => {
        const photo = photos.find((item) => item.angle === angle);
        const busy = uploadingAngle === angle;
        const problem = error?.angle === angle ? error.message : undefined;
        const action = busy
          ? i18nT("Đang tải…")
          : problem || photo
            ? i18nT("Chụp lại")
            : i18nT("Chụp ảnh");
        return (
          <View key={angle} style={s.row}>
            <View style={s.main}>
              {photo ? (
                <Image
                  source={{ uri: photo.fileUrl }}
                  cachePolicy="memory"
                  contentFit="cover"
                  style={s.thumb}
                  accessibilityLabel={i18nT(label)}
                />
              ) : (
                <View
                  style={[
                    s.thumb,
                    s.placeholder,
                    { backgroundColor: colors.surfaceContainerHigh },
                  ]}
                >
                  <MaterialIcons
                    name="photo-camera"
                    size={24}
                    color={colors.onSurfaceVariant}
                  />
                </View>
              )}
              <View style={s.detail}>
                <Text style={s.label}>{i18nT(label)}</Text>
                <Text
                  accessibilityRole={problem ? "alert" : undefined}
                  style={[
                    s.status,
                    busy ? { color: colors.primary } : undefined,
                    photo && !problem ? { color: colors.successStrong } : undefined,
                    problem ? { color: colors.error } : undefined,
                  ]}
                >
                  {busy
                    ? i18nT("Đang tải ảnh…")
                    : problem
                      ? problem
                      : photo
                        ? i18nT("Đã có ảnh")
                        : i18nT("Chưa có ảnh")}
                </Text>
              </View>
            </View>
            <Button
              variant="secondary"
              style={s.action}
              label={action}
              accessibilityLabel={`${action} · ${i18nT(label)}`}
              disabled={busyElsewhere || saving}
              loading={busy}
              loadingLabel={i18nT("Đang tải…")}
              onPress={() => onCapture(angle)}
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    group: { gap: spacing.spaceSm },
    heading: { ...typography.label, color: colors.onSurface },
    progress: { borderRadius: borderRadius.full },
    row: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: spacing.spaceSm,
      paddingVertical: spacing.spaceXs,
    },
    main: {
      flex: 1,
      minWidth: 150,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.spaceSm,
    },
    thumb: { width: 56, height: 56, borderRadius: borderRadius.default },
    placeholder: { alignItems: "center", justifyContent: "center" },
    detail: { flex: 1, gap: spacing.xxs },
    label: { ...typography.body, color: colors.onSurface, flexShrink: 1 },
    status: { ...typography.bodySecondary, color: colors.onSurfaceVariant, flexShrink: 1 },
    action: { width: "auto", minWidth: 104 },
  });
