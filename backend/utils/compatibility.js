function calculateCompatibility(prefsA, prefsB, weights = {}) {
  const w = {
    budget: weights.budget || 1,
    location: weights.location || 1,
    sleepTime: weights.sleepTime || 1,
    cleanliness: weights.cleanliness || 1,
    foodHabit: weights.foodHabit || 1,
    genderPreference: weights.genderPreference || 1,
    noiseTolerance: weights.noiseTolerance || 1,
    personality: weights.personality || 1,
  };

  const breakdown = {};

  // Budget compatibility
  if (prefsA.budgetMax && prefsB.budgetMax) {
    const overlap =
      Math.min(prefsA.budgetMax, prefsB.budgetMax) -
      Math.max(prefsA.budgetMin || 0, prefsB.budgetMin || 0);
    breakdown.budget =
      Math.max(0, overlap / Math.max(prefsA.budgetMax, prefsB.budgetMax)) * 100;
  } else {
    breakdown.budget = 50;
  }

  // Sleep time compatibility
  breakdown.sleepTime =
    prefsA.sleepTime === prefsB.sleepTime
      ? 100
      : prefsA.sleepTime === 'flexible' || prefsB.sleepTime === 'flexible'
      ? 75
      : 50;

  // Cleanliness compatibility
  const cleanDiff = Math.abs((prefsA.cleanliness || 3) - (prefsB.cleanliness || 3));
  breakdown.cleanliness = (1 - cleanDiff / 4) * 100;

  // Food habit compatibility
  breakdown.foodHabit = prefsA.foodHabit === prefsB.foodHabit ? 100 : 60;

  // Gender preference compatibility
  if (prefsA.genderPreference === 'any' || prefsB.genderPreference === 'any') {
    breakdown.genderPreference = 100;
  } else {
    breakdown.genderPreference = prefsA.genderPreference === prefsB.genderPreference ? 100 : 0;
  }

  // Noise tolerance compatibility
  const noiseDiff = Math.abs((prefsA.noiseTolerance || 3) - (prefsB.noiseTolerance || 3));
  breakdown.noiseTolerance = (1 - noiseDiff / 4) * 100;

  // Personality compatibility
  breakdown.personality =
    prefsA.personality === prefsB.personality
      ? 100
      : prefsA.personality === 'ambivert' || prefsB.personality === 'ambivert'
      ? 75
      : 50;

  // Location (city-based matching, fixed score since we already filter by city)
  breakdown.location = 80;

  const totalWeight = Object.values(w).reduce((a, b) => a + b, 0);
  const weightedSum =
    breakdown.budget * w.budget +
    breakdown.sleepTime * w.sleepTime +
    breakdown.cleanliness * w.cleanliness +
    breakdown.foodHabit * w.foodHabit +
    breakdown.genderPreference * w.genderPreference +
    breakdown.noiseTolerance * w.noiseTolerance +
    breakdown.location * w.location +
    breakdown.personality * w.personality;

  const score = Math.round(weightedSum / totalWeight);

  // FIX BUG 1 & 2: use local roundScores instead of Math.roundScores
  return { score, breakdown: roundScores(breakdown) };
}

function roundScores(obj) {
  const result = {};
  for (const key in obj) {
    result[key] = Math.round(obj[key]);
  }
  return result;
}

module.exports = { calculateCompatibility };
