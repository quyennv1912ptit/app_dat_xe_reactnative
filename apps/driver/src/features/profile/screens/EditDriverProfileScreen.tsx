import { DriverPage } from "@/components/DriverPage";
import { request } from "@/lib/api";
import { useSessionStore } from "@/lib/store";
import { AUTH_FULL_NAME_MAX_LENGTH, getAuthFullNameValidationError, type AuthProfile } from "@datxe/shared";
import { Button, Card, PaperTextInput as TextInput, SectionHeading, Typography, useThemeColors } from "@datxe/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet } from "react-native";

import { updateDriverIdentity } from "../api";

export default function EditDriverProfileScreen() {
  const router = useRouter();
  const client = useQueryClient();
  const colors = useThemeColors();
  const session = useQuery({ queryKey: ["driver", "session"], queryFn: () => request<AuthProfile>("/auth/me") });
  const profile = session.data;
  const [draft, setDraft] = useState<{ id: number; fullName: string; email: string } | null>(null);
  const fields = profile && draft?.id === profile.id ? draft : { id: profile?.id ?? 0, fullName: profile?.fullName ?? "", email: profile?.email ?? "" };
  const nameError = getAuthFullNameValidationError(fields.fullName);
  const email = fields.email.trim();
  const emailError = email.length > 255 || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
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
  const changed = fields.fullName.trim() !== (profile?.fullName ?? "") || email !== (profile?.email ?? "");
  return (
    <DriverPage title="Thông tin cá nhân" loading={session.isLoading} error={session.error?.message || save.error?.message} retry={session.error ? session.refetch : undefined}>
      {profile ? (
        <>
          <SectionHeading title="Thông tin liên hệ" />
          <Card style={styles.form}>
            <TextInput label="Họ và tên" mode="flat" underlineColor={colors.transparent} value={fields.fullName}
              maxLength={AUTH_FULL_NAME_MAX_LENGTH} editable={!save.isPending} error={Boolean(draft && nameError)}
              onChangeText={(fullName) => setDraft({ ...fields, fullName })} />
            {draft && nameError ? <Typography style={{ color: colors.error }}>{nameError}</Typography> : null}
            <TextInput label="Email liên hệ" mode="flat" underlineColor={colors.transparent} value={fields.email}
              keyboardType="email-address" autoCapitalize="none" autoCorrect={false} maxLength={255}
              editable={!save.isPending} error={Boolean(emailError)} onChangeText={(value) => setDraft({ ...fields, email: value })} />
            {emailError ? <Typography style={{ color: colors.error }}>Email không hợp lệ.</Typography> : null}
            <Typography style={{ fontSize: 13, color: colors.onSurfaceVariant }}>Số điện thoại đã xác minh</Typography>
            <Typography>{profile.phoneNumber ?? "Chưa có số điện thoại"}</Typography>
          </Card>
          <Button label="Lưu thông tin" loading={save.isPending} disabled={!changed || Boolean(nameError) || Boolean(emailError)}
            onPress={() => save.mutate({ id: profile.id, fullName: fields.fullName.trim(), email: email || null })} />
        </>
      ) : null}
    </DriverPage>
  );
}

const styles = StyleSheet.create({ form: { gap: 12 } });
