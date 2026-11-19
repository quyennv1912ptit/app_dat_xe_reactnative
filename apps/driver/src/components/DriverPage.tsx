import { driverApi } from "@/lib/driverApi";
import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, Appbar } from "react-native-paper";
import {
  Button,
  Card,
  TonalNavigationBar,
  ScreenWrapper,
  Typography,
  spacing,
  typography,
  useThemeColors,
  useThemedStyles,
  type ThemeColors,
} from "@datxe/ui";
import { useFocusEffect, usePathname, useRouter, type Href } from "expo-router";
import { useCallback, useEffect, useRef, useState, type ComponentRef, type ReactNode } from "react";
import { KeyboardAvoidingView, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { rideStyles } from "./rideStyles";
import { useSessionStore } from "@/lib/store";
import { DriverChatButton } from "./DriverChatButton";

const tabsList = [
  { route: "home", label: "Trang chủ", icon: "home" },
  { route: "history", label: "Lịch sử", icon: "receipt-long" },
  { route: "notifications", label: "Thông báo", icon: "notifications" },
  { route: "profile", label: "Hồ sơ", icon: "person" },
] as const;

type Props = {
  title: string;
  children: ReactNode;
  loading?: boolean;
  error?: string | null;
  retry?: () => unknown;
  tabs?: boolean;
  scroll?: boolean;
  footer?: ReactNode;
  headerContent?: ReactNode;
  headerAction?: ReactNode;
  intro?: ReactNode;
  appearance?: "ride";
  backFallback?: Href;
  form?: boolean;
  /** Resets the ScrollView back to top when a parent flow phase/status changes. */
  scrollResetKey?: string | number | boolean | null;
};
export function DriverPage({
  title,
  children,
  loading,
  error,
  retry,
  tabs = false,
  scroll = true,
  footer,
  headerContent,
  headerAction,
  intro,
  appearance,
  backFallback = "/(tabs)/home",
  scrollResetKey,
}: Props) {
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  useEffect(() => {
    if (scroll && scrollResetKey !== undefined && scrollResetKey !== null) {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  }, [scroll, scrollResetKey]);
  const styles = useThemedStyles(createStyles);
  const shared = useThemedStyles(rideStyles);
  const colors = useThemeColors();
  const rideBackground = appearance === "ride" ? styles.rideBackground : undefined;
  const router = useRouter();
  const pathname = usePathname();
  const [tabBarRevision, setTabBarRevision] = useState(0);
  useFocusEffect(
    useCallback(() => {
      if (tabs) setTabBarRevision((revision) => revision + 1);
    }, [tabs]),
  );
  const activeRide = useSessionStore((state) => state.activeRide);
  const userId = useSessionStore((state) => state.user?.id);
  const { width } = useWindowDimensions();
  const tablet = width >= 768;
  const tabletColumn = tablet ? styles.tabletColumn : undefined;
  const { data: unread } = useQuery({
    queryKey: ["driver", "notifications", "count"],
    queryFn: driverApi.notificationCount,
    enabled: tabs && Boolean(userId),
    select: (result) => result?.unread_count ?? 0,
  });
  return (
    <ScreenWrapper style={rideBackground}>
      <View style={[styles.header, rideBackground]}>
        {!tabs ? (
          <Appbar.BackAction
            style={styles.action}
            accessibilityLabel="Quay lại"
            onPress={() =>
              router.canGoBack()
                ? router.back()
                : router.replace(backFallback)
            }
          />
        ) : null}
        <View style={styles.titleWrap}>
          <Typography accessibilityRole="header" textBreakStrategy="simple" style={styles.title}>
            {title}
          </Typography>
        </View>
        {headerAction ? (
          <View style={styles.headerAction}>{headerAction}</View>
        ) : tabs && activeRide ? (
          <DriverChatButton ride={activeRide} compact />
        ) : null}
      </View>
      {headerContent}
      <KeyboardAvoidingView behavior="padding" style={styles.scroll}>
      {scroll ? (
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={[shared.page, tablet && styles.tabletPage, tabletColumn]}
          keyboardShouldPersistTaps="handled"
        >
          {intro}
          {loading ? <ActivityIndicator color={colors.primary} /> : null}
          {error ? (
            <Card style={styles.errorCard}>
              <Typography accessibilityRole="alert" style={shared.error}>
                {error}
              </Typography>
              {retry ? (
                <Button label="Thử lại" onPress={() => void retry()} />
              ) : null}
            </Card>
          ) : null}
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.scroll, styles.listHost, tabletColumn]}>
          {intro || loading || error ? (
            <View style={[styles.listTopBanner, tablet && styles.tabletListBanner]}>
              {intro}
              {loading ? <ActivityIndicator color={colors.primary} /> : null}
              {error ? (
                <Card style={styles.errorCard}>
                  <Typography accessibilityRole="alert" style={shared.error}>
                    {error}
                  </Typography>
                  {retry ? (
                    <Button label="Thử lại" onPress={() => void retry()} />
                  ) : null}
                </Card>
              ) : null}
            </View>
          ) : null}
          {children}
        </View>
      )}
      {footer ? (
        <View style={[styles.footer, appearance === "ride" && styles.rideFooter]}>
          <View style={[styles.footerInner, tabletColumn]}>{footer}</View>
        </View>
      ) : null}
      </KeyboardAvoidingView>
      {tabs ? (
        <TonalNavigationBar
          key={tabBarRevision}
          items={tabsList.map((tab) => ({ ...tab, id: tab.route, badge: tab.route === "notifications" ? unread : undefined }))}
          active={
            tabsList.find((tab) => pathname.endsWith("/" + tab.route))?.route ??
            "home"
          }
          onSelect={(id) => router.navigate(("/(tabs)/" + id) as never)}
        />
      ) : null}
    </ScreenWrapper>
  );
}
const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    scroll: { flex: 1 },
    listHost: { flex: 1, width: "100%" },
    listTopBanner: { paddingHorizontal: spacing.spaceMd, paddingTop: spacing.spaceMd, gap: spacing.spaceMd },
    tabletColumn: { width: "100%", maxWidth: spacing.formMaxWidth + spacing.marginTablet * 2, alignSelf: "center" },
    tabletPage: { paddingHorizontal: spacing.marginTablet },
    tabletListBanner: { paddingHorizontal: spacing.marginTablet },
    headerAction: { flexShrink: 0 },
    action: { width: 48, height: 48, borderRadius: 24 },
    footer: { padding: 16, backgroundColor: colors.cardSurface },
    footerInner: { gap: 8 },
    rideBackground: { backgroundColor: colors.rideBackground },
    rideFooter: { backgroundColor: colors.rideSurface },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing.spaceMd,
      minHeight: spacing.headerHeight,
      height: "auto",
      paddingVertical: 8,
      gap: spacing.spaceSm,
      backgroundColor: colors.background,
    },
    titleWrap: { flex: 1, minWidth: 0, justifyContent: "center" },
    title: { ...typography.screenTitle, color: colors.onSurface },
    errorCard: { gap: spacing.spaceMd, backgroundColor: colors.errorContainer },
  });
