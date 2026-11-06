import { DriverReceptionStatus } from "@/components/DriverReceptionStatus";
import { DriverPage } from "@/components/DriverPage";
import { DriverChatButton } from "@/components/DriverChatButton";
import { StatusBadge } from "@/components/StatusBadge";
import { vehicleTypeLabel, transmissionLabel } from "@/lib/displayLabels";
import { rideStyles as s } from "@/components/rideStyles";
import type { DriverDocument } from "@datxe/shared";
import {
  Button,
  Card,
  MotionPressable as Pressable,
  Typography as Text,
  useThemedStyles,
} from "@datxe/ui";
import { useState } from "react";
import { RadioButton } from "react-native-paper";
import { useHome } from "../hooks/useHome";

const today = () => {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
};
const isExpired = (value: string | null | undefined) =>
  Boolean(value && value.slice(0, 10) < today());
const formatDate = (value: string) => {
  const [year, month, day] = value.slice(0, 10).split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
};
const currentLicense = (
  documents: DriverDocument[],
): DriverDocument | undefined =>
  documents.find(
    (document) =>
      document.document_type === "DRIVER_LICENSE" && document.is_current,
  );

export default function DriverHomeScreen() {
  const themed_s = useThemedStyles(s);
  const [vehicle, setVehicle] = useState<"CAR" | "MOTORCYCLE" | null>(null);
  const h = useHome();
  const online = h.session.data?.status === "ONLINE";
  const approved = h.verification.data?.verification_status === "APPROVED";
  const skills = h.skills.data ?? [];
  const verifiedSkills = skills.filter((skill) => skill.verified);
  const vehicleTypes = [...new Set(verifiedSkills.map((skill) => skill.vehicle_type))];
  const selected = vehicle && vehicleTypes.includes(vehicle) ? vehicle : vehicleTypes[0];
  const license = currentLicense(h.documents.data ?? []);
  const licenseExpired = isExpired(license?.expires_at);
  return (
    <DriverPage
      title="Trang chủ tài xế"
      tabs
      loading={h.session.isLoading || h.active.isLoading}
      error={
        h.session.error?.message ||
        h.verification.error?.message ||
        h.active.error?.message ||
        h.offer.error?.message ||
        h.skills.error?.message ||
        h.documents.error?.message ||
        h.availability.error?.message
      }
      retry={() =>
        Promise.all([
          h.session.refetch(),
          h.verification.refetch(),
          h.active.refetch(),
          h.offer.refetch(),
          h.skills.refetch(),
          h.documents.refetch(),
        ])
      }
    >
      {h.offer.data ? (
        <Card radius={20} style={themed_s.card}>
          <Text style={themed_s.title}>
            Yêu cầu chuyến #{h.offer.data.rideId}
          </Text>
          <Text style={themed_s.text}>
            {h.offer.data.pickup.address} → {h.offer.data.dropoff.address}
          </Text>
          <Button
            onPress={() => h.router.push({ pathname: "/ride/accept", params: { rideId: String(h.offer.data?.rideId) } })}
            style={themed_s.button}
            label={"Xem yêu cầu"}
            textStyle={themed_s.buttonText}
          />
        </Card>
      ) : null}

      {h.active.data ? (
        <Card radius={20} style={themed_s.card}>
          <Text style={themed_s.text}>
            Chuyến đang thực hiện #{h.active.data.id}
          </Text>
          <StatusBadge
            kind="ride"
            value={h.active.data.status}
            contextLabel="Trạng thái chuyến"
          />
          <Text style={themed_s.text}>
            {h.active.data.pickupAddress} → {h.active.data.dropoffAddress}
          </Text>
          <Button
            style={themed_s.button}
            onPress={() => h.router.push("/ride/in-progress")}
            label={"Tiếp tục chuyến"}
            textStyle={themed_s.buttonText}
          />
          <DriverChatButton ride={h.active.data} />
        </Card>
      ) : null}

      <Card radius={20} style={themed_s.card}>
        <Text style={themed_s.title}>
          {h.session.data?.fullName ?? "Tài xế"}
        </Text>
        {h.verification.data && !approved ? (
          <Pressable onPress={() => h.router.push("/(auth)/approval-status")}>
            <Text style={themed_s.link}>
              Hoàn tất hồ sơ xét duyệt để nhận chuyến
            </Text>
          </Pressable>
        ) : null}
      </Card>

      {licenseExpired ? (
        <Card radius={20} style={themed_s.card}>
          <Text style={themed_s.title}>Giấy phép lái xe đã hết hạn</Text>
          <Text style={themed_s.text}>
            Hạn trên GPLX là {formatDate(license?.expires_at ?? "")}. Bạn cần
            cập nhật ảnh và ngày hết hạn mới rồi được duyệt lại trước khi nhận
            chuyến.
          </Text>
          <Button
            label="Cập nhật GPLX"
            onPress={() => h.router.push("/(auth)/license-upload")}
            style={themed_s.button}
            textStyle={themed_s.buttonText}
          />
        </Card>
      ) : null}

      {!h.active.data && approved && h.session.data ? (
        <Card radius={20} style={themed_s.card}>
          <Text style={themed_s.title}>Nhận chuyến</Text>
          {online ? (
            <>
              <Text style={themed_s.text}>
                Chế độ nhận chuyến đã bật.
              </Text>
              <Button
                disabled={h.availability.isPending}
                onPress={() => h.availability.mutate({ online: false })}
                style={themed_s.button}
                label={"Tạm ngừng nhận chuyến"}
                numberOfLines={1}
                textStyle={themed_s.buttonText}
              />
            </>
          ) : licenseExpired ? (
            <Text style={themed_s.text}>
              Cập nhật giấy phép lái xe còn hạn trước khi bật nhận chuyến.
            </Text>
          ) : verifiedSkills.length ? (
            <>
              <RadioButton.Group value={selected ?? ""} onValueChange={(value) => {
                if (value === "CAR" || value === "MOTORCYCLE") setVehicle(value);
              }}>
                {vehicleTypes.map((type) => (
                  <RadioButton.Item key={type} value={type} label={vehicleTypeLabel(type)} disabled={h.availability.isPending} />
                ))}
              </RadioButton.Group>
              {verifiedSkills.filter((skill) => skill.vehicle_type === selected).map((skill) => (
                <Text key={skill.id} style={themed_s.label}>
                  {transmissionLabel(skill.transmission)}{skill.license_class ? ` · Hạng ${skill.license_class}` : ""}
                </Text>
              ))}
              <Button label="Bật nhận chuyến" style={themed_s.button} loading={h.availability.isPending} disabled={!selected}
                onPress={() => { if (selected) h.availability.mutate({ online: true, vehicle_type: selected }); }} />
            </>
          ) : (
            <Text style={themed_s.text}>
              Chưa có kỹ năng lái xe nào được quản trị viên duyệt nên bạn chưa
              thể nhận chuyến.
            </Text>
          )}

          {!verifiedSkills.length || !skills.length ? (
            <Pressable
              onPress={() =>
                h.router.push(
                  skills.length
                    ? "/(auth)/approval-status"
                    : "/(auth)/license-upload",
                )
              }
            >
              <Text style={themed_s.link}>
                {skills.length
                  ? "Xem trạng thái xét duyệt kỹ năng"
                  : "Đăng ký giấy phép lái xe và loại xe"}
              </Text>
            </Pressable>
          ) : null}
        </Card>
      ) : null}

      <DriverReceptionStatus onDetails={() => h.router.push("/settings/reception")} />
    </DriverPage>
  );
}
