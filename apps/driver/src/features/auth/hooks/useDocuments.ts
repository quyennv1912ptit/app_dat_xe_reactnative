import { request } from "@/lib/api";
import { useState } from "react";
import { skipToken, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getFirebaseUser, getVehicleCatalog, vehicleCatalogQueryKey, type BookingVehicleType, type VehicleTransmission } from "@datxe/shared";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { extractDocumentEkyc, getDriverDocuments, getDriverProfile, getDriverSkills, submitDocument, updateDriverLicense, uploadDocumentImage } from "../api";
import { documentExpiry, documentNumber, documentUpdate } from "../onboardingValidation";

type Draft = {
  number?: string;
  licenseClass?: string;
  years?: string;
  expiry?: string;
  vehicleType?: BookingVehicleType;
  transmission?: VehicleTransmission;
  images?: Record<string, string>;
};

const warningLabels: Record<string, string> = {
  IMAGE_BLURRY: "Ảnh bị mờ hoặc rung tay. Chữ có thể khó đọc.",
  IMAGE_GLARE: "Ảnh bị chói hoặc lóa sáng đèn.",
  WRONG_DOCUMENT_TYPE: "Ảnh không đúng loại giấy tờ yêu cầu.",
  DOCUMENT_SLOT_MISMATCH: "Ảnh có thể sai mặt giấy tờ (trước/sau).",
  LOW_RESOLUTION: "Độ phân giải ảnh thấp, chữ khó đọc.",
  ORIENTATION_UNCERTAIN: "Chưa xác định đúng chiều thẻ. Hãy chụp thẳng thẻ.",
  LOW_KEYPOINT_CONFIDENCE: "Hãy chụp đủ 4 góc của thẻ.",
  DETECTOR_NO_BOX: "Không tìm thấy vùng thẻ trong ảnh.",
  CARD_QUALITY_REJECTED: "Ảnh thẻ không đạt kiểm tra chất lượng.",
};

export function useDocuments(identity: boolean) {
  const client = useQueryClient();
  const router = useRouter();
  const uid = getFirebaseUser()?.uid;
  const key = ["driverDraft", "documents", uid, identity];
  const { data: draft = {} } = useQuery<Draft>({ queryKey: key, queryFn: skipToken });
  const documents = useQuery({ queryKey: ["driver", "documents"], queryFn: getDriverDocuments });
  const profile = useQuery({ queryKey: ["driver", "profile"], queryFn: getDriverProfile });
  const catalog = useQuery({ queryKey: vehicleCatalogQueryKey, queryFn: ({ signal }) => getVehicleCatalog(request, signal) ?? null, enabled: !identity, staleTime: 300_000 });
  const skills = useQuery({ queryKey: ["driver", "skills"], queryFn: getDriverSkills });
  const [source, setSource] = useState<string | null>(null);
  const [picking, setPicking] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [extracting, setExtracting] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<Record<string, string[]>>({});
  const [pickError, setPickError] = useState<{ type: string; message: string } | null>(null);
  const types = identity ? ["CCCD", "CCCD_BACK", "SELFIE"] : ["DRIVER_LICENSE", "DRIVER_LICENSE_BACK"];
  const currentDocument = documents.data?.find((doc) => doc.document_type === types[0]);
  const number = draft.number ?? currentDocument?.document_number ?? (identity ? "" : profile.data?.license_number ?? "");
  const licenseClass = draft.licenseClass ?? profile.data?.license_class ?? "";
  const years = draft.years ?? (profile.data?.years_of_experience == null ? "" : String(profile.data.years_of_experience));
  const expiry = draft.expiry ?? currentDocument?.expires_at ?? "";
  const vehicleType = draft.vehicleType ?? skills.data?.[0]?.vehicle_type ?? "CAR";
  const transmission = draft.transmission ?? skills.data?.[0]?.transmission ?? "AUTO";
  const images = draft.images ?? {};
  const update = (fields: Partial<Draft>) => {
    if (uid && getFirebaseUser()?.uid === uid) client.setQueryData<Draft>(key, (current) => ({ ...current, ...fields }));
  };

  const extract = async (type: string, overrideUri?: string) => {
    const uri = overrideUri ?? images[type] ?? documents.data?.find((doc) => doc.document_type === type)?.secure_url;
    if (!uri) return;
    const slot = type === "DRIVER_LICENSE" ? "gplx_front"
      : type === "DRIVER_LICENSE_BACK" ? "gplx_back"
      : type === "CCCD" ? "cccd_front"
      : type === "CCCD_BACK" ? "cccd_back" : null;
    if (!slot) return;
    setExtracting(type);
    try {
      const cacheKey = ["ekyc", "extract", slot, uri] as const;
      const cached = client.getQueryData<Awaited<ReturnType<typeof extractDocumentEkyc>>>(cacheKey);
      const result = cached ?? await extractDocumentEkyc(slot, uri);
      if (!cached) client.setQueryData(cacheKey, result);
      const rawWarnings = result.warnings ?? [];
      const translated = rawWarnings.map((w) => warningLabels[w] ?? w);
      const candidates = result.candidates ?? [];
      const valid = candidates.filter((c) => c.parseStatus === "parsed" && c.validationStatus === "valid");
      const getStr = (...keys: string[]) => {
        const match = valid.find((c) => keys.includes(c.fieldKey) && typeof c.candidateValue === "string");
        return typeof match?.candidateValue === "string" ? match.candidateValue : undefined;
      };
      if (type === "DRIVER_LICENSE") {
        const updates: Partial<Draft> = {};
        const gNum = getStr("id_number", "gplx_number");
        const gClassRaw = valid.find((c) => ["vehicle_class", "gplx_classes"].includes(c.fieldKey))?.candidateValue;
        const gClass = Array.isArray(gClassRaw)
          ? String(gClassRaw[0] ?? "")
          : typeof gClassRaw === "string"
            ? gClassRaw.split(/[,;\s]+/)[0] ?? gClassRaw
            : undefined;
        const expiryCandidate = valid.find((c) => ["expiry", "expiry_date"].includes(c.fieldKey))?.candidateValue;
        if (gNum) updates.number = gNum;
        if (gClass) updates.licenseClass = gClass.toUpperCase();
        if (expiryCandidate && typeof expiryCandidate === "object" && "no_expiry" in expiryCandidate) {
          const obj = expiryCandidate as { no_expiry?: boolean; expiry_date?: string | null };
          if (obj.no_expiry === true) {
            updates.expiry = "";
            translated.push("GPLX không thời hạn");
          } else if (typeof obj.expiry_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(obj.expiry_date)) {
            updates.expiry = obj.expiry_date;
          }
        } else if (typeof expiryCandidate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(expiryCandidate)) {
          updates.expiry = expiryCandidate;
        }
        if (Object.keys(updates).length) update(updates);
      } else if (type === "CCCD") {
        const updates: Partial<Draft> = {};
        const cId = getStr("id_number", "cccd_id");
        const expiryCandidate = valid.find((c) => ["expiry", "cccd_expiry_date"].includes(c.fieldKey))?.candidateValue;
        const exp = expiryCandidate && typeof expiryCandidate === "object" && "expiry_date" in expiryCandidate
          ? (expiryCandidate as { expiry_date?: string | null }).expiry_date
          : typeof expiryCandidate === "string" ? expiryCandidate : undefined;
        if (cId) updates.number = cId;
        if (typeof exp === "string" && /^\d{4}-\d{2}-\d{2}$/.test(exp)) updates.expiry = exp;
        if (Object.keys(updates).length) update(updates);
      }
      setWarnings((prev) => ({ ...prev, [type]: translated }));
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Không thể đọc thông tin từ ảnh.";
      setWarnings((prev) => ({ ...prev, [type]: [msg] }));
    } finally {
      setExtracting(null);
    }
  };

  const pick = async (type: string, camera: boolean) => {
    setSource(null);
    setPicking(type);
    setPickError(null);
    try {
      if (camera && !(await ImagePicker.requestCameraPermissionsAsync()).granted)
        throw new Error("Cần cấp quyền camera để chụp giấy tờ.");
      const options: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], quality: 0.95 };
      const result = camera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
      const asset = result.assets?.[0];
      if (!result.canceled && asset) {
        update({ images: { ...images, [type]: asset.uri } });
        if (type === "DRIVER_LICENSE" || type === "CCCD") {
          void extract(type, asset.uri);
        }
      }
    } catch (error) {
      setPickError({ type, message: error instanceof Error ? error.message : "Không mở được ảnh." });
    } finally {
      setPicking(null);
    }
  };

  const requireAccount = () => {
    if (!uid || uid !== getFirebaseUser()?.uid) throw new Error("Phiên đăng nhập đã thay đổi.");
  };
  const save = useMutation({
    mutationFn: async () => {
      requireAccount();
      const num = documentNumber(number, identity);
      const expires = documentExpiry(expiry);
      if (!documents.data || !profile.data || (!identity && !skills.data)) throw new Error("Chưa tải được hồ sơ. Hãy thử lại.");
      if (!identity && (!licenseClass.trim() || licenseClass.length > 10 || !/^\d+$/.test(years) || !Number.isSafeInteger(Number(years))))
        throw new Error("Nhập hạng bằng và số năm kinh nghiệm hợp lệ.");
      for (const type of types) {
        if (!images[type] && !documents.data.some((doc) => doc.document_type === type)) throw new Error("Cần đủ ảnh giấy tờ trước khi gửi.");
      }

      const submitted = [];
      try {
        for (const type of types) {
          requireAccount();
          const current = documents.data.find((doc) => doc.document_type === type);
          if (images[type]) setUploading(type);
          const uploaded = images[type] ? await uploadDocumentImage(images[type]) : undefined;
          requireAccount();
          const body = documentUpdate(type, num, identity ? null : expires, current, uploaded);
          if (body) {
            submitted.push(await submitDocument(body));
            if (uploaded) {
              client.setQueryData<Draft>(key, (previous) => {
                if (!previous?.images || getFirebaseUser()?.uid !== uid) return previous;
                const remaining = { ...previous.images };
                delete remaining[type];
                return { ...previous, images: remaining };
              });
            }
          }
        }
      } finally {
        setUploading(null);
      }
      requireAccount();
      if (!identity && skills.data) {
        const normalizedClass = licenseClass.trim().toUpperCase();
        await updateDriverLicense({ license_number: num, license_class: normalizedClass, years_of_experience: Number(years),
          license_image_url: submitted.find((doc) => doc?.document_type === "DRIVER_LICENSE")?.secure_url ?? currentDocument?.secure_url ?? profile.data.license_image_url });
        requireAccount();

      }
    },
    onSuccess: async () => {
      if (getFirebaseUser()?.uid !== uid) return;
      await client.invalidateQueries({ queryKey: ["driver"] });
      client.setQueryData<Draft>(key, {});
      if (getFirebaseUser()?.uid === uid) router.push(identity ? "/(auth)/approval-status" : "/(auth)/verify-id");
    },
    onError: () => client.invalidateQueries({ queryKey: ["driver", "documents"] }),
  });

  return {
    catalog: catalog.data, documents, profile, skills, number, licenseClass, years, expiry, vehicleType, transmission, types, images,
    update, source, setSource, picking, pick, pickError, uploading, extracting, warnings, extract, save,
    error: save.error?.message || documents.error?.message || profile.error?.message || skills.error?.message,
  };
}
