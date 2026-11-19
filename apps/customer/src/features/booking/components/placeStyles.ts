import { typography, type ThemeColors } from '@datxe/ui';
import { StyleSheet } from 'react-native';

/**
 * Màu nhấn riêng cho luồng chọn địa điểm: điểm đón xanh, điểm đến vàng.
 * Nút hành động dùng primary coral để đồng bộ với phần còn lại của app; các màu
 * nền/chữ vẫn lấy từ theme để chế độ tối hoạt động đúng.
 */
export const placeAccent = (colors: ThemeColors) => ({
  action: colors.primary,
  onAction: colors.onPrimary,
  pickup: colors.ridePickup,
  dropoff: colors.rideDropoff,
  onAccent: colors.onRideAccent,
});

export const placeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1 },
    page: { paddingHorizontal: 16, paddingBottom: 32 },
    content: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 24 },

    headerLink: {
      ...typography.navigationLabel,
      color: colors.primary,
      textAlign: 'right',
    },
    headerLinkTarget: { minHeight: 48, minWidth: 48, justifyContent: 'center', paddingHorizontal: 8 },
    loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 14 },

    fieldsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    fieldsColumn: { flex: 1, gap: 10 },
    fieldBox: {
      minHeight: 56,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 14,
      borderRadius: 18,
      backgroundColor: colors.surfaceContainerLowest,
    },
    fieldBoxActive: { backgroundColor: colors.primaryFixedTint },
    fieldIcon: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    fieldInput: {
      ...typography.body,
      flex: 1,
      minHeight: 52,
      paddingVertical: 8,
      color: colors.onSurface,
    },
    fieldValue: {
      ...typography.body,
      flex: 1,
      paddingVertical: 10,
      color: colors.onSurface,
    },
    fieldPlaceholder: { color: colors.onSurfaceVariant },
    fieldClear: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },

    chips: { gap: 8, paddingVertical: 14, paddingEnd: 8 },
    chip: {
      flexShrink: 0,
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: colors.surfaceContainerHigh,
    },
    chipDisabled: { opacity: 0.5 },
    chipText: {
      ...typography.label,
      color: colors.onSurface,
    },

    section: {
      ...typography.label,
      marginTop: 18,
      marginBottom: 2,
      color: colors.onSurface,
    },
    helper: {
      ...typography.caption,
      color: colors.onSurfaceVariant,
    },
    helperPadded: {
      ...typography.caption,
      color: colors.onSurfaceVariant,
      paddingVertical: 12,
    },

    listRow: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 14,
      backgroundColor: colors.surfaceContainerLow,
      marginBottom: 6,
      paddingHorizontal: 10,
    },
    listRowMain: {
      flex: 1,
      minHeight: 64,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 10,
    },
    listIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceContainerHigh,
    },
    listCopy: { flex: 1, minWidth: 0, gap: 2 },
    listTitle: {
      ...typography.cardTitle,
      color: colors.onSurface,
    },
    listAddress: {
      ...typography.bodySecondary,
      color: colors.onSurfaceVariant,
    },
    listMeta: {
      ...typography.caption,
      color: colors.onSurfaceVariant,
    },
    moreButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
    pressed: { opacity: 0.65 },

    selectedRow: {
      backgroundColor: colors.warningContainer,
      borderRadius: 14,
      marginBottom: 4,
      paddingHorizontal: 10,
    },
    selectedTitle: { color: colors.onWarningContainer },

    empty: { alignItems: 'center', gap: 8, paddingVertical: 36, paddingHorizontal: 24 },
    errorBox: {
      marginTop: 12,
      padding: 12,
      borderRadius: 14,
      backgroundColor: colors.errorContainer,
    },
    errorText: {
      ...typography.caption,
      color: colors.onErrorContainer,
    },

    sheetHeading: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
    },
    sheetCopy: { flex: 1, gap: 4 },
    sheetTitle: {
      ...typography.sectionTitle,
      color: colors.onSurface,
    },
    sheetSubtitle: {
      ...typography.caption,
      color: colors.onSurfaceVariant,
    },
    sheetEdit: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceContainerHigh,
    },
    nearbyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      marginTop: 6,
    },
    nearbyTitle: {
      ...typography.label,
      color: colors.onSurface,
    },
    noteBox: {
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      backgroundColor: colors.surfaceContainerHigh,
    },
    noteInput: {
      ...typography.body,
      flex: 1,
      minHeight: 40,
      paddingVertical: 6,
      color: colors.onSurface,
    },
    statusRow: { height: 30, flexDirection: 'row', alignItems: 'center', gap: 8 },
    statusText: {
      ...typography.caption,
      flex: 1,
      color: colors.onSurfaceVariant,
    },

    detailMap: {
      height: 210,
      borderRadius: 22,
      overflow: 'hidden',
      backgroundColor: colors.surfaceContainerHigh,
      marginTop: 4,
    },
    detailMapPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    detailTitle: {
      ...typography.screenTitle,
      marginTop: 16,
      color: colors.onSurface,
    },
    detailMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
    detailMetaText: {
      ...typography.bodySecondary,
      color: colors.onSurfaceVariant,
    },
    detailAddress: {
      ...typography.body,
      color: colors.onSurface,
      marginTop: 10,
    },
    detailActions: { flexDirection: 'row', gap: 12, marginTop: 18 },
    actionCard: {
      flex: 1,
      minHeight: 84,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.surfaceContainerHigh,
    },
    actionLabel: {
      ...typography.label,
      color: colors.onSurface,
    },
    divider: { height: 1, backgroundColor: colors.outlineVariant, marginTop: 22 },
    feedbackTitle: {
      ...typography.label,
      marginTop: 18,
      color: colors.onSurface,
    },
    feedbackCard: {
      marginTop: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 14,
      paddingVertical: 14,
      borderRadius: 16,
      backgroundColor: colors.surfaceContainerHigh,
    },
    feedbackCopy: { flex: 1, minWidth: 0, gap: 2 },
    feedbackTitleText: {
      ...typography.label,
      color: colors.onSurface,
    },
    footer: {
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 12,
      gap: 8,
      backgroundColor: colors.background,
    },
    cta: { minHeight: 52, backgroundColor: colors.primary },
    ctaSm: { minHeight: 48, backgroundColor: colors.primary },

    modalBackdrop: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: colors.scrim60,
    },
    modalDismiss: { flex: 1 },
    modalSheet: {
      backgroundColor: colors.surfaceContainerLowest,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      padding: 20,
      paddingBottom: 28,
      gap: 14,
    },
    modalTitle: {
      ...typography.sectionTitle,
      color: colors.onSurface,
    },
    modalDescription: {
      ...typography.bodySecondary,
      color: colors.onSurfaceVariant,
    },
    modalInput: {
      ...typography.body,
      minHeight: 96,
      borderRadius: 14,
      backgroundColor: colors.surfaceContainerHigh,
      padding: 12,
      color: colors.onSurface,
      textAlignVertical: 'top',
    },
    modalActions: { flexDirection: 'row', gap: 10 },
    modalButton: { flex: 1 },
    reasonChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    reasonChip: {
      minHeight: 48,
      justifyContent: 'center',
      paddingHorizontal: 12,
      borderRadius: 999,
      backgroundColor: colors.surfaceContainerHigh,
    },
    reasonChipActive: { backgroundColor: colors.primaryFixed },
    reasonChipText: {
      ...typography.label,
      color: colors.onSurface,
    },
  });
