const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  userA: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userB: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  compatibilityScore: { type: Number, required: true },
  breakdown: {
    budget: { type: Number },
    sleepTime: { type: Number },
    cleanliness: { type: Number },
    foodHabit: { type: Number },
    genderPreference: { type: Number },
    noiseTolerance: { type: Number },
    location: { type: Number },
    personality: { type: Number }
  },
  
  status: { 
    type: String, 
    enum: ['pending', 'liked', 'matched', 'rejected'], 
    default: 'pending' 
  },
  
  userARead: { type: Boolean, default: false },
  userBRead: { type: Boolean, default: false },
  
  agreement: {
    rent: { type: Number },
    rentSplit: {
      userA: { type: Number },
      userB: { type: Number }
    },
    rules: [{ type: String }],
    moveInDate: { type: Date },
    createdAt: { type: Date }
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

matchSchema.index({ userA: 1, userB: 1 });

module.exports = mongoose.model('Match', matchSchema);