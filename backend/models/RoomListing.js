const mongoose = require('mongoose');

const roomListingSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  title:       { type: String, required: true, maxlength: 120 },
  description: { type: String, maxlength: 1000 },

  // Location
  city:    { type: String, required: true },
  area:    { type: String },
  address: { type: String },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number }
  },

  // Pricing
  rent:    { type: Number, required: true },
  deposit: { type: Number, default: 0 },

  // Facilities
  facilities: {
    wifi:         { type: Boolean, default: false },
    ac:           { type: Boolean, default: false },
    parking:      { type: Boolean, default: false },
    laundry:      { type: Boolean, default: false },
    kitchen:      { type: Boolean, default: false },
    gym:          { type: Boolean, default: false },
    security:     { type: Boolean, default: false },
    powerBackup:  { type: Boolean, default: false },
    waterSupply:  { type: Boolean, default: false },
    furnished:    { type: String, enum: ['furnished', 'semi-furnished', 'unfurnished'], default: 'unfurnished' }
  },

  roomType:      { type: String, enum: ['single', 'shared', 'studio', 'flat'], default: 'single' },
  availableFrom: { type: Date },
  genderPreference: { type: String, enum: ['male', 'female', 'any'], default: 'any' },

  // Images (uploaded URLs)
  images: [{ type: String }],

  // Status
  isActive:  { type: Boolean, default: true },
  isFlagged: { type: Boolean, default: false },

  // Stats
  viewCount:  { type: Number, default: 0 },
  savedBy:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

roomListingSchema.index({ city: 1, rent: 1 });
roomListingSchema.index({ 'coordinates': '2dsphere' });

module.exports = mongoose.model('RoomListing', roomListingSchema);
