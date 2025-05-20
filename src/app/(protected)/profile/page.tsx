"use client";
import axios, { AxiosError } from "axios";
import React, { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface User {
  _id: string;
  name: string;
  phone: string;
  friends: string[];
  monthlyIncome?: number;
  upiId?: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [income, setIncome] = useState("");
  const [upi, setUpi] = useState("");
  const { toast } = useToast();

  const getUser = async () => {
    try {
      const response = await axios.get("/api/users/profile");
      setUser(response.data?.data);
      console.log(response.data);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        setError(error.response?.data.error);
      } else {
        setError("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = async () => {
    if (isEditing) {
      // Save changes
      try {
        if (income && (isNaN(Number(income)) || Number(income) < 0)) {
          toast({
            title: "Invalid input",
            description: "Please enter a valid monthly income amount",
            variant: "destructive",
          });
          return;
        }

        // Update monthly income
        await axios.post("/api/users/update-income", {
          userId: user?._id,
          monthlyIncome: income ? Number(income) : 0,
        });

        // TODO: Add API endpoint for updating UPI ID if needed
        // For now, we'll just update the UI

        // Update user data
        getUser();

        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully",
          variant: "success",
        });

        setIsEditing(false);
      } catch (error) {
        console.error(error);
        toast({
          title: "Update failed",
          description: "Failed to update your profile",
          variant: "destructive",
        });
      }
    } else {
      // Enter edit mode
      setIsEditing(true);
    }
  };

  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
    if (user) {
      setIncome(user.monthlyIncome?.toString() || "");
      setUpi(user.upiId || "");
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-lg font-medium">Loading...</p>
      </div>
    );
  }

  return (
    <div className="sm: mt-5 min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg rounded-3xl shadow-2xl border-2 border-current p-6 sm:p-8">
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

        <div className="flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-gray-600 mb-4 flex items-center justify-center text-4xl font-bold text-white">
            {user?.name?.charAt(0) || "G"}
          </div>

          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">{user?.name || "Guest"}</h2>

          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{user?.phone || "912xxxx874"}</p>

          {/* Monthly Income */}
          <div className="mt-6 w-full text-sm text-gray-700 dark:text-gray-300 space-y-3">
            <div className="flex justify-between items-center">
              <label className="font-medium">Monthly Income:</label>
              {isEditing ? (
                <input
                  type="number"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  className="bg-gray-100 dark:bg-gray-800 text-sm p-1 rounded w-1/2 text-right"
                />
              ) : (
                <span>{user?.monthlyIncome ? `₹${user.monthlyIncome}` : "Not added"}</span>
              )}
            </div>

            {/* UPI ID */}
            <div className="flex justify-between items-center">
              <label className="font-medium">UPI ID:</label>
              {isEditing ? (
                <input
                  type="text"
                  value={upi}
                  onChange={(e) => setUpi(e.target.value)}
                  className="bg-gray-100 dark:bg-gray-800 text-sm p-1 rounded w-1/2 text-right"
                />
              ) : (
                <span>{user?.upiId || "Not provided"}</span>
              )}
            </div>
          </div>

          {/* Friends Section */}
          <div className="w-full mt-6 border-t dark:border-gray-700 pt-4">
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 text-center">
              {user?.friends.length ?? 0} Friend{(user?.friends.length ?? 0) !== 1 ? "s" : ""}
            </h3>
            {user?.friends?.length ? (
              <ul className="mt-2 text-sm text-gray-600">

              </ul>
            ) : (
              <p className="text-gray-500 text-center">No friends added yet.</p>
            )}
          </div>
          <Button
            onClick={handleEditToggle}
            className="mt-3 w-full font-medium py-2 rounded hover:opacity-90 transition"
          >
            {isEditing ? "Save Changes" : "Edit Details"}
          </Button>
          {isEditing ? <Button
            onClick={() => setIsEditing(false)}
            className="mt-6 w-full font-medium py-2 rounded hover:opacity-90 transition"
          >
            Cancel
          </Button> : null}
        </div>
      </div>
    </div>
  );
}
