import { Typography as Text, useLanguage, useThemedStyles } from '@datxe/ui';
import { homeStyles } from './homeStyles';

/** Tầng 1: lời chào đứng riêng, không chia hàng với ví để tránh vỡ layout. */
export function HomeGreeting({ greeting, name }: { greeting: string; name: string }) {
  useLanguage();
  const s = useThemedStyles(homeStyles);
  return (
    <Text
      accessibilityRole="header"
      style={s.greeting}
    >
      {greeting}, {name}
    </Text>
  );
}
