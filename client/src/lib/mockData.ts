
import { LucideIcon } from "lucide-react";

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  status: "new" | "processed" | "completed";
  slackId?: string;
};

export type StepStatus = "pending" | "processing" | "completed" | "error";

export interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  status: StepStatus;
}

export const MOCK_SLACK_USERS: User[] = [
  { id: "U01", firstName: "Alice", lastName: "Chen", status: "new", slackId: "U12345" },
  { id: "U02", firstName: "Bob", lastName: "Smith", status: "new", slackId: "U67890" },
  { id: "U03", firstName: "Charlie", lastName: "Kim", status: "new", slackId: "U54321" },
];

export const MOCK_NEW_USERS: User[] = [
  { id: "N01", firstName: "David", lastName: "Lee", status: "new" },
  { id: "N02", firstName: "Eva", lastName: "Green", status: "new" },
];
