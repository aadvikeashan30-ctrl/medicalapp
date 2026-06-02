const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true }, // BR-001
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String },
    pincode: { type: String },
    phone: { type: String },
    email: { type: String },
    // Operating details
    workingHours: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '18:00' }
    },
    workingDays: [{ type: String }],
    // Staff assignment
    doctors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    staff: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    // Facilities
    facilities: [{ type: String }], // ['pharmacy', 'lab', 'imaging', 'ot']
    consultationRooms: { type: Number, default: 1 },
    // Status
    isActive: { type: Boolean, default: true },
    isMainBranch: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Branch', branchSchema);
