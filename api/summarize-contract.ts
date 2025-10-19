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
    const { contract } = await req.json();

    // Validate input
    if (!contract) {
      return new Response(JSON.stringify({ error: 'Contract data is required' }), {
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
        temperature: 0.5,
      }
    });

    // Create the prompt for Gemini
    const prompt = `You are an AI assistant helping users understand smart contracts on CredChain, a decentralized freelance platform.

**Contract Details:**
${JSON.stringify(contract, null, 2)}

**Task:**
Create a clear, concise summary of this contract that includes:
1. **Overview** - What work is being done (1-2 sentences)
2. **Key Details** - Total amount, number of milestones, current status
3. **Milestones Breakdown** - List each milestone with its status, amount, and deadline
4. **Risk Assessment** - Any potential issues or things to watch out for
5. **Next Steps** - What actions need to be taken next

Make it easy to understand for both technical and non-technical users.
Use plain language and avoid blockchain jargon.

**Return Format (JSON only, no markdown):**
{
  "overview": "string",
  "keyDetails": {
    "totalAmount": "string (formatted with currency)",
    "numberOfMilestones": number,
    "currentStatus": "string",
    "completionPercentage": number
  },
  "milestones": [
    {
      "index": number,
      "title": "string",
      "amount": "string",
      "deadline": "string (formatted date)",
      "status": "string",
      "daysUntilDeadline": number
    }
  ],
  "riskAssessment": "string (2-3 sentences)",
  "nextSteps": ["array of action items"]
}`;

    // Call Gemini API
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Parse the JSON response
    let summary;
    try {
      summary = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', responseText);
      summary = {
        overview: responseText,
        keyDetails: {},
        milestones: [],
        riskAssessment: '',
        nextSteps: []
      };
    }

    // Get usage metadata
    const usageMetadata = result.response.usageMetadata;

    return new Response(JSON.stringify({
      success: true,
      summary,
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
    console.error('Error in summarize-contract:', error);
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
