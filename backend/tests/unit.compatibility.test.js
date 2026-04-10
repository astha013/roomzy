/**
 * UNIT TESTS: Compatibility Scoring Engine
 * Tests every branch of the calculateCompatibility function
 */

const { calculateCompatibility } = require('../utils/compatibility');

describe('calculateCompatibility()', () => {
  const basePrefs = {
    budgetMin: 5000,
    budgetMax: 15000,
    sleepTime: 'early',
    cleanliness: 4,
    foodHabit: 'veg',
    genderPreference: 'any',
    noiseTolerance: 3,
    personality: 'introvert',
  };

  // ─── RETURN SHAPE ───────────────────────────────────────────────────────────
  test('returns object with score (number) and breakdown (object)', () => {
    const result = calculateCompatibility(basePrefs, basePrefs);
    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('breakdown');
    expect(typeof result.score).toBe('number');
    expect(typeof result.breakdown).toBe('object');
  });

  test('breakdown contains all expected keys', () => {
    const { breakdown } = calculateCompatibility(basePrefs, basePrefs);
    expect(breakdown).toHaveProperty('budget');
    expect(breakdown).toHaveProperty('sleepTime');
    expect(breakdown).toHaveProperty('cleanliness');
    expect(breakdown).toHaveProperty('foodHabit');
    expect(breakdown).toHaveProperty('genderPreference');
    expect(breakdown).toHaveProperty('noiseTolerance');
    expect(breakdown).toHaveProperty('personality');
    expect(breakdown).toHaveProperty('location');
  });

  test('all breakdown values are rounded integers', () => {
    const { breakdown } = calculateCompatibility(basePrefs, basePrefs);
    for (const [key, val] of Object.entries(breakdown)) {
      expect(Number.isInteger(val)).toBe(true);
    }
  });

  // ─── SCORE RANGE ────────────────────────────────────────────────────────────
  test('score is between 0 and 100 for identical prefs', () => {
    const { score } = calculateCompatibility(basePrefs, basePrefs);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  test('identical preferences give high score (>=80)', () => {
    const { score } = calculateCompatibility(basePrefs, basePrefs);
    expect(score).toBeGreaterThanOrEqual(80);
  });

  test('completely opposite preferences give lower score than identical', () => {
    const oppositePrefs = {
      budgetMin: 20000,
      budgetMax: 50000,
      sleepTime: 'late',
      cleanliness: 1,
      foodHabit: 'non-veg',
      genderPreference: 'female',
      noiseTolerance: 5,
      personality: 'extrovert',
    };
    const sameScore = calculateCompatibility(basePrefs, basePrefs).score;
    const diffScore = calculateCompatibility(basePrefs, oppositePrefs).score;
    expect(diffScore).toBeLessThan(sameScore);
  });

  // ─── BUDGET ─────────────────────────────────────────────────────────────────
  test('overlapping budgets give high budget score', () => {
    const a = { ...basePrefs, budgetMin: 5000, budgetMax: 15000 };
    const b = { ...basePrefs, budgetMin: 8000, budgetMax: 20000 };
    const { breakdown } = calculateCompatibility(a, b);
    expect(breakdown.budget).toBeGreaterThan(30);
  });

  test('non-overlapping budgets give 0 budget score', () => {
    const a = { ...basePrefs, budgetMin: 1000, budgetMax: 5000 };
    const b = { ...basePrefs, budgetMin: 10000, budgetMax: 20000 };
    const { breakdown } = calculateCompatibility(a, b);
    expect(breakdown.budget).toBe(0);
  });

  test('missing budget returns fallback score of 50', () => {
    const a = { ...basePrefs, budgetMax: undefined };
    const { breakdown } = calculateCompatibility(a, basePrefs);
    expect(breakdown.budget).toBe(50);
  });

  // ─── SLEEP TIME ─────────────────────────────────────────────────────────────
  test('identical sleep time gives 100', () => {
    const a = { ...basePrefs, sleepTime: 'early' };
    const b = { ...basePrefs, sleepTime: 'early' };
    const { breakdown } = calculateCompatibility(a, b);
    expect(breakdown.sleepTime).toBe(100);
  });

  test('flexible vs any specific gives 75', () => {
    const a = { ...basePrefs, sleepTime: 'flexible' };
    const b = { ...basePrefs, sleepTime: 'late' };
    const { breakdown } = calculateCompatibility(a, b);
    expect(breakdown.sleepTime).toBe(75);
  });

  test('early vs late gives 50', () => {
    const a = { ...basePrefs, sleepTime: 'early' };
    const b = { ...basePrefs, sleepTime: 'late' };
    const { breakdown } = calculateCompatibility(a, b);
    expect(breakdown.sleepTime).toBe(50);
  });

  // ─── CLEANLINESS ────────────────────────────────────────────────────────────
  test('same cleanliness level gives 100', () => {
    const a = { ...basePrefs, cleanliness: 4 };
    const b = { ...basePrefs, cleanliness: 4 };
    const { breakdown } = calculateCompatibility(a, b);
    expect(breakdown.cleanliness).toBe(100);
  });

  test('cleanliness diff of 4 (max) gives 0', () => {
    const a = { ...basePrefs, cleanliness: 1 };
    const b = { ...basePrefs, cleanliness: 5 };
    const { breakdown } = calculateCompatibility(a, b);
    expect(breakdown.cleanliness).toBe(0);
  });

  test('cleanliness diff of 2 gives 50', () => {
    const a = { ...basePrefs, cleanliness: 3 };
    const b = { ...basePrefs, cleanliness: 5 };
    const { breakdown } = calculateCompatibility(a, b);
    expect(breakdown.cleanliness).toBe(50);
  });

  // ─── FOOD HABIT ─────────────────────────────────────────────────────────────
  test('same food habit gives 100', () => {
    const a = { ...basePrefs, foodHabit: 'veg' };
    const b = { ...basePrefs, foodHabit: 'veg' };
    const { breakdown } = calculateCompatibility(a, b);
    expect(breakdown.foodHabit).toBe(100);
  });

  test('different food habits give 60 (partial match)', () => {
    const a = { ...basePrefs, foodHabit: 'veg' };
    const b = { ...basePrefs, foodHabit: 'non-veg' };
    const { breakdown } = calculateCompatibility(a, b);
    expect(breakdown.foodHabit).toBe(60);
  });

  // ─── GENDER PREFERENCE ──────────────────────────────────────────────────────
  test('either party "any" gives 100', () => {
    const a = { ...basePrefs, genderPreference: 'any' };
    const b = { ...basePrefs, genderPreference: 'female' };
    const { breakdown } = calculateCompatibility(a, b);
    expect(breakdown.genderPreference).toBe(100);
  });

  test('both "any" gives 100', () => {
    const a = { ...basePrefs, genderPreference: 'any' };
    const b = { ...basePrefs, genderPreference: 'any' };
    const { breakdown } = calculateCompatibility(a, b);
    expect(breakdown.genderPreference).toBe(100);
  });

  test('conflicting gender preferences give 0', () => {
    const a = { ...basePrefs, genderPreference: 'male' };
    const b = { ...basePrefs, genderPreference: 'female' };
    const { breakdown } = calculateCompatibility(a, b);
    expect(breakdown.genderPreference).toBe(0);
  });

  test('same gender preference gives 100', () => {
    const a = { ...basePrefs, genderPreference: 'female' };
    const b = { ...basePrefs, genderPreference: 'female' };
    const { breakdown } = calculateCompatibility(a, b);
    expect(breakdown.genderPreference).toBe(100);
  });

  // ─── NOISE TOLERANCE ────────────────────────────────────────────────────────
  test('same noise tolerance gives 100', () => {
    const a = { ...basePrefs, noiseTolerance: 3 };
    const b = { ...basePrefs, noiseTolerance: 3 };
    const { breakdown } = calculateCompatibility(a, b);
    expect(breakdown.noiseTolerance).toBe(100);
  });

  test('noise diff of 4 gives 0', () => {
    const a = { ...basePrefs, noiseTolerance: 1 };
    const b = { ...basePrefs, noiseTolerance: 5 };
    const { breakdown } = calculateCompatibility(a, b);
    expect(breakdown.noiseTolerance).toBe(0);
  });

  // ─── PERSONALITY ────────────────────────────────────────────────────────────
  test('same personality gives 100', () => {
    const a = { ...basePrefs, personality: 'introvert' };
    const b = { ...basePrefs, personality: 'introvert' };
    const { breakdown } = calculateCompatibility(a, b);
    expect(breakdown.personality).toBe(100);
  });

  test('ambivert vs any gives 75', () => {
    const a = { ...basePrefs, personality: 'ambivert' };
    const b = { ...basePrefs, personality: 'extrovert' };
    const { breakdown } = calculateCompatibility(a, b);
    expect(breakdown.personality).toBe(75);
  });

  test('introvert vs extrovert gives 50', () => {
    const a = { ...basePrefs, personality: 'introvert' };
    const b = { ...basePrefs, personality: 'extrovert' };
    const { breakdown } = calculateCompatibility(a, b);
    expect(breakdown.personality).toBe(50);
  });

  // ─── WEIGHTS ────────────────────────────────────────────────────────────────
  test('weights affect the final score', () => {
    const a = { ...basePrefs, foodHabit: 'veg' };
    const b = { ...basePrefs, foodHabit: 'non-veg' };
    const defaultWeights = {};
    const highFoodWeight = { foodHabit: 5 };
    const scoreDefault = calculateCompatibility(a, b, defaultWeights).score;
    const scoreHighFood = calculateCompatibility(a, b, highFoodWeight).score;
    // Higher food weight should pull score toward food compatibility (60 in this case)
    // The result may differ from default
    expect(typeof scoreHighFood).toBe('number');
    expect(scoreHighFood).not.toBe(scoreDefault);
  });

  test('works with empty weights object (fallback to 1)', () => {
    expect(() => calculateCompatibility(basePrefs, basePrefs, {})).not.toThrow();
  });

  test('works with undefined weights (fallback to 1)', () => {
    expect(() => calculateCompatibility(basePrefs, basePrefs, undefined)).not.toThrow();
  });

  // ─── EDGE CASES ─────────────────────────────────────────────────────────────
  test('handles empty preferences without crashing', () => {
    expect(() => calculateCompatibility({}, {})).not.toThrow();
  });

  test('handles null values with defaults', () => {
    const prefs = { cleanliness: null, noiseTolerance: null };
    expect(() => calculateCompatibility(prefs, prefs)).not.toThrow();
  });

  test('location score is always 80 (fixed city-based)', () => {
    const { breakdown } = calculateCompatibility(basePrefs, basePrefs);
    expect(breakdown.location).toBe(80);
  });
});
