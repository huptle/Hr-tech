import { GoogleGenerativeAI } from "@google/generative-ai";

const DEFAULT_MODEL = "gemini-2.5-flash";

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

function getModel(jsonMode: boolean) {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) throw new Error("GEMINI_API_KEY is not set");
  const gen = new GoogleGenerativeAI(key);
  const name = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
  return gen.getGenerativeModel({
    model: name,
    ...(jsonMode
      ? { generationConfig: { responseMimeType: "application/json" as const } }
      : {}),
  });
}

function stripJsonFence(raw: string): string {
  let t = raw.trim();
  if (t.startsWith("```json")) t = t.slice(7);
  else if (t.startsWith("```")) t = t.slice(3);
  if (t.endsWith("```")) t = t.slice(0, -3);
  return t.trim();
}

export async function geminiGenerateText(prompt: string): Promise<string> {
  const model = getModel(false);
  const res = await model.generateContent(prompt);
  const text = res.response.text();
  if (!text?.trim()) throw new Error("Empty response from AI");
  return text.trim();
}

export async function geminiGenerateJson<T>(prompt: string): Promise<T> {
  const model = getModel(true);
  const res = await model.generateContent(prompt);
  const raw = res.response.text();
  if (!raw?.trim()) throw new Error("Empty JSON from AI");
  const parsed = JSON.parse(stripJsonFence(raw)) as T;
  return parsed;
}
