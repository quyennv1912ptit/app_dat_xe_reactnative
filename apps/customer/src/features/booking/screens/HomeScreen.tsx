import { CustomerTabBar } from "@/components/CustomerTabBar";
import { CustomerNotice } from "@/components/CustomerRideUI";
import { HeaderIconButton } from "@/components/ScreenHeader";
import { HomeMap } from "@/components/map/HomeMap";
import { useWalletOverview } from "@/lib/useWallet";
import { MapSheetLayout } from "@datxe/ui/goong-map";
import { walletBalance, translate as t } from "@datxe/shared";
import {
  borderRadius,
  Button,
  Card,
  MotionPressable as Pressable,
  ScreenWrapper,
  spacing,
  type ThemeColors,
  Typography as Text,
  typography,
  useLanguage,
  useThemeColors,
  useThemedStyles,
} from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import { HomeBookingCard } from "../components/HomeBookingCard";
import { HomeGreeting } from "../components/HomeGreeting";
import { HomeWalletCard } from "../components/HomeWalletCard";
import { getGreeting, getRideStatusLabel } from "../components/HomeScreenParts";
import { homeStyles } from "../components/homeStyles";
import { useHome } from "../hooks/useHome";

export default function HomeScreen() {
  useLanguage();
  const colors = useThemeColors();
  const s = useThemedStyles(homeStyles);
  const suspendedStyles = useThemedStyles(createSuspendedStyles);
  const [recenterToken, setRecenterToken] = useState(0);
  const h = useHome();
  const wallet = useWalletOverview();
  const balance = walletBalance(wallet.data, 'CUSTOMER');
  const recenter = async () => {
    await h.refreshLocation(true);
    setRecenterToken(value => value + 1);
  };

  return (
    <ScreenWrapper edges={["bottom"]}>
      <MapSheetLayout
        insetBottom={false}
        initialSnap={0}
        snapPoints={["64%", "88%"]}
        footer={null}
        topActions={
          <>
            <HeaderIconButton icon="gps-fixed" accessibilityLabel="Về vị trí hiện tại"
              onPress={() => void recenter()} />
            <HeaderIconButton icon="shield" accessibilityLabel="An toàn chuyến đi"
              onPress={() => h.router.push({ pathname: "/support", params: { topic: "safety" } })} />
          </>
        }
        renderMap={viewport => (
          <HomeMap coordinate={h.currentCoordinates} drivers={h.nearbyDrivers}
            viewport={viewport} recenterToken={recenterToken} />
        )}
      >
        <HomeGreeting
          greeting={t(getGreeting(h.currentHour))}
          name={h.greetingName}
        />
        <HomeWalletCard
          balance={balance}
          walletLoading={wallet.isLoading || wallet.isFetching}
          walletError={wallet.isError}
          onWallet={() => h.router.push('/wallet')}
          onTopUp={() => h.router.push('/wallet/top-up')}
        />

        {h.activeRide ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${t('Chuyến đang diễn ra')}: ${t(getRideStatusLabel(h.activeRide.status))}`}
            onPress={() => h.openBooking()}
            style={s.activeRideCard}
          >
            <View style={s.activeRideCopy}>
              <Text style={s.activeRideLabel}>{t('Chuyến đang diễn ra')}</Text>
              <Text style={s.activeRideStatus}>
                {t(getRideStatusLabel(h.activeRide.status))}
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={colors.onPrimaryContainer} />
          </Pressable>
        ) : h.isSuspended ? (
          <Card style={suspendedStyles.card}>
            <View style={suspendedStyles.header}>
              <View style={suspendedStyles.iconWrap} accessible={false}>
                <MaterialIcons name="pause-circle-outline" size={22} color={colors.onErrorContainer} />
              </View>
              <Text accessibilityRole="alert" style={suspendedStyles.title}>
                {t("Tài khoản đang tạm ngưng đặt chuyến")}
              </Text>
            </View>
            <Text style={suspendedStyles.body}>
              {t(
                "Tính năng đặt xe và đặt lịch mới đang bị tạm khóa. Bạn vẫn có thể xem lịch sử chuyến đi, kiểm tra ví, thanh toán cước nợ và gửi yêu cầu hỗ trợ CSKH.",
              )}
            </Text>
            <View style={suspendedStyles.actions}>
              <Button
                icon="support-agent"
                label={t("Liên hệ CSKH")}
                onPress={() => h.router.push("/support")}
                style={suspendedStyles.actionButton}
              />
              <Button
                variant="secondary"
                icon="account-balance-wallet"
                label={t("Mở ví")}
                onPress={() => h.router.push("/wallet")}
                style={suspendedStyles.actionButton}
              />
            </View>
          </Card>
        ) : (
          <HomeBookingCard
            pickupAddress={h.currentLocation}
            pickupLoading={h.locationLoading}
            onPickup={() => h.openBooking()}
            onSearch={() => h.openBooking(undefined, "destination")}
            onSchedule={() => h.openBooking(undefined, "schedule")}
          />
        )}

        {!h.activeRide && !h.isSuspended && h.recentDestinations.length ? (
          <View style={s.recentSection}>
            <Text style={s.recentHeading}>{t("Điểm đến gần đây")}</Text>
            <View style={s.recentCard}>
              {h.recentDestinations.map((item) => (
                <Pressable
                  key={item.address}
                  accessibilityRole="button"
                  accessibilityLabel={`${t("Đặt chuyến đến")} ${item.address}`}
                  onPress={() => h.openRecentDestination(item)}
                  style={({ pressed }) => [s.recentRow, pressed && { opacity: 0.65 }]}
                >
                  <View style={s.recentIcon}>
                    <MaterialIcons name={item.coordinate ? "place" : "history"} size={20} color={colors.primary} />
                  </View>
                  <View style={s.recentCopy}>
                    <Text style={s.recentTitle}>{item.title}</Text>
                    <Text style={s.recentAddress}>{item.address}</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={colors.onSurfaceVariant} />
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {!h.activeRide && h.nearbyDrivers.length ? (
          <View style={s.nearbyRow}>
            <MaterialIcons name="near-me" size={16} color={colors.successStrong} />
            <Text style={s.nearbyText}>
              {t("{0} tài xế gần bạn", { "0": h.nearbyDrivers.length })}
            </Text>
          </View>
        ) : null}

        {h.loadError ? (
          <CustomerNotice onRetry={() => void h.retryData()}>{t(h.loadError)}</CustomerNotice>
        ) : h.loading && !h.profile ? (
          <View style={s.loading}><ActivityIndicator color={colors.primary} /></View>
        ) : null}
      </MapSheetLayout>
      <CustomerTabBar active="home" unreadCount={h.unreadCount} />
    </ScreenWrapper>
  );
}

const createSuspendedStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      padding: spacing.spaceMd,
      gap: spacing.spaceSm,
      backgroundColor: colors.surfaceContainerLow,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.spaceSm,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: borderRadius.full,
      backgroundColor: colors.errorContainer,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      ...typography.cardTitle,
      color: colors.onSurface,
      flex: 1,
    },
    body: {
      ...typography.bodySecondary,
      color: colors.onSurfaceVariant,
    },
    actions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.spaceSm,
    },
    actionButton: {
      flexGrow: 1,
    },
  });
