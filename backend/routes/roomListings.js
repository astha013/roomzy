const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/authMiddleware');
const RoomListing = require('../models/RoomListing');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, `room-${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`)
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Only images allowed'));
    cb(null, true);
  }
});

// GET /api/rooms — list rooms with filters & location-based search
router.get('/', async (req, res) => {
  try {
    const { city, minRent, maxRent, roomType, furnished, lat, lng, radius = 10, page = 1, limit = 20 } = req.query;
    const filter = { isActive: true, isFlagged: false };

    if (city) filter.city = new RegExp(city, 'i');
    if (roomType) filter.roomType = roomType;
    if (furnished) filter['facilities.furnished'] = furnished;
    if (minRent || maxRent) {
      filter.rent = {};
      if (minRent) filter.rent.$gte = Number(minRent);
      if (maxRent) filter.rent.$lte = Number(maxRent);
    }

    // Geo-based filter (simple bounding box if lat/lng provided)
    if (lat && lng) {
      const R = Number(radius) / 111; // approx degrees per km
      filter['coordinates.lat'] = { $gte: Number(lat) - R, $lte: Number(lat) + R };
      filter['coordinates.lng'] = { $gte: Number(lng) - R, $lte: Number(lng) + R };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [listings, total] = await Promise.all([
      RoomListing.find(filter)
        .populate('owner', 'name profilePhoto trustScore city')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      RoomListing.countDocuments(filter)
    ]);

    res.json({ listings, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/rooms/:id
router.get('/:id', async (req, res) => {
  try {
    const listing = await RoomListing.findById(req.params.id).populate('owner', 'name profilePhoto trustScore city area');
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    listing.viewCount += 1;
    await listing.save();
    res.json(listing);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/rooms — create listing with optional images
router.post('/', protect, upload.array('images', 6), async (req, res) => {
  try {
    const { title, description, city, area, address, rent, deposit, roomType,
      availableFrom, genderPreference, facilities, lat, lng } = req.body;

    const images = (req.files || []).map(f => `/uploads/${f.filename}`);

    const listing = await RoomListing.create({
      owner: req.user._id,
      title, description, city, area, address, rent: Number(rent),
      deposit: deposit ? Number(deposit) : 0,
      roomType, availableFrom, genderPreference,
      facilities: facilities ? JSON.parse(facilities) : {},
      coordinates: lat && lng ? { lat: Number(lat), lng: Number(lng) } : undefined,
      images
    });

    res.status(201).json(listing);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/rooms/:id
router.put('/:id', protect, upload.array('images', 6), async (req, res) => {
  try {
    const listing = await RoomListing.findOne({ _id: req.params.id, owner: req.user._id });
    if (!listing) return res.status(404).json({ message: 'Not found or not your listing' });

    const fields = ['title', 'description', 'city', 'area', 'address', 'rent', 'deposit',
      'roomType', 'availableFrom', 'genderPreference', 'isActive'];
    fields.forEach(f => { if (req.body[f] !== undefined) listing[f] = req.body[f]; });
    if (req.body.facilities) listing.facilities = JSON.parse(req.body.facilities);
    if (req.files?.length) listing.images.push(...req.files.map(f => `/uploads/${f.filename}`));
    listing.updatedAt = new Date();
    await listing.save();
    res.json(listing);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/rooms/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const listing = await RoomListing.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!listing) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/rooms/:id/save — toggle save
router.post('/:id/save', protect, async (req, res) => {
  try {
    const listing = await RoomListing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Not found' });
    const idx = listing.savedBy.indexOf(req.user._id);
    if (idx === -1) listing.savedBy.push(req.user._id);
    else listing.savedBy.splice(idx, 1);
    await listing.save();
    res.json({ saved: idx === -1 });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
