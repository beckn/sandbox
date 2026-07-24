import { readFileSync } from "fs";
import path from "path";

const RESPONSES_BASE_PATH = path.resolve(__dirname, "../webhook/jsons");

export const normalizeDomain = (domain: string) => {
  if (!domain) {
    return domain;
  }
  // replace colons with dots for Windows-compatible dir names, then strip version suffix
  return domain.replace(/:/g, ".").replace(/\.\d+(?:\.\d+)*$/, "");
};

/**
 * Resolves the domain identifier from a beckn context object.
 * Falls back to networkId if domain is absent.
 */
export const resolveDomain = (context: any): string => {
  return context.domain || context.network_id || context.networkId;
};

/**
 * Replaces {{VAR}} / {{VAR:-default}} placeholders in a fixture with the value
 * of environment variable VAR, falling back to the inline default (or leaving
 * the placeholder untouched if neither is set). Lets a mounted response fixture
 * be re-pointed via env without editing the file, e.g.:
 *   "ledgerUri": "{{SELLER_LEDGER_URI:-http://seller-discom-ledger.example.com:9000}}"
 */
const substituteEnvVars = (contents: string): string =>
  contents.replace(
    /\{\{(\w+)(?::-([^}]*))?\}\}/g,
    (match, key: string, fallback?: string) => {
      const value = process.env[key];
      if (value !== undefined && value !== "") return value;
      return fallback !== undefined ? fallback : match;
    }
  );

export const readDomainResponse = async (
  domain: string,
  action: string,
  persona?: string
) => {
  const normalizedDomain = normalizeDomain(domain);

  // If persona is specified, try persona-specific path first
  if (persona) {
    const personaPath = path.join(
      RESPONSES_BASE_PATH,
      normalizedDomain,
      "response",
      persona,
      `${action}.json`
    );

    try {
      const fileContents = readFileSync(personaPath, "utf-8");
      const parsed = JSON.parse(substituteEnvVars(fileContents));
      return parsed;
    } catch (error: any) {
      if (error?.code !== "ENOENT") {
        throw error;
      }
      // Fall through to default path if persona file not found
    }
  }

  // Default path (backward compatible)
  const targetPath = path.join(
    RESPONSES_BASE_PATH,
    normalizedDomain,
    "response",
    `${action}.json`
  );

  try {
    const fileContents = readFileSync(targetPath, "utf-8");
    const parsed = JSON.parse(fileContents);
    return parsed;
  } catch (error: any) {
    if (error?.code === "ENOENT") {
      console.warn(`File not found: ${targetPath}, returning empty object`);
      return {};
    }
    throw error;
  }
};

