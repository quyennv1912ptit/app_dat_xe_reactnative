import { CustomerTabBar } from "@/components/CustomerTabBar";
import { CustomerNotice } from "@/components/CustomerRideUI";
import { HeaderIconButton } from "@/components/ScreenHeader";
import { HomeMap } from "@/components/map/HomeMap";
import { useWalletOverview } from "@/lib/useWallet";
import { MapSheetLayout } from "@datxe/ui/goong-map";
import { walletBalance, translate as t } from "@datxe/shared";
import {
  MotionPressable as Pressable,
  ScreenWrapper,
  Typography as Text,
  useLanguage,
  useThemeColors,
  useThemedStyles,
} from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { View } from "react-native";
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
        ) : (
          <HomeBookingCard
            pickupAddress={h.currentLocation}
            pickupLoading={h.locationLoading}
            onPickup={() => h.openBooking()}
            onSearch={() => h.openBooking(undefined, "destination")}
            onSchedule={() => h.openBooking(undefined, "schedule")}
          />
        )}

        {!h.activeRide && h.recentDestinations.length ? (
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
