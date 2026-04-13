const User = require('../models/User');
const Review = require('../models/Review');

const TRUST_POINTS = {
  emailVerified: 10,
  phoneVerified: 20,
  selfieVerified: 20,
  governmentIdVerified: 10,
  socialLinkVerified: 2.5,
  maxSocialLinks: 4,
  reviewMaxPoints: 30,
  accountAgeMax: 10
};

async function calculateTrustScore(userId) {
  const user = await User.findById(userId);
  if (!user) return 0;

  let score = 0;

  if (user.isEmailVerified) score += TRUST_POINTS.emailVerified;
  if (user.phoneVerified) score += TRUST_POINTS.phoneVerified;
  if (user.selfieVerified) score += TRUST_POINTS.selfieVerified;
  if (user.governmentIdVerified) score += TRUST_POINTS.governmentIdVerified;

  let verifiedSocialLinks = 0;
  if (user.socialLinks?.linkedinVerified) verifiedSocialLinks++;
  if (user.socialLinks?.instagramVerified) verifiedSocialLinks++;
  if (user.socialLinks?.collegeEmailVerified) verifiedSocialLinks++;
  if (user.socialLinks?.companyEmailVerified) verifiedSocialLinks++;
  
  score += Math.min(verifiedSocialLinks * TRUST_POINTS.socialLinkVerified, TRUST_POINTS.maxSocialLinks * TRUST_POINTS.socialLinkVerified);

  const reviews = await Review.find({ reviewedUser: userId });
  if (reviews.length > 0) {
    const avgRating = reviews.reduce((sum, r) => sum + (r.ratings.overall || 0), 0) / reviews.length;
    score += Math.min(Math.round(avgRating * 6), TRUST_POINTS.reviewMaxPoints);
  }

  const daysSinceJoin = (Date.now() - user.createdAt) / (1000 * 60 * 60 * 24);
  if (daysSinceJoin > 30) score += 3;
  if (daysSinceJoin > 90) score += 4;
  if (daysSinceJoin > 180) score += 3;

  return Math.min(100, Math.max(0, Math.round(score)));
}

async function updateTrustScore(userId) {
  const newScore = await calculateTrustScore(userId);
  await User.findByIdAndUpdate(userId, { trustScore: newScore });
  return newScore;
}

function getTrustBreakdown(user) {
  const breakdown = {
    emailVerified: { value: user.isEmailVerified ? TRUST_POINTS.emailVerified : 0, label: 'Email Verified' },
    phoneVerified: { value: user.phoneVerified ? TRUST_POINTS.phoneVerified : 0, label: 'Phone Verified (OTP)' },
    selfieVerified: { value: user.selfieVerified ? TRUST_POINTS.selfieVerified : 0, label: 'Selfie Verified (Liveness)' },
    governmentId: { value: user.governmentIdVerified ? TRUST_POINTS.governmentIdVerified : 0, label: 'Government ID (Optional)' },
    socialLinks: { value: 0, label: 'Social Links' },
    reviews: { value: 0, label: 'Roommate Reviews' },
    accountAge: { value: 0, label: 'Account Age' }
  };

  let socialCount = 0;
  if (user.socialLinks?.linkedinVerified) socialCount++;
  if (user.socialLinks?.instagramVerified) socialCount++;
  if (user.socialLinks?.collegeEmailVerified) socialCount++;
  if (user.socialLinks?.companyEmailVerified) socialCount++;
  breakdown.socialLinks.value = Math.min(socialCount * TRUST_POINTS.socialLinkVerified, TRUST_POINTS.maxSocialLinks);

  breakdown.accountAge.value = (() => {
    const days = (Date.now() - user.createdAt) / (1000 * 60 * 60 * 24);
    let points = 0;
    if (days > 30) points += 3;
    if (days > 90) points += 4;
    if (days > 180) points += 3;
    return points;
  })();

  return breakdown;
}

module.exports = { calculateTrustScore, updateTrustScore, getTrustBreakdown, TRUST_POINTS };