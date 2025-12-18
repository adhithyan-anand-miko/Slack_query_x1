
import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Check, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

interface StepCardProps {
  stepNumber: number;
  title: string;
  description: string;
  status: "pending" | "processing" | "completed" | "error" | "disabled";
  onAction?: () => void;
  actionLabel?: string;
  children?: React.ReactNode;
  className?: string;
}

export function StepCard({
  stepNumber,
  title,
  description,
  status,
  onAction,
  actionLabel,
  children,
  className,
}: StepCardProps) {
  const isCompleted = status === "completed";
  const isProcessing = status === "processing";
  const isDisabled = status === "disabled";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: stepNumber * 0.1 }}
    >
      <Card className={cn(
        "relative overflow-hidden border-l-4 transition-all duration-300",
        status === "completed" ? "border-l-green-500 bg-green-50/30 dark:bg-green-900/10" : 
        status === "processing" ? "border-l-blue-500 bg-blue-50/30 dark:bg-blue-900/10" :
        status === "error" ? "border-l-red-500" :
        isDisabled ? "border-l-gray-200 opacity-60 grayscale" : "border-l-primary",
        className
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                  isCompleted ? "bg-green-100 text-green-700" : 
                  isDisabled ? "bg-gray-100 text-gray-500" : "bg-primary/10 text-primary"
                )}>
                  {stepNumber}
                </span>
                <CardTitle className="text-lg font-medium tracking-tight">{title}</CardTitle>
              </div>
              <CardDescription>{description}</CardDescription>
            </div>
            <div className="flex-shrink-0">
              {status === "completed" && <Check className="h-6 w-6 text-green-500" />}
              {status === "processing" && <Loader2 className="h-6 w-6 animate-spin text-blue-500" />}
              {status === "error" && <AlertCircle className="h-6 w-6 text-red-500" />}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {children}
        </CardContent>
        {actionLabel && (
          <CardFooter className="pt-0">
            <Button 
              onClick={onAction} 
              disabled={isDisabled || isProcessing || isCompleted}
              className={cn("w-full sm:w-auto gap-2", isCompleted && "bg-green-600 hover:bg-green-700")}
              variant={isCompleted ? "outline" : "default"}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : isCompleted ? (
                <>
                  Completed
                  <Check className="h-4 w-4" />
                </>
              ) : (
                <>
                  {actionLabel}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </CardFooter>
        )}
      </Card>
    </motion.div>
  );
}
