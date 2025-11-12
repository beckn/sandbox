import { readFileSync } from "fs";
import path from "path";

const RESPONSES_BASE_PATH = path.resolve(__dirname, "../webhook/jsons");

export const normalizeDomain = (domain: string) => {
  if (!domain) {
    return domain;
  }
  return domain.replace(/:\d+(?:\.\d+)*$/, "");
};

export const readDomainResponse = async (domain: string, action: string) => {
  const normalizedDomain = normalizeDomain(domain);
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
      console.warn("File not found, returning empty object");
      return {};
    }
    throw error;
  }
};

