import * as ImagePicker from "expo-image-picker";

export interface ParsedReceipt {
  description: string | null;
  amount: number | null;
  transaction_date: string | null;
  rawText: string;
}

const VISION_ENDPOINT = "https://vision.googleapis.com/v1/images:annotate";

async function callGoogleVision(base64: string): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_VISION_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing EXPO_PUBLIC_GOOGLE_VISION_KEY. Add it to your .env file to enable receipt scanning."
    );
  }

  const response = await fetch(`${VISION_ENDPOINT}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requests: [
        {
          image: { content: base64 },
          features: [{ type: "TEXT_DETECTION", maxResults: 1 }],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Vision API error (${response.status}).`);
  }

  const data = await response.json();
  const text: string | undefined =
    data?.responses?.[0]?.fullTextAnnotation?.text ??
    data?.responses?.[0]?.textAnnotations?.[0]?.description;

  if (!text) {
    throw new Error("No text was detected in the image.");
  }
  return text;
}

const AMOUNT_KEYWORDS = [
  "grand total",
  "amount due",
  "total due",
  "balance due",
  "total amount",
  "total",
  "amount",
  "amt",
  "subtotal",
];

const NUMBER_PATTERN = /(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})/g;

function parseAmount(lines: string[]): number | null {
  const lower = lines.map((line) => line.toLowerCase());

  for (const keyword of AMOUNT_KEYWORDS) {
    for (let i = 0; i < lower.length; i++) {
      if (!lower[i].includes(keyword)) continue;

      const sameLine = lines[i].match(NUMBER_PATTERN);
      if (sameLine && sameLine.length > 0) {
        const value = toNumber(sameLine[sameLine.length - 1]);
        if (value !== null) return value;
      }

      const nextLine = lines[i + 1]?.match(NUMBER_PATTERN);
      if (nextLine && nextLine.length > 0) {
        const value = toNumber(nextLine[nextLine.length - 1]);
        if (value !== null) return value;
      }
    }
  }

  // Fallback: largest decimal number anywhere
  let max: number | null = null;
  for (const line of lines) {
    const matches = line.match(NUMBER_PATTERN);
    if (!matches) continue;
    for (const m of matches) {
      const value = toNumber(m);
      if (value !== null && (max === null || value > max)) {
        max = value;
      }
    }
  }
  return max;
}

function toNumber(raw: string): number | null {
  const cleaned = raw.replace(/,/g, "");
  const value = parseFloat(cleaned);
  return Number.isFinite(value) && value > 0 ? value : null;
}

const DATE_PATTERNS: { regex: RegExp; build: (m: RegExpMatchArray) => string | null }[] = [
  // 2025-12-31 or 2025/12/31
  {
    regex: /\b(20\d{2})[-/.](0?[1-9]|1[0-2])[-/.](0?[1-9]|[12]\d|3[01])\b/,
    build: (m) => isoDate(+m[1], +m[2], +m[3]),
  },
  // 31/12/2025 or 31-12-2025 (day-first)
  {
    regex: /\b(0?[1-9]|[12]\d|3[01])[-/.](0?[1-9]|1[0-2])[-/.](20\d{2})\b/,
    build: (m) => isoDate(+m[3], +m[2], +m[1]),
  },
  // 12/31/2025 (month-first) — best-effort fallback handled by above when day > 12
  // Dec 31, 2025
  {
    regex: /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(0?[1-9]|[12]\d|3[01]),?\s+(20\d{2})\b/i,
    build: (m) => {
      const month = monthFromName(m[1]);
      return month ? isoDate(+m[3], month, +m[2]) : null;
    },
  },
];

function parseDate(text: string): string | null {
  for (const { regex, build } of DATE_PATTERNS) {
    const match = text.match(regex);
    if (!match) continue;
    const iso = build(match);
    if (iso) return iso;
  }
  return null;
}

function isoDate(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const MONTH_NAMES: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

function monthFromName(name: string): number | null {
  return MONTH_NAMES[name.slice(0, 3).toLowerCase()] ?? null;
}

function parseDescription(lines: string[]): string | null {
  // Prefer the first line that looks like a merchant name (mostly letters, not a number/date).
  for (const line of lines.slice(0, 6)) {
    const trimmed = line.trim();
    if (trimmed.length < 3 || trimmed.length > 60) continue;
    const letters = trimmed.replace(/[^a-zA-Z]/g, "").length;
    if (letters < Math.max(3, Math.floor(trimmed.length * 0.5))) continue;
    return trimmed;
  }
  return lines[0]?.trim() || null;
}

export function parseReceiptText(rawText: string): ParsedReceipt {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return {
    description: parseDescription(lines),
    amount: parseAmount(lines),
    transaction_date: parseDate(rawText),
    rawText,
  };
}

export type ReceiptSource = "camera" | "library";

export async function pickReceiptImage(
  source: ReceiptSource
): Promise<{ base64: string } | null> {
  if (source === "camera") {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      throw new Error("Camera permission was denied.");
    }
    const result = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.7,
      mediaTypes: ["images"],
    });
    if (result.canceled || !result.assets?.[0]?.base64) return null;
    return { base64: result.assets[0].base64 };
  }

  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Photo library permission was denied.");
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    base64: true,
    quality: 0.7,
    mediaTypes: ["images"],
  });
  if (result.canceled || !result.assets?.[0]?.base64) return null;
  return { base64: result.assets[0].base64 };
}

export async function scanReceipt(source: ReceiptSource): Promise<ParsedReceipt | null> {
  const image = await pickReceiptImage(source);
  if (!image) return null;
  const text = await callGoogleVision(image.base64);
  return parseReceiptText(text);
}
