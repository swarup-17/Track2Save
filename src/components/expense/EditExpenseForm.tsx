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

interface Payer {
    userId: string;
    amount: number;
    name?: string;
    isCurrentUser?: boolean;
    phone?: string;
    role?: string;
}

interface Expense {
    _id: string;
    amount: number;
    category: string;
    note: string;
    date: string | Date;
    isSplitted: boolean;
    payers: Payer[];
    createdAt?: string;
    updatedAt?: string;
}

interface EditExpenseFormProps {
    expense: Expense;
    userId: string | null;
    onExpenseUpdated: () => void;
    onClose: () => void;
}

export default function EditExpenseForm({ expense, userId, onExpenseUpdated, onClose }: EditExpenseFormProps) {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>("");
    const [selectedTag, setSelectedTag] = useState<string>(expense.category);
    const [split, setSplit] = useState(expense.isSplitted);
    const [fetchingFriends, setFetchingFriends] = useState(false);
    const [friends, setFriends] = useState<Friend[]>([]);
    const [selectedFriends, setSelectedFriends] = useState<{ [key: string]: boolean }>({});
    const [totalAmount, setTotalAmount] = useState<number>(expense.amount);
    const [splitAmounts, setSplitAmounts] = useState<{ [key: string]: number }>({});
    const [userAmount, setUserAmount] = useState<number>(0);

    const tags = ["Food", "Grocery", "Transport", "Medical", "Fruits", "Bills", "Rent", "Entertainment", "Other"];

    useEffect(() => {
        if (expense && userId) {
            const userPayer = expense.payers.find(payer => payer.userId === userId);
            setUserAmount(userPayer?.amount || expense.amount);

            if (expense.isSplitted && expense.payers.length > 1) {
                const friendSelections: { [key: string]: boolean } = {};
                const friendAmounts: { [key: string]: number } = {};

                expense.payers.forEach(payer => {
                    if (payer.userId !== userId) {
                        friendSelections[payer.userId] = true;
                        friendAmounts[payer.userId] = payer.amount;
                    }
                });

                setSelectedFriends(friendSelections);
                setSplitAmounts(friendAmounts);
            }
        }
    }, [expense, userId]);

    const getFriends = async () => {
        try {
            setFetchingFriends(true);
            const response = await axios.get("/api/friends/get");
            setFriends(response.data.data.friends);

            const newFriendsState: { [key: string]: boolean } = {};
            const newSplitAmounts: { [key: string]: number } = {};

            response.data.data.friends.forEach((friend: Friend) => {
                newFriendsState[friend.userId._id] = selectedFriends[friend.userId._id] || false;
                newSplitAmounts[friend.userId._id] = splitAmounts[friend.userId._id] || 0;
            });

            setSelectedFriends(newFriendsState);
            setSplitAmounts(newSplitAmounts);

        } catch (error) {
            if (error instanceof AxiosError) {
                setError(error.response?.data.error);
            } else {
                setError("Something went wrong");
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
        const parsedAmount = parseFloat(amount);
        if (!isNaN(parsedAmount)) {
            setTotalAmount(parsedAmount);
        } else {
            setTotalAmount(0);
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
        const friendsTotal = Object.entries(splitAmounts)
            .filter(([id]) => selectedFriends[id])
            .reduce((sum, [, amount]) => sum + amount, 0);

        const total = friendsTotal + userAmount;
        return Math.abs(total - totalAmount) < 0.01;
    };

    const updateExpense = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);
        const amount = parseFloat(formData.get("amount") as string);
        const note = formData.get("note");
        const date = formData.get("date") as string;

        if (!selectedTag) {
            setError("Please select a category.");
            return;
        }

        if (isNaN(amount) || amount <= 0) {
            setError("Please enter a valid amount.");
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

        setError("");
        try {
            setLoading(true);

            const payers = [];

            if (split) {
                // Add current user
                payers.push({ userId: userId, amount: userAmount });

                // Add selected friends
                Object.entries(selectedFriends)
                    .filter(([, isSelected]) => isSelected)
                    .forEach(([friendId]) => {
                        payers.push({
                            userId: friendId,
                            amount: splitAmounts[friendId]
                        });
                    });
            } else {
                // For non-split expenses, only current user pays
                payers.push({ userId: userId, amount: amount });
            }

            await axios.put(`/api/expenses/update?id=${expense._id}`, {
                amount,
                category: selectedTag,
                payers,
                note,
                date: new Date(date),
                isSplitted: split,
            });

            onExpenseUpdated();
            onClose();
        } catch (error: unknown) {
            if (error instanceof AxiosError) {
                setError(error.response?.data.error || "Failed to update expense");
            } else {
                setError("Something went wrong");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="border-none px-6 py-4 shadow-md">
            <CardContent className="p-0">
                <form onSubmit={updateExpense} className="space-y-6">
                    <div className="space-y-2 pt-5">
                        <Label htmlFor="amount" className="font-medium">Amount</Label>
                        <Input
                            id="amount"
                            name="amount"
                            type="number"
                            placeholder="Enter amount"
                            step="0.01"
                            min="0"
                            defaultValue={expense.amount}
                            onChange={(e) => handleAmountChange(e.target.value)}
                            required
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
                            name="date"
                            type="date"
                            defaultValue={
                                typeof expense.date === 'string'
                                    ? new Date(expense.date).toISOString().split('T')[0]
                                    : (expense.date as Date).toISOString().split('T')[0]
                            }
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
                                    required={split}
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
                            name="note"
                            type="text"
                            placeholder="Add a description"
                            defaultValue={expense.note || ''}
                            className="h-12"
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 h-12 font-medium"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="flex-1 h-12 font-medium"
                        >
                            {loading ? "Updating..." : "Update Expense"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}