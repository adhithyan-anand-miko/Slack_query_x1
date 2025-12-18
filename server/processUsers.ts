import { clearSheetRange, writeSheet } from "./googleSheets";
import { google } from "googleapis";

const SOURCE_TAB = "New Users";
const TARGET_TAB = "New Users-Processed";

/**
 * Helper to get raw values from a sheet range.
 * We reuse the auth logic from googleSheets via google.auth.GoogleAuth,
 * but for simplicity here we call the API directly.
 */
async function readSheet(range: string): Promise<string[][]> {
  const SHEET_ID = process.env.GOOGLE_SHEET_ID;
  const SERVICE_ACCOUNT_JSON = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (!SHEET_ID) throw new Error("GOOGLE_SHEET_ID is not set");
  if (!SERVICE_ACCOUNT_JSON) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not set");

  let json: string;
  try {
    JSON.parse(SERVICE_ACCOUNT_JSON);
    json = SERVICE_ACCOUNT_JSON;
  } catch {
    json = Buffer.from(SERVICE_ACCOUNT_JSON, "base64").toString("utf8");
  }
  const credentials = JSON.parse(json);

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range,
  });

  return (res.data.values as string[][]) || [];
}

function cleanName(raw: string): string {
  if (!raw) return "";
  // Remove non-alphanumeric except spaces, collapse multiple spaces
  return raw.replace(/[^a-zA-Z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function splitName(name: string): [string, string] {
  const cleaned = cleanName(name);
  if (!cleaned) return ["", "Scaler"];

  const parts = cleaned.split(" ");
  if (parts.length === 1) return [parts[0], "Scaler"];
  return [parts[0], parts[parts.length - 1]];
}

/**
 * Process names from "New Users" into "New Users-Processed":
 * - Clean names (remove special chars)
 * - Split into First/Last (first word, last word, fallback last=Scaler)
 * - Flag duplicates in the upload list
 */
export async function processNewUsers() {
  console.log(`[processUsers] Reading names from "${SOURCE_TAB}"...`);
  const rows = await readSheet(`${SOURCE_TAB}!A1:A1000`);
  if (!rows || rows.length < 2) {
    console.log("[processUsers] No names found in source tab.");
    return { count: 0, duplicates: 0, tab: TARGET_TAB };
  }

  // Skip header, get raw names
  const names = rows
    .slice(1)
    .map((row) => row[0])
    .filter((val) => typeof val === "string" && val.trim().length > 0) as string[];

  if (names.length === 0) {
    console.log("[processUsers] No non-empty names in source tab.");
    return { count: 0, duplicates: 0, tab: TARGET_TAB };
  }

  // First pass: count occurrences of cleaned names
  const counts = new Map<string, number>();
  for (const originalName of names) {
    const cleaned = cleanName(originalName);
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  // Second pass: build processed rows
  let duplicateCount = 0;
  const processedRows: (string | null)[][] = names.map((originalName) => {
    const cleaned = cleanName(originalName);
    const [firstName, lastName] = splitName(originalName);
    const key = cleaned.toLowerCase();
    const isDup = key && (counts.get(key) || 0) > 1;
    if (isDup) duplicateCount += 1;

    return [
      firstName || null,
      lastName || null,
      cleaned || null,
      isDup ? "Yes" : "No",
    ];
  });

  console.log(
    `[processUsers] Processed ${processedRows.length} names, ${duplicateCount} duplicates.`,
  );

  // Write to TARGET_TAB
  const header = ["First Name", "Last Name", "Full Name", "Is Duplicate"];

  console.log(`[processUsers] Clearing "${TARGET_TAB}" from row 2 down...`);
  await clearSheetRange(`${TARGET_TAB}!A2:Z`);

  console.log(`[processUsers] Writing header and processed rows...`);
  await writeSheet(`${TARGET_TAB}!A1`, [header]);
  if (processedRows.length > 0) {
    await writeSheet(`${TARGET_TAB}!A2`, processedRows);
  }

  return {
    count: processedRows.length,
    duplicates: duplicateCount,
    tab: TARGET_TAB,
  };
}
