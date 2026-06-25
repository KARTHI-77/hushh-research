import { describe, expect, it } from "vitest";

import {
  collectAccounts,
  dedupAccountsByFreshest,
} from "@/lib/services/one-kyc-financial-consolidation";

describe("collectAccounts", () => {
  it("treats a single portfolio object as one account", () => {
    const collected = collectAccounts({
      account_info: { brokerage_name: "Fidelity", account_type: "Individual TOD" },
      account_summary: { ending_value: 1000, cash_balance: 50 },
      holdings: [{ symbol: "AAPL", quantity: 10, market_value: 900 }],
    });
    expect(collected).toHaveLength(1);
    expect(collected[0]!.account.label).toBe("Fidelity Individual TOD");
    expect(collected[0]!.account.endingValue).toBe(1000);
    expect(collected[0]!.account.cashBalance).toBe(50);
    expect(collected[0]!.holdings).toHaveLength(1);
  });

  it("expands an accounts[] array into one entry per account", () => {
    const collected = collectAccounts({
      accounts: [
        {
          account_info: { brokerage_name: "Fidelity", account_type: "Individual" },
          account_summary: { ending_value: 1000 },
          holdings: [{ symbol: "AAPL", quantity: 100, market_value: 900 }],
          generated_at: "2026-01-31T00:00:00Z",
        },
        {
          account_info: { brokerage_name: "Schwab", account_type: "IRA" },
          account_summary: { ending_value: 2000 },
          holdings: [{ symbol: "AAPL", quantity: 200, market_value: 1800 }],
          generated_at: "2026-02-15T00:00:00Z",
        },
      ],
    });
    expect(collected).toHaveLength(2);
    expect(collected.map((c) => c.account.label)).toEqual([
      "Fidelity Individual",
      "Schwab IRA",
    ]);
  });
});

describe("dedupAccountsByFreshest", () => {
  it("keeps the freshest copy of a duplicated account by generatedAt", () => {
    const collected = collectAccounts({
      accounts: [
        {
          account_info: { brokerage_name: "Fidelity", account_type: "IRA", account_number: "X1" },
          account_summary: { ending_value: 1000 },
          holdings: [{ symbol: "AAPL", quantity: 100, market_value: 900 }],
          generated_at: "2026-01-31T00:00:00Z",
        },
        {
          account_info: { brokerage_name: "Fidelity", account_type: "IRA", account_number: "X1" },
          account_summary: { ending_value: 1100 },
          holdings: [{ symbol: "AAPL", quantity: 110, market_value: 990 }],
          generated_at: "2026-02-28T00:00:00Z",
        },
      ],
    });
    const deduped = dedupAccountsByFreshest(collected);
    expect(deduped).toHaveLength(1);
    expect(deduped[0]!.account.endingValue).toBe(1100);
    expect(deduped[0]!.account.generatedAt).toBe("2026-02-28T00:00:00Z");
  });

  it("keeps accounts with no identity key distinct", () => {
    const collected = collectAccounts({
      accounts: [
        { account_summary: { ending_value: 1 }, holdings: [] },
        { account_summary: { ending_value: 2 }, holdings: [] },
      ],
    });
    expect(dedupAccountsByFreshest(collected)).toHaveLength(2);
  });
});
