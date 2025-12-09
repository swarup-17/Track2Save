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
        - All section headings **MUST** be formatted using **Markdown bold syntax** (e.g., **Heading**) followed by two asterisks on the next line (e.g., **Heading**\n\n**Subheading**).
        - Use **Markdown bullet points** (*) for the content within the suggestions/advice sections.
        - Write in complete sentences with proper paragraph structure.

        Structure your response EXACTLY as follows:

        **Spending Behavior Summary**
        [Analyze spending patterns in plain text paragraphs]

        **Savings Enhancement Suggestions**
        * [Provide specific recommendation 1]
        * [Provide specific recommendation 2]

        **Budget Optimization Advice**
        * [Provide advice 1]
        * [Provide advice 2]
        * [Provide advice 3]

        Remember: Ensure the entire output is structured using the Markdown requested above.
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
