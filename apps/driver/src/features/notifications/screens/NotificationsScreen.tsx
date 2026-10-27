import { colors,fontSize,spacing } from '@datxe/ui';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import {
Pressable,
ScrollView,
Text,
View
} from 'react-native';
import { ApprovalContent,BonusContent,FILTERS,SafetyContent,styles,TABS,WalletContent } from '../components/NotificationsScreenParts';
import { useNotifications } from '../hooks/useNotifications';
export default function DriverNotificationsScreen() {
const { router, insets, filter, setFilter, readIds, filteredItems, unreadCount, markAllRead, markOneRead } = useNotifications();
return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerTitleGroup}>
          <View style={styles.liveDot} />
          <Text style={styles.headerTitle}>Thông Báo</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable accessibilityRole="button" onPress={() => router.push('/(tabs)/profile' as never)} style={styles.headerIcon}>
            <MaterialIcons color={colors.onPrimary} name="support-agent" size={fontSize.icon2xl} />
          </Pressable>
          <View style={styles.headerAvatar}>
            <MaterialIcons color={colors.onPrimary} name="person-outline" size={fontSize.iconMd} />
          </View>
        </View>
      </View>

      <View style={styles.unreadBar}>
        <View style={styles.unreadCountWrap}>
          <Text style={styles.unreadCount}>{unreadCount}</Text>
          <Text style={styles.unreadLabel}>Tin chưa đọc</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={unreadCount === 0}
          onPress={markAllRead}
          style={styles.markReadButton}
        >
          <MaterialIcons color={unreadCount ? colors.primary : colors.success} name="done-all" size={fontSize.iconMd} />
          <Text style={[styles.markReadText, unreadCount === 0 && styles.markReadDone]}>
            {unreadCount === 0 ? 'Hoàn tất' : 'Đánh dấu đã đọc'}
          </Text>
        </Pressable>
      </View>

      <ScrollView horizontal contentContainerStyle={styles.filters} showsHorizontalScrollIndicator={false}>
        {FILTERS.map((item) => (
          <Pressable
            accessibilityRole="button"
            key={item.id}
            onPress={() => setFilter(item.id)}
            style={[styles.filterChip, filter === item.id && styles.filterChipActive]}
          >
            <MaterialIcons
              color={filter === item.id ? colors.onPrimary : colors.onSurfaceVariant}
              name={item.icon}
              size={fontSize.iconSm}
            />
            <Text style={[styles.filterText, filter === item.id && styles.filterTextActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={[styles.feed, { paddingBottom: spacing.spaceXl + insets.bottom + spacing.tabBarHeight }]}
        showsVerticalScrollIndicator={false}
      >
        {filteredItems.map((item) => {
          const isUnread = Boolean(item.unread && !readIds.includes(item.id));
          return (
            <Pressable
              accessibilityRole="button"
              key={item.id}
              onPress={() => markOneRead(item.id)}
              style={styles.notificationCard}
            >
              <View style={[styles.iconCircle, item.category === 'income' && styles.moneyIcon, item.category === 'trip' && styles.safetyIcon, item.category === 'system' && styles.systemIcon]}>
                <MaterialIcons
                  color={item.category === 'income' ? colors.onSuccessContainer : item.category === 'trip' ? '#93000A' : colors.onPrimaryFixed}
                  name={item.icon}
                  size={fontSize.iconXl}
                />
              </View>
              <View style={styles.notificationContent}>
                <View style={styles.notificationHeading}>
                  <Text numberOfLines={1} style={styles.notificationTitle}>{item.title}</Text>
                  <Text style={styles.notificationDate}>{item.date}</Text>
                </View>
                {item.id === 'wallet' ? (
                  <WalletContent />
                ) : item.id === 'bonus' ? (
                  <BonusContent />
                ) : item.id === 'safety' ? (
                  <SafetyContent />
                ) : (
                  <ApprovalContent />
                )}
              </View>
              {isUnread ? <View style={styles.unreadBadge} /> : null}
            </Pressable>
          );
        })}

        {filteredItems.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons color={colors.outline} name="notifications-none" size={fontSize.icon3xl} />
            <Text style={styles.emptyText}>Chưa có thông báo trong mục này</Text>
          </View>
        ) : null}
        <View style={styles.endNote}>
          <View style={styles.endIcon}>
            <MaterialIcons color={colors.secondary} name="check" size={fontSize.iconMd} />
          </View>
          <Text style={styles.endText}>Bạn đã xem toàn bộ thông báo gần đây</Text>
        </View>
      </ScrollView>

      <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, spacing.spaceXs) }]}>
        {TABS.map((tab) => {
          const active = tab.label === 'Thông báo';
          return (
            <Pressable accessibilityRole="button" key={tab.label} onPress={() => router.push(tab.route as never)} style={styles.tabItem}>
              <MaterialIcons color={active ? colors.primary : colors.onSurfaceVariant} name={tab.icon} size={fontSize.icon2xl} />
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
