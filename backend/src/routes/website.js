const express = require('express');
const Website = require('../models/Website');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

function slugify(s) {
  return String(s || 'clinic').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
}

// Get my site config (creates a default draft if none)
router.get(
  '/',
  auth,
  asyncHandler(async (req, res) => {
    let site = await Website.findOne({ doctorId: req.user._id });
    if (!site) {
      site = await Website.create({
        doctorId: req.user._id,
        slug: `${slugify(req.user.clinicName || req.user.name)}-${String(req.user._id).slice(-4)}`,
        headline: `${req.user.clinicName || 'Welcome to our clinic'}`,
        about: `Dr. ${req.user.name} — ${req.user.qualification || 'MBBS'}, ${(req.user.specialty || 'General Physician')}.`,
        services: ['General Consultation', 'Health Check-ups', 'Teleconsultation'],
        highlights: [req.user.experience ? `${req.user.experience}+ years experience` : 'Trusted care', 'Online booking available'],
        contact: { phone: req.user.phone, email: req.user.email, address: [req.user.clinicAddress, req.user.clinicCity].filter(Boolean).join(', ') }
      });
    }
    res.json(site);
  })
);

// Update config
router.put(
  '/',
  auth,
  asyncHandler(async (req, res) => {
    const updates = { ...req.body };
    delete updates.doctorId; delete updates.views;
    if (updates.slug) updates.slug = slugify(updates.slug);
    const site = await Website.findOneAndUpdate({ doctorId: req.user._id }, updates, { new: true, upsert: true, setDefaultsOnInsert: true });
    res.json(site);
  })
);

// Publish / unpublish
router.post(
  '/publish',
  auth,
  asyncHandler(async (req, res) => {
    const site = await Website.findOneAndUpdate({ doctorId: req.user._id }, { published: req.body.published !== false }, { new: true, upsert: true });
    res.json({ published: site.published, slug: site.slug, url: `/site/${site.slug}` });
  })
);

// PUBLIC: render site data by slug (no auth) — used by the public microsite page
router.get(
  '/public/:slug',
  asyncHandler(async (req, res) => {
    const site = await Website.findOne({ slug: req.params.slug, published: true });
    if (!site) return res.status(404).json({ message: 'Site not found or not published' });
    const doctor = await User.findById(site.doctorId).select('name specialty qualification clinicName clinicCity workingHours consultationFee');
    site.views += 1; await site.save();
    res.json({ site, doctor });
  })
);

module.exports = router;
