import { google } from "googleapis";
import { writeSheet } from "./googleSheets";

const USERS_TAB = "New Users-Processed";
const SLACK_TAB = "SlackUsers";
const DOMAIN = "scaler.com";

/**
 * Helper to get raw values from a sheet range.
 * (Same pattern as in processUsers.ts)
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

function normalize(str: string) {
  return (str || "").toLowerCase().replace(/\s+/g, "");
}

function generateUniqueEmail(
  firstName: string,
  lastName: string,
  existingEmails: Set<string>,
) {
  let base = `${normalize(firstName)}.${normalize(lastName)}`;
  let email = `${base}@${DOMAIN}`;
  let suffix = 1;
  while (existingEmails.has(email)) {
    const padded = suffix < 10 ? `0${suffix}` : `${suffix}`;
    email = `${base}${padded}@${DOMAIN}`;
    suffix++;
  }
  existingEmails.add(email);
  return email;
}

/**
 * Generate unique emails for rows in "New Users-Processed":
 * - Reads A:D (First Name, Last Name, Full Name, Is Duplicate)
 * - Generates unique email IDs based on first/last name and existing Slack emails
 * - Overwrites column D with "Email ID" (removing "Is Duplicate")
 */
export async function generateEmailsForProcessedUsers() {
  console.log(`[generateEmails] Reading users from "${USERS_TAB}"...`);
  const userRows = await readSheet(`${USERS_TAB}!A1:D1000`);
  if (!userRows || userRows.length < 2) {
    console.log("[generateEmails] No users found in processed tab.");
    return { count: 0, tab: USERS_TAB };
  }

  const users = userRows.slice(1).map((row) => ({
    firstName: row[0] || "",
    lastName: row[1] || "",
    fullName: row[2] || "",
  }));

  console.log('[generateEmails] Reading emails from "SlackUsers"...');
  const slackRows = await readSheet(`${SLACK_TAB}!C1:C10000`);
  const slackEmails = new Set(
    slackRows
      .slice(1)
      .map((row) => (row[0] || "").toLowerCase())
      .filter((v) => !!v),
  );

  const emails = users.map((u) =>
    generateUniqueEmail(u.firstName, u.lastName, slackEmails),
  );

  const header = ["First Name", "Last Name", "Full Name", "Email ID"];
  const output: (string | null)[][] = [
    header,
    ...users.map((u, i) => [
      u.firstName || null,
      u.lastName || null,
      u.fullName || null,
      emails[i],
    ]),
  ];

  console.log(`[generateEmails] Writing header and ${emails.length} rows to "${USERS_TAB}"...`);
  await writeSheet(`${USERS_TAB}!A1`, [header]);
  if (output.length > 1) {
    await writeSheet(`${USERS_TAB}!A2`, output.slice(1));
  }

  return {
    count: emails.length,
    tab: USERS_TAB,
  };
}
