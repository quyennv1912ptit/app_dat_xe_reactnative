import { Button, Typography, useThemeColors } from "@datxe/ui";
import type { ReactNode } from "react";
import { KeyboardAvoidingView, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { Dialog, Portal } from "react-native-paper";

export function DriverConfirmationDialog({ title, description, confirmLabel, dismissLabel, visible, busy, disabled, destructive = true, error, onDismiss, onConfirm, children }: {
  title: string;
  description: string;
  confirmLabel: string;
  dismissLabel: string;
  visible: boolean;
  busy: boolean;
  disabled?: boolean;
  destructive?: boolean;
  error?: string;
  onDismiss: () => void;
  onConfirm: () => void;
  children?: ReactNode;
}) {
  const colors = useThemeColors();
  const { height } = useWindowDimensions();
  const maxBodyHeight = Math.max(120, Math.round(height * 0.42));
  return (
    <Portal>
      <KeyboardAvoidingView behavior="padding" pointerEvents="box-none" style={styles.keyboardHost}>
        <Dialog visible={visible} onDismiss={onDismiss} dismissable={!busy} dismissableBackButton={!busy}
          style={{ backgroundColor: colors.surfaceContainerHigh, borderRadius: 28 }}>
          <Dialog.Title>{title}</Dialog.Title>
          <Dialog.ScrollArea style={[styles.scrollArea, { maxHeight: maxBodyHeight }]}>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
              <Typography>{description}</Typography>
              {children}
              {error ? <Typography accessibilityRole="alert" style={{ color: colors.error }}>{error}</Typography> : null}
            </ScrollView>
          </Dialog.ScrollArea>
          <View style={styles.actions}>
            <Button label={confirmLabel} onPress={onConfirm} loading={busy} disabled={disabled}
              style={[styles.button, { backgroundColor: disabled || busy ? colors.disabled : destructive ? colors.error : colors.primary }]}
              contentColor={disabled || busy ? colors.disabledText : destructive ? colors.onError : colors.onPrimary} />
            <Button label={dismissLabel} onPress={onDismiss} variant="ghost" disabled={busy} style={styles.button} />
          </View>
        </Dialog>
      </KeyboardAvoidingView>
    </Portal>
  );
}

const styles = StyleSheet.create({
  keyboardHost: { flex: 1, justifyContent: "center" },
  scrollArea: { paddingHorizontal: 0, borderTopWidth: 0, borderBottomWidth: 0 },
  content: { paddingHorizontal: 24, paddingBottom: 12, gap: 12 },
  actions: { paddingHorizontal: 24, paddingBottom: 20, paddingTop: 4, gap: 8 },
  button: { minHeight: 48 },
});
