import { writeFile } from "node:fs/promises";
import type { CardStyle } from "./styles.js";

export function buildPrompt(imagePrompt: string, style: CardStyle): string {
  return `${imagePrompt}. ${style.prompt}. Portrait composition. No text, letters, numbers, words, logos or watermarks anywhere. Keep the lower half of the image simple and uncluttered.`;
}

export async function generateBackground(prompt: string, outPath: string): Promise<void> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt,
      size: "1024x1536",
      quality: "medium",
      n: 1,
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI image generation failed (${res.status}): ${await res.text()}`);
  }

  const json = (await res.json()) as { data?: { b64_json?: string }[] };
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error("OpenAI response did not include image data");
  }
  await writeFile(outPath, Buffer.from(b64, "base64"));
}
