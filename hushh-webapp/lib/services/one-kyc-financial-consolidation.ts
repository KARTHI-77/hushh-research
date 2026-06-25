"use client";

/**
 * Deterministic, client-side financial consolidation for the KYC approved-disclosure
 * draft. Runs BEFORE tokenization (zero-knowledge): the LLM never sees real numbers.
 * Reuses the tested per-security merge math from portfolio-normalize.
 */

type AnyRecord = Record<string, unknown>;

export type ConsolidatedAccount = {
  label: string | null;
  endingValue: number | null;
  cashBalance: number | null;
  generatedAt: string | null;
};

export type CollectedAccount = {
  account: ConsolidatedAccount;
  holdings: AnyRecord[];
  key: string;
};

export function isRecord(value: unknown): value is AnyRecord {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const text = value.trim();
    if (!text) return null;
    const negative = text.startsWith("(") && text.endsWith(")");
    const sanitized = text.replace(/[,$\s]/g, "").replace(/%/g, "").replace(/[()]/g, "");
    const parsed = Number(negative ? `-${sanitized}` : sanitized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function toText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.replace(/\s+/g, " ").trim();
  return text ? text : null;
}

function recordField(record: AnyRecord | null, keys: string[]): unknown {
  if (!record) return undefined;
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null && record[key] !== "") {
      return record[key];
    }
  }
  return undefined;
}

export function accountLabel(accountInfo: AnyRecord | null): string | null {
  if (!accountInfo) return null;
  const brokerage = toText(
    recordField(accountInfo, ["brokerage_name", "brokerage", "institution_name"])
  );
  const type = toText(recordField(accountInfo, ["account_type"]));
  if (brokerage && type) return `${brokerage} ${type}`;
  return brokerage || type || toText(recordField(accountInfo, ["account_holder", "holder_name"]));
}

export function collectAccounts(portfolio: AnyRecord): CollectedAccount[] {
  const rawAccounts =
    Array.isArray(portfolio.accounts) && portfolio.accounts.length
      ? portfolio.accounts.filter(isRecord)
      : [portfolio];

  return rawAccounts.map((acct) => {
    const info = isRecord(acct.account_info) ? acct.account_info : null;
    const summary = isRecord(acct.account_summary) ? acct.account_summary : null;
    const holdings = Array.isArray(acct.holdings) ? acct.holdings.filter(isRecord) : [];
    const label = accountLabel(info);
    const endingValue =
      toNumber(acct.total_value) ??
      toNumber(recordField(summary, ["ending_value", "total_value"]));
    const cashBalance =
      toNumber(acct.cash_balance) ?? toNumber(recordField(summary, ["cash_balance"]));
    const generatedAt = toText(
      acct.generated_at ?? acct.updated_at ?? (summary ? summary.generated_at : undefined)
    );
    const accountNumber = toText(recordField(info, ["account_number"]));
    const key = `${label ?? ""}|${accountNumber ?? ""}`;
    return {
      account: { label, endingValue, cashBalance, generatedAt },
      holdings,
      key,
    };
  });
}

export function dedupAccountsByFreshest(collected: CollectedAccount[]): CollectedAccount[] {
  const byKey = new Map<string, CollectedAccount>();
  collected.forEach((item, index) => {
    // An account with no label and no account number has no stable identity:
    // keep it distinct so we never merge two unrelated accounts.
    if (item.key.replace(/\|/g, "") === "") {
      byKey.set(`__unique_${index}`, item);
      return;
    }
    const existing = byKey.get(item.key);
    if (!existing) {
      byKey.set(item.key, item);
      return;
    }
    // ISO-8601 timestamps compare correctly as strings; freshest wins.
    const existingAt = existing.account.generatedAt ?? "";
    const incomingAt = item.account.generatedAt ?? "";
    if (incomingAt > existingAt) byKey.set(item.key, item);
  });
  return Array.from(byKey.values());
}
