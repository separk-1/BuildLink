export async function askGemini(question: string, context: string) {
  try {
      const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({
              question,
              context
          })
      });

      if (!response.ok) {
          const err = await response.json();
          throw new Error(err.detail || "Backend Error");
      }

      const data = await response.json();
      return data.answer;
  } catch (error) {
      console.error("AI Service Error:", error);
      return `Error: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}
