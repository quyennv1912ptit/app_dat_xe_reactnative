import { ActivityIndicator } from 'react-native-paper';
import { ScreenHeader } from '@/components/ScreenHeader';
import { translate as i18nT } from '@datxe/shared';
import {
  MotionPressable as Pressable,
  ScreenWrapper as SafeAreaView,
  Typography as Text,
  ThemedTextInput as TextInput,
  useLanguage,
  useThemeColors,
  useThemedStyles,
} from '@datxe/ui';
import { MaterialIcons } from '@expo/vector-icons';
import { useRef, useState, type ComponentRef } from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  View,
} from 'react-native';
import { formatDistanceMeters } from '../bookingUtils';
import { PlaceKindIcon, PlaceRow } from '../components/PlaceRow';
import { placeAccent, placeStyles } from '../components/placeStyles';
import { usePlaceSelection } from '../hooks/usePlaceSelection';
import type { PlaceKind } from '../types';

export default function PlaceSelectionScreen({ kind }: { kind: PlaceKind }) {
  useLanguage();
  const colors = useThemeColors();
  const s = useThemedStyles(placeStyles);
  const accent = placeAccent(colors);
  const h = usePlaceSelection(kind);
  const searchInput = useRef<ComponentRef<typeof TextInput>>(null);
  const [activeField, setActiveField] = useState<PlaceKind>(kind);
  const isPickup = kind === 'pickup';
  const hasText = h.text.trim().length > 0;
  const savedNames = new Set(h.savedPlaces.map((place) => place.name));
  const selected = h.selected;

  const clearSearch = () => {
    searchInput.current?.clear();
    h.clearText();
  };

  const searchField = (
    <View style={[s.fieldBox, activeField === kind && s.fieldBoxActive]}>
      <PlaceKindIcon pickup={isPickup} />
      <TextInput
        ref={searchInput}
        autoFocus
        accessibilityLabel={i18nT(isPickup ? 'Tìm điểm đón' : 'Tìm điểm đến')}
        defaultValue={h.initialText}
        onChangeText={h.onChangeText}
        onFocus={() => setActiveField(kind)}
        placeholder={i18nT(isPickup ? 'Nhập điểm đón' : 'Nhập điểm đến')}
        placeholderTextColor={colors.onSurfaceVariant}
        maxLength={255}
        returnKeyType="search"
        style={s.fieldInput}
      />
      {hasText ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={i18nT('Xóa tìm kiếm')}
          onPress={clearSearch}
          style={s.fieldClear}
          hitSlop={8}
        >
          <MaterialIcons name="cancel" size={20} color={colors.outline} />
        </Pressable>
      ) : null}
    </View>
  );

  const otherField = kind === 'dropoff' ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={i18nT('Đổi điểm đón')}
      onPress={() => h.editTarget('pickup')}
      style={s.fieldBox}
    >
      <PlaceKindIcon pickup />
      <Text style={[s.fieldValue, !h.pickup && s.fieldPlaceholder]}>
        {h.pickup?.address ?? i18nT('Chọn điểm đón')}
      </Text>
      <MaterialIcons name="chevron-right" size={20} color={colors.outline} />
    </Pressable>
  ) : null;

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <ScreenHeader
        title={i18nT(isPickup ? 'Chọn điểm đón' : 'Bạn muốn đi đâu?')}
        onBack={() => h.router.back()}
        rightContent={(
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={i18nT('Chọn từ bản đồ')}
            onPress={h.openMap}
            style={s.headerLinkTarget}
          >
            <Text style={s.headerLink}>{i18nT('Chọn từ bản đồ')}</Text>
          </Pressable>
        )}
      />
      <KeyboardAvoidingView style={s.flex} behavior="padding">
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={s.content}
        >
          <View style={s.fieldsRow}>
            <View style={s.fieldsColumn}>
              {otherField}
              {searchField}
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
            {h.savedPlaces.map((place) => (
              <Pressable
                key={place.id}
                accessibilityRole="button"
                accessibilityLabel={i18nT('Dùng địa điểm đã lưu {0}', { 0: i18nT(place.name) })}
                onPress={() => h.selectKnownPlace(place)}
                style={s.chip}
              >
                <MaterialIcons
                  name={place.name === 'Nhà' ? 'home' : place.name === 'Cơ quan' ? 'work' : 'star'}
                  size={18}
                  color={colors.onSurfaceVariant}
                />
                <Text style={s.chipText}>{i18nT(place.name)}</Text>
              </Pressable>
            ))}
            {!savedNames.has('Nhà') ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={i18nT('Thêm nhà')}
                onPress={() => h.addSavedPlace('Nhà')}
                style={s.chip}
              >
                <MaterialIcons name="add-location-alt" size={18} color={colors.onSurfaceVariant} />
                <Text style={s.chipText}>{i18nT('Thêm nhà')}</Text>
              </Pressable>
            ) : null}
            {!savedNames.has('Cơ quan') ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={i18nT('Thêm công ty')}
                onPress={() => h.addSavedPlace('Cơ quan')}
                style={s.chip}
              >
                <MaterialIcons name="add-location-alt" size={18} color={colors.onSurfaceVariant} />
                <Text style={s.chipText}>{i18nT('Thêm công ty')}</Text>
              </Pressable>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={i18nT('Thêm địa chỉ')}
              onPress={() => h.addSavedPlace('Yêu thích')}
              style={s.chip}
            >
              <MaterialIcons name="add" size={18} color={colors.onSurfaceVariant} />
              <Text style={s.chipText}>{i18nT('Thêm địa chỉ')}</Text>
            </Pressable>
          </ScrollView>

          {h.error ? (
            <View style={s.errorBox}>
              <Text accessibilityRole="alert" style={s.errorText}>{i18nT(h.error)}</Text>
            </View>
          ) : null}

          {!hasText ? (
            <>
              {selected ? (
                <PlaceRow
                  selected
                  title={i18nT('Địa điểm đã chọn')}
                  address={selected.address}
                  icon="check-circle"
                  iconColor={colors.primary}
                  onPress={() => void h.select(selected)}
                  onMore={() => h.openDetail(selected)}
                />
              ) : null}

              {isPickup ? (
                <PlaceRow
                  title={i18nT('Dùng vị trí hiện tại')}
                  address={i18nT('Xác định điểm đón bằng GPS')}
                  icon="my-location"
                  iconColor={accent.pickup}
                  onPress={() => void h.useCurrentLocation()}
                  disabled={h.locating}
                  meta={h.locating ? i18nT('Đang lấy vị trí…') : undefined}
                />
              ) : null}

              {h.recentLoading || h.popularLoading ? (
                <View style={s.loadingRow}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={s.helper}>{i18nT('Đang tìm địa điểm…')}</Text>
                </View>
              ) : null}

              {h.recentPlaces.length ? (
                <Text style={s.section}>
                  {i18nT(isPickup ? 'Địa điểm gần đây' : 'Điểm đến gần đây')}
                </Text>
              ) : null}
              {h.recentPlaces.map((place) => (
                <PlaceRow
                  key={place.id}
                  title={place.name}
                  address={place.address}
                  meta={formatDistanceMeters(place.distanceMeters)}
                  icon="history"
                  onPress={() => h.selectKnownPlace(place)}
                  onMore={() => h.openDetail(place)}
                  disabled={h.selectingId !== null}
                />
              ))}

              {kind === 'dropoff' && h.popularPlaces.length ? (
                <Text style={s.section}>{i18nT('Điểm đến phổ biến')}</Text>
              ) : null}
              {kind === 'dropoff' ? h.popularPlaces.map((place) => (
                <PlaceRow
                  key={place.id}
                  title={place.name}
                  address={place.address}
                  meta={formatDistanceMeters(place.distanceMeters)}
                  icon="trending-up"
                  iconColor={colors.onRideDropoff}
                  iconBackground={accent.dropoff}
                  onPress={() => void h.select(place)}
                  onMore={() => h.openDetail(place)}
                  disabled={h.selectingId !== null}
                />
              )) : null}

              {!h.recentPlaces.length && !(kind === 'dropoff' && h.popularPlaces.length) && !selected && !h.recentLoading && !h.popularLoading ? (
                <View style={s.empty}>
                  <MaterialIcons name="travel-explore" size={42} color={colors.outline} />
                  <Text style={s.helper}>
                    {i18nT('Tìm địa chỉ hoặc chọn một vị trí trên bản đồ để tiếp tục.')}
                  </Text>
                </View>
              ) : null}
            </>
          ) : (
            <>
              {h.loading ? (
                <View style={s.loadingRow}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={s.helper}>{i18nT('Đang tìm địa điểm…')}</Text>
                </View>
              ) : null}
              {!h.canSearch ? (
                <Text style={s.helperPadded}>{i18nT('Nhập ít nhất 2 ký tự để tìm địa điểm.')}</Text>
              ) : null}
              {h.canSearch && h.results.length ? (
                <Text style={s.section}>{i18nT('Kết quả tìm kiếm')}</Text>
              ) : null}
              {h.canSearch ? h.results.map((place) => (
                <PlaceRow
                  key={place.id}
                  title={place.name}
                  address={place.address}
                  icon="place"
                  iconColor={isPickup ? accent.onAccent : colors.onRideDropoff}
                  iconBackground={isPickup ? accent.pickup : accent.dropoff}
                  meta={h.selectingId === place.id ? i18nT('Đang xác định vị trí chính xác…') : undefined}
                  onPress={() => void h.select(place)}
                  onMore={() => h.openDetail(place)}
                  disabled={h.selectingId !== null}
                />
              )) : null}
              {h.canSearch && !h.loading && !h.error && !h.results.length ? (
                <View style={s.empty}>
                  <MaterialIcons name="search-off" size={36} color={colors.outline} />
                  <Text style={s.listTitle}>{i18nT('Chưa tìm thấy địa điểm')}</Text>
                  <Text style={s.helper}>
                    {i18nT('Thử thêm tên đường, quận hoặc thành phố, hoặc chọn trên bản đồ.')}
                  </Text>
                </View>
              ) : null}
              {h.limitedCoverage && !h.loading && h.results.length ? (
                <Text style={s.helperPadded}>
                  {i18nT('Chưa thấy đúng địa chỉ? Nhập thêm số nhà, ngõ/ngách, quận hoặc chọn vị trí trên bản đồ.')}
                </Text>
              ) : null}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
