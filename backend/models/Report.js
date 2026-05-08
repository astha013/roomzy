const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reportedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  reason: { 
    type: String, 
    enum: ['spam', 'harassment', 'fake_profile', 'inappropriate', 'other'], 
    required: true 
  },
  description: { type: String },
  evidence: [{ type: String }],
  
  status: { 
    type: String, 
    enum: ['pending', 'investigating', 'resolved', 'dismissed'], 
    default: 'pending' 
  },
  
  resolution: { type: String },
  actionTaken: { type: String },
  
  createdAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date }
});

reportSchema.index({ reportedUser: 1 });
reportSchema.index({ reporter: 1 });

module.exports = mongoose.model('Report', reportSchema);