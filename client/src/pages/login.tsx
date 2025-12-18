import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [checking, setChecking] = useState(true);

  // If already logged in (session cookie present), skip login page
  useEffect(() => {
    fetch("/api/me", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(() => {
        setLocation("/dashboard");
      })
      .catch(() => {
        setChecking(false);
      });
  }, [setLocation]);

  const handleGoogleLogin = () => {
    window.location.href = "/auth/google";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

      <Card className="w-full max-w-md relative z-10 shadow-xl border-slate-200 dark:border-slate-800">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30">
              <ShieldCheck className="h-7 w-7" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Welcome</CardTitle>
          <CardDescription>Sign in with Google to access the Email Checker dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            className="w-full"
            disabled={checking}
            onClick={handleGoogleLogin}
          >
            {checking ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking session...
              </>
            ) : (
              "Sign in with Google"
            )}
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 text-center text-sm text-muted-foreground">
          <p>
            By clicking continue, you agree to our{" "}
            <span className="underline hover:text-primary cursor-pointer">Terms of Service</span> and{" "}
            <span className="underline hover:text-primary cursor-pointer">Privacy Policy</span>.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
