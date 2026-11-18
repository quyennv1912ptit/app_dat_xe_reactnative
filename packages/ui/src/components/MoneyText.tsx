import { formatMoney, getLocale } from "@datxe/shared";
import { type StyleProp, type TextStyle } from "react-native";
import { typography } from "../theme/colors";
import { Typography } from "./Typography";

export type MoneyVariant = "display" | "headline" | "title" | "body" | "label";

const variantStyles: Record<MoneyVariant, TextStyle> = {
  display: { ...typography.display },
  headline: { ...typography.moneyDisplay },
  title: { ...typography.sectionTitle },
  body: { ...typography.label },
  label: { ...typography.badge },
};

export type MoneyTextProps = {
  value?: number | null;
  locale?: string;
  signed?: boolean;
  variant?: MoneyVariant;
  color?: string;
  accessibilityLabel?: string;
  style?: StyleProp<TextStyle>;
};

/** Renders VND amounts with tabular digits and non-breaking unit spacing so currency never wraps or clips. */
export function MoneyText({
  value,
  locale,
  signed = false,
  variant = "body",
  color,
  accessibilityLabel,
  style,
}: MoneyTextProps) {
  const formatted =
    value != null && Number.isFinite(value)
      ? formatMoney(value, { locale: locale ?? getLocale(), signed, nonBreaking: true })
      : "—";

  return (
    <Typography
      accessibilityLabel={accessibilityLabel ?? (value != null && Number.isFinite(value) ? formatMoney(value, { locale: locale ?? getLocale(), signed }) : undefined)}
      textBreakStrategy="simple"
      style={[
        variantStyles[variant],
        { fontVariant: ["tabular-nums"], flexShrink: 1 },
        color ? { color } : null,
        style,
      ]}
    >
      {formatted}
    </Typography>
  );
}
