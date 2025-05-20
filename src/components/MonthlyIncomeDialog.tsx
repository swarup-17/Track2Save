"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface MonthlyIncomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export default function MonthlyIncomeDialog({
  open,
  onOpenChange,
  userId,
}: MonthlyIncomeDialogProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!monthlyIncome || isNaN(Number(monthlyIncome)) || Number(monthlyIncome) < 0) {
      toast({
        title: "Invalid input",
        description: "Please enter a valid monthly income amount",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Update user's monthly income
      await axios.post("/api/users/update-income", {
        userId,
        monthlyIncome: Number(monthlyIncome),
      });

      toast({
        title: "Income updated",
        description: "Your monthly income has been saved",
        variant: "success",
      });

      // Close dialog and redirect to expense page
      onOpenChange(false);
      router.push("/expense");
    } catch (error) {
      console.error(error);
      toast({
        title: "Something went wrong",
        description: "Failed to update monthly income",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Set Your Monthly Income</DialogTitle>
        </DialogHeader>
        <div className="p-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Setting your monthly income helps us provide better insights into your spending habits.
          </p>

          <div className="space-y-2">
            <Label htmlFor="monthlyIncome" className="text-sm font-medium">
              Monthly Income
            </Label>
            <div className="relative">
              <Input
                id="monthlyIncome"
                type="number"
                placeholder="Enter your monthly income"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                className="pl-10 transition-all focus-visible:ring-primary"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                router.push("/expense");
              }}
            >
              Skip for now
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className={loading ? "opacity-80 cursor-wait" : ""}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="mr-2 h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}