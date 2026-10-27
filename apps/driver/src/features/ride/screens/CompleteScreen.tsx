import { Button,Card,colors,fontSize,spacing } from '@datxe/ui';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Pressable,ScrollView,Text,View } from 'react-native';
import { FARE_ROWS,StatCard,styles } from '../components/CompleteScreenParts';
import { useComplete } from '../hooks/useComplete';
export default function CompleteRideScreen() {
const { router, insets, searchState, handleNextRide, ctaLabel } = useComplete();
return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable
          accessibilityLabel="Quay lại"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <MaterialIcons color={colors.onPrimary} name="arrow-back" size={fontSize.icon2xl} />
        </Pressable>
        <Text style={styles.headerTitle}>Chi Tiết Chuyến Xe</Text>
        <View style={styles.headerAvatar}>
          <MaterialIcons color={colors.onPrimary} name="person-outline" size={fontSize.iconMd} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: spacing.spaceXl + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.summaryCard} variant="surface">
          <View style={styles.successCircle}>
            <MaterialIcons color={colors.success} name="check-circle-outline" size={fontSize.icon3xl} />
          </View>
          <View style={styles.tripCompletePill}>
            <View style={styles.greenDot} />
            <Text style={styles.tripCompleteText}>CHUYẾN ĐI HOÀN TẤT AN TOÀN</Text>
          </View>
          <Text style={styles.earningsLabel}>Thu nhập thực nhận</Text>
          <Text style={styles.earnings}>210.000<Text style={styles.currency}> ₫</Text></Text>
          <View style={styles.paymentBanner}>
            <MaterialIcons color={colors.primary} name="account-balance-wallet" size={fontSize.icon2xl} />
            <Text style={styles.paymentText}>Đã thanh toán qua Ví điện tử</Text>
            <Text style={styles.cashTag}>Không thu tiền mặt</Text>
          </View>
        </Card>

        <Card style={styles.reviewCard} variant="surface">
          <View style={styles.reviewHeading}>
            <View style={styles.reviewTitle}>
              <MaterialIcons color={colors.primary} name="thumb-up" size={fontSize.iconXl} />
              <Text style={styles.sectionTitle}>Đánh giá từ khách hàng</Text>
            </View>
            <Text style={styles.stars}>☆☆☆☆☆</Text>
          </View>
          <View style={styles.quoteBox}>
            <MaterialIcons color={colors.secondary} name="format-quote" size={fontSize.iconXl} />
            <View style={styles.quoteTextBox}>
              <Text style={styles.quote}>&quot;Lái xe rất êm, chu đáo và đúng giờ.&quot;</Text>
              <Text style={styles.quoteSource}>Khách hàng xe Mazda CX-5 • 5.0 ★</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.fareCard} variant="surface">
          <View style={styles.fareHeading}>
            <Text style={styles.sectionTitle}>Chi tiết cước phí</Text>
            <Text style={styles.tripId}>Mã: #DX-8892</Text>
          </View>
          {FARE_ROWS.map((row) => (
            <View key={row.label} style={styles.fareRow}>
              <View style={styles.fareLabelWrap}>
                <Text style={styles.fareLabel}>{row.label}</Text>
                {row.detail ? <Text style={styles.fareDetail}>{row.detail}</Text> : null}
              </View>
              <Text style={[styles.fareAmount, { color: row.color }]}>{row.amount}</Text>
            </View>
          ))}
          <View style={styles.walletTotal}>
            <View style={styles.walletTotalCopy}>
              <Text style={styles.walletTotalTitle}>Thực nhận vào ví</Text>
              <Text style={styles.walletTotalCaption}>Cộng trực tiếp vào số dư ví tài xế</Text>
            </View>
            <Text style={styles.walletTotalAmount}>210.000₫</Text>
          </View>
        </Card>

        <View style={styles.statsRow}>
          <StatCard icon="near-me" label="Quãng đường" value="14.8 km" />
          <StatCard icon="schedule" label="Thời gian lái" value="32 phút" />
          <StatCard icon="directions-car" label="Loại xe" value="Tự động (AT)" />
        </View>

        <Button
          icon={searchState === 'ready' ? 'check' : searchState === 'searching' ? undefined : 'radar'}
          iconPosition="leading"
          label={ctaLabel}
          loading={searchState === 'searching'}
          onPress={handleNextRide}
          style={styles.nextButton}
          textStyle={styles.nextButtonText}
        />
        <Text style={styles.footerText}>
          Hệ thống sẽ tự động quét khách hàng gần nhất quanh vị trí hiện tại
        </Text>
      </ScrollView>
    </View>
  );
}
