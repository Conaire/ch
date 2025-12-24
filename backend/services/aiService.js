const { streamText } = require('ai');

// Helper to get text from AI model
async function getText(modelName, systemPrompt, userPrompt) {
  const result = streamText({
    model: modelName,
    system: systemPrompt,
    prompt: userPrompt,
    maxTokens: 100,
  });
  
  let text = '';
  for await (const chunk of result.textStream) {
    text += chunk;
  }
  return text.trim();
}

/**
 * Generate a cross-examination question from one party to challenge the other
 * @param {Array} transcript - Array of transcript entries with role and content
 * @param {string} role - The role asking the question ('party_1' or 'party_2')
 * @param {string} modelName - AI model to use
 * @returns {Promise<string>} Generated question (max 2 sentences)
 */
async function generateQuestion(transcript, role, modelName = 'openai/gpt-4o') {
  const partyName = role === 'party_1' ? 'Plaintiff' : 'Defendant';
  const opposingParty = role === 'party_1' ? 'Defendant' : 'Plaintiff';
  
  const transcriptText = transcript
    .map(t => {
      const speaker = t.role === 'judge' ? 'Judge' : (t.role === 'party_1' ? 'Plaintiff' : 'Defendant');
      return `${speaker}: ${t.content}`;
    })
    .join('\n');
  
  const systemPrompt = `You are the ${partyName} in an AI arbitration case. Generate a sharp, probing question to cross-examine the ${opposingParty}. If you are Plantiff, do not reference facts or evidence that has not previously been  mentioned. Maximum 2 sentences. Be direct and strategic.`;
  
  const userPrompt = `Case transcript so far:\n${transcriptText}\n\n. You represent the ${partyName} in an AI arbitration case. Generate your cross-examination question for the ${opposingParty}:`;
  
  try {
    return await getText(modelName, systemPrompt, userPrompt);
  } catch (error) {
    console.error('Error generating question:', error);
    return `Can you explain your position more clearly?`;
  }
}

/**
 * Generate a closing statement from one party summarizing their case
 * @param {Array} transcript - Array of transcript entries with role and content
 * @param {string} role - The role making the closing statement ('party_1' or 'party_2')
 * @param {string} modelName - AI model to use
 * @returns {Promise<string>} Generated closing statement (max 2 sentences)
 */
async function generateClosingStatement(transcript, role, modelName = 'openai/gpt-4o') {
  const partyName = role === 'party_1' ? 'Plaintiff' : 'Defendant';
  
  const transcriptText = transcript
    .map(t => {
      const speaker = t.role === 'judge' ? 'Judge' : (t.role === 'party_1' ? 'Plaintiff' : 'Defendant');
      return `${speaker}: ${t.content}`;
    })
    .join('\n');
  
  const systemPrompt = `You are the ${partyName} in an AI arbitration case. Deliver a compelling closing statement summarizing why you should win. Maximum 2 sentences. Be persuasive and decisive.`;
  
  const userPrompt = `Case transcript:\n${transcriptText}\n\nDeliver your closing statement as the ${partyName}:`;
  
  try {
    return await getText(modelName, systemPrompt, userPrompt);
  } catch (error) {
    console.error('Error generating closing statement:', error);
    return `In conclusion, the evidence clearly supports my position.`;
  }
}

/**
 * Generate a verdict from the judge based on the case transcript
 * @param {Array} transcript - Array of transcript entries with role and content
 * @param {string} modelName - AI model to use
 * @returns {Promise<string>} Generated verdict - first char is "1" (plaintiff wins) or "2" (defendant wins), followed by explanation
 */
async function generateVerdict(transcript, modelName = 'openai/gpt-4o') {
  const transcriptText = transcript
    .map(t => {
      const speaker = t.role === 'judge' ? 'Judge' : (t.role === 'party_1' ? 'Plaintiff' : 'Defendant');
      return `${speaker}: ${t.content}`;
    })
    .join('\n');
  
  const systemPrompt = `You are an impartial AI arbitrator judge. Based on the arguments presented, deliver a clear verdict. Your response MUST start with exactly "1" if Plaintiff wins or "2" if Defendant wins, immediately followed by a space and your verdict explanation. Maximum 2 sentences for the explanation. Be decisive. Example: "1 The court finds in favor of the Plaintiff because..."`;
  
  const userPrompt = `Case transcript:\n${transcriptText}\n\nDeliver your verdict (remember: start with 1 for Plaintiff win or 2 for Defendant win):`;
  
  try {
    const result = await getText(modelName, systemPrompt, userPrompt);
    // Ensure result starts with 1 or 2
    if (result && (result.startsWith('1') || result.startsWith('2'))) {
      return result;
    }
    // If AI didn't follow format, default to 1 with the result
    console.warn('[aiService] Verdict did not start with 1 or 2, defaulting to 1');
    return `1 ${result}`;
  } catch (error) {
    console.error('Error generating verdict:', error);
    return `1 After reviewing the arguments, the court finds in favor of the Plaintiff.`;
  }
}

module.exports = {
  generateQuestion,
  generateClosingStatement,
  generateVerdict
};

