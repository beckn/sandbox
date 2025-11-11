import { readFile } from "fs/promises";
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
    const fileContents = await readFile(targetPath, "utf-8");
    return JSON.parse(fileContents);
  } catch (error: any) {
    if (error?.code === "ENOENT") {
      return {};
    }
    throw error;
  }
};

