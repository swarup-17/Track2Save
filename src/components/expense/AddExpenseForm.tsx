"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, FilterIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import axios, { AxiosError } from "axios";
import { Friend } from "@/types/friend";

export default function AddExpenseForm({ userId, onExpenseAdded }: { userId: string | null; onExpenseAdded: () => void }) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [split, setSplit] = useState(false);
  const [fetchingFriends, setFetchingFriends] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<{ [key: string]: boolean }>({});
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [splitAmounts, setSplitAmounts] = useState<{ [key: string]: number }>({});
  const [userAmount, setUserAmount] = useState<number>(0);

  const tags = ["Food", "Grocery", "Transport", "Medical", "Fruits", "Bills", "Rent", "Entertainment", "Other"];

  const getFriends = async () => {
    try {
      setFetchingFriends(true);
      setError(null);

      const response = await axios.get("/api/friends/get");

      if (response.data.success) {
        setFriends(response.data.data.friends || []);

        const friendsState: { [key: string]: boolean } = {};
        const initialSplitAmounts: { [key: string]: number } = {};

        (response.data.data.friends || []).forEach((friend: Friend) => {
          friendsState[friend.userId._id] = false;
          initialSplitAmounts[friend.userId._id] = 0;
        });

        setSelectedFriends(friendsState);
        setSplitAmounts(initialSplitAmounts);
      }

    } catch (error) {
      console.error("Error fetching friends:", error);
      if (error instanceof AxiosError) {
        setError(error.response?.data?.error || "Failed to fetch friends");
      } else {
        setError("Something went wrong while fetching friends");
      }
    } finally {
      setFetchingFriends(false);
    }
  };


  const distributeAmount = () => {
    const selectedCount = Object.values(selectedFriends).filter(Boolean).length;

    if (selectedCount === 0) {
      setUserAmount(totalAmount);
      return;
    }

    const splitAmount = parseFloat((totalAmount / (selectedCount + 1)).toFixed(2));

    setUserAmount(splitAmount);

    const newSplitAmounts = { ...splitAmounts };
    Object.keys(selectedFriends).forEach(friendId => {
      if (selectedFriends[friendId]) {
        newSplitAmounts[friendId] = splitAmount;
      } else {
        newSplitAmounts[friendId] = 0;
      }
    });

    setSplitAmounts(newSplitAmounts);
  };

  useEffect(() => {
    if (split === true && friends.length === 0) {
      getFriends();
    }
  }, [split, friends]);

  useEffect(() => {
    if (split && totalAmount > 0) {
      distributeAmount();
    }
  }, [totalAmount, selectedFriends, split]);

  const handleFriendToggle = (friendId: string) => {
    setSelectedFriends(prev => ({
      ...prev,
      [friendId]: !prev[friendId]
    }));
  };


  const handleAmountChange = (amount: string) => {
    if (amount === '') {
      setTotalAmount(0);
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (!isNaN(parsedAmount) && parsedAmount >= 0) {
      setTotalAmount(parsedAmount);
    }
  };

  const handleSplitAmountChange = (friendId: string, amount: string) => {
    if (amount === '') {
      setSplitAmounts(prev => ({
        ...prev,
        [friendId]: 0
      }));
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (!isNaN(parsedAmount) && parsedAmount >= 0) {
      setSplitAmounts(prev => ({
        ...prev,
        [friendId]: parsedAmount
      }));
    }
  };

  const handleUserAmountChange = (amount: string) => {
    if (amount === '') {
      setUserAmount(0);
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (!isNaN(parsedAmount) && parsedAmount >= 0) {
      setUserAmount(parsedAmount);
    }
  };

  const validateSplitTotal = () => {
    if (!split) return true;

    const friendsTotal = Object.entries(splitAmounts)
      .filter(([id]) => selectedFriends[id])
      .reduce((sum, [, amount]) => sum + amount, 0);

    const total = friendsTotal + userAmount;
    return Math.abs(total - totalAmount) < 0.01;
  };

  const addExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const amount = parseFloat(formData.get("amount") as string);
    const note = formData.get("note") as string;
    const date = formData.get("date") as string;

    // Validation
    if (!selectedTag) {
      setError("Please select a category.");
      return;
    }

    if (isNaN(amount) || amount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    if (!userId) {
      setError("User not authenticated.");
      return;
    }

    if (split) {
      const anyFriendSelected = Object.values(selectedFriends).some(Boolean);
      if (!anyFriendSelected) {
        setError("Please select at least one friend to split with.");
        return;
      }

      if (!validateSplitTotal()) {
        setError("Split amounts must sum up to the total expense amount.");
        return;
      }
    }

    try {
      setLoading(true);

      const payers = [];

      if (split) {
        payers.push({ userId: userId, amount: userAmount });

        Object.entries(selectedFriends)
          .filter(([, isSelected]) => isSelected)
          .forEach(([friendId]) => {
            payers.push({
              userId: friendId,
              amount: splitAmounts[friendId]
            });
          });
      } else {
        payers.push({ userId: userId, amount: amount });
      }

      // Make API call
      const response = await axios.post("/api/expenses/create", {
        amount: amount,
        category: selectedTag,
        payers: payers,
        note: note || "",
        date: new Date(date),
        isSplitted: split,
      });

      if (response.data.success) {
        // Reset form
        (e.target as HTMLFormElement).reset();
        setSelectedTag(null);
        setTotalAmount(0);
        setUserAmount(0);
        setSplit(false);

        if (split) {
          const resetFriends: { [key: string]: boolean } = {};
          const resetAmounts: { [key: string]: number } = {};

          Object.keys(selectedFriends).forEach(key => {
            resetFriends[key] = false;
            resetAmounts[key] = 0;
          });

          setSelectedFriends(resetFriends);
          setSplitAmounts(resetAmounts);
        }

        onExpenseAdded();
      }

    } catch (error) {
      console.error("Error adding expense:", error);

      if (error instanceof AxiosError) {
        const errorMessage = error.response?.data?.error || "Failed to add expense";
        setError(errorMessage);
      } else {
        setError("Failed to add expense. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-none">
      <CardContent>
        <form onSubmit={addExpense} className="space-y-6">
          <div className="space-y-2 pt-5">
            <Label htmlFor="amount" className="font-medium">Amount</Label>
            <Input
              id="amount"
              type="number"
              name="amount"
              placeholder="Enter amount"
              step="0.01"
              min="0"
              required
              onChange={(e) => handleAmountChange(e.target.value)}
              className="h-12"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="tag" className="font-medium">Category</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-12 w-full justify-between border-dashed"
                >
                  <div className="flex items-center gap-2">
                    <FilterIcon className="h-4 w-4" />
                    {selectedTag ? selectedTag : "Select a category"}
                  </div>
                  {selectedTag && (
                    <Badge className="ml-2">{selectedTag}</Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-4">
                <div className="grid grid-cols-2 gap-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={selectedTag === tag ? "default" : "outline"}
                      className="cursor-pointer text-center py-1.5 px-3 hover:opacity-80 transition-opacity"
                      onClick={() => setSelectedTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date" className="font-medium">Date</Label>
            <Input
              id="date"
              type="date"
              name="date"
              defaultValue={new Date().toISOString().split('T')[0]}
              required
              className="h-12"
            />
          </div>

          <div className="flex items-center justify-between bg-muted/40 p-3 rounded-lg">
            <Label htmlFor="split" className="font-medium cursor-pointer">Split with friends</Label>
            <Switch
              id="split"
              checked={split}
              onCheckedChange={() => setSplit(!split)}
            />
          </div>

          {split && (
            <div className="space-y-5 bg-muted/20 p-4 rounded-lg border border-dashed">
              <div className="space-y-2">
                <Label htmlFor="userAmount" className="font-medium">Your share</Label>
                <Input
                  id="userAmount"
                  type="text"
                  value={userAmount === 0 ? "" : userAmount.toString()}
                  onChange={(e) => handleUserAmountChange(e.target.value)}
                  placeholder="0.00"
                  className="h-12"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="selectFriends" className="font-medium">Select Friends</Label>
                <ScrollArea className="h-48 border rounded-lg p-2 bg-background shadow-sm">
                  {fetchingFriends ? (
                    <div className="flex justify-center items-center h-full">
                      <p className="text-muted-foreground">Loading friends...</p>
                    </div>
                  ) : friends.length > 0 ? (
                    <div className="space-y-1">
                      {friends.map((friend) => (
                        <div key={friend.userId._id} className="flex items-center py-2.5 px-2 space-x-2 hover:bg-muted/50 rounded-md">
                          <div className="flex items-center gap-2 flex-1">
                            <Checkbox
                              id={`friend-${friend.userId._id}`}
                              checked={selectedFriends[friend.userId._id] || false}
                              onCheckedChange={() => handleFriendToggle(friend.userId._id)}
                            />
                            <Label htmlFor={`friend-${friend.userId._id}`} className="cursor-pointer">
                              {friend.userId.name}
                            </Label>
                          </div>
                          {selectedFriends[friend.userId._id] && (
                            <Input
                              type="text"
                              value={splitAmounts[friend.userId._id] === 0 ? "" : splitAmounts[friend.userId._id].toString()}
                              onChange={(e) => handleSplitAmountChange(friend.userId._id, e.target.value)}
                              className="w-24 h-8"
                              placeholder="0.00"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex justify-center items-center h-full">
                      <p className="text-muted-foreground">No friends found. Add friends to split expenses.</p>
                    </div>
                  )}
                </ScrollArea>

                {split && totalAmount > 0 && (
                  <div className="mt-3 text-sm bg-muted/30 p-3 rounded-md">
                    <div className="flex justify-between font-medium">
                      <span>Total expense:</span>
                      <span>₹{totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between mt-1 text-muted-foreground">
                      <span>Sum of splits:</span>
                      <span>
                        ₹{(userAmount +
                          Object.entries(splitAmounts)
                            .filter(([id]) => selectedFriends[id])
                            .reduce((sum, [, amount]) => sum + amount, 0)
                        ).toFixed(2)}
                      </span>
                    </div>
                    {!validateSplitTotal() && (
                      <p className="text-destructive mt-2 text-xs flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Split amounts must sum up to the total expense amount.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="note" className="font-medium">Note</Label>
            <Input
              id="note"
              type="text"
              name="note"
              placeholder="Add a description"
              className="h-12"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              <AlertCircle className="w-4 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full h-12 font-medium">
            {loading ? "Adding..." : "Add Expense"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}