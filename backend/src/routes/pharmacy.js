const express = require('express');
const PharmacyItem = require('../models/PharmacyItem');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ── List / search inventory ──────────────────────────────────────
// Returns each item's computed summary (qty, strips, batch, expiry, prices, flags)
router.get(
  '/',
  auth,
  asyncHandler(async (req, res) => {
    const { search, filter, limit = 200 } = req.query;
    const query = { doctorId: req.user._id, isActive: true };
    if (search) {
      const safe = escapeRegex(search);
      query.$or = [
        { name: { $regex: safe, $options: 'i' } },
        { genericName: { $regex: safe, $options: 'i' } },
        { barcode: { $regex: safe, $options: 'i' } }
      ];
    }
    const items = await PharmacyItem.find(query).limit(parseInt(limit, 10));
    let summaries = items.map((i) => i.summary());

    if (filter === 'low-stock') summaries = summaries.filter((s) => s.flags.lowStock || s.flags.outOfStock);
    else if (filter === 'near-expiry') summaries = summaries.filter((s) => s.flags.nearExpiry);
    else if (filter === 'expired') summaries = summaries.filter((s) => s.flags.expired);
    else if (filter === 'out-of-stock') summaries = summaries.filter((s) => s.flags.outOfStock);

    summaries.sort((a, b) => a.name.localeCompare(b.name));
    res.json({ items: summaries, total: summaries.length });
  })
);

// ── Inventory dashboard stats ────────────────────────────────────
router.get(
  '/stats/summary',
  auth,
  asyncHandler(async (req, res) => {
    const items = await PharmacyItem.find({ doctorId: req.user._id, isActive: true });
    const summaries = items.map((i) => i.summary());
    const stats = {
      totalItems: summaries.length,
      stockValue: Math.round(summaries.reduce((s, x) => s + x.stockValue, 0)),
      outOfStock: summaries.filter((s) => s.flags.outOfStock).length,
      lowStock: summaries.filter((s) => s.flags.lowStock).length,
      nearExpiry: summaries.filter((s) => s.flags.nearExpiry).length,
      expired: summaries.filter((s) => s.flags.expired).length
    };
    res.json(stats);
  })
);

// ── Alerts: out-of-stock, low stock, near/already expired ────────
router.get(
  '/alerts',
  auth,
  asyncHandler(async (req, res) => {
    const items = await PharmacyItem.find({ doctorId: req.user._id, isActive: true });
    const summaries = items.map((i) => i.summary());
    res.json({
      outOfStock: summaries.filter((s) => s.flags.outOfStock),
      lowStock: summaries.filter((s) => s.flags.lowStock),
      nearExpiry: summaries.filter((s) => s.flags.nearExpiry),
      expired: summaries.filter((s) => s.flags.expired)
    });
  })
);

// ── Smart purchase suggestions ───────────────────────────────────
// For items at/below reorder level, suggest qty to bring back to 2x reorder level.
router.get(
  '/purchase-suggestions',
  auth,
  asyncHandler(async (req, res) => {
    const items = await PharmacyItem.find({ doctorId: req.user._id, isActive: true });
    const suggestions = items
      .map((i) => i.summary())
      .filter((s) => s.flags.lowStock || s.flags.outOfStock)
      .map((s) => {
        const minimumRequired = Math.max(s.reorderLevel, 1);
        const target = minimumRequired * 2; // restock to a healthy buffer
        const suggestedPurchase = Math.max(target - s.totalQuantity, minimumRequired - s.totalQuantity, 0);
        return {
          _id: s._id,
          name: s.name,
          strength: s.strength,
          currentStock: s.totalQuantity,
          minimumRequired,
          suggestedPurchase,
          estimatedCost: Math.round(suggestedPurchase * (s.purchasePrice || 0))
        };
      })
      .filter((s) => s.suggestedPurchase > 0)
      .sort((a, b) => a.currentStock - b.currentStock);

    res.json({ suggestions, total: suggestions.length });
  })
);

// ── Pharmacy revenue dashboard ───────────────────────────────────
router.get(
  '/revenue',
  auth,
  asyncHandler(async (req, res) => {
    const items = await PharmacyItem.find({ doctorId: req.user._id });
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let dailyRevenue = 0;
    let dailyProfit = 0;
    let monthRevenue = 0;
    let monthProfit = 0;
    let totalRevenue = 0;
    const bestSellers = {};
    const trendMap = {}; // YYYY-MM-DD -> revenue (last 7 days)

    const sevenDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);

    items.forEach((item) => {
      (item.sales || []).forEach((sale) => {
        const d = new Date(sale.date);
        totalRevenue += sale.revenue || 0;
        if (d >= startOfMonth) {
          monthRevenue += sale.revenue || 0;
          monthProfit += sale.profit || 0;
        }
        if (d >= startOfDay) {
          dailyRevenue += sale.revenue || 0;
          dailyProfit += sale.profit || 0;
        }
        if (d >= sevenDaysAgo) {
          const key = d.toISOString().slice(0, 10);
          trendMap[key] = (trendMap[key] || 0) + (sale.revenue || 0);
        }
        bestSellers[item.name] = bestSellers[item.name] || { name: item.name, quantity: 0, revenue: 0 };
        bestSellers[item.name].quantity += sale.quantity || 0;
        bestSellers[item.name].revenue += sale.revenue || 0;
      });
    });

    const trend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      trend.push({ date: key, revenue: Math.round(trendMap[key] || 0) });
    }

    res.json({
      dailyRevenue: Math.round(dailyRevenue),
      dailyProfit: Math.round(dailyProfit),
      monthRevenue: Math.round(monthRevenue),
      monthProfit: Math.round(monthProfit),
      totalRevenue: Math.round(totalRevenue),
      margin: monthRevenue > 0 ? Math.round((monthProfit / monthRevenue) * 100) : 0,
      trend,
      bestSellers: Object.values(bestSellers)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)
        .map((b) => ({ ...b, revenue: Math.round(b.revenue) }))
    });
  })
);

// ── Get one item ─────────────────────────────────────────────────
router.get(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const item = await PharmacyItem.findOne({ _id: req.params.id, doctorId: req.user._id });
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ ...item.summary(), sales: item.sales });
  })
);

// ── Create item (optionally with first batch) ────────────────────
router.post(
  '/',
  auth,
  asyncHandler(async (req, res) => {
    const {
      name, genericName, strength, form, category, manufacturer,
      unitsPerStrip, reorderLevel, rackLocation, barcode, hsnCode, gstPercent,
      batchNo, expiryDate, quantity, purchasePrice, sellingPrice, supplier
    } = req.body;

    if (!name) return res.status(400).json({ message: 'name is required' });

    const batches = [];
    if (quantity || batchNo || expiryDate) {
      batches.push({
        batchNo, expiryDate, quantity: Number(quantity) || 0,
        purchasePrice: Number(purchasePrice) || 0, sellingPrice: Number(sellingPrice) || 0, supplier
      });
    }

    const item = await PharmacyItem.create({
      doctorId: req.user._id,
      name, genericName, strength, form, category, manufacturer,
      unitsPerStrip: Number(unitsPerStrip) || 1,
      reorderLevel: Number(reorderLevel) || 10,
      rackLocation, barcode, hsnCode, gstPercent: Number(gstPercent) || 0,
      batches
    });
    res.status(201).json(item.summary());
  })
);

// ── Add / restock a batch (purchase) ─────────────────────────────
router.post(
  '/:id/batch',
  auth,
  asyncHandler(async (req, res) => {
    const { batchNo, expiryDate, quantity, purchasePrice, sellingPrice, supplier } = req.body;
    const item = await PharmacyItem.findOne({ _id: req.params.id, doctorId: req.user._id });
    if (!item) return res.status(404).json({ message: 'Item not found' });
    item.batches.push({
      batchNo, expiryDate, quantity: Number(quantity) || 0,
      purchasePrice: Number(purchasePrice) || 0, sellingPrice: Number(sellingPrice) || 0, supplier
    });
    await item.save();
    res.status(201).json(item.summary());
  })
);

// ── Sell / dispense (FEFO auto stock deduction) ──────────────────
router.post(
  '/:id/sell',
  auth,
  asyncHandler(async (req, res) => {
    const qtyToSell = Number(req.body.quantity) || 0;
    const { patientName } = req.body;
    if (qtyToSell <= 0) return res.status(400).json({ message: 'quantity must be greater than 0' });

    const item = await PharmacyItem.findOne({ _id: req.params.id, doctorId: req.user._id });
    if (!item) return res.status(404).json({ message: 'Item not found' });
    if (item.totalQuantity() < qtyToSell) {
      return res.status(400).json({ message: `Insufficient stock. Only ${item.totalQuantity()} units available.` });
    }

    // First-Expiry-First-Out: sort batches with stock by expiry
    const ordered = item.batches
      .filter((b) => (b.quantity || 0) > 0)
      .sort((a, b) => {
        const ea = a.expiryDate ? new Date(a.expiryDate) : Infinity;
        const eb = b.expiryDate ? new Date(b.expiryDate) : Infinity;
        return ea - eb;
      });

    let remaining = qtyToSell;
    let revenue = 0;
    let cost = 0;
    const usedBatchNos = [];
    for (const batch of ordered) {
      if (remaining <= 0) break;
      const take = Math.min(batch.quantity, remaining);
      batch.quantity -= take;
      remaining -= take;
      revenue += take * (batch.sellingPrice || 0);
      cost += take * (batch.purchasePrice || 0);
      if (batch.batchNo) usedBatchNos.push(batch.batchNo);
    }

    const profit = revenue - cost;
    item.sales.push({
      date: new Date(), quantity: qtyToSell, batchNo: usedBatchNos.join(', '),
      revenue, cost, profit, patientName
    });
    await item.save();

    res.json({ message: 'Sale recorded', sold: qtyToSell, revenue: Math.round(revenue), profit: Math.round(profit), item: item.summary() });
  })
);

// ── Update item meta ─────────────────────────────────────────────
router.put(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const updates = {};
    const allowed = ['name', 'genericName', 'strength', 'form', 'category', 'manufacturer', 'unitsPerStrip', 'reorderLevel', 'rackLocation', 'barcode', 'hsnCode', 'gstPercent', 'isActive'];
    allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    const item = await PharmacyItem.findOneAndUpdate(
      { _id: req.params.id, doctorId: req.user._id },
      updates,
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item.summary());
  })
);

// ── Delete (soft) ────────────────────────────────────────────────
router.delete(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const item = await PharmacyItem.findOneAndUpdate(
      { _id: req.params.id, doctorId: req.user._id },
      { isActive: false },
      { new: true }
    );
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ message: 'Item removed' });
  })
);

module.exports = router;
