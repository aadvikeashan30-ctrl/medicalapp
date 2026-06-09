/**
 * Revenue routing helper — turns a prescription or lab order into an
 * internal fulfillment record so the transaction stays in-network.
 * Best-effort: never throws into the calling request flow.
 */
const Fulfillment = require('../models/Fulfillment');
const logger = require('../utils/logger');

// Rough in-house price estimates (₹) used to quantify prevented leakage.
const EST_MEDICINE_VALUE = 80;
const EST_LAB_VALUE = 400;

async function routePrescription(doctor, prescription, patientName) {
  try {
    const meds = prescription.medicines || [];
    if (meds.length === 0) return null;
    const items = meds.map((m) => ({
      name: m.name,
      quantity: 1,
      estimatedValue: EST_MEDICINE_VALUE
    }));
    const estimatedValue = items.reduce((s, i) => s + i.estimatedValue, 0);
    return await Fulfillment.create({
      doctorId: doctor._id,
      patientId: prescription.patientId,
      patientName,
      source: 'prescription',
      sourceId: prescription._id,
      type: 'pharmacy',
      items,
      estimatedValue,
      destination: 'internal',
      status: 'routed'
    });
  } catch (err) {
    logger.warn(`Fulfillment routing (prescription) failed: ${err.message}`);
    return null;
  }
}

async function routeLab(doctor, labTest, patientName) {
  try {
    const isImaging = /x-?ray|mri|ct|scan|ultrasound|sonography|imaging/i.test(labTest.name || '');
    return await Fulfillment.create({
      doctorId: doctor._id,
      patientId: labTest.patientId,
      patientName,
      source: isImaging ? 'imaging' : 'lab',
      sourceId: labTest._id,
      type: isImaging ? 'imaging' : 'lab',
      items: [{ name: labTest.name, quantity: 1, estimatedValue: EST_LAB_VALUE }],
      estimatedValue: EST_LAB_VALUE,
      destination: 'internal',
      status: 'routed'
    });
  } catch (err) {
    logger.warn(`Fulfillment routing (lab) failed: ${err.message}`);
    return null;
  }
}

module.exports = { routePrescription, routeLab, EST_MEDICINE_VALUE, EST_LAB_VALUE };
