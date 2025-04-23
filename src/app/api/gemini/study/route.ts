import { NextResponse } from 'next/server';

export const maxDuration = 40; 

export async function POST(request: Request) {
  try {
    const { topic } = await request.json();

    if (!topic || topic.trim().length === 0) {
      return NextResponse.json(
        { error: 'No topic provided' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('Missing Gemini API key');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const prompt = `
      Create a comprehensive study guide for the topic: "${topic}"
      Please provide the response in the following JSON format:
      {
        "summary": "A brief overview of the topic (about 150 words)",
        "flashcards": [
          { "front": "Question/term", "back": "Answer/definition" }
          // At least 5 flashcards
        ],
        "quizQuestions": [
          {
            "question": "The question text",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": "The correct option"
          }
          // At least 3 quiz questions
        ]
      }
    `;

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
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 32,
            topP: 0.95,
            maxOutputTokens: 2048,
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
    const generatedText = data.candidates[0].content.parts[0].text;
    console.log('Gemini API response:', generatedText);
    
    // Extract the JSON from the response
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse JSON from response');
    }
    
    const studyGuide = JSON.parse(jsonMatch[0]);

    return NextResponse.json(studyGuide);
  } catch (error) {
    console.error('Error processing study guide request:', error);
    return NextResponse.json(
      { error: 'Failed to generate study guide' },
      { status: 500 }
    );
  }
}