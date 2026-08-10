export type OptimizationCustomer = {
  id: string;
  firstName: string;
  lastVisitAt: Date | null;
  lifetimeValueCents: number;
  preferredServices: string[];
  marketingConsent: boolean;
  doNotContact: boolean;
};

export type OptimizationOpportunity = {
  customerId: string;
  type: "inactive_client" | "follow_up";
  title: string;
  reason: string;
  score: number;
  estimatedValueCents: number;
  metadata: Record<string, unknown>;
};

const DAY_MS = 86_400_000;

export function scoreCustomer(customer: OptimizationCustomer, now = new Date()): OptimizationOpportunity | null {
  if (!customer.marketingConsent || customer.doNotContact || !customer.lastVisitAt) return null;
  const inactiveDays = Math.max(0, Math.floor((now.getTime() - customer.lastVisitAt.getTime()) / DAY_MS));
  if (inactiveDays < 60) return null;

  const recencyScore = inactiveDays >= 180 ? 38 : inactiveDays >= 120 ? 32 : inactiveDays >= 90 ? 26 : 20;
  const valueScore = Math.min(30, Math.round(customer.lifetimeValueCents / 10_000) * 3);
  const serviceScore = Math.min(14, customer.preferredServices.length * 5);
  const timingScore = inactiveDays <= 240 ? 14 : 8;
  const score = Math.min(100, recencyScore + valueScore + serviceScore + timingScore);
  const averageHistoricalTicket = customer.lifetimeValueCents > 0 ? Math.min(35_000, Math.max(7_000, Math.round(customer.lifetimeValueCents / 6))) : 12_000;

  return {
    customerId: customer.id,
    type: "inactive_client",
    title: `Ricontatta ${customer.firstName}`,
    reason: `Non prenota da ${inactiveDays} giorni${customer.preferredServices[0] ? ` · interesse: ${customer.preferredServices[0]}` : ""}`,
    score,
    estimatedValueCents: averageHistoricalTicket,
    metadata: { inactiveDays, preferredServices: customer.preferredServices, algorithmVersion: "1.0.0" },
  };
}

export function rankOpportunities(customers: OptimizationCustomer[], limit = 25, now = new Date()) {
  return customers.map((customer) => scoreCustomer(customer, now)).filter((item): item is OptimizationOpportunity => Boolean(item)).sort((left, right) => right.score - left.score || right.estimatedValueCents - left.estimatedValueCents).slice(0, limit);
}

export function estimateEmptySlotScore(input: { hoursUntilSlot: number; matchingCustomers: number; valueCents: number }) {
  const urgency = input.hoursUntilSlot <= 24 ? 35 : input.hoursUntilSlot <= 72 ? 25 : 15;
  const matchStrength = Math.min(40, input.matchingCustomers * 6);
  const value = Math.min(25, Math.round(input.valueCents / 2_000));
  return Math.min(100, urgency + matchStrength + value);
}

