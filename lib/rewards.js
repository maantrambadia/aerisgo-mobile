import { apiFetch } from "./api";

// Get user's reward balance and stats
export async function getRewardBalance() {
  const res = await apiFetch("/rewards/balance", {
    method: "GET",
    auth: true,
  });
  return res.data;
}

// Get reward transaction history
export async function getRewardHistory({ page = 1, limit = 20, type } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (type) params.set("type", type);

  const res = await apiFetch(`/rewards/history?${params.toString()}`, {
    method: "GET",
    auth: true,
  });
  return res.data;
}

// Redeem points
export async function redeemPoints({ points, description }) {
  const res = await apiFetch("/rewards/redeem", {
    method: "POST",
    auth: true,
    json: { points, description },
  });
  return res.data;
}
