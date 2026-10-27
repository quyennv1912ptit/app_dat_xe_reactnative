import { Button,Card,colors,fontSize,spacing } from '@datxe/ui';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import {
Alert,
Image,
Pressable,
ScrollView,
Text,
View
} from 'react-native';
import { CUSTOMER_AVATAR,CUSTOMER_PHONE,MAP_IMAGE,MapToolButton,StageProgress,TRIP_STEPS,styles } from '../components/InProgressScreenParts';
import { useInProgress } from '../hooks/useInProgress';
export default function InProgressRideScreen() {
const { router, insets, activeStep, tripCompleted, voiceEnabled, setVoiceEnabled, mapNotice, trafficLayerEnabled, handoverPhoto, capturingPhoto, openCustomerCall, openSupport, captureHandoverPhoto, advanceTrip, onMapToolPress, currentStepCopy } = useInProgress();
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
            Chuyến Xe Hiện Tại
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
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, spacing.spaceMd) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.tripHud}>
          <View style={styles.tripHudDetails}>
            <View style={styles.tripIdBadge}>
              <View style={styles.tripIdDot} />
              <Text style={styles.tripIdText}>#DX-8892</Text>
            </View>
            <View style={styles.tripDistance}>
              <MaterialIcons
                color={colors.primaryFixed}
                name="near-me"
                size={fontSize.iconMd}
              />
              <Text style={styles.tripDistanceText}>6.2 km • 18 phút</Text>
            </View>
          </View>
          <Pressable
            accessibilityLabel="Gọi hỗ trợ chuyến đi"
            accessibilityRole="button"
            onPress={openSupport}
            style={styles.sosButton}
          >
            <MaterialIcons
              color={colors.onError}
              name="emergency"
              size={fontSize.iconMd}
            />
            <Text style={styles.sosText}>SOS</Text>
          </Pressable>
        </View>

        <View style={styles.directionBar}>
          <View style={styles.turnIconBox}>
            <MaterialIcons
              color={colors.onPrimary}
              name="turn-right"
              size={fontSize.icon2xl}
            />
          </View>
          <View style={styles.directionCopy}>
            <View style={styles.directionTitleRow}>
              <Text style={styles.directionDistance}>Trong 150m</Text>
              <View style={styles.laneBadge}>
                <Text style={styles.laneText}>Làn 2</Text>
              </View>
            </View>
            <Text numberOfLines={1} style={styles.directionSubtitle}>
              Rẽ phải vào Phố Vọng hướng Đại La
            </Text>
          </View>
          <Pressable
            accessibilityLabel={voiceEnabled ? 'Tắt hướng dẫn bằng giọng nói' : 'Bật hướng dẫn bằng giọng nói'}
            accessibilityRole="button"
            accessibilityState={{ selected: voiceEnabled }}
            onPress={() => setVoiceEnabled((enabled) => !enabled)}
            style={styles.voiceButton}
          >
            <MaterialIcons
              color={colors.primary}
              name={voiceEnabled ? 'volume-up' : 'volume-off'}
              size={fontSize.iconXl}
            />
          </Pressable>
        </View>

        <View style={styles.mapViewport}>
          <Image
            accessible={false}
            resizeMode="cover"
            source={{ uri: MAP_IMAGE }}
            style={styles.mapImage}
          />
          <View pointerEvents="none" style={styles.mapTint} />

          {trafficLayerEnabled ? (
            <View style={styles.trafficBadge}>
              <View style={styles.trafficDot} />
              <Text style={styles.trafficBadgeText}>Giao thông thông thoáng</Text>
            </View>
          ) : null}

          <View style={styles.mapTools}>
            <MapToolButton
              accessibilityLabel="Lớp bản đồ"
              icon="layers"
              onPress={() => onMapToolPress('layers')}
            />
            <MapToolButton
              accessibilityLabel="Định vị tài xế"
              icon="my-location"
              onPress={() => onMapToolPress('location')}
            />
            <MapToolButton
              accessibilityLabel={trafficLayerEnabled ? 'Tắt lớp giao thông' : 'Bật lớp giao thông'}
              icon="traffic"
              onPress={() => onMapToolPress('traffic')}
              active={trafficLayerEnabled}
            />
          </View>

          <View pointerEvents="none" style={styles.driverMarker}>
            <View style={styles.markerHalo}>
              <View style={styles.markerCore}>
                <MaterialIcons
                  color={colors.onPrimary}
                  name="navigation"
                  size={fontSize.iconMd}
                />
              </View>
            </View>
            <View style={styles.speedBadge}>
              <Text style={styles.speedText}>38 km/h</Text>
            </View>
          </View>

          {mapNotice ? (
            <View style={styles.mapNotice}>
              <Text numberOfLines={1} style={styles.mapNoticeText}>
                {mapNotice}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.bottomSheet}>
          <Card style={styles.vehicleCard} variant="surface">
            <View style={styles.vehicleIconBox}>
              <MaterialIcons
                color={colors.onSurface}
                name="directions-car"
                size={fontSize.icon2xl}
              />
            </View>
            <View style={styles.vehicleCopy}>
              <View style={styles.vehicleNameRow}>
                <Text numberOfLines={1} style={styles.vehicleName}>
                  Toyota Camry
                </Text>
                <View style={styles.transmissionBadge}>
                  <Text style={styles.transmissionText}>AT • Tự động</Text>
                </View>
              </View>
              <Text style={styles.licensePlate}>Biển số: 30G-928.14</Text>
            </View>
            <Pressable
              accessibilityLabel={capturingPhoto ? 'Đang chụp biên bản' : 'Chụp biên bản xe'}
              accessibilityRole="button"
              disabled={capturingPhoto}
              onPress={() => void captureHandoverPhoto()}
              style={styles.reportButton}
            >
              {handoverPhoto ? (
                <Image
                  accessibilityLabel="Ảnh biên bản xe đã chụp"
                  resizeMode="cover"
                  source={{ uri: handoverPhoto }}
                  style={styles.reportThumbnail}
                />
              ) : (
                <MaterialIcons
                  color={colors.primary}
                  name={capturingPhoto ? 'hourglass-top' : 'photo-camera'}
                  size={fontSize.iconMd}
                />
              )}
              <Text style={styles.reportButtonText}>
                {handoverPhoto ? 'Đã chụp' : 'Biên bản'}
              </Text>
            </Pressable>
          </Card>

          <Card style={styles.customerCard} variant="surface">
            <View style={styles.customerHeader}>
              <Image
                accessibilityLabel="Ảnh đại diện khách hàng Anh Tuấn Anh"
                resizeMode="cover"
                source={{ uri: CUSTOMER_AVATAR }}
                style={styles.customerAvatar}
              />
              <View style={styles.customerStatusDot} />
              <View style={styles.customerIdentity}>
                <View style={styles.customerNameRow}>
                  <Text numberOfLines={1} style={styles.customerName}>
                    Anh Tuấn Anh
                  </Text>
                  <View style={styles.customerRating}>
                    <MaterialIcons
                      color={colors.success}
                      name="star"
                      size={fontSize.iconSm}
                    />
                    <Text style={styles.customerRatingText}>4.9</Text>
                  </View>
                </View>
                <Text numberOfLines={2} style={styles.customerSubtitle}>
                  Khách hàng đặt lái hộ về nhà
                </Text>
              </View>
              <View style={styles.customerActions}>
                <Pressable
                  accessibilityLabel={`Gọi khách ${CUSTOMER_PHONE}`}
                  accessibilityRole="link"
                  onPress={() => void openCustomerCall()}
                  style={styles.callCustomerButton}
                >
                  <MaterialIcons
                    color={colors.primary}
                    name="call"
                    size={fontSize.iconMd}
                  />
                  <Text style={styles.callCustomerText}>Gọi khách</Text>
                </Pressable>
                <Pressable
                  accessibilityLabel="Nhắn tin cho khách"
                  accessibilityRole="button"
                  onPress={() =>
                    Alert.alert(
                      'Tin nhắn khách hàng',
                      'Cuộc trò chuyện với khách sẽ hiển thị tại đây.',
                    )
                  }
                  style={styles.chatButton}
                >
                  <MaterialIcons
                    color={colors.primary}
                    name="chat"
                    size={fontSize.iconXl}
                  />
                </Pressable>
              </View>
            </View>

            <View style={styles.checkpointsCard}>
              <View style={styles.checkpointRail}>
                <View style={[styles.checkpointDot, styles.pickupDot]} />
                <View style={styles.checkpointLine} />
                <View style={[styles.checkpointDot, styles.destinationDot]} />
              </View>
              <View style={styles.checkpointsCopy}>
                <View style={styles.checkpointItem}>
                  <Text style={styles.pickupLabel}>ĐIỂM ĐÓN</Text>
                  <Text numberOfLines={1} style={styles.checkpointAddress}>
                    Nhà hàng Bia Vân Hồ, 2B Hoa Lư, Lê Đại Hành
                  </Text>
                </View>
                <View style={styles.checkpointItem}>
                  <Text style={styles.destinationLabel}>ĐIỂM TRẢ</Text>
                  <Text numberOfLines={1} style={styles.destinationAddress}>
                    Khu đô thị Times City, Hai Bà Trưng
                  </Text>
                </View>
              </View>
            </View>
          </Card>

          <Card style={styles.stageCard} variant="surface">
            <StageProgress activeStep={activeStep} completed={tripCompleted} />
            <Button
              accessibilityLabel={tripCompleted ? 'Chuyến đi đã hoàn thành' : currentStepCopy.label}
              disabled={tripCompleted}
              icon={tripCompleted ? 'task-alt' : currentStepCopy.icon}
              iconPosition="leading"
              iconSize={fontSize.iconXl}
              label={tripCompleted ? 'Chuyến đi đã hoàn thành' : currentStepCopy.label}
              onPress={advanceTrip}
              style={[
                styles.stageActionButton,
                activeStep === TRIP_STEPS.length - 1 && styles.stageFinalButton,
                tripCompleted && styles.stageCompletedButton,
              ]}
              textStyle={styles.stageActionText}
            />
            <Pressable
              accessibilityLabel="Mở kiểm tra xe 6 góc"
              accessibilityRole="button"
              onPress={() => router.push('/ride/vehicle-inspection' as never)}
              style={styles.inspectionLink}
            >
              <MaterialIcons color={colors.primary} name="photo-camera" size={fontSize.iconMd} />
              <Text style={styles.inspectionLinkText}>Kiểm tra xe 6 góc</Text>
              <MaterialIcons color={colors.primary} name="chevron-right" size={fontSize.iconLg} />
            </Pressable>
            <View style={styles.stageHelper}>
              <MaterialIcons
                color={colors.onSurfaceVariant}
                name={tripCompleted ? 'check-circle-outline' : 'touch-app'}
                size={fontSize.iconMd}
              />
              <Text style={styles.stageHelperText}>
                {tripCompleted ? 'Cảm ơn bạn đã hoàn thành chuyến đi an toàn.' : currentStepCopy.helper}
              </Text>
            </View>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}
