const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function generateAISummary(preferences) {
  if (!process.env.OPENAI_API_KEY) {
    return generateMockSummary(preferences);
  }

  const prompt = `Based on the following roommate preferences, provide a brief personality summary in 2-3 sentences:
- Budget: ${preferences.budgetMin}-${preferences.budgetMax}
- Sleep time: ${preferences.sleepTime}
- Cleanliness: ${preferences.cleanliness}/5
- Personality: ${preferences.personality}
- Food: ${preferences.foodHabit}
- Work from home: ${preferences.workFromHome}
- Guests: ${preferences.guestsAllowed ? 'allows' : 'does not allow'}
- Noise tolerance: ${preferences.noiseTolerance}/5`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150
    });
    return completion.choices[0]?.message?.content || generateMockSummary(preferences);
  } catch (error) {
    console.error('OpenAI error:', error);
    return generateMockSummary(preferences);
  }
}

function generateMockSummary(preferences) {
  const parts = [];
  
  if (preferences.cleanliness >= 4) parts.push('Very tidy');
  else if (preferences.cleanliness <= 2) parts.push('Relaxed about cleanliness');
  else parts.push('Moderately clean');

  if (preferences.personality === 'introvert') parts.push('prefers quiet, solo time');
  else if (preferences.personality === 'extrovert') parts.push('enjoys social interactions');
  else parts.push('balances social and private time');

  if (preferences.workFromHome) parts.push('works from home');
  if (preferences.guestsAllowed) parts.push('happy to host guests');

  return `This roommate is ${parts.join(', ')}. ${preferences.sleepTime === 'early' ? 'They prefer early nights.' : preferences.sleepTime === 'late' ? 'They are night owls.' : 'Their sleep schedule is flexible.'}`;
}

module.exports = { generateAISummary };