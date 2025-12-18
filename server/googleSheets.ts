import { google } from "googleapis";

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SERVICE_ACCOUNT_JSON = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

/**
 * Load service account credentials from env.
 * GOOGLE_SERVICE_ACCOUNT_JSON can be:
 * - A JSON string
 * - A base64-encoded JSON
 */
function getServiceAccountCredentials(): any {
  if (!SERVICE_ACCOUNT_JSON) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not set");
  }

  let json: string;

  try {
    // Try direct JSON first
    JSON.parse(SERVICE_ACCOUNT_JSON);
    json = SERVICE_ACCOUNT_JSON;
  } catch {
    // Fallback: assume base64-encoded JSON
    json = Buffer.from(SERVICE_ACCOUNT_JSON, "base64").toString("utf8");
  }

  return JSON.parse(json);
}

function getSheetsClient() {
  if (!SHEET_ID) {
    throw new Error("GOOGLE_SHEET_ID is not set");
  }

  const credentials = getServiceAccountCredentials();

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

/**
 * Clear a range in the spreadsheet.
 * Example range: "SlackUsers!A2:Z"
 */
export async function clearSheetRange(range: string) {
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SHEET_ID!,
    range,
  });
}

/**
 * Write (overwrite) rows to a specific range.
 * Example range: "SlackUsers!A1"
 */
export async function writeSheet(range: string, values: (string | null)[][]) {
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID!,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });
}
