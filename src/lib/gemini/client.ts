export async function summarizeText(
    text: string,
    options: { maxLength?: number } = {}
  ): Promise<{ summary: string } | { error: string }> {
    try {
      // Client-side call to our Next.js API route
      const response = await fetch('/api/gemini/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          maxLength: options.maxLength || 100,
        }),
      });
  
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to summarize text');
      }
  
      const data = await response.json();
      return { summary: data.summary };
    } catch (error) {
      console.error('Error summarizing with Gemini:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }