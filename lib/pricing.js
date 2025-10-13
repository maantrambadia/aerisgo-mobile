import { apiFetch } from "./api";

export async function getPriceBreakdown({
  baseFare,
  travelClass,
  isExtraLegroom = false,
}) {
  const { data } = await apiFetch("/pricing/breakdown", {
    method: "POST",
    auth: true,
    body: { baseFare, travelClass, isExtraLegroom },
  });
  return data;
}
