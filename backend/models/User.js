const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const preferencesSchema = new mongoose.Schema({
  budgetMin: { type: Number, default: 0 },
  budgetMax: { type: Number, default: 50000 },
  locationRadius: { type: Number, default: 10 },
  sleepTime: { type: String, enum: ['early', 'late', 'flexible'], default: 'flexible' },
  smoking: { type: String, enum: ['yes', 'no', 'occasional'], default: 'no' },
  drinking: { type: String, enum: ['yes', 'no', 'occasional'], default: 'no' },
  foodHabit: { type: String, enum: ['veg', 'non-veg', 'eggetarian'], default: 'veg' },
  cleanliness: { type: Number, min: 1, max: 5, default: 3 },
  guestsAllowed: { type: Boolean, default: true },
  workFromHome: { type: Boolean, default: false },
  genderPreference: { type: String, enum: ['male', 'female', 'any'], default: 'any' },
  language: { type: String, default: 'English' },
  personality: { type: String, enum: ['introvert', 'extrovert', 'ambivert'], default: 'ambivert' },
  noiseTolerance: { type: Number, min: 1, max: 5, default: 3 },
  acPreference: { type: String, enum: ['ac', 'non-ac', 'any'], default: 'any' },
  pets: { type: String, enum: ['yes', 'no', 'allergic'], default: 'no' },
  religion: { type: String, default: '' },
  moveInDate: { type: Date }
}, { _id: false });

const preferenceWeightsSchema = new mongoose.Schema({
  budget: { type: Number, default: 1, min: 0, max: 5 },
  location: { type: Number, default: 1, min: 0, max: 5 },
  sleepTime: { type: Number, default: 1, min: 0, max: 5 },
  cleanliness: { type: Number, default: 1, min: 0, max: 5 },
  foodHabit: { type: Number, default: 1, min: 0, max: 5 },
  genderPreference: { type: Number, default: 1, min: 0, max: 5 },
  noiseTolerance: { type: Number, default: 1, min: 0, max: 5 },
  personality: { type: Number, default: 1, min: 0, max: 5 }
}, { _id: false });

const socialLinksSchema = new mongoose.Schema({
  linkedin: { type: String, default: '' },
  linkedinVerified: { type: Boolean, default: false },
  instagram: { type: String, default: '' },
  instagramVerified: { type: Boolean, default: false },
  collegeEmail: { type: String, default: '' },
  collegeEmailVerified: { type: Boolean, default: false },
  companyEmail: { type: String, default: '' },
  companyEmailVerified: { type: Boolean, default: false }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phoneNumber: { type: String },
  profilePhoto: { type: String },
  bio: { type: String, maxLength: 500 },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'], default: 'prefer_not_to_say' },
  
  intent: { 
    type: String, 
    enum: ['have_room_need_roommate', 'looking_for_roommate'], 
    required: true 
  },
  city: { type: String, required: true },
  area: { type: String },
  
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
  emailVerificationExpires: { type: Date },
  
  phoneVerified: { type: Boolean, default: false },
  phoneVerificationCode: { type: String },
  phoneVerificationExpires: { type: Date },
  
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },
  
  selfieVerified: { type: Boolean, default: false },
  selfieUrl: { type: String },
  selfieCapturedAt: { type: Date },
  livenessScore: { type: Number },
  
  governmentIdVerified: { type: Boolean, default: false },
  verificationStatus: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
  verificationId: { type: String },
  verificationHash: { type: String },
  verificationTimestamp: { type: Date },
  
  idDocumentType: { type: String, enum: ['aadhar', 'pan', 'passport', 'driving_license'], default: 'aadhar' },
  idDocumentUrl: { type: String },
  idDocumentNumber: { type: String },
  maskedIdNumber: { type: String },
  
  socialLinks: { type: socialLinksSchema, default: {} },
  
  preferences: { type: preferencesSchema, default: {} },
  preferenceWeights: { type: preferenceWeightsSchema, default: {} },
  
  trustScore: { type: Number, default: 0, min: 0, max: 100 },
  reviewTrustPoints: { type: Number, default: 0 },
  aiSummary: { type: String },
  
  isBlocked: { type: Boolean, default: false },
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isAdmin: { type: Boolean, default: false },
  
  matches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Match' }],
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);