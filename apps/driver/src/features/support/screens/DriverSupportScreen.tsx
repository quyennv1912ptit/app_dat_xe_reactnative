import { DriverPage } from "@/components/DriverPage";
import { useSupportRequests } from "@/lib/useSupportRequests";
import { pickSupportImage } from "@/lib/supportImages";
import { SupportCenter } from "@datxe/ui";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function DriverSupportScreen() {
  const router = useRouter();
  const support = useSupportRequests();
  const { rideId } = useLocalSearchParams<{ rideId?: string }>();
  return (
    <DriverPage
      title="Trợ giúp"
      loading={support.loading}
      error={support.error}
      retry={support.retry}
    >
      <SupportCenter
        {...support}
        initialRideId={Number(rideId) || undefined}
        pickImage={pickSupportImage}
        onOpenRide={(id) => router.push({ pathname: "/ride/complete", params: { rideId: String(id) } })}
        onRefresh={() => void support.retry()}
      />
    </DriverPage>
  );
}
