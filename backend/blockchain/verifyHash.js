const CryptoJS = require('crypto-js');

function generateVerificationHash(userId, verificationId, timestamp) {
  const data = `${userId}${verificationId}${timestamp}`;
  return CryptoJS.SHA256(data).toString();
}

function verifyHash(userId, verificationId, timestamp, hash) {
  const expectedHash = generateVerificationHash(userId, verificationId, timestamp);
  return expectedHash === hash;
}

module.exports = { generateVerificationHash, verifyHash };