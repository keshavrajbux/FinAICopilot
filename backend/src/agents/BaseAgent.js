const { OpenAI } = require('openai');

class BaseAgent {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async generatePrompt(context, task) {
    return `You are a Financial Analysis Agent, part of a Financial Decision Copilot system.

# CONTEXT
${JSON.stringify(context, null, 2)}

# TASK
${task}

# CONSTRAINTS
- Make only evidence-based recommendations
- Prioritize practical, actionable advice
- Consider user's stated financial goals
- Respect privacy by not making assumptions about spending habits
- Format response as JSON for easy parsing`;
  }

  async callAPI(prompt) {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "You are a financial analysis expert. Always respond in JSON format."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      console.error('Error in API call:', error);
      throw new Error('Failed to process financial analysis');
    }
  }
}

module.exports = BaseAgent; 