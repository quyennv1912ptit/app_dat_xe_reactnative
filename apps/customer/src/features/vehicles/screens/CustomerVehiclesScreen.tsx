import { CustomerNotice } from "@/components/CustomerRideUI";
import { ActivityIndicator } from "react-native-paper";
import { HeaderIconButton, ScreenHeader } from "@/components/ScreenHeader";
import { translate as i18nT } from "@datxe/shared";
import {
  Button,
  GroupedList,
  MotionPressable as Pressable,
  ScreenWrapper as SafeAreaView,
  Typography as Text,
  useLanguage,
  useThemeColors,
  useThemedStyles,
} from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useState } from "react";
import { ScrollView, View } from "react-native";

import { styles as base_styles } from "../components/CustomerVehiclesScreenParts";
import { useCustomerVehicles } from "../hooks/useCustomerVehicles";
export default function CustomerVehiclesScreen() {
  useLanguage();

  const colors = useThemeColors();

  const styles = useThemedStyles(base_styles);
  const [failedImageIds, setFailedImageIds] = useState<Record<number, boolean>>({});

  const { router, vehicles, loading, error, deletingId, remove, refresh, defaultId, setDefault } =
    useCustomerVehicles();
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScreenHeader
        title={i18nT("Phương tiện của tôi")}
        onBack={() => router.back()}
        rightContent={
          vehicles.length > 0 ? (
            <HeaderIconButton
              icon="add"
              accessibilityLabel={i18nT("Thêm xe")}
              onPress={() => router.push("/add-vehicle")}
              tone="primary"
            />
          ) : undefined
        }
      />
      <ScrollView contentContainerStyle={styles.content}>
        {loading ? <ActivityIndicator color={colors.primary} /> : null}
        {error ? <CustomerNotice onRetry={() => void refresh()}>{i18nT(error)}</CustomerNotice> : null}
        {!loading && !error && vehicles.length === 0 ? (
          <View style={styles.empty}>
            <MaterialIcons
              name="verified-user"
              size={38}
              color={colors.primary}
            />
            <Text style={styles.heading}>{i18nT("Chưa có phương tiện")}</Text>
            <Text style={styles.meta}>
              {i18nT("Thêm xe để chọn khi tạo chuyến đi.")}
            </Text>
            <Button label={i18nT("Thêm xe mới")} onPress={() => router.push("/add-vehicle")} />
          </View>
        ) : null}
        {vehicles.length ? (
          <GroupedList>
            {vehicles.map((vehicle) => (
              <View key={vehicle.id} style={styles.vehicle}>
                {vehicle.images[0]?.secure_url && !failedImageIds[vehicle.id] ? (
                  <Image
                    source={{ uri: vehicle.images[0].secure_url }}
                    cachePolicy="memory"
                    contentFit="cover"
                    onError={() =>
                      setFailedImageIds((prev) =>
                        prev[vehicle.id] ? prev : { ...prev, [vehicle.id]: true },
                      )
                    }
                    style={[styles.image, { backgroundColor: colors.surfaceContainerHigh }]}
                  />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.typePlaceholder}>
                      {i18nT(vehicle.vehicle_type === "MOTORCYCLE" ? "Xe máy" : vehicle.vehicle_type === "CAR" ? "Ô tô" : "Xe")}
                    </Text>
                  </View>
                )}
                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    router.push({
                      pathname: "/add-vehicle",
                      params: { vehicleId: String(vehicle.id) },
                    })
                  }
                  style={styles.details}
                >
                  <Text style={styles.name}>
                    {i18nT(
                      [vehicle.brand, vehicle.model]
                        .filter(Boolean)
                        .join(" ") ||
                        (vehicle.vehicle_type === "MOTORCYCLE" ? "Xe máy" : vehicle.vehicle_type === "CAR" ? "Ô tô" : "Phương tiện"),
                    )}
                  </Text>
                  <Text style={styles.plate}>
                    {vehicle.plate_number || i18nT("Chưa có biển số")}
                  </Text>
                  <Text style={styles.meta}>
                    {i18nT(vehicle.vehicle_type === "MOTORCYCLE" ? "Xe máy" : vehicle.vehicle_type === "CAR" ? "Ô tô" : "—")} ·{" "}
                    {i18nT(vehicle.transmission_type === "AUTO" ? "Số tự động" : vehicle.transmission_type === "MANUAL" ? "Số sàn" : "—")}
                    {vehicle.is_default ? " · " + i18nT("Mặc định") : ""}
                    {i18nT(vehicle.color ? ` · ${vehicle.color}` : "")}
                    {i18nT(
                      vehicle.engine_cc ? ` · ${vehicle.engine_cc} cc` : "",
                    )}
                  </Text>
                </Pressable>
                {!vehicle.is_default ? <Pressable
                  accessibilityRole="button" accessibilityLabel={i18nT("Đặt làm xe mặc định")}
                  disabled={defaultId !== null || deletingId === vehicle.id}
                  onPress={() => void setDefault(vehicle.id)} style={styles.delete}>
                  {defaultId === vehicle.id ? <ActivityIndicator color={colors.primary} />
                    : <MaterialIcons name="star-outline" size={23} color={colors.primary} />}
                </Pressable> : null}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={i18nT("Lưu trữ {0}", {
                    "0": vehicle.plate_number || i18nT("xe"),
                  })}
                  disabled={deletingId === vehicle.id}
                  onPress={() => remove(vehicle)}
                  style={styles.delete}
                >
                  {deletingId === vehicle.id ? (
                    <ActivityIndicator color={colors.error} />
                  ) : (
                    <MaterialIcons
                      name="delete-outline"
                      size={23}
                      color={colors.error}
                    />
                  )}
                </Pressable>
              </View>
            ))}
          </GroupedList>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
