import { StyleSheet } from 'react-native';
import { colors, fontFamily } from '@datxe/ui';
export const rideStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' }, page: { padding: 20, gap: 16 },
  title: { fontFamily: fontFamily.inter, fontSize: 24, fontWeight: '700', color: '#182230' },
  text: { fontFamily: fontFamily.inter, fontSize: 16, lineHeight: 24, color: '#182230' },
  label: { fontFamily: fontFamily.inter, fontSize: 12, fontWeight: '700', color: '#667085' },
  card: { padding: 18, borderRadius: 18, gap: 10, backgroundColor: '#FFFFFF' },
  button: { padding: 16, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center' },
  buttonText: { fontFamily: fontFamily.inter, fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  link: { fontFamily: fontFamily.inter, fontSize: 15, color: colors.primary, fontWeight: '600' },
  error: { fontFamily: fontFamily.inter, fontSize: 14, color: '#B42318' },
});
