const mongoose = require('mongoose');

// One counter per (doctorId, kind) pair: kind is 'patient' | 'rx' | 'invoice' | 'token-YYYY-MM-DD'
const counterSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 }
});

const Counter = mongoose.model('Counter', counterSchema);

// Atomically increment and return next sequence number
async function nextSeq(key) {
  const doc = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return doc.seq;
}

module.exports = { Counter, nextSeq };
