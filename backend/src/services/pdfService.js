/**
 * PDF Generation Service — Creates prescription and invoice PDFs
 * Uses pdfkit (already in dependencies)
 */
const PDFDocument = require('pdfkit');

/**
 * Generate a prescription PDF
 * @param {Object} prescription - Populated prescription object
 * @param {Object} doctor - Doctor/user object
 * @returns {Promise<Buffer>} PDF buffer
 */
function generatePrescriptionPDF(prescription, doctor) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const pageWidth = doc.page.width - 100;

    // Header - Doctor info
    doc.fontSize(18).fillColor('#1e40af').font('Helvetica-Bold')
      .text(`Dr. ${doctor.name}`, 50, 50);
    doc.fontSize(10).fillColor('#6b7280').font('Helvetica')
      .text(`${(doctor.specialty || 'General Physician').toUpperCase()} | ${doctor.qualification || 'MBBS'}`, 50, 72)
      .text(`Reg. No: ${doctor.registrationNo || 'N/A'}`, 50, 86);

    // Clinic info (right aligned)
    doc.fontSize(9).fillColor('#6b7280')
      .text(doctor.clinicName || '', 300, 50, { align: 'right', width: pageWidth - 250 })
      .text(doctor.clinicAddress || '', 300, 63, { align: 'right', width: pageWidth - 250 })
      .text(`${doctor.clinicCity || ''} | Ph: ${doctor.phone || ''}`, 300, 76, { align: 'right', width: pageWidth - 250 });

    // Divider
    doc.moveTo(50, 105).lineTo(50 + pageWidth, 105).strokeColor('#e5e7eb').lineWidth(1).stroke();

    // Prescription header
    doc.fontSize(12).fillColor('#1f2937').font('Helvetica-Bold')
      .text('PRESCRIPTION', 50, 115);
    doc.fontSize(9).fillColor('#6b7280').font('Helvetica')
      .text(`${prescription.prescriptionNo || ''} | Date: ${new Date(prescription.createdAt).toLocaleDateString('en-IN')}`, 50, 132);

    // Patient info box
    const patient = prescription.patientId || {};
    doc.roundedRect(50, 150, pageWidth, 50, 5).fillColor('#f8fafc').fill();
    doc.fillColor('#374151').fontSize(10).font('Helvetica-Bold')
      .text(`Patient: ${patient.name || 'N/A'}`, 60, 160);
    doc.font('Helvetica').fontSize(9).fillColor('#6b7280')
      .text(`ID: ${patient.patientId || 'N/A'} | Age: ${patient.age || '?'} | Gender: ${(patient.gender || '?').toUpperCase()}`, 60, 177)
      .text(`Phone: ${patient.phone || 'N/A'}`, 350, 177);

    let y = 215;

    // Vitals (if present)
    const vitals = prescription.vitals || {};
    if (vitals.bp || vitals.weight || vitals.temperature || vitals.pulse) {
      doc.fontSize(10).fillColor('#1e40af').font('Helvetica-Bold').text('Vitals:', 50, y);
      y += 16;
      const vitalText = [
        vitals.bp && `BP: ${vitals.bp}`,
        vitals.pulse && `Pulse: ${vitals.pulse}`,
        vitals.temperature && `Temp: ${vitals.temperature}°F`,
        vitals.weight && `Weight: ${vitals.weight}kg`,
        vitals.height && `Height: ${vitals.height}cm`,
        vitals.spo2 && `SpO2: ${vitals.spo2}%`
      ].filter(Boolean).join('  |  ');
      doc.fontSize(9).fillColor('#374151').font('Helvetica').text(vitalText, 50, y);
      y += 20;
    }

    // Diagnosis
    if (prescription.diagnosis) {
      doc.fontSize(10).fillColor('#1e40af').font('Helvetica-Bold').text('Diagnosis:', 50, y);
      y += 15;
      doc.fontSize(10).fillColor('#374151').font('Helvetica').text(prescription.diagnosis, 50, y);
      y += 20;
    }

    // Symptoms
    if (prescription.symptoms?.length) {
      doc.fontSize(10).fillColor('#1e40af').font('Helvetica-Bold').text('Symptoms:', 50, y);
      y += 15;
      doc.fontSize(9).fillColor('#374151').font('Helvetica').text(prescription.symptoms.join(', '), 50, y);
      y += 18;
    }

    // Rx Symbol
    y += 5;
    doc.fontSize(18).fillColor('#1e40af').font('Helvetica-Bold').text('℞', 50, y);
    y += 25;

    // Medicines table
    if (prescription.medicines?.length) {
      // Header row
      doc.roundedRect(50, y, pageWidth, 22, 3).fillColor('#eff6ff').fill();
      doc.fontSize(8).fillColor('#1e40af').font('Helvetica-Bold');
      doc.text('#', 55, y + 6, { width: 20 });
      doc.text('Medicine', 75, y + 6, { width: 180 });
      doc.text('Dosage', 255, y + 6, { width: 70 });
      doc.text('Frequency', 325, y + 6, { width: 70 });
      doc.text('Duration', 395, y + 6, { width: 70 });
      doc.text('Timing', 465, y + 6, { width: 80 });
      y += 28;

      prescription.medicines.forEach((med, idx) => {
        if (y > 720) { doc.addPage(); y = 50; }
        doc.fontSize(9).fillColor('#1f2937').font('Helvetica');
        doc.text(`${idx + 1}.`, 55, y, { width: 20 });
        doc.font('Helvetica-Bold').text(med.name || '', 75, y, { width: 180 });
        doc.font('Helvetica').text(med.dosage || '', 255, y, { width: 70 });
        doc.text(med.frequency || '', 325, y, { width: 70 });
        doc.text(med.duration || '', 395, y, { width: 70 });
        doc.text((med.timing || '').replace('-', ' '), 465, y, { width: 80 });
        y += 18;
      });
    }

    y += 10;

    // Tests
    if (prescription.tests?.length) {
      doc.fontSize(10).fillColor('#1e40af').font('Helvetica-Bold').text('Lab Tests:', 50, y);
      y += 15;
      doc.fontSize(9).fillColor('#374151').font('Helvetica').text(prescription.tests.join(', '), 50, y);
      y += 18;
    }

    // Advice
    if (prescription.advice) {
      y += 5;
      doc.fontSize(10).fillColor('#1e40af').font('Helvetica-Bold').text('Advice:', 50, y);
      y += 15;
      doc.fontSize(9).fillColor('#374151').font('Helvetica').text(prescription.advice, 50, y, { width: pageWidth });
      y += doc.heightOfString(prescription.advice, { width: pageWidth }) + 10;
    }

    // Follow-up
    if (prescription.followUpDate) {
      y += 5;
      doc.fontSize(9).fillColor('#dc2626').font('Helvetica-Bold')
        .text(`Follow-up: ${new Date(prescription.followUpDate).toLocaleDateString('en-IN')}`, 50, y);
    }

    // Footer
    doc.fontSize(8).fillColor('#9ca3af').font('Helvetica')
      .text('Generated by DocClinic Pro | This is a computer-generated prescription', 50, 770, { align: 'center', width: pageWidth });

    doc.end();
  });
}

/**
 * Generate an invoice PDF
 * @param {Object} invoice - Populated billing object
 * @param {Object} doctor - Doctor/user object
 * @returns {Promise<Buffer>} PDF buffer
 */
function generateInvoicePDF(invoice, doctor) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const pageWidth = doc.page.width - 100;

    // Header
    doc.fontSize(20).fillColor('#1e40af').font('Helvetica-Bold')
      .text('INVOICE', 50, 50);
    doc.fontSize(11).fillColor('#6b7280').font('Helvetica')
      .text(invoice.invoiceNo || '', 50, 75);

    // Clinic info (right)
    doc.fontSize(11).fillColor('#1f2937').font('Helvetica-Bold')
      .text(doctor.clinicName || `Dr. ${doctor.name}`, 300, 50, { align: 'right', width: pageWidth - 250 });
    doc.fontSize(9).fillColor('#6b7280').font('Helvetica')
      .text(doctor.clinicAddress || '', 300, 65, { align: 'right', width: pageWidth - 250 })
      .text(`${doctor.clinicCity || ''} | Ph: ${doctor.phone || ''}`, 300, 78, { align: 'right', width: pageWidth - 250 });

    doc.moveTo(50, 100).lineTo(50 + pageWidth, 100).strokeColor('#e5e7eb').lineWidth(1).stroke();

    // Date & Patient info
    const patient = invoice.patientId || {};
    let y = 115;
    doc.fontSize(9).fillColor('#6b7280').font('Helvetica')
      .text(`Date: ${new Date(invoice.createdAt).toLocaleDateString('en-IN')}`, 50, y)
      .text(`Payment: ${(invoice.paymentMethod || 'cash').toUpperCase()}`, 300, y);
    y += 18;
    doc.fontSize(10).fillColor('#1f2937').font('Helvetica-Bold')
      .text(`Patient: ${patient.name || 'N/A'}`, 50, y);
    doc.fontSize(9).fillColor('#6b7280').font('Helvetica')
      .text(`ID: ${patient.patientId || ''} | Phone: ${patient.phone || ''}`, 50, y + 14);
    y += 40;

    // Items table
    doc.roundedRect(50, y, pageWidth, 22, 3).fillColor('#f8fafc').fill();
    doc.fontSize(9).fillColor('#1e40af').font('Helvetica-Bold');
    doc.text('#', 55, y + 6, { width: 25 });
    doc.text('Description', 80, y + 6, { width: 250 });
    doc.text('Qty', 330, y + 6, { width: 40 });
    doc.text('Rate', 370, y + 6, { width: 70 });
    doc.text('Amount', 440, y + 6, { width: 80, align: 'right' });
    y += 28;

    (invoice.items || []).forEach((item, idx) => {
      doc.fontSize(9).fillColor('#374151').font('Helvetica');
      doc.text(`${idx + 1}`, 55, y, { width: 25 });
      doc.text(item.description || '', 80, y, { width: 250 });
      doc.text(`${item.quantity || 1}`, 330, y, { width: 40 });
      doc.text(`₹${item.amount || 0}`, 370, y, { width: 70 });
      doc.text(`₹${(item.amount || 0) * (item.quantity || 1)}`, 440, y, { width: 80, align: 'right' });
      y += 18;
    });

    // Totals
    y += 10;
    doc.moveTo(350, y).lineTo(50 + pageWidth, y).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
    y += 10;

    const addTotal = (label, value, bold = false) => {
      doc.fontSize(9).fillColor('#6b7280').font(bold ? 'Helvetica-Bold' : 'Helvetica')
        .text(label, 350, y, { width: 90 });
      doc.fillColor(bold ? '#1f2937' : '#374151')
        .text(`₹${Number(value || 0).toLocaleString('en-IN')}`, 440, y, { width: 80, align: 'right' });
      y += 16;
    };

    addTotal('Subtotal', invoice.subtotal);
    if (invoice.discount) addTotal('Discount', `-${invoice.discount}`);
    if (invoice.tax) addTotal('Tax', invoice.tax);
    y += 2;
    doc.moveTo(350, y).lineTo(50 + pageWidth, y).strokeColor('#1e40af').lineWidth(1).stroke();
    y += 8;
    addTotal('TOTAL', invoice.totalAmount, true);
    addTotal('Paid', invoice.paidAmount);

    const balance = (invoice.totalAmount || 0) - (invoice.paidAmount || 0);
    if (balance > 0) {
      doc.fontSize(10).fillColor('#dc2626').font('Helvetica-Bold')
        .text(`Balance Due: ₹${balance.toLocaleString('en-IN')}`, 350, y, { width: 170, align: 'right' });
    } else {
      doc.fontSize(10).fillColor('#059669').font('Helvetica-Bold')
        .text('PAID IN FULL', 350, y, { width: 170, align: 'right' });
    }

    // Footer
    doc.fontSize(8).fillColor('#9ca3af').font('Helvetica')
      .text('Generated by DocClinic Pro | This is a computer-generated invoice', 50, 770, { align: 'center', width: pageWidth });

    doc.end();
  });
}

module.exports = { generatePrescriptionPDF, generateInvoicePDF };
