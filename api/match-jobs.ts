import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req: Request) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { userBadges, jobs, userCompletions } = await req.json();

    // Validate input
    if (!jobs || !Array.isArray(jobs)) {
      return new Response(JSON.stringify({ error: 'Invalid jobs data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(
      process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || ''
    );

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      }
    });

    // Create the prompt for Gemini
    const prompt = `You are an AI job matching assistant for CredChain, a decentralized freelance platform.

**User Profile:**
- Badges earned: ${JSON.stringify(userBadges || [], null, 2)}
- Completed contracts: ${userCompletions || 0}

**Available Jobs:**
${JSON.stringify(jobs, null, 2)}

**Task:**
Analyze the user's skills (from badges) and experience (from completions) against the available jobs.
Rank each job by fit score (0-100) and provide a brief reason why it's a good match.

**Return Format (JSON only, no markdown):**
[
  {
    "jobId": "string",
    "title": "string",
    "fitScore": number (0-100),
    "reason": "string (1-2 sentences explaining the match)",
    "matchedSkills": ["array of matching skill categories"]
  }
]

Sort by fitScore descending. Only include jobs with fitScore >= 50.
If the user has no badges, prioritize entry-level jobs or jobs with lower skill requirements.`;

    // Call Gemini API
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Parse the JSON response
    let matches;
    try {
      matches = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', responseText);
      matches = [];
    }

    // Get usage metadata
    const usageMetadata = result.response.usageMetadata;

    return new Response(JSON.stringify({
      success: true,
      matches,
      usage: {
        inputTokens: usageMetadata?.promptTokenCount || 0,
        outputTokens: usageMetadata?.candidatesTokenCount || 0,
        totalTokens: usageMetadata?.totalTokenCount || 0
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });

  } catch (error) {
    console.error('Error in match-jobs:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle OPTIONS requests for CORS
export const config = {
  runtime: 'edge'
};
