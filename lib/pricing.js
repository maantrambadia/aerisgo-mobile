import { apiFetch } from "./api";

export async function getPriceBreakdown(seatId) {
  const { data } = await apiFetch(`/pricing/breakdown`, {
    method: "POST",
    body: { seatId },
  });
  return data;
}

export async function getDynamicPrice(
  flightId,
  travelClass,
  isExtraLegroom = false,
  seatType = "standard"
) {
  const params = new URLSearchParams({
    travelClass,
    isExtraLegroom: String(isExtraLegroom),
    seatType,
  });

  const { data } = await apiFetch(
    `/pricing/dynamic/${flightId}?${params.toString()}`,
    { method: "GET" }
  );
  return data;
}

export async function getPricingConfig() {
  const { data } = await apiFetch(`/pricing/config`, {
    method: "GET",
  });
  return data;
}
