import fs from "node:fs";
import path from "node:path";

export interface AccountConfig {
  id: string;
  platform: string;
  handle: string;
}

export interface AppConfig {
  recentDays: number;
  accounts: AccountConfig[];
}

export function loadConfig(configPath = "accounts.json"): AppConfig {
  const resolved = path.resolve(configPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(
      `Missing ${resolved}. Copy accounts.example.json to accounts.json and fill in your accounts.`,
    );
  }

  const raw: unknown = JSON.parse(fs.readFileSync(resolved, "utf8"));
  return validateConfig(raw);
}

function validateConfig(raw: unknown): AppConfig {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("accounts.json must be an object");
  }

  const obj = raw as Record<string, unknown>;
  const recentDays = obj.recentDays === undefined ? 14 : obj.recentDays;
  if (typeof recentDays !== "number" || !Number.isInteger(recentDays) || recentDays < 1) {
    throw new Error("recentDays must be a positive integer");
  }

  if (!Array.isArray(obj.accounts) || obj.accounts.length === 0) {
    throw new Error("accounts.json must include a non-empty accounts array");
  }

  const accounts = obj.accounts.map((item, index) => validateAccount(item, index));
  const ids = new Set<string>();
  for (const account of accounts) {
    if (ids.has(account.id)) {
      throw new Error(`Duplicate account id: ${account.id}`);
    }
    ids.add(account.id);
  }

  return { recentDays, accounts };
}

function validateAccount(raw: unknown, index: number): AccountConfig {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error(`accounts[${index}] must be an object`);
  }

  const obj = raw as Record<string, unknown>;
  const id = requireNonEmptyString(obj.id, `accounts[${index}].id`);
  const platform = requireNonEmptyString(obj.platform, `accounts[${index}].platform`);
  const handle = requireNonEmptyString(obj.handle, `accounts[${index}].handle`);
  return { id, platform, handle };
}

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value.trim();
}
