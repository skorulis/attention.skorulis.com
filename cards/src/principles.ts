import { readFile, writeFile } from "node:fs/promises";
import { principlesJsonPath } from "./paths.js";
import type { Principle, PrinciplesData } from "./types.js";

export async function loadPrinciples(): Promise<Principle[]> {
  const data = JSON.parse(await readFile(principlesJsonPath, "utf8")) as PrinciplesData;
  return data.principles;
}

export async function savePrinciples(principles: Principle[]): Promise<void> {
  const data: PrinciplesData = { principles };
  await writeFile(principlesJsonPath, JSON.stringify(data, null, 2) + "\n");
}
