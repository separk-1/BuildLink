export async function askGemini(question: string, context: string, apiKey?: string) {
  // Prioritize passed key, then env var
  const keyToUse = apiKey || import.meta.env.VITE_GEMINI_API_KEY;

  if (!keyToUse) {
      throw new Error("API Key is missing. Please set VITE_GEMINI_API_KEY in .env");
  }

  const prompt = `
  You are an AI Advisor for a Nuclear Power Plant Operator.
  Use the following Knowledge Graph context (Procedures and System State) to answer the user's question.
  Be concise, professional, and safety-oriented.

  CONTEXT:
  ${context}

  USER QUESTION:
  ${question}
  `;

  try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${keyToUse}`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({
              contents: [{
                  parts: [{ text: prompt }]
              }]
          })
      });

      if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error?.message || "Gemini API Error");
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
  } catch (error) {
      console.error("Gemini API Call Failed:", error);
      return `Error: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}
