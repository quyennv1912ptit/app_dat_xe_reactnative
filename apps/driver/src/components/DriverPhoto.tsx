import { ImageViewer, MotionPressable, Typography, typography, useThemeColors } from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export function DriverPhoto({
  uri, label, tile = false, portrait = false, sensitive = false, showCaption = true,
}: { uri: string; label: string; tile?: boolean; portrait?: boolean; sensitive?: boolean; showCaption?: boolean }) {
  const [open, setOpen] = useState(false);
  const colors = useThemeColors();
  const close = () => setOpen(false);
  const cachePolicy = sensitive ? "memory" : "memory-disk";
  const frameStyle = tile
    ? [styles.tile, { backgroundColor: colors.rideInset }]
    : portrait
      ? [styles.thumbnailFramePortrait, { backgroundColor: colors.rideInset }]
      : [styles.thumbnailFrame, { backgroundColor: colors.rideInset }];
  return (
    <>
      <MotionPressable accessibilityRole="button" accessibilityLabel={`Xem ảnh · ${label}`} onPress={() => setOpen(true)}
        style={frameStyle}>
        <Image accessibilityLabel={label} contentFit="contain" cachePolicy={cachePolicy} recyclingKey={uri}
          source={{ uri }} style={tile ? styles.tileImage : styles.thumbnailImage} />
        {tile && showCaption ? (
          <LinearGradient colors={[colors.transparent, colors.photoCaptionScrim]} style={styles.caption}>
            <Typography style={[styles.captionText, { color: colors.onScrim }]}>{label}</Typography>
          </LinearGradient>
        ) : !tile ? (
          <View style={[styles.zoomHint, { backgroundColor: colors.photoCaptionScrim }]} pointerEvents="none">
            <MaterialIcons name="zoom-in" size={16} color={colors.onScrim} importantForAccessibility="no" />
            <Typography style={[styles.zoomHintText, { color: colors.onScrim }]}>Chạm để phóng to</Typography>
          </View>
        ) : null}
      </MotionPressable>
      {open ? (
        <ImageViewer uri={uri} title={label} cachePolicy={cachePolicy} onClose={close} />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  thumbnailFrame: {
    width: "100%",
    height: 240,
    borderRadius: 16,
    overflow: "hidden",
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  thumbnailFramePortrait: {
    alignSelf: "center",
    width: 210,
    maxWidth: "100%",
    aspectRatio: 3 / 4,
    borderRadius: 16,
    overflow: "hidden",
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  thumbnailImage: { width: "100%", height: "100%" },
  zoomHint: {
    position: "absolute",
    right: 10,
    bottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  zoomHintText: { ...typography.badge },
  tile: { aspectRatio: 4 / 3, borderRadius: 12, overflow: "hidden" },
  tileImage: { width: "100%", height: "100%" },
  caption: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 8, paddingTop: 24 },
  captionText: { ...typography.label },
});
