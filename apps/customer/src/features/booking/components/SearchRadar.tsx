import { useReducedMotion, useThemeColors } from '@datxe/ui';
import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

export function SearchRadar({ top, bottom, fraction }: { top: number; bottom: number; fraction: number }) {
  const colors = useThemeColors();
  const reduced = useReducedMotion();
  const [rotation] = useState(() => new Animated.Value(0));
  const [size, setSize] = useState(0);
  useEffect(() => {
    if (reduced) return;
    const sweep = Animated.loop(Animated.timing(rotation, {
      toValue: 1, duration: 2800, easing: Easing.linear, useNativeDriver: true,
      isInteraction: false,
    }));
    sweep.start();
    return () => sweep.stop();
  }, [reduced, rotation]);
  const diameter = size * Math.min(1, Math.max(0.25, fraction)) * 0.8;
  const spin = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <View pointerEvents="none" accessible={false}
      style={[StyleSheet.absoluteFill, styles.center, { top, bottom }]}
      onLayout={({ nativeEvent: { layout } }) => setSize(Math.min(layout.width, layout.height))}>
      <View style={[styles.circle, { width: diameter, height: diameter }]}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.primaryTintStrong }]} />
        {!reduced ? <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate: spin }] }]}>
          <View style={[styles.sector, { backgroundColor: colors.primaryTintStrong }]} />
          <View style={[styles.arm, { backgroundColor: colors.primary }]} />
        </Animated.View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  circle: { borderRadius: 999, overflow: 'hidden' },
  sector: { position: 'absolute', left: '50%', top: 0, width: '50%', height: '50%' },
  arm: { position: 'absolute', left: '50%', top: 0, width: 2, height: '50%' },
});
