"use client";

import { useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCw, UserX } from "lucide-react";
import AddFriends from "@/components/AddFriends";
import { Friend } from "@/types/friend";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddFriends, setShowAddFriends] = useState<boolean>(false);
  const { toast } = useToast();

  const getFriends = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/friends/get");

      if (response.data.success) {
        setFriends(response.data.data.friends);
      } else {
        setError("Failed to fetch friends");
      }
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        setError(error.response?.data.error);
      }
      setError("An error occurred while fetching friends");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getFriends();
  }, []);

  const settleBalance = async (friendId: string) => {
    try {
      const response = await axios.post("/api/friends/settle", { friendId });
      if (response.data.success) {
        toast({
          variant: "success",
          title: "Success",
          description: "Balance settled successfully",
        });
        getFriends();
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong while settling balance",
      });
    }
  };

  return (
    <div className="container mx-auto py-20 px-4 max-w-4xl">
      <Card className="mb-8">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
          <div>
            <CardTitle className="text-2xl font-bold">Friends</CardTitle>
            <CardDescription>Manage your friends and balances</CardDescription>
          </div>
          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="default"
              onClick={() => getFriends()}
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            <AddFriends
              variant="default"
              onComplete={() => {
                setShowAddFriends(false);
                getFriends();
              }}
            />
          </div>
        </CardHeader>

        {showAddFriends && (
          <CardContent className="pt-0 pb-4">
            <AddFriends
              onComplete={() => {
                setShowAddFriends(false);
                getFriends();
              }}
            />
          </CardContent>
        )}
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-center">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : friends.length === 0 ? (
        <Card className="border-dashed border-2 p-8">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="rounded-full bg-secondary p-4">
              <UserX className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-lg">No friends yet</h3>
            <p className="text-muted-foreground">
              Add your first friend to get started
            </p>
            <AddFriends
              variant="default"
              onComplete={() => {
                setShowAddFriends(false);
                getFriends();
              }}
            />
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Desktop view (hidden on mobile) */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Friend</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {friends.map((friend) => (
                  <TableRow key={friend.userId._id}>
                    <TableCell className="font-medium">
                      <p>{friend.userId.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {friend.userId.phone}
                      </p>
                    </TableCell>
                    <TableCell className={`text-right font-semibold ${friend.amount === 0 ? "text-foreground" : friend.amount < 0 ? "text-red-500" : "text-primary"}`}>
                      {friend.amount > 0 ? "+" : ""}
                      {friend.amount}
                    </TableCell>
                    <TableCell className={`text-right ${friend.amount === 0 ? "text-green-500" : friend.amount < 0 ? "text-red-500" : "text-primary"}`}>
                      {friend.amount > 0
                        ? "Owes you"
                        : friend.amount < 0
                          ? "You owe"
                          : "Settled"}
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" className="text-primary">Settle Balance</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action will settle the balance between you and{" "}
                              {friend.userId.name} and cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => settleBalance(friend.userId._id)}
                            >
                              Settle Balance
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile view (hidden on desktop) */}
          <div className="block md:hidden space-y-4">
            {friends.map((friend) => (
              <Card key={friend.userId._id} className="p-4">
                <div className="flex flex-col space-y-3">
                  <div>
                    <h3 className="font-medium">{friend.userId.name}</h3>
                    <p className="text-sm text-muted-foreground">{friend.userId.phone}</p>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Balance:</span>
                    <span className={`font-semibold ${friend.amount === 0 ? "text-foreground" : friend.amount < 0 ? "text-red-500" : "text-primary"}`}>
                      {friend.amount > 0 ? "+" : ""}
                      {friend.amount}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Status:</span>
                    <span className={`${friend.amount === 0 ? "text-green-500" : friend.amount < 0 ? "text-red-500" : "text-primary"}`}>
                      {friend.amount > 0
                        ? "Owes you"
                        : friend.amount < 0
                          ? "You owe"
                          : "Settled"}
                    </span>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="text-primary w-full mt-2">
                        Settle Balance
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action will settle the balance between you and{" "}
                          {friend.userId.name} and cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => settleBalance(friend.userId._id)}
                        >
                          Settle Balance
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}