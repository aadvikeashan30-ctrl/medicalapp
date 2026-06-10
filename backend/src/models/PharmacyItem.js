const mongoose = require('mongoose');

/**
 * Smart Pharmacy inventory item.
 *
 * An item (medicine/product) holds one or more BATCHES. Each batch carries its
 * own quantity, batch number, expiry date, purchase price and selling price so
 * the pharmacy can do multi-batch, batch-wise, FEFO (first-expiry-first-out)
 * stock management. Sales are logged per item for the revenue dashboard.
 */

const batchSchema = new mongoose.Schema(
  {
    batchNo: { type: String, trim: true },
    expiryDate: { type: Date },
    quantity: { type: Number, default: 0, min: 0 }, // available units in this batch
    purchasePrice: { type: Number, default: 0, min: 0 }, // cost per unit
    sellingPrice: { type: Number, default: 0, min: 0 }, // MRP / sale price per unit
    supplier: { type: String, trim: true },
    addedAt: { type: Date, default: Date.now }
  },
  { _id: true }
);

const saleSchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },
    quantity: { type: Number, default: 0 },
    batchNo: { type: String },
    revenue: { type: Number, default: 0 }, // sellingPrice * qty
    cost: { type: Number, default: 0 }, // purchasePrice * qty
    profit: { type: Number, default: 0 },
    patientName: { type: String, trim: true }
  },
  { _id: true }
);

const pharmacyItemSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    genericName: { type: String, trim: true },
    strength: { type: String, trim: true }, // "500mg"
    form: { type: String, trim: true }, // tablet, syrup, injection...
    category: { type: String, trim: true }, // antibiotic, analgesic...
    manufacturer: { type: String, trim: true },
    unitsPerStrip: { type: Number, default: 1, min: 1 }, // for strip calculation
    reorderLevel: { type: Number, default: 10, min: 0 }, // minimum required units
    rackLocation: { type: String, trim: true },
    barcode: { type: String, trim: true, index: true },
    hsnCode: { type: String, trim: true },
    gstPercent: { type: Number, default: 0 },
    batches: [batchSchema],
    sales: [saleSchema],
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

pharmacyItemSchema.index({ doctorId: 1, name: 1 });

// ── Derived helpers ──────────────────────────────────────────────
pharmacyItemSchema.methods.totalQuantity = function () {
  return (this.batches || []).reduce((sum, b) => sum + (b.quantity || 0), 0);
};

pharmacyItemSchema.methods.summary = function () {
  const batches = (this.batches || []).filter((b) => (b.quantity || 0) > 0);
  const totalQuantity = batches.reduce((s, b) => s + (b.quantity || 0), 0);
  const unitsPerStrip = this.unitsPerStrip || 1;
  const totalStrips = Math.floor(totalQuantity / unitsPerStrip);
  const looseUnits = totalQuantity % unitsPerStrip;

  // Nearest expiry among batches that still have stock
  const withExpiry = batches.filter((b) => b.expiryDate).sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
  const nearestExpiry = withExpiry[0]?.expiryDate || null;

  // Representative prices = latest batch's price
  const latest = [...(this.batches || [])].sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))[0];
  const purchasePrice = latest?.purchasePrice || 0;
  const sellingPrice = latest?.sellingPrice || 0;

  const stockValue = batches.reduce((s, b) => s + (b.quantity || 0) * (b.sellingPrice || 0), 0);

  const now = new Date();
  const in90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  const expired = !!nearestExpiry && new Date(nearestExpiry) < now;
  const nearExpiry = !!nearestExpiry && !expired && new Date(nearestExpiry) <= in90;
  const outOfStock = totalQuantity <= 0;
  const lowStock = !outOfStock && totalQuantity <= (this.reorderLevel || 0);

  return {
    _id: this._id,
    name: this.name,
    genericName: this.genericName,
    strength: this.strength,
    form: this.form,
    category: this.category,
    manufacturer: this.manufacturer,
    unitsPerStrip,
    reorderLevel: this.reorderLevel,
    rackLocation: this.rackLocation,
    barcode: this.barcode,
    batchNo: latest?.batchNo || '',
    totalQuantity,
    totalStrips,
    looseUnits,
    nearestExpiry,
    purchasePrice,
    sellingPrice,
    stockValue,
    batches: this.batches,
    flags: { expired, nearExpiry, outOfStock, lowStock }
  };
};

module.exports = mongoose.model('PharmacyItem', pharmacyItemSchema);
