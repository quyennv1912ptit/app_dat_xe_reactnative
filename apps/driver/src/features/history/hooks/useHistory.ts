import { useInfiniteQuery } from "@tanstack/react-query";
import type { DriverRideFilterParams } from "@/lib/driverApi";
import { useRefreshOnFocus } from "@/lib/useRefreshOnFocus";
import { historyApi } from "../api";

export function useHistory(statusOrFilters?: string | DriverRideFilterParams) {
  const raw = typeof statusOrFilters === "string"
    ? { status: statusOrFilters }
    : (statusOrFilters ?? {});
  const status = raw.status?.trim() || undefined;
  const q = raw.q?.trim() || undefined;
  const createdFrom = raw.createdFrom || undefined;
  const createdTo = raw.createdTo || undefined;
  const normalized: DriverRideFilterParams = {
    ...(status ? { status } : {}),
    ...(q ? { q } : {}),
    ...(createdFrom ? { createdFrom } : {}),
    ...(createdTo ? { createdTo } : {}),
  };

  const query = useInfiniteQuery({
    queryKey: [
      "driver",
      "history",
      normalized.status ?? null,
      normalized.q ?? null,
      normalized.createdFrom ?? null,
      normalized.createdTo ?? null,
    ],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => historyApi.rides(pageParam, normalized),
    getNextPageParam: (last) => (last?.hasNext ? last.page + 1 : undefined),
  });
  useRefreshOnFocus(query.refetch);
  return query;
}
