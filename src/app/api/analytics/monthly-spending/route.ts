import { getDataFromToken } from "@/helpers/getDataFromTokens";
import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbConfig/dbConfig";
import User from "@/models/userModel";
import { Expense as ExpenseType } from "@/types/expense";

connect();

interface ExpenseQuery {
  "payers.0.userId": string;
  createdAt?: {
    $gte: Date;
    $lte: Date;
  };
  category?: string;
}

const getMonthName = (date: Date | string) => {
  return new Date(date).toLocaleString('default', { month: 'short' });
};


interface MonthlyDataItem {
  month: string;
  total: number;
  Food: number;
  Grocery: number;
  Transport: number;
  Medical: number;
  Fruits: number;
  Bills: number;
  Rent: number;
  Entertainment: number;
  Other: number;
  [key: string]: number | string;
}


const processMonthlyData = (expens: ExpenseType[]) => {
  const monthlyData: Record<string, MonthlyDataItem> = {};
  
  expens.forEach(expense => {
    const date = expense.createdAt ? new Date(expense.createdAt) : new Date();
    const monthYear = `${getMonthName(date)} ${date.getFullYear()}`;
    
    if (!monthlyData[monthYear]) {
      monthlyData[monthYear] = {
        month: monthYear,
        total: 0,
        Food: 0,
        Grocery: 0,
        Transport: 0,
        Medical: 0,
        Fruits: 0,
        Bills: 0,
        Rent: 0,
        Entertainment: 0,
        Other: 0
      };
    }
    
    monthlyData[monthYear].total += expense.amount;
    
    if (typeof monthlyData[monthYear][expense.category] === 'number') {
      monthlyData[monthYear][expense.category] = (monthlyData[monthYear][expense.category] as number) + expense.amount;
    } else {
      monthlyData[monthYear][expense.category] = expense.amount;
    }
  });
  
  return Object.values(monthlyData).sort((a, b) => {
    const dateA = new Date(a.month as string);
    const dateB = new Date(b.month as string);
    return dateA.getTime() - dateB.getTime();
  });
};

async function GET(request: NextRequest) {
  try {
    const userId = await getDataFromToken(request);
    
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const expenses = await userId.expenses.find({
      "payers.0.userId": userId,
      createdAt: { $gte: sixMonthsAgo }
    }).sort({ createdAt: 1 });
    
    const monthlyData = processMonthlyData(expenses);
    
    return NextResponse.json({
      message: "Monthly spending data retrieved",
      success: true,
      data: monthlyData
    }, { status: 200 });
    
  } catch (error) {
    console.error("Error retrieving analytics:", error);
    return NextResponse.json(
      { error: "Failed to retrieve analytics data" },
      { status: 500 }
    );
  }
}

async function POST(request: NextRequest) {
  try {
    const userId = await getDataFromToken(request);
    
    const user = await User.findById(userId);
    if (!user?.isPremium) {
      return NextResponse.json(
        { error: "Premium subscription required" },
        { status: 403 }
      );
    }
    
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const dateParam = url.searchParams.get('date');
    
    const endDate = dateParam ? new Date(dateParam) : new Date();
    const startDate = new Date(endDate);
    
    const query: ExpenseQuery = {
      "payers.0.userId": userId,
      createdAt: { $gte: startDate, $lte: endDate }
    };
    
    if (category && category !== 'all') {
  query.category = category;
}

    
    const expenses = await user.expenses.find(query).sort({ createdAt: 1 });
    
    const categoriesData = processCategoriesData(expenses);
    
    return NextResponse.json({
      message: "Premium analytics data retrieved",
      success: true,
      data: {
        categories: categoriesData,
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error("Error retrieving premium analytics:", error);
    return NextResponse.json(
      { error: "Failed to retrieve premium analytics data" },
      { status: 500 }
    );
  }
}


function processCategoriesData(expenses: ExpenseType[]) {
  const categories: Record<string, number> = {};
  
  expenses.forEach(expense => {
    if (!categories[expense.category]) {
      categories[expense.category] = 0;
    }
    categories[expense.category] += expense.amount;
  });
  
  return Object.entries(categories).map(([name, value]) => ({
    name,
    value
  }));
}

export { GET, POST };