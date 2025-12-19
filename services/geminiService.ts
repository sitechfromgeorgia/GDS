
import { GoogleGenAI } from "@google/genai";
import { AnalyticsData } from "../types";

// Business analysis insights generation using Gemini API
export const generateAIInsights = async (data: AnalyticsData): Promise<string> => {
  // Directly use process.env.API_KEY
  if (!process.env.API_KEY) return "API Key missing. Cannot generate insights.";

  try {
    // Instantiate GoogleGenAI with a named parameter for the API key
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      As an expert business analyst for a food distribution company, analyze the following data:
      - Total Sales: $${data.totalSales}
      - Total Orders: ${data.totalOrders}
      - Profit Margin: ${(data.totalSales > 0 ? (data.totalProfit / data.totalSales * 100).toFixed(1) : 0)}%
      - Top Product: ${data.topProducts[0]?.name || 'N/A'}

      Provide a concise executive summary (max 3 sentences) and 3 bullet points of actionable strategic advice to increase profitability in the Georgian market context.
      Format the output as Markdown.
    `;

    // Using gemini-3-pro-preview for complex reasoning and business analysis tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });

    // Directly access the .text property from the GenerateContentResponse object
    return response.text || "No insights generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Failed to generate insights at this time.";
  }
};
