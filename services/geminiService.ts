
import { GoogleGenAI } from "@google/genai";
import { AnalyticsData } from "../types";

// Business analysis insights generation using Gemini API
export const generateAIInsights = async (data: AnalyticsData): Promise<string> => {
  // Always use process.env.API_KEY directly
  if (!process.env.API_KEY) return "API გასაღები ვერ მოიძებნა. ანალიტიკა დროებით მიუწვდომელია.";

  try {
    // Create new instance for every call as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      As a senior business intelligence consultant for the Georgian food distribution market, analyze:
      - Current Revenue: $${data.totalSales.toLocaleString()}
      - Net Profit: $${data.totalProfit.toLocaleString()}
      - Profit Margin: ${(data.totalSales > 0 ? (data.totalProfit / data.totalSales * 100).toFixed(1) : 0)}%
      - Top Performing Product: ${data.topProducts[0]?.name || 'N/A'}
      
      Instructions:
      1. Provide a professional, encouraging executive summary (2 sentences).
      2. List 3 specific, data-driven strategies for the Georgian context (e.g., regional expansion, category focus).
      3. Focus on maximizing the current profit margin.
      4. Answer in Georgian language.
      Format: Clean Markdown.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.9,
      }
    });

    return response.text || "ინსაიტების გენერირება ვერ მოხერხდა.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI სერვისთან დაკავშირება ვერ მოხერხდა. გთხოვთ სცადოთ მოგვიანებით.";
  }
};
