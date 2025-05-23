"use client";

import axios, { AxiosError } from "axios";
import { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../ui/card";
import { Badge } from "../ui/badge";
import {
  Loader2,
  Trash2,
  Users,
  User,
  Receipt,
  FilterIcon,
  EllipsisVertical,
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Pencil,
} from "lucide-react";
import { Button } from "../ui/button";
import { useAuthStore } from "@/store/Auth";
import { useToast } from "../../hooks/use-toast";

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

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Separator } from "../ui/separator";
import EditExpenseForm from "../expense/EditExpenseForm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { formatCurrency } from "@/helpers/formatCurrency";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../ui/dialog";
import { ScrollArea } from "../ui/scroll-area";

export default function UserExpenses({ refresh }: { refresh: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });
  const { userId } = useAuthStore();
  const { toast } = useToast();

  const [selectedMonth, setSelectedMonth] = useState<string>(
    String(new Date().getMonth() + 1)
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    String(new Date().getFullYear())
  );
  const [selectedTag, setSelectedTag] = useState<string>("All");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);

  const tags = [
    "All",
    "Food",
    "Grocery",
    "Transport",
    "Medical",
    "Fruits",
    "Bills",
    "Rent",
    "Entertainment",
    "Other",
  ];

  const months = [
    { value: "all", label: "All Months" },
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  // Generate years (current year and 5 years back)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => String(currentYear - i));

  const getUserExpenses = useCallback(async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      let url = "/api/expenses/userExpenses";
      const params = new URLSearchParams();

      if (selectedMonth !== "all") {
        params.append("month", selectedMonth);
      }

      params.append("year", selectedYear);

      if (selectedTag !== "All") {
        params.append("tag", selectedTag);
      }

      params.append("page", page.toString());
      params.append("limit", pagination.limit.toString());

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await axios.get(url);
      if (response.status === 200) {
        setExpenses(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        setError(error.response?.data.error || "Failed to load expenses");
        toast({
          title: "Error loading expenses",
          description: error.response?.data.error || "Please try again later",
          variant: "destructive",
        });
      } else {
        setError("Something went wrong");
        toast({
          title: "Error",
          description: "Something went wrong loading your expenses",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, selectedTag, pagination.limit, toast]);

  useEffect(() => {
    getUserExpenses(1);
  }, [selectedMonth, selectedYear, selectedTag, refresh, getUserExpenses]);

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    getUserExpenses(newPage);
  };

  const openDeleteDialog = (expenseId: string) => {
    setExpenseToDelete(expenseId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;

    try {
      setLoading(true);
      const response = await axios(`/api/expenses/delete?id=${expenseToDelete}`, {
        method: "DELETE",
        data: { userId, expenseId: expenseToDelete },
        headers: { "Content-Type": "application/json" }
      });

      setExpenses(prev => prev.filter(exp => exp._id !== expenseToDelete));

      if (response.status === 200) {
        toast({
          title: "Success",
          variant: "destructive",
          duration: 2000,
          description: "Expense deleted successfully",
        });
        await getUserExpenses(pagination.page);
      }
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast({
          title: "Error deleting expense",
          description: error.response?.data.error || "Please try again",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Something went wrong",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setExpenseToDelete(null);
    }
  };

  const isExpenseSplit = (expense: Expense) => {
    return expense.isSplitted && expense.payers && expense.payers.length > 1;
  };

  const getUserRole = (expense: Expense) => {
    const userPayer = expense.payers?.find(payer => payer.userId === userId);
    if (userPayer?.role) {
      return userPayer.role;
    }

    const isCreator = expense.payers &&
      expense.payers.length > 0 &&
      expense.payers[0].userId === userId;

    const isSplit = isExpenseSplit(expense);

    if (isSplit) {
      return isCreator ? "split-owner" : "payer";
    } else {
      return "owner";
    }
  };

  const getUserAmount = (expense: Expense) => {
    if (!expense.payers || !Array.isArray(expense.payers)) return 0;
    const userPayer = expense.payers.find((payer) => payer.userId === userId);
    return userPayer ? userPayer.amount : 0;
  };

  const getBadgeLabel = (role: string) => {
    switch (role) {
      case "split-owner":
        return "Split Owner";
      case "owner":
        return "Owner";
      case "payer":
        return "Payer";
      default:
        return "Unknown";
    }
  };

  const getBadgeIcon = (role: string) => {
    switch (role) {
      case "split-owner":
        return <Users className="w-3 h-3" />;
      case "owner":
        return <User className="w-3 h-3" />;
      case "payer":
        return <Receipt className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getMonthName = (monthNum: string) => {
    return months.find((m) => m.value === monthNum)?.label || "All Months";
  };

  if (loading && expenses.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-hidden border-t-4 border-primary border-l-0 border-r-0">
          <DialogHeader className="px-4 pt-6 pb-2">
            <DialogTitle className="flex items-center text-xl gap-1">
              <Pencil className="w-4 h-4" />Edit Expense
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="pb-6 max-h-[calc(90vh-80px)]">
            {expenseToEdit ? (
              <EditExpenseForm
                expense={{
                  ...expenseToEdit,
                  category: expenseToEdit.category,
                }}
                userId={userId}
                onExpenseUpdated={() => {
                  getUserExpenses(pagination.page);
                  setEditDialogOpen(false);
                  setExpenseToEdit(null);
                  toast({
                    title: "Success",
                    variant: "success",
                    duration: 2000,
                    description: "Expense updated successfully",
                  });
                }}
                onClose={() => {
                  setEditDialogOpen(false);
                  setExpenseToEdit(null);
                }}
              />
            ) : (
              <div className="text-muted-foreground text-sm">No expense selected</div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Expense</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteExpense}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between sticky top-0 bg-background px-2 py-4 z-10 gap-4">
        <h2 className="text-2xl font-bold tracking-tight text-foreground font-sour_gummy">
          Expenses
        </h2>

        <div className="flex flex-wrap items-center gap-2">
          {/* Month selector */}
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Year selector */}
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-24">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Tag filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <FilterIcon className="h-4 w-4 mr-2" />
                {selectedTag === "All" ? "All Tags" : selectedTag}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60">
              <div className="grid grid-cols-2 gap-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTag === tag ? "default" : "outline"}
                    className="cursor-pointer text-center py-1"
                    onClick={() => setSelectedTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex flex-col items-end">
          <p className="text-sm text-muted-foreground text-right">
            {pagination.total} {pagination.total === 1 ? "expense" : "expenses"}{" "}
            in {getMonthName(selectedMonth)} {selectedYear}
          </p>
          {expenses.length > 0 && (
            <p className="text-sm font-medium">
              Total:{" "}
              {formatCurrency(
                expenses.reduce(
                  (acc, expense) => acc + getUserAmount(expense),
                  0
                )
              )}
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 text-sm text-destructive-foreground bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 auto-rows-max">
        {expenses.map((expense) => {
          const isSplit = isExpenseSplit(expense);
          const userRole = getUserRole(expense);
          const userAmount = getUserAmount(expense);

          return (
            <Card
              key={expense._id}
              className="overflow-hidden transition-shadow hover:shadow-lg"
            >
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="px-2 py-1">
                      {expense.category}
                    </Badge>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge
                            variant="outline"
                            className="flex items-center gap-1 px-2 py-1"
                          >
                            {getBadgeIcon(userRole)}
                            <span>{getBadgeLabel(userRole)}</span>
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          {(() => {
                            switch (userRole) {
                              case "split-owner":
                                return <p>You created this split expense shared between {expense.payers.length} people</p>;
                              case "owner":
                                return <p>Your personal expense that you created</p>;
                              case "payer":
                                return <p>An expense where you are the payer</p>;
                              default:
                                return <p>Expense details</p>;
                            }
                          })()}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex items-center gap-2">
                    <time className="text-sm text-muted-foreground whitespace-nowrap flex items-center">
                      <CalendarIcon className="md:block w-3 h-3 mr-1" />
                      {formatDate(expense.date)}
                    </time>

                    {expense.payers && expense.payers.length > 0 && expense.payers[0].userId === userId && (
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <EllipsisVertical className="w-5 h-5 text-muted-foreground cursor-pointer" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            className="flex items-center cursor-pointer space-x-2"
                            onClick={() => {
                              setExpenseToEdit(expense);
                              setEditDialogOpen(true);
                            }}
                          >
                            <Pencil className="w-4 h-4" /> Edit
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            className="flex items-center cursor-pointer space-x-2 text-red-600"
                            onClick={() => openDeleteDialog(expense._id)}
                          >
                            <Trash2 className="w-4 h-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
                <CardDescription className="text-sm whitespace-pre-line">
                  {expense.note || "No description provided"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">
                      Your share
                    </span>
                    <CardTitle className="text-2xl font-bold text-primary">
                      {formatCurrency(userAmount)}
                    </CardTitle>
                  </div>

                  {isSplit && (
                    <div className="flex flex-col items-end">
                      <span className="text-sm text-muted-foreground">
                        Total expense
                      </span>
                      <span className="text-lg font-semibold">
                        {formatCurrency(expense.amount)}
                      </span>
                    </div>
                  )}
                </div>

                {isSplit && (
                  <>
                    <Separator />
                    <div className="text-sm text-muted-foreground">
                      <div className="flex justify-between items-center">
                        <span>
                          Split between {expense.payers.length} people
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {expenses.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg border-border bg-background">
          <Receipt className="w-12 h-12 text-muted-foreground mb-2" />
          <p className="text-lg font-medium text-foreground">
            No expenses found
          </p>
          <p className="text-sm text-muted-foreground">
            {selectedTag !== "All"
              ? `No ${selectedTag.toLowerCase()} expenses in ${getMonthName(
                selectedMonth
              )} ${selectedYear}.`
              : `No expenses in ${getMonthName(
                selectedMonth
              )} ${selectedYear}.`}
          </p>
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1 || loading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages || loading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}