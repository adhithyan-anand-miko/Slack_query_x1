import { WebClient } from "@slack/web-api";
import { clearSheetRange, writeSheet } from "./googleSheets";

const SHEET_TAB = "SlackUsers"; // Change as needed
const SLACK_TOKEN = process.env.SLACK_TOKEN;

/**
 * Fetch all Slack users using cursor-based pagination.
 */
async function fetchAllSlackUsers() {
  if (!SLACK_TOKEN) {
    throw new Error("SLACK_TOKEN is not set");
  }

  const slackClient = new WebClient(SLACK_TOKEN);

  let allUsers: any[] = [];
  let cursor: string | undefined = undefined;
  let page = 1;

  do {
    console.log(`[slack] Fetching page ${page} (up to 1000 users)...`);
    const response = await slackClient.users.list({ limit: 1000, cursor });
    const users = response.members || [];
    allUsers = allUsers.concat(users);

    cursor = response.response_metadata?.next_cursor || undefined;
    page++;
  } while (cursor);

  return allUsers;
}

/**
 * Sync all Slack users into the Google Sheet tab SHEET_TAB.
 * - Clears rows from A2:Z
 * - Writes header in A1
 * - Writes user rows starting from A2
 */
export async function syncSlackUsersToSheet() {
  console.log("[slack] Starting Slack → Google Sheets sync...");

  const allUsers = await fetchAllSlackUsers();
  const now = new Date().toISOString();

  const header = ["ID", "Name", "Email", "Title", "Status", "Is Bot", "Last Updated"];

  const rows: (string | null)[][] = allUsers.map((u: any) => [
    u.id ?? null,
    u.profile?.real_name_normalized ?? null,
    u.profile?.email ?? null,
    u.profile?.title ?? null,
    u.deleted ? "Deleted" : "Active",
    u.is_bot ? "Yes" : "No",
    now,
  ]);

  console.log("[slack] Clearing sheet rows from row 2 down...");
  await clearSheetRange(`${SHEET_TAB}!A2:Z`);

  console.log("[slack] Writing header and rows...");
  await writeSheet(`${SHEET_TAB}!A1`, [header]);
  if (rows.length > 0) {
    await writeSheet(`${SHEET_TAB}!A2`, rows);
  }

  console.log(`[slack] Wrote ${allUsers.length} users to Google Sheet tab "${SHEET_TAB}".`);

  return {
    count: allUsers.length,
    tab: SHEET_TAB,
  };
}
