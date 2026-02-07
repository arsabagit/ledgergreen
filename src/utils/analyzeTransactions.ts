import { Transaction } from "@/types";

export interface AnalysisResult {
    summary: string;
    potentialDuplicates: Transaction[];
    insights: string[];
}

export async function analyzeTransactions(transactions: Transaction[]): Promise<AnalysisResult> {
    // Simulator for Gemini API call
    console.log("Analyzing transactions with Gemini...", transactions.length);

    // In a real implementation, we would use Google Generative AI SDK here
    // const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    // ...

    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock analysis
    const duplicates = transactions.filter((t, index) =>
        transactions.findIndex(t2 => t2.amount === t.amount && t2.date === t.date && t2.description === t.description) !== index
    );

    return {
        summary: `You have spent a total of ${transactions.length} transactions this month. Top category appears to be Food.`,
        potentialDuplicates: duplicates,
        insights: [
            "Spending on 'Food' is 20% higher than last month.",
            "You have 3 recurring subscriptions detected.",
            "Consider setting a budget for 'Shopping'."
        ]
    };
}
