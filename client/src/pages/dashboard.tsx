
import React, { useState } from "react";
import { Layout } from "@/components/layout";
import { StepCard } from "@/components/step-card";
import { UserTable } from "@/components/user-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { MOCK_SLACK_USERS, User } from "@/lib/mockData";
import { FileSpreadsheet, Upload, Users, Wand2, Download, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  // State for workflow progress
  const [currentStep, setCurrentStep] = useState(1);
  const [processingStep, setProcessingStep] = useState<number | null>(null);
  
  // Data state
  const [slackUsers, setSlackUsers] = useState<User[]>([]);
  const [newUsers, setNewUsers] = useState<User[]>([]);
  const [processedUsers, setProcessedUsers] = useState<User[]>([]);
  
  // File upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // Paste names state
  const [pastedNames, setPastedNames] = useState("");
  const [pasteLoading, setPasteLoading] = useState(false);

  // Step 1: Fetch Slack Users (real API call)
  const handleFetchSlack = async () => {
    setProcessingStep(1);
    try {
      const res = await fetch("/api/fetch-slack-users", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "Failed to fetch Slack users");
      }

      // Optionally: setSlackUsers(...) if you want to preview fetched users in the table
      setProcessingStep(null);
      setCurrentStep(2);
      toast({
        title: "Slack Users Fetched",
        description: `Successfully fetched ${data.count} users from Slack and wrote them to Google Sheets tab "${data.tab}".`,
      });
    } catch (err: any) {
      console.error("Error fetching Slack users:", err);
      setProcessingStep(null);
      toast({
        title: "Error",
        description: err?.message || "Failed to fetch Slack users. Check server logs.",
        variant: "destructive",
      });
    }
  };

  // Step 2: Upload Users (CSV -> "New Users" sheet)
  const handleUpload = async () => {
    if (!uploadFile) return;

    setProcessingStep(2);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);

      const res = await fetch("/api/upload-users", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "Failed to upload user list");
      }

      setProcessingStep(null);
      setCurrentStep(3);
      toast({
        title: "File Uploaded",
        description: `User list has been written to sheet "${data.tab}" (${data.count} rows).`,
      });

      // Optionally, you can clear local newUsers/processedUsers or fetch preview from backend later
    } catch (err: any) {
      console.error("Error uploading users:", err);
      setProcessingStep(null);
      toast({
        title: "Error",
        description: err?.message || "Failed to upload user list. Check server logs.",
        variant: "destructive",
      });
    }
  };

  // Step 2: Paste Names (alternative to file upload)
  const handlePasteNames = async () => {
    if (!pastedNames.trim()) return;

    setPasteLoading(true);
    setProcessingStep(2);
    try {
      const res = await fetch("/api/upload-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ names: pastedNames }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "Failed to upload user list");
      }

      setProcessingStep(null);
      setPasteLoading(false);
      setCurrentStep(3);
      toast({
        title: "Names Uploaded",
        description: `User list has been written to sheet "${data.tab}" (${data.count} rows).`,
      });
    } catch (err: any) {
      console.error("Error uploading users:", err);
      setProcessingStep(null);
      setPasteLoading(false);
      toast({
        title: "Error",
        description: err?.message || "Failed to upload user list. Check server logs.",
        variant: "destructive",
      });
    }
  };

  // Step 3: Process Users (clean, split, flag duplicates -> "New Users-Processed")
  const handleProcessUsers = async () => {
    setProcessingStep(3);
    try {
      const res = await fetch("/api/process-users", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "Failed to process users");
      }

      setProcessingStep(null);
      setCurrentStep(4);
      toast({
        title: "Users Processed",
        description: `Processed ${data.count} names in "${data.tab}" (${data.duplicates} duplicates).`,
      });

      // Optionally later: fetch processed preview from backend to show in the table
    } catch (err: any) {
      console.error("Error processing users:", err);
      setProcessingStep(null);
      toast({
        title: "Error",
        description: err?.message || "Failed to process users. Check server logs.",
        variant: "destructive",
      });
    }
  };

  // Step 4: Generate Emails (unique, written to "New Users-Processed" column D)
  const handleGenerateEmails = async () => {
    setProcessingStep(4);
    try {
      const res = await fetch("/api/generate-emails", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "Failed to generate emails");
      }

      setProcessingStep(null);
      setCurrentStep(5);
      toast({
        title: "Emails Generated",
        description: `Generated ${data.count} unique emails in "${data.tab}".`,
      });

      // Optionally later: fetch rows from "New Users-Processed" to display in the table
    } catch (err: any) {
      console.error("Error generating emails:", err);
      setProcessingStep(null);
      toast({
        title: "Error",
        description: err?.message || "Failed to generate emails. Check server logs.",
        variant: "destructive",
      });
    }
  };

  // Step 5: Download
  const handleDownload = () => {
    setProcessingStep(5);
    setTimeout(() => {
      setProcessingStep(null);
      toast({
        title: "Download Started",
        description: "Your CSV file is being downloaded.",
      });
    }, 1000);
  };

  return (
    <Layout>
      <div className="space-y-8 max-w-5xl mx-auto">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Onboarding Workflow</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Manage the user onboarding process from Slack sync to email generation.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-[1fr_350px]">
          <div className="space-y-6">
            
            {/* Step 1 */}
            <StepCard
              stepNumber={1}
              title="Fetch Slack Users"
              description="Sync current active users from Slack workspace to check for existing accounts."
              status={currentStep > 1 ? "completed" : currentStep === 1 ? (processingStep === 1 ? "processing" : "pending") : "disabled"}
              onAction={handleFetchSlack}
              actionLabel="Fetch Users"
            >
              <div className="mt-4">
                <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-100 dark:bg-slate-800 p-3 rounded-md">
                  <Users className="h-4 w-4" />
                  <span>Target: <strong>Main Workspace</strong> (slack-corp-v2)</span>
                </div>
              </div>
            </StepCard>

            {/* Step 2 */}
            <StepCard
              stepNumber={2}
              title="Upload New User List"
              description="Upload a CSV file or paste names to onboard new employees."
              status={currentStep > 2 ? "completed" : currentStep === 2 ? (processingStep === 2 ? "processing" : "pending") : "disabled"}
              onAction={handleUpload}
              actionLabel="Upload & Parse"
            >
              <div className="grid w-full max-w-sm items-center gap-1.5 mt-4">
                <Label htmlFor="user-file">User List (CSV)</Label>
                <div className="flex gap-2">
                  <Input 
                    id="user-file" 
                    type="file" 
                    accept=".csv" 
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    disabled={currentStep !== 2}
                  />
                </div>
                <p className="text-xs text-slate-500">Required columns: Full Name, Department</p>
              </div>
              <Separator className="my-4" />
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="paste-names">Or paste names (one per line, optionally comma-separated with department):</Label>
                <textarea
                  id="paste-names"
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring"
                  rows={6}
                  placeholder="Jane Doe, Engineering&#10;John Smith, Marketing"
                  value={pastedNames}
                  onChange={e => setPastedNames(e.target.value)}
                  disabled={currentStep !== 2 || pasteLoading}
                />
                <Button
                  type="button"
                  className="w-full mt-2"
                  onClick={handlePasteNames}
                  disabled={currentStep !== 2 || pasteLoading}
                >
                  {pasteLoading ? "Uploading..." : "Paste & Parse"}
                </Button>
                <p className="text-xs text-slate-500">Format: "Full Name, Department" per line, or just names.</p>
              </div>
            </StepCard>

            {/* Step 3 */}
            <StepCard
              stepNumber={3}
              title="Process New Users"
              description="Standardize names, split first/last names, and handle edge cases."
              status={currentStep > 3 ? "completed" : currentStep === 3 ? (processingStep === 3 ? "processing" : "pending") : "disabled"}
              onAction={handleProcessUsers}
              actionLabel="Process Names"
            >
              <div className="mt-4 text-sm text-slate-600">
                <ul className="list-disc list-inside space-y-1">
                  <li>Splits full names into First/Last</li>
                  <li>Removes special characters</li>
                  <li>Flags duplicates in upload list</li>
                </ul>
              </div>
            </StepCard>

            {/* Step 4 */}
            <StepCard
              stepNumber={4}
              title="Generate Unique Emails"
              description="Create email addresses and ensure no conflicts with existing Slack users."
              status={currentStep > 4 ? "completed" : currentStep === 4 ? (processingStep === 4 ? "processing" : "pending") : "disabled"}
              onAction={handleGenerateEmails}
              actionLabel="Generate Emails"
            >
              <div className="mt-4 flex items-center gap-2 text-sm text-slate-600 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-100 dark:border-blue-800">
                <Wand2 className="h-4 w-4 text-blue-500" />
                <span>Algorithm: <strong>firstname.lastname@company.com</strong></span>
              </div>
            </StepCard>

            {/* Step 5 */}
            <StepCard
              stepNumber={5}
              title="Download Results"
              description="Export the final list with generated emails and temporary passwords."
              status={currentStep === 5 ? "pending" : "disabled"}
              onAction={handleDownload}
              actionLabel="Download CSV"
            >
              {currentStep === 5 && (
                <div className="mt-4 flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mb-2" />
                  <p className="font-medium text-slate-900">All steps completed!</p>
                  <p className="text-sm text-slate-500">Your data is ready for export.</p>
                </div>
              )}
            </StepCard>

          </div>

          <div className="space-y-6">
            <div className="sticky top-24 space-y-6">
              <h2 className="text-lg font-semibold tracking-tight">Live Data Preview</h2>
              
              {slackUsers.length > 0 && (
                <UserTable 
                  title="Slack Users (Reference)" 
                  users={slackUsers} 
                  className="border-l-4 border-l-blue-500"
                />
              )}

              {(newUsers.length > 0 || processedUsers.length > 0) && (
                <UserTable 
                  title="New Onboarding List" 
                  users={processedUsers.length > 0 ? processedUsers : newUsers} 
                  className={cn(
                    "border-l-4 transition-colors",
                    processedUsers.length > 0 && processedUsers[0].email ? "border-l-green-500" : "border-l-amber-500"
                  )}
                />
              )}

              {slackUsers.length === 0 && newUsers.length === 0 && (
                <div className="p-8 border border-dashed border-slate-300 rounded-lg text-center text-slate-500">
                  <FileSpreadsheet className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>Data will appear here as you progress through the workflow steps.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
