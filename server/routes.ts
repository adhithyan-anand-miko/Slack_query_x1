import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { syncSlackUsersToSheet } from "./slack";
import { requireAuth } from "./index";
import multer from "multer";
import { clearSheetRange, writeSheet } from "./googleSheets";
import { processNewUsers } from "./processUsers";
import { generateEmailsForProcessedUsers } from "./generateEmails";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // Hardcoded password login
  app.post(
    "/api/login-password",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { password } = req.body;
        if (password !== "Omega@2255") {
          return res.status(401).json({ ok: false, message: "Invalid password" });
        }
        // Set session user object
        req.login(
          { passwordLogin: true },
          (err) => {
            if (err) return next(err);
            res.json({ ok: true });
          }
        );
      } catch (err) {
        next(err);
      }
    }
  );

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  // Fetch Slack users and sync to Google Sheets
  app.post(
    "/api/fetch-slack-users",
    // requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await syncSlackUsersToSheet();
        res.json({ ok: true, ...result });
      } catch (err) {
        next(err);
      }
    },
  );

  // Upload new user list CSV and write to "New Users" sheet
  app.post(
    "/api/upload-users",
    // requireAuth,
    upload.single("file"),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const file = (req as any).file as Express.Multer.File | undefined;
        if (!file) {
          return res
            .status(400)
            .json({ ok: false, message: "No file uploaded" });
        }

        const csv = file.buffer.toString("utf8");
        const lines = csv
          .split(/\r?\n/)
          .filter((l: string) => l.trim().length > 0);

        if (lines.length === 0) {
          return res
            .status(400)
            .json({ ok: false, message: "CSV file is empty" });
        }

        // Assume first line is header, but we will enforce our own header in Sheets
        const [, ...dataLines] = lines;

        const rows: (string | null)[][] = dataLines
          .map((line: string) => {
            const parts = line.split(",").map((s: string) => s.trim());
            const name = parts[0] || null;
            const department = parts[1] || null;
            return [name, department];
          })
          .filter((r: (string | null)[]) => r[0] !== null); // require at least a name

        const SHEET_TAB = "New Users";
        const header = ["Name", "Department"];

        await clearSheetRange(`${SHEET_TAB}!A2:Z`);
        await writeSheet(`${SHEET_TAB}!A1`, [header]);
        if (rows.length > 0) {
          await writeSheet(`${SHEET_TAB}!A2`, rows);
        }

        res.json({ ok: true, count: rows.length, tab: SHEET_TAB });
      } catch (err) {
        next(err);
      }
    },
  );

  // Process new users: clean names, split First/Last, flag duplicates, write to "New Users-Processed"
  app.post(
    "/api/process-users",
    // requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await processNewUsers();
        res.json({ ok: true, ...result });
      } catch (err) {
        next(err);
      }
    },
  );

  // Generate unique emails: write Email ID into column D of "New Users-Processed"
  app.post(
    "/api/generate-emails",
    // requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await generateEmailsForProcessedUsers();
        res.json({ ok: true, ...result });
      } catch (err) {
        next(err);
      }
    },
  );

  return httpServer;
}
