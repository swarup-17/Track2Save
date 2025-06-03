"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { useAuthStore } from "@/store/Auth";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Label
} from "recharts";
import axios from "axios";
import { generateFinancialInsights } from './generateFinancialInsights';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableRow } from "../ui/table";

type ExpenseCategory =
  | "Food"
  | "Grocery"
  | "Transport"
  | "Medical"
  | "Fruits"
  | "Bills"
  | "Rent"
  | "Entertainment"
  | "Other"
  | "Remaining";

const categoryColors: Record<ExpenseCategory, string> = {
  Food: "#FF5252",
  Grocery: "#2196F3",
  Transport: "#FFCA28",
  Medical: "#00BFA5",
  Fruits: "#8E24AA",
  Bills: "#FF6D00",
  Rent: "#D81B60",
  Entertainment: "#546E7A",
  Other: "#3949AB",
  Remaining: "#4CAF50"
};

interface ChartDataItem {
  name: string;
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    percent?: number;
    dataKey?: string | number;
    payload?: {
      isSplit?: boolean;
      name: string;
      value: number;
    };
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const isSplit = data.payload?.isSplit;
    return (
      <div className="bg-white p-4 rounded shadow-md border border-gray-200">
        <p className="font-medium text-gray-900">
          {data.name}
          {isSplit && (
            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
              Split
            </span>
          )}
        </p>
        <p className="text-gray-700">
          Amount: ₹{data.value.toLocaleString('en-IN')}
          {isSplit && ' (Your Share)'}
        </p>
        <p className="text-gray-500">
          {data.percent ? `${(data.percent * 100).toFixed(1)}%` : ''}
        </p>
      </div>
    );
  }
  return null;
};

interface CustomLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  index: number;
  name: string;
}

const renderCustomizedLabel = (props: CustomLabelProps) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.7;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null;

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={14}
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

interface CentralLabelProps {
  viewBox?: {
    cx?: number;
    cy?: number;
    height?: number;
    width?: number;
    x?: number;
    y?: number;
  };
}

export default function MonthlyPieChart() {
  const { userId } = useAuthStore();
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalSpent, setTotalSpent] = useState<number>(0);
  const [monthlyIncome, setMonthlyIncome] = useState<number>(0);
  const [remainingAmount, setRemainingAmount] = useState<number>(0);
  const [showRemainingInChart, setShowRemainingInChart] = useState<boolean>(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()));
  const [aiInsights, setAiInsights] = useState<string>("");
  const [isGeneratingInsights, setIsGeneratingInsights] = useState<boolean>(false);
  const aiInsightsRef = useRef<HTMLDivElement>(null);

  // Generate years (current year and 5 years back)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => String(currentYear - i));

  const months = [
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
    { value: "12", label: "December" }
  ];

  const getAiInsights = useCallback(async () => {
    if (chartData.length === 0) return 0;
    setIsGeneratingInsights(true);
    try {
      const spendingData = {
        totalSpent,
        monthlyIncome,
        remainingAmount,
        categories: chartData
      };

      const insights = await generateFinancialInsights(spendingData);
      setAiInsights(insights);

      setTimeout(() => {
        aiInsightsRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
    } catch (error) {
      console.error('Failed to generate insights:', error);
      setAiInsights("Failed to generate insights. Please try again.");
    } finally {
      setIsGeneratingInsights(false);
    }
  }, [totalSpent, monthlyIncome, remainingAmount, chartData]);


  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [userResponse, spendingResponse] = await Promise.all([
          axios.get("/api/users/profile"),
          axios.get(`/api/expenses/userExpenses?month=${selectedMonth}&year=${selectedYear}`)
        ]);

        const userMonthlyIncome = userResponse.data?.data?.monthlyIncome || 0;
        setMonthlyIncome(userMonthlyIncome);

        const expenseData = spendingResponse.data?.data || [];

        if (expenseData.length === 0) {
          setChartData([]);
          setTotalSpent(0);
          setRemainingAmount(userMonthlyIncome);
          return;
        }

        if (expenseData.length > 0) {
          let totalSpentAmount = 0;
          interface Expense {
            category: ExpenseCategory;
            amount: number;
            isSplitted: boolean;
            payers: Array<{
              userId: string;
              amount: number;
            }>;
          }

          const categoryTotals = expenseData.reduce((acc: Record<string, number>, expense: Expense) => {
            const category = expense.category;
            const amount = expense.isSplitted
              ? expense.payers.find((payer) => payer.userId === userId)?.amount || 0
              : expense.amount;
            acc[category] = (acc[category] || 0) + amount;
            totalSpentAmount += amount;
            return acc;
          }, {});

          const chartDataItems: ChartDataItem[] = Object.entries(categoryTotals).map(([category, amount]): ChartDataItem => ({
            name: category,
            value: Number(amount)
          }));

          setTotalSpent(totalSpentAmount);

          const remaining = userMonthlyIncome - totalSpentAmount;
          setRemainingAmount(remaining > 0 ? remaining : 0);

          expenseData.sort((a: { value: number }, b: { value: number }) => b.value - a.value);

          chartDataItems.sort((a, b) => b.value - a.value);
          setChartData(chartDataItems);
        }
      } catch (err) {
        setError("Failed to load chart data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, selectedMonth, selectedYear]);

  const toggleRemainingInChart = () => {
    setShowRemainingInChart(!showRemainingInChart);
  };

  const finalChartData: ChartDataItem[] = showRemainingInChart && remainingAmount > 0
    ? [...chartData, { name: "Remaining", value: remainingAmount }]
    : chartData;

  const CentralLabelContent = (props: CentralLabelProps) => {
    if (!props.viewBox || props.viewBox.cx === undefined || props.viewBox.cy === undefined) {
      return null;
    }

    const { cx, cy } = props.viewBox;

    const displayAmount = showRemainingInChart ? remainingAmount : totalSpent;
    const displayLabel = showRemainingInChart ? "Remaining" : "Total Spent";
    const displayColor = showRemainingInChart ? "fill-green-600" : "fill-red-500";

    return (
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central">
        <tspan x={cx} y={cy - 10} className={`text-lg font-bold ${displayColor}`}>
          ₹{displayAmount.toLocaleString('en-IN')}
        </tspan>
        <tspan x={cx} y={cy + 10} className="text-xs fill-current">
          {displayLabel}
        </tspan>
      </text>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="h-80 flex items-center justify-center">
          <div className="text-center text-gray-500">Loading chart data...</div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="h-80 flex items-center justify-center">
          <div className="text-center text-red-500">{error}</div>
        </div>
      );
    }

    if (chartData.length === 0) {
      return (
        <div className="h-80 flex items-center justify-center">
          <div className="text-center text-gray-500">
            No expenses found for {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="w-full h-64 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={finalChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius="40%"
                  outerRadius="100%"
                  paddingAngle={2}
                  labelLine={false}
                  label={renderCustomizedLabel}
                >
                  {finalChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={categoryColors[entry.name as ExpenseCategory] || "#8884d8"}
                      strokeWidth={1}
                    />
                  ))}
                  <Label
                    position="center"
                    content={CentralLabelContent}
                  />
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="border rounded-lg p-4">
          <h3 className="text-xl mb-6">Spending Summary</h3>
          <div className="space-y-5">
            <div className="flex justify-between">
              <span className="text-current">Monthly Income:</span>
              <span className="font-medium">₹{monthlyIncome.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-current">Total Spent:</span>
              <span className="font-medium">₹{totalSpent.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between border-t pt-2 mt-2">
              <span className="text-current">Remaining:</span>
              <span className="font-medium text-green-600">₹{remainingAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="pt-3">
              <div className="bg-gray-200 h-5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-5 rounded-full"
                  style={{ width: `${Math.min(100, (totalSpent / monthlyIncome) * 100)}%` }}
                />
              </div>
              <div className="flex justify-center text-xs text-gray-500 mt-2">
                <span>{Math.round((totalSpent / monthlyIncome) * 100)}% of budget used</span>
              </div>
              {chartData.length > 0 && (
                <div className="flex flex-col gap-2 pt-7">
                  <Button
                    onClick={toggleRemainingInChart}
                    className={`w-full font-medium py-2 px-4 rounded-lg transition-colors ${showRemainingInChart
                      ? "bg-gray-600 hover:bg-gray-700 text-white"
                      : "bg-green-500 hover:bg-green-600 text-white"
                      }`}
                  >
                    {showRemainingInChart ? "Hide Remaining" : "Show Remaining"}
                  </Button>
                  <Button
                    onClick={getAiInsights}
                    disabled={isGeneratingInsights}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGeneratingInsights ? "Generating..." : "Generate AI Insights"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between md: gap-4">
          <div>
            <CardTitle className="text-lg md:text-xl">Monthly Spending</CardTitle>
            <CardDescription className="text-sm text-gray-500">
              Showing expenditure for {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
            </CardDescription>
          </div>
          <div className="flex flex-col md:flex-row gap-2 md:items-center">
            <div className="flex gap-2">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[200px]">
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
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[200px]">
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
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {renderContent()}

        {chartData.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <Table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-current">
                  <th className="text-left text-lg py-2 px-2 font-medium text-current">Category</th>
                  <th className="text-right text-lg py-2 px-2 font-medium text-current">Amount</th>
                  <th className="text-right text-lg py-2 px-2 font-medium text-current"> % of Total</th>
                </tr>
              </thead>
              <TableBody>
                {chartData.map((item, index) => (
                  <TableRow key={index} className="border-b border-gray-100">
                    <TableCell className="py-2 px-2 flex items-center">
                      <span
                        className="w-3 h-3 rounded-full inline-block mr-2"
                        style={{ backgroundColor: categoryColors[item.name as ExpenseCategory] || "#8884d8" }}
                      />
                      {item.name}
                    </TableCell>
                    <TableCell className="text-right py-2 px-2">₹{item.value.toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right py-2 px-2">{((item.value / totalSpent) * 100).toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {chartData.length > 0 && (
        <div
          ref={aiInsightsRef}
          className="my-5 p-4 rounded-lg">
          {aiInsights && (
            <div className="prose prose-sm max-w-none">
              <h3 className="text-2xl font-bolder mb-4 flex items-center">
                <span className="mr-2">🤖</span>
                AI Financial Insights
              </h3>
              <div className="prose prose-sm max-w-none leading-relaxed">
                <div className="whitespace-pre-line">{aiInsights}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}