/**
 * AI-Based Fake Profile Detection
 * Uses heuristic ML-style scoring to detect: duplicate profiles, spam accounts,
 * suspicious activities, and fake images
 */

/**
 * Compute a "fakeness" score for a user profile (0 = genuine, 100 = likely fake)
 * @param {Object} user - Mongoose User document
 * @param {Number} reportCount - number of reports against user
 * @param {Number} reviewCount - number of reviews user has received
 * @returns {{ fakeScore: number, verdict: 'genuine'|'suspicious'|'likely_fake', signals: string[] }}
 */
function detectFakeProfile(user, reportCount = 0, reviewCount = 0) {
  const signals = [];
  let score = 0;

  // ── Account age ─────────────────────────────────────────────────────────
  const ageHours = (Date.now() - new Date(user.createdAt).getTime()) / 3600000;
  if (ageHours < 1)   { score += 30; signals.push('account_created_just_now'); }
  else if (ageHours < 24) { score += 15; signals.push('very_new_account'); }

  // ── Profile completeness ─────────────────────────────────────────────────
  if (!user.profilePhoto) { score += 20; signals.push('no_profile_photo'); }
  if (!user.bio || user.bio.length < 10) { score += 10; signals.push('empty_bio'); }
  if (!user.phoneVerified) { score += 10; signals.push('unverified_phone'); }
  if (!user.isEmailVerified) { score += 15; signals.push('unverified_email'); }

  // ── Verification signals ─────────────────────────────────────────────────
  if (!user.selfieVerified) { score += 10; signals.push('no_liveness_check'); }
  if (user.governmentIdVerified) { score -= 20; signals.push('gov_id_verified'); }
  if (user.trustScore > 60) { score -= 15; signals.push('high_trust_score'); }

  // ── Social links ─────────────────────────────────────────────────────────
  const hasVerifiedSocial = user.socialLinks &&
    (user.socialLinks.linkedinVerified || user.socialLinks.collegeEmailVerified || user.socialLinks.companyEmailVerified);
  if (hasVerifiedSocial) { score -= 15; signals.push('verified_social_links'); }

  // ── Reports ──────────────────────────────────────────────────────────────
  if (reportCount >= 5)  { score += 40; signals.push('5+_reports'); }
  else if (reportCount >= 3) { score += 25; signals.push('3+_reports'); }
  else if (reportCount >= 1) { score += 10; signals.push('reported_by_users'); }

  // ── Reviews ──────────────────────────────────────────────────────────────
  if (reviewCount > 2) { score -= 10; signals.push('multiple_reviews'); }

  // ── Name analysis ────────────────────────────────────────────────────────
  if (user.name) {
    const genericNames = /^(user|test|admin|fake|temp|dummy)\d*/i;
    if (genericNames.test(user.name)) { score += 20; signals.push('suspicious_name'); }

    // Random-looking names (mostly numbers/symbols)
    if (/\d{4,}/.test(user.name)) { score += 15; signals.push('numeric_name'); }
  }

  score = Math.max(0, Math.min(100, score));
  const verdict = score >= 60 ? 'likely_fake' : score >= 30 ? 'suspicious' : 'genuine';

  return { fakeScore: score, verdict, signals };
}

/**
 * Check if two user profiles are likely duplicates
 * @param {Object} userA
 * @param {Object} userB
 * @returns {{ isDuplicate: boolean, confidence: number, reasons: string[] }}
 */
function detectDuplicateProfile(userA, userB) {
  const reasons = [];
  let confidence = 0;

  // Same phone
  if (userA.phoneNumber && userB.phoneNumber && userA.phoneNumber === userB.phoneNumber) {
    confidence += 80; reasons.push('same_phone_number');
  }

  // Similar names (Levenshtein-like: same first 4 chars)
  if (userA.name && userB.name) {
    const a = userA.name.toLowerCase().replace(/\s/g, '');
    const b = userB.name.toLowerCase().replace(/\s/g, '');
    if (a === b) { confidence += 40; reasons.push('identical_names'); }
    else if (a.slice(0, 4) === b.slice(0, 4) && Math.abs(a.length - b.length) <= 2) {
      confidence += 20; reasons.push('similar_names');
    }
  }

  // Same city and same bio (suspicious)
  if (userA.city === userB.city && userA.bio && userB.bio && userA.bio === userB.bio) {
    confidence += 50; reasons.push('identical_bio_same_city');
  }

  // Created within 1 hour of each other (same IP likely)
  const timeDiff = Math.abs(new Date(userA.createdAt) - new Date(userB.createdAt));
  if (timeDiff < 3600000) { confidence += 20; reasons.push('registered_within_1hr'); }

  return {
    isDuplicate: confidence >= 60,
    confidence: Math.min(confidence, 100),
    reasons
  };
}

module.exports = { detectFakeProfile, detectDuplicateProfile };
