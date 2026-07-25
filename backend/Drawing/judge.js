require('dotenv').config(); // <-- Added to load .env variables
const OpenAI = require("openai");

const openai = new OpenAI(); // Automatically reads process.env.OPENAI_API_KEY

/**
 * Evaluates the player's drawing against a reference image.
 * 
 * @param {string} referenceImage - Image URL or base64 data string
 * @param {string} playerImage - Image URL or base64 data string
 * @returns {Promise<{score: number, feedback: string, breakdown: object}>}
 */
async function evaluateDrawing(referenceImage, playerImage)  {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" }, // Guarantees JSON output
      messages: [
        {
          role: "system",
          content: `You are an expert AI judge for a drawing competition.
Compare the player's drawing with the reference image.

Ignore:
- Lighting differences
- Shadows
- Paper color / background texture
- Camera angles

Evaluate and output a strict JSON object with:
- "score": (number from 0 to 100 overall score)
- "feedback": (string containing actionable, encouraging critique)
- "breakdown": object containing numbers (0-100) for:
    - "similarity"
    - "proportions"
    - "recognizability"
    - "completeness"
    - "effort"`
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Reference Image:" },
            {
              type: "image_url",
              image_url: { url: referenceImage },
            },
            { type: "text", text: "Player Drawing:" },
            {
              type: "image_url",
              image_url: { url: playerImage },
            },
          ],
        },
      ],
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content);
  } catch (error) {
    console.error("OpenAI Judge Evaluation Error:", error);
    throw error;
  }
}
module.exports = evaluateDrawing;