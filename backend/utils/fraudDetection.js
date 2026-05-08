/**
 * Fraud Detection & Spam Filtering Utilities
 * Covers: duplicate profiles, spam accounts, suspicious activity, spam messages
 */

const SPAM_PATTERNS = [
  /\b(earn|make)\s*\d+\s*(rupees|rs|inr|money|cash)\b/i,
  /\bwhatsapp\s*me\b/i,
  /\bcall\s*(me|now|immediately)\b/i,
  /\b(free|instant)\s*(money|cash|profit)\b/i,
  /\b(click|visit)\s*(here|link|url)\b/i,
  /http[s]?:\/\/(?!roomzy)/i,
  /\b(lottery|won|prize|congratulations)\b/i,
  /\b(investment|scheme|pyramid)\b/i,
];

const TOXIC_PATTERNS = [
  /\b(scam|fraud|fake|cheat)\b/i,
  /\b(abuse|harass|threat|kill)\b/i,
  /\b(idiot|stupid|fool|loser)\b/i,
];

const SUSPICIOUS_PROFILE_FLAGS = {
  NO_PHOTO: 'no_profile_photo',
  NEW_ACCOUNT: 'account_less_than_24h',
  INCOMPLETE_PROFILE: 'incomplete_profile',
  MULTIPLE_REPORTS: 'multiple_user_reports',
  UNUSUAL_ACTIVITY: 'unusual_activity_pattern',
};

/**
 * Score a message for spam / toxic content
 * Returns: { isSpam, isToxic, score, reasons }
 * score: 0 (clean) to 1 (very suspicious)
 */
function analyzeMessage(text) {
  if (!text || typeof text !== 'string') return { isSpam: false, isToxic: false, score: 0, reasons: [] };

  const reasons = [];
  let score = 0;

  // Spam checks
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(text)) {
      reasons.push('spam_pattern_match');
      score += 0.35;
      break;
    }
  }

  // Toxic checks
  for (const pattern of TOXIC_PATTERNS) {
    if (pattern.test(text)) {
      reasons.push('toxic_language');
      score += 0.25;
      break;
    }
  }

  // Excessive caps
  const capsRatio = (text.match(/[A-Z]/g) || []).length / Math.max(text.length, 1);
  if (capsRatio > 0.6 && text.length > 10) {
    reasons.push('excessive_caps');
    score += 0.15;
  }

  // Repeated characters
  if (/(.)\1{4,}/.test(text)) {
    reasons.push('repeated_characters');
    score += 0.1;
  }

  // Phone number in message (suspicious)
  if (/(\+91|0)?\s*[6-9]\d{9}/.test(text)) {
    reasons.push('phone_number_in_message');
    score += 0.2;
  }

  score = Math.min(score, 1);
  return {
    isSpam: score >= 0.35,
    isToxic: reasons.includes('toxic_language'),
    score: parseFloat(score.toFixed(2)),
    reasons
  };
}

/**
 * Basic sentiment analysis (keyword-based)
 * Returns score from -1 (very negative) to 1 (very positive)
 */
function analyzeSentiment(text) {
  if (!text) return 0;

  const positive = ['great', 'good', 'excellent', 'amazing', 'clean', 'helpful', 'friendly',
    'cooperative', 'punctual', 'reliable', 'wonderful', 'fantastic', 'recommend',
    'honest', 'responsible', 'kind', 'polite', 'comfortable', 'happy'];

  const negative = ['bad', 'terrible', 'horrible', 'dirty', 'rude', 'lazy', 'late',
    'unreliable', 'noisy', 'messy', 'dishonest', 'aggressive', 'avoid',
    'problem', 'issue', 'complaint', 'worst', 'fraud', 'cheat'];

  const words = text.toLowerCase().split(/\W+/);
  let score = 0;

  words.forEach(word => {
    if (positive.includes(word)) score += 0.1;
    if (negative.includes(word)) score -= 0.1;
  });

  return Math.max(-1, Math.min(1, parseFloat(score.toFixed(2))));
}

/**
 * Check a user profile for suspicious indicators
 * Returns: { riskLevel: 'low'|'medium'|'high', flags: [] }
 */
function assessProfileRisk(user, reportCount = 0) {
  const flags = [];
  let riskScore = 0;

  if (!user.profilePhoto) { flags.push(SUSPICIOUS_PROFILE_FLAGS.NO_PHOTO); riskScore += 20; }

  const ageHours = (Date.now() - new Date(user.createdAt).getTime()) / 3600000;
  if (ageHours < 24) { flags.push(SUSPICIOUS_PROFILE_FLAGS.NEW_ACCOUNT); riskScore += 15; }

  if (!user.bio || user.bio.length < 20) { flags.push(SUSPICIOUS_PROFILE_FLAGS.INCOMPLETE_PROFILE); riskScore += 10; }

  if (reportCount >= 3) { flags.push(SUSPICIOUS_PROFILE_FLAGS.MULTIPLE_REPORTS); riskScore += 40; }
  else if (reportCount >= 1) { riskScore += 15; }

  if (!user.isEmailVerified) riskScore += 10;

  const riskLevel = riskScore >= 50 ? 'high' : riskScore >= 25 ? 'medium' : 'low';

  return { riskLevel, riskScore, flags };
}

module.exports = { analyzeMessage, analyzeSentiment, assessProfileRisk, SUSPICIOUS_PROFILE_FLAGS };
