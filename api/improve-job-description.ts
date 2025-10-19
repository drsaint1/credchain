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
    const { title, description, category, budget, jobType } = await req.json();

    // Validate input
    if (!title && !description) {
      return new Response(JSON.stringify({ error: 'Title or description is required' }), {
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
        temperature: 0.8,
      }
    });

    // Create the prompt for Gemini
    const prompt = `You are an AI assistant helping clients write better job postings on CredChain, a decentralized freelance platform.

**Current Job Posting:**
- Title: ${title || '(not provided)'}
- Description: ${description || '(not provided)'}
- Category/Skills Required: ${category || '(not specified)'}
- Budget: ${budget || '(not specified)'}
- Job Type: ${jobType || '(not specified)'}

**Task:**
Improve this job posting to make it more attractive to qualified freelancers and increase application quality.

**Guidelines:**
1. Make the title clear, specific, and compelling
2. Expand the description with:
   - Clear project overview
   - Specific deliverables and requirements
   - Technical skills needed
   - Timeline expectations
   - What makes this project interesting
3. Suggest appropriate skill badges required (from: Solana Developer, Frontend Developer, UI/UX Designer, Content Writer, Data Analyst, Marketing Specialist)
4. If budget is vague, suggest a realistic range
5. Add any missing critical information
6. Keep it professional but friendly
7. Optimize for clarity and completeness

**Return Format (JSON only, no markdown):**
{
  "improvedTitle": "string",
  "improvedDescription": "string (well-formatted with paragraphs)",
  "suggestedSkills": ["array of skill categories"],
  "suggestedBudgetRange": "string",
  "improvements": [
    "list of specific improvements made"
  ],
  "missingInfo": [
    "list of information that should be added by the client"
  ]
}`;

    // Call Gemini API
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Parse the JSON response
    let improvement;
    try {
      improvement = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', responseText);
      improvement = {
        improvedTitle: title,
        improvedDescription: description,
        suggestedSkills: [],
        suggestedBudgetRange: budget,
        improvements: [],
        missingInfo: []
      };
    }

    // Get usage metadata
    const usageMetadata = result.response.usageMetadata;

    return new Response(JSON.stringify({
      success: true,
      improvement,
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
    console.error('Error in improve-job-description:', error);
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
