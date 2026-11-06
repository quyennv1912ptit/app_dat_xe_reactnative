import { DriverPage } from "@/components/DriverPage";
import { request } from "@/lib/api";
import { useSessionStore } from "@/lib/store";
import { AUTH_FULL_NAME_MAX_LENGTH, getAuthFullNameValidationError, type AuthProfile } from "@datxe/shared";
import { Button, Card, PaperTextInput as TextInput, SectionHeading, Typography, useThemeColors } from "@datxe/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { StyleSheet } from "react-native";

import { updateDriverIdentity } from "../api";

export default function EditDriverProfileScreen() {
  const router = useRouter();
  const client = useQueryClient();
  const colors = useThemeColors();
  const session = useQuery({ queryKey: ["driver", "session"], queryFn: () => request<AuthProfile>("/auth/me") });
  const profile = session.data;
  // Keep editor text in a ref. Only publish validation and button state to React.
  const draft = useRef<{ id: number; fullName: string; email: string } | null>(null);
  const [validation, setValidation] = useState<{
    id: number;
    nameError: string | null;
    emailError: boolean;
    changed: boolean;
  } | null>(null);
  const initialName = profile?.fullName ?? "";
  const initialEmail = profile?.email ?? "";
  const currentValidation = validation && validation.id === profile?.id ? validation : null;
  const updateDraft = (patch: Partial<{ fullName: string; email: string }>) => {
    if (!profile) return;
    const previous = draft.current?.id === profile.id ? draft.current : { id: profile.id, fullName: initialName, email: initialEmail };
    const next = { ...previous, ...patch };
    draft.current = next;
    const email = next.email.trim();
    setValidation({
      id: profile.id,
      nameError: getAuthFullNameValidationError(next.fullName),
      emailError: email.length > 255 || Boolean(email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)),
      changed: next.fullName.trim() !== initialName || email !== initialEmail,
    });
  };
  const save = useMutation({
    mutationFn: async ({ id, fullName, email }: { id: number; fullName: string; email: string | null }) => {
      if (useSessionStore.getState().user?.id !== id) throw new Error("Phiên đăng nhập đã thay đổi.");
      const result = await updateDriverIdentity({ fullName, email });
      if (!result) throw new Error("Chưa nhận được thông tin hồ sơ đã lưu.");
      return result;
    },
    onSuccess: (identity, { id }) => {
      const user = useSessionStore.getState().user;
      if (user?.id !== id) return;
      const updated = { ...user, fullName: identity.fullName, email: identity.email ?? null };
      useSessionStore.getState().setUser(updated);
      client.setQueryData(["driver", "session"], updated);
      void client.invalidateQueries({ queryKey: ["driver", "session"] });
      if (router.canGoBack()) router.back();
      else router.replace("/(tabs)/profile");
    },
  });
  return (
    <DriverPage title="Thông tin cá nhân" loading={session.isLoading} error={session.error?.message || save.error?.message} retry={session.error ? session.refetch : undefined}>
      {profile ? (
        <>
          <SectionHeading title="Thông tin liên hệ" />
          <Card key={profile.id} style={styles.form}>
            <TextInput label="Họ và tên" mode="flat" underlineColor={colors.transparent} defaultValue={initialName}
              maxLength={AUTH_FULL_NAME_MAX_LENGTH} editable={!save.isPending} error={Boolean(currentValidation?.nameError)}
              onChangeText={(fullName) => updateDraft({ fullName })} />
            {currentValidation?.nameError ? <Typography style={{ color: colors.error }}>{currentValidation.nameError}</Typography> : null}
            <TextInput label="Email liên hệ" mode="flat" underlineColor={colors.transparent} defaultValue={initialEmail}
              keyboardType="email-address" autoCapitalize="none" autoCorrect={false} maxLength={255}
              editable={!save.isPending} error={Boolean(currentValidation?.emailError)} onChangeText={(value) => updateDraft({ email: value })} />
            {currentValidation?.emailError ? <Typography style={{ color: colors.error }}>Email không hợp lệ.</Typography> : null}
            <Typography style={{ fontSize: 13, color: colors.onSurfaceVariant }}>Số điện thoại đã xác minh</Typography>
            <Typography>{profile.phoneNumber ?? "Chưa có số điện thoại"}</Typography>
          </Card>
          <Button label="Lưu thông tin" loading={save.isPending} disabled={!currentValidation?.changed || Boolean(currentValidation.nameError) || currentValidation.emailError}
            onPress={() => {
              const current = draft.current;
              if (current?.id === profile.id) {
                save.mutate({ id: profile.id, fullName: current.fullName.trim(), email: current.email.trim() || null });
              }
            }} />
        </>
      ) : null}
    </DriverPage>
  );
}

const styles = StyleSheet.create({ form: { gap: 12 } });
