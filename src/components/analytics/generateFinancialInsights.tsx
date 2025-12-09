import { GoogleGenAI } from "@google/genai";

interface SpendingData {
    totalSpent: number;
    monthlyIncome: number;
    remainingAmount: number;
    categories: {
        name: string;
        value: number;
    }[];
}

export async function generateFinancialInsights(data: SpendingData): Promise<string> {
    if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
        console.error("GEMINI_API_KEY is not defined in environment variables.");
        return "API key is missing. Unable to generate insights.";
    }

    const genAI = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

    const categoryBreakdown = data.categories
        .map(cat => `- ${cat.name}: ₹${cat.value}`)
        .join("\n");

    const prompt = `
        You are a financial assistant. Analyze the following financial summary and provide concise, practical advice in a clean, structured, and professional format.

        Monthly Income: ₹${data.monthlyIncome}
        Total Spent: ₹${data.totalSpent}
        Remaining Amount: ₹${data.remainingAmount}

        Spending Breakdown:
        ${categoryBreakdown}

        IMPORTANT FORMATTING REQUIREMENTS:
        - Write all sub-points and explanations in plain text without any formatting
        - Write in complete sentences with proper paragraph structure
        - Keep explanations clear and actionable

        Structure your response exactly as follows:

        Spending Behavior Summary
        [Analyze spending patterns in plain text paragraphs]

        Savings Enhancement Suggestions
        [Provide specific recommendations in plain text format]

        Budget Optimization Advice
        [Include advice for high expense ratios and general budget tips in plain text]

        Remember: Only section headings should be bold. All content within sections should be in normal text formatting.

        Format:
            Return the output as 3–4 bullet points, with no extra spaces, explanations, or introductory text—just the bullet points.
        `;


    try {
        const response = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text ?? "No response generated.";
    } catch (error) {
        console.error("Error generating insights:", error);
        return "Unable to generate insights at this time.";
    }
}
