import { useLanguage } from "../useLanguage";
import { useEffect, useState } from 'react';
import { Animated, Easing, Platform, Pressable, type PressableProps } from 'react-native';
import { useReducedMotion } from '../motion';
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
export function MotionPressable({ style, onPressIn, onPressOut, disabled, ...props }: PressableProps) {
 useLanguage();

  const [scale] = useState(() => new Animated.Value(1));
  const reduced = useReducedMotion();
  useEffect(() => { if (disabled || reduced) { scale.stopAnimation(); scale.setValue(1); } return () => scale.stopAnimation(); }, [disabled, reduced, scale]);
  const animate = (value: number) => {
    scale.stopAnimation();
    Animated.timing(scale, { toValue: reduced ? 1 : value, duration: value === 1 ? 160 : 90, easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== 'web' }).start();
  };
  return <AnimatedPressable {...props} disabled={disabled} onPressIn={event => { animate(0.98); onPressIn?.(event); }} onPressOut={event => { animate(1); onPressOut?.(event); }} style={state => [typeof style === 'function' ? style(state) : style, { transform: [{ scale }] }]} />;
}
