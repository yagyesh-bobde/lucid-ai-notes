// src/app/api/gemini/summarize/route.ts
// API route for Gemini summarization
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { text, maxLength = 100 } = await request.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'No text provided for summarization' },
        { status: 400 }
      );
    }

    // Get Gemini API key from environment variable
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('Missing Gemini API key');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Call Gemini API for summarization
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Please provide a concise summary of the following text in about ${maxLength} words:\n\n${text}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            topK: 32,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error:', errorData);
      return NextResponse.json(
        { error: `API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Extract summary from response
    if (
      data.candidates &&
      data.candidates.length > 0 &&
      data.candidates[0].content &&
      data.candidates[0].content.parts &&
      data.candidates[0].content.parts.length > 0
    ) {
      return NextResponse.json({
        summary: data.candidates[0].content.parts[0].text,
      });
    } else {
      console.error('Unexpected response structure:', data);
      return NextResponse.json(
        { error: 'Failed to parse Gemini API response' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing summarization request:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}