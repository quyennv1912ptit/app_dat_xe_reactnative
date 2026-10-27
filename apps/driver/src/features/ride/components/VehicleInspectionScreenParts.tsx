import { borderRadius,colors,spacing,typography } from '@datxe/ui';
import {
StyleSheet
} from 'react-native';
export type InspectionSlot = {
  title: string;
  image?: string;
};

export const INITIAL_SLOTS: InspectionSlot[] = [
  {
    title: '1. Đầu xe (Góc trước)',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCTWIYOlCl2kNWZU1vXaiZCY6_w_FxvzCkXEpDLHcuPifR2y-5Bux4ZyY2QvTzANe4VQzMe2LXuD6XWUS2b0-MQKOD5Zj5O7fu8AelAvPllnQRtLt0Fv8W31J6F3wLqbRHFLX_xkrwc4mCBoflnfLZp9H9UWNhHIbgQtyB3N7O5yjPIP8ffJEDH2DTwoMMZajPZl4-M4f2HQvXQh2CQeBqwftgofY4N8J-OesSWE4aRzdfE8pgsOB8hGA',
  },
  {
    title: '2. Đuôi xe & Biển số',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDl1G5iIy1e5fKElBq2GShnLmO6Lwu9JORj3z_9q_B28Y1AnSnNryYS7Ah5fkM3IVuTFa5pBO5Rwt6dz0r2ep1VUuQfkQPlTJaMTNVTnzQpZ18g2oS7sZepc2zk4XiOuj9IpL3XwpSiamyaUVpEH9ltp0fQMbHANQh1L_sjvGp__ADeZR2C0tXIBmyevISrU_veNZQLdLdeyQUGNdVxY21KowNv2yrAzKs-tlF-NHPaf_skLFrPThmAyQ',
  },
  {
    title: '3. Sườn trái xe',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA7860CQ4Xaf1GZywFInBrAykAk-l1FfzXtvSGuHnG8aA-igrHHtqRrD9_9TSG1yhdbOL8mgxOdAna-YKe2Svull8Y26vFPGmYZwDtZcIcSuqPjwhdaTEYXPGT_HOjetbURDq_fAoblATD067fWjYwukklBXEqAqwbEXbsSuEQobo5dkNvV0a_1oRZnbnpZqy8MU0Nlx-6Hmde67lOmUsjlYr7clWTJ5zXGHsDExCDwTA28WySSXPT_og',
  },
  {
    title: '4. Sườn phải xe',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA7bI22dHcawqHlvm0ET9pV8YLuu5hRNa7tzPDLgxqFUuz4laIBLHRWrIfkq2fUJlR8WSu8u2UUpOLwGhv3wPsudlbt65dquezGUTnVz4-Mo9OMUGHhPx5-1kWE2mC1yHcsFaxGUFMeO_XJf0r_0tsvleP3PZh6cgkb2Xgb0mDX9OuBtREke18faDwgFaXE5OhG9RaZx1VdBdjA1X5iXEC0zb94nyMBEZTXT2Ll5aHFE-t-89Ov83Hy4g',
  },
  { title: '5. Nội thất & Cần số' },
  { title: '6. ODO & Vạch xăng' },
];

export const NOTE_PRESETS = [
  'Có vết trầy xước nhẹ',
  'Có tư trang giá trị',
  'Xe sạch sẽ nguyên vẹn',
];

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  header: {
    minHeight: spacing.headerHeight,
    backgroundColor: colors.driverHeader,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.spaceMd,
    paddingBottom: spacing.spaceSm,
    gap: spacing.spaceSm,
  },
  backButton: { width: spacing.iconButtonMd, height: spacing.iconButtonMd, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.headlineSm, color: colors.onPrimary, flex: 1 },
  headerAvatar: { width: spacing.avatarMd, height: spacing.avatarMd, borderRadius: borderRadius.full, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: spacing.gutter, paddingTop: spacing.spaceMd, gap: spacing.spaceMd },
  noticeCard: { padding: spacing.spaceMd, backgroundColor: colors.primarySoft, gap: spacing.spaceXs },
  noticeTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.spaceSm },
  noticeTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.spaceXs, flex: 1 },
  noticeHeading: { ...typography.labelLg, color: colors.onSurface, letterSpacing: 0.7 },
  counter: { ...typography.labelSm, color: colors.onPrimaryFixed, backgroundColor: colors.secondaryFixed, borderRadius: borderRadius.full, paddingHorizontal: spacing.spaceSm, paddingVertical: spacing.py0_5 },
  noticeCopy: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: spacing.spaceXs },
  cameraNotice: { flexDirection: 'row', alignItems: 'center', gap: spacing.spaceXs, marginTop: spacing.spaceXs },
  cameraNoticeText: { ...typography.bodyMd, color: colors.success, flex: 1 },
  progressTrack: { height: 6, borderRadius: borderRadius.full, backgroundColor: colors.surfaceContainerHigh, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: borderRadius.full },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: spacing.spaceMd },
  photoCard: { width: '48.5%', padding: 0, overflow: 'hidden' },
  photoAction: { width: '100%', aspectRatio: 4 / 3, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  photo: { width: '100%', height: '100%' },
  pendingPhoto: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', gap: spacing.spaceXs },
  cameraCircle: { width: 52, height: 52, borderRadius: borderRadius.full, backgroundColor: colors.primaryFixed, alignItems: 'center', justifyContent: 'center' },
  captureLabel: { ...typography.labelMd, color: colors.primary },
  checkedBadge: { position: 'absolute', top: spacing.spaceSm, right: spacing.spaceSm, width: 28, height: 28, borderRadius: borderRadius.full, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
  cameraBadge: { position: 'absolute', right: spacing.spaceSm, bottom: spacing.spaceSm, width: 36, height: 36, borderRadius: borderRadius.full, backgroundColor: '#0B1C30CC', alignItems: 'center', justifyContent: 'center' },
  photoCaption: { padding: spacing.spaceSm, gap: spacing.spaceXs },
  photoTitle: { ...typography.labelMd, color: colors.onSurface },
  photoStatus: { flexDirection: 'row', alignItems: 'center', gap: spacing.spaceXs },
  statusDot: { width: 7, height: 7, borderRadius: borderRadius.full, backgroundColor: colors.outline },
  statusDotCaptured: { backgroundColor: colors.success },
  statusText: { ...typography.bodyMd, color: colors.outline },
  statusTextCaptured: { color: colors.success },
  notesCard: { padding: spacing.spaceMd, gap: spacing.spaceSm },
  notesHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing.spaceXs },
  sectionTitle: { ...typography.labelLg, color: colors.onSurface, flex: 1 },
  optional: { ...typography.bodyMd, color: colors.outline },
  notesInput: { minHeight: 72, borderRadius: borderRadius.lg, backgroundColor: colors.primarySoft, paddingHorizontal: spacing.spaceMd, paddingVertical: spacing.spaceSm, color: colors.onSurface, ...typography.bodyMd },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.spaceXs },
  presetChip: { borderRadius: borderRadius.full, backgroundColor: colors.surfaceContainer, paddingHorizontal: spacing.spaceSm, paddingVertical: spacing.py1 },
  presetText: { ...typography.labelSm, color: colors.onSurfaceVariant },
  submitButton: { height: 64, marginTop: spacing.spaceXs },
  submitLabel: { ...typography.headlineSm, color: colors.onPrimary },
  footerNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.spaceXs, marginTop: -spacing.spaceSm },
  footerText: { ...typography.bodyMd, color: colors.outline, textAlign: 'center' },
});
