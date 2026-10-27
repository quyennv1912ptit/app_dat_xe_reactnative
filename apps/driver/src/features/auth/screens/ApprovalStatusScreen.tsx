import { Button,Card,colors,fontSize } from '@datxe/ui';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import {
Image,
Pressable,
ScrollView,
Text,
View
} from 'react-native';
import { APPROVAL_TABS,ApprovedPanel,DRIVER_PORTRAIT,PendingPanel,RejectedPanel,SafetyStandardsCard,styles } from '../components/ApprovalStatusScreenParts';
import { useApprovalStatus } from '../hooks/useApprovalStatus';
export default function ApprovalStatusScreen() {
const { router, insets, activeState, setActiveState, callSupport, openLicenseUpload, openDriverApp } = useApprovalStatus();
return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerRow}>
          <Pressable
            accessibilityLabel="Quay lại"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <MaterialIcons
              color={colors.onPrimary}
              name="arrow-back"
              size={fontSize.icon2xl}
            />
          </Pressable>
          <Text numberOfLines={1} style={styles.headerTitle}>
            Cài Đặt Tài Xế
          </Text>
          <View style={styles.profileIcon}>
            <MaterialIcons
              color={colors.onPrimary}
              name="person-outline"
              size={fontSize.iconMd}
            />
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.driverCard} variant="surface">
          <View style={styles.driverIdentity}>
            <Image
              accessibilityLabel="Ảnh đại diện tài xế Nguyễn Văn Tuấn"
              resizeMode="cover"
              source={{ uri: DRIVER_PORTRAIT }}
              style={styles.driverPortrait}
            />
            <View style={styles.driverCopy}>
              <View style={styles.driverNameRow}>
                <Text numberOfLines={1} style={styles.driverName}>
                  Nguyễn Văn Tuấn
                </Text>
                <MaterialIcons
                  color={colors.primary}
                  name="verified"
                  size={fontSize.iconMd}
                />
              </View>
              <Text numberOfLines={1} style={styles.driverMeta}>
                Mã đối tác: #DRV-84920 • Hạng B2
              </Text>
            </View>
          </View>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live Sync</Text>
          </View>
        </Card>

        <View accessibilityRole="tablist" style={styles.tabs}>
          {APPROVAL_TABS.map((tab) => {
            const selected = activeState === tab.value;

            return (
              <Pressable
                key={tab.value}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                onPress={() => setActiveState(tab.value)}
                style={[styles.tab, selected && styles.tabSelected]}
              >
                <MaterialIcons
                  color={selected ? colors.primary : colors.onSurfaceVariant}
                  name={tab.icon}
                  size={fontSize.iconMd}
                />
                <Text style={[styles.tabText, selected && styles.tabTextSelected]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {activeState === 'pending' ? (
          <PendingPanel />
        ) : activeState === 'rejected' ? (
          <RejectedPanel onResubmit={openLicenseUpload} />
        ) : (
          <ApprovedPanel onContinue={openDriverApp} />
        )}

        <SafetyStandardsCard />

        <Card style={styles.supportCard} variant="surface">
          <View style={styles.supportIdentity}>
            <View style={styles.supportIcon}>
              <MaterialIcons
                color={colors.primary}
                name="support-agent"
                size={fontSize.iconXl}
              />
            </View>
            <View style={styles.supportCopy}>
              <Text style={styles.supportLabel}>
                Tổng đài hỗ trợ đối tác 24/7
              </Text>
              <Pressable
                accessibilityLabel="Gọi tổng đài 1900 6868"
                accessibilityRole="link"
                onPress={() => void callSupport()}
              >
                <Text style={styles.supportPhone}>1900 6868</Text>
              </Pressable>
            </View>
          </View>
          <Button
            icon="call"
            iconPosition="leading"
            iconSize={fontSize.iconSm}
            label="Gọi ngay"
            numberOfLines={1}
            onPress={() => void callSupport()}
            style={styles.callButton}
            textStyle={styles.callButtonText}
          />
        </Card>
      </ScrollView>
      <View style={{ height: insets.bottom, backgroundColor: colors.background }} />
    </View>
  );
}
