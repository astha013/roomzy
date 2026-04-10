const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reviewedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  ratings: {
    cleanliness: { type: Number, min: 1, max: 5 },
    communication: { type: Number, min: 1, max: 5 },
    responsibility: { type: Number, min: 1, max: 5 },
    friendliness: { type: Number, min: 1, max: 5 },
    overall: { type: Number, min: 1, max: 5 }
  },
  
  comment: { type: String },
  stayDuration: { type: String },
  wouldRecommend: { type: Boolean },
  
  createdAt: { type: Date, default: Date.now }
});

reviewSchema.index({ reviewedUser: 1 });
reviewSchema.index({ reviewer: 1, reviewedUser: 1 });

module.exports = mongoose.model('Review', reviewSchema);