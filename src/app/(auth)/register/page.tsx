"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import React, { useState } from "react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import MonthlyIncomeDialog from "@/components/MonthlyIncomeDialog";

export default function RegisterPage() {
  const { toast } = useToast();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [showIncomeDialog, setShowIncomeDialog] = useState(false);
  const [userId, setUserId] = useState("");

  const [userDetails, setUserDetails] = useState({
    name: "",
    password: "",
    confirmPassword: "",
  });

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.trim();
    if (!value.startsWith("+91")) {
      value = `+91${value}`;
    }
    setPhone(value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { name, password, confirmPassword } = userDetails;

    if (!name || !phone || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (phone.length < 10) {
      setError("Phone number must be at least 10 digits");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    try {
      setLoading(true);

      // Register user
      const res = await axios.post("/api/users/signup", {
        name: userDetails.name,
        phone,
        password: userDetails.password,
      });

      if (res.status === 201) {
        toast({
          title: "Registration successful",
          description: "Let's set up your monthly income",
          variant: "success",
          duration: 3000,
        });

        // Store the user ID and show the monthly income dialog
        setUserId(res.data.savedUser._id);
        setShowIncomeDialog(true);
      } else {
        setError(res.data.message);
      }
    } catch {
      toast({
        title: "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <MonthlyIncomeDialog
        open={showIncomeDialog}
        onOpenChange={setShowIncomeDialog}
        userId={userId}
      />
      <div className="mx-auto w-full my-5 max-w-md rounded-xl border border-border bg-card p-6 shadow-lg transition-all md:p-8">
        <div className="mb-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Create account</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your details to get started
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-destructive/10 p-3 text-center text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
            <div className="relative">
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Enter your full name"
                value={userDetails.name}
                onChange={(e) => setUserDetails({ ...userDetails, name: e.target.value })}
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
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
            <div className="relative">
              <Input
                id="phone"
                type="text"
                name="phone"
                placeholder="Enter your phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={handlePhoneChange}
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
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                value={userDetails.password}
                onChange={(e) => setUserDetails({ ...userDetails, password: e.target.value })}
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
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={userDetails.confirmPassword}
                onChange={(e) => setUserDetails({ ...userDetails, confirmPassword: e.target.value })}
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
                  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z"></path>
                  <path d="M12 16v-4"></path>
                  <path d="M12 8h.01"></path>
                </svg>
              </span>
            </div>
          </div>

          <Button
            type="submit"
            className={`w-full rounded-lg bg-primary px-4 py-3 text-base font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 ${loading ? "opacity-80 cursor-wait" : ""}`}
            disabled={loading}
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
                Registering...
              </span>
            ) : "Register"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Login
          </Link>
        </p>
      </div>
    </>
  );
}