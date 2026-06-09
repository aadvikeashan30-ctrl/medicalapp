/**
 * HL7 FHIR R4 mapping service.
 *
 * Maps our internal records to/from standard FHIR resources so the app can
 * exchange data with external EHRs (Epic, Cerner, etc.). Network transport to
 * an external FHIR server is intentionally abstracted behind FHIR_BASE_URL so
 * credentials/config can be supplied per-deployment.
 */
const GENDER_MAP = { male: 'male', female: 'female', other: 'other' };

function toFhirPatient(p) {
  return {
    resourceType: 'Patient',
    id: String(p._id || p.patientId || ''),
    identifier: [{ system: 'urn:docclinic:patientId', value: p.patientId }],
    active: p.isActive !== false,
    name: [{ use: 'official', text: p.name }],
    telecom: [
      p.phone ? { system: 'phone', value: p.phone, use: 'mobile' } : null,
      p.email ? { system: 'email', value: p.email } : null
    ].filter(Boolean),
    gender: GENDER_MAP[p.gender] || 'unknown',
    birthDate: p.dateOfBirth ? new Date(p.dateOfBirth).toISOString().slice(0, 10) : undefined,
    address: p.address ? [{ text: p.address, city: p.city }] : undefined
  };
}

function fromFhirPatient(resource) {
  if (!resource || resource.resourceType !== 'Patient') {
    throw new Error('Expected a FHIR Patient resource');
  }
  const name = resource.name?.[0];
  const phone = (resource.telecom || []).find((t) => t.system === 'phone')?.value;
  const email = (resource.telecom || []).find((t) => t.system === 'email')?.value;
  return {
    name: name?.text || [name?.given?.join(' '), name?.family].filter(Boolean).join(' ') || 'Unknown',
    phone: phone || '',
    email,
    gender: resource.gender && resource.gender !== 'unknown' ? resource.gender : undefined,
    dateOfBirth: resource.birthDate ? new Date(resource.birthDate) : undefined,
    address: resource.address?.[0]?.text,
    city: resource.address?.[0]?.city
  };
}

function toFhirAppointment(a, patientRef) {
  const start = a.date ? new Date(a.date).toISOString() : undefined;
  const statusMap = { scheduled: 'booked', confirmed: 'booked', completed: 'fulfilled', cancelled: 'cancelled', 'no-show': 'noshow' };
  return {
    resourceType: 'Appointment',
    id: String(a._id),
    status: statusMap[a.status] || 'booked',
    description: a.symptoms || a.type,
    start,
    minutesDuration: a.duration || 30,
    participant: [{ actor: { reference: patientRef }, status: 'accepted' }]
  };
}

function toFhirMedicationRequests(prescription, patientRef) {
  return (prescription.medicines || []).map((m, i) => ({
    resourceType: 'MedicationRequest',
    id: `${prescription._id}-${i}`,
    status: 'active',
    intent: 'order',
    medicationCodeableConcept: { text: [m.name, m.dosage].filter(Boolean).join(' ') },
    subject: { reference: patientRef },
    authoredOn: prescription.createdAt ? new Date(prescription.createdAt).toISOString() : undefined,
    dosageInstruction: [{ text: [m.frequency, m.duration, m.timing].filter(Boolean).join(', ') }]
  }));
}

function toFhirCondition(diagnosis, patientRef) {
  if (!diagnosis) return null;
  return {
    resourceType: 'Condition',
    code: { text: diagnosis },
    subject: { reference: patientRef }
  };
}

function buildEverythingBundle({ patient, appointments = [], prescriptions = [] }) {
  const patientRef = `Patient/${patient._id || patient.patientId}`;
  const entries = [{ resource: toFhirPatient(patient) }];

  appointments.forEach((a) => entries.push({ resource: toFhirAppointment(a, patientRef) }));
  prescriptions.forEach((rx) => {
    toFhirMedicationRequests(rx, patientRef).forEach((mr) => entries.push({ resource: mr }));
    const cond = toFhirCondition(rx.diagnosis, patientRef);
    if (cond) entries.push({ resource: cond });
  });

  return {
    resourceType: 'Bundle',
    type: 'searchset',
    timestamp: new Date().toISOString(),
    total: entries.length,
    entry: entries
  };
}

function capabilityStatement() {
  return {
    resourceType: 'CapabilityStatement',
    status: 'active',
    date: new Date().toISOString(),
    publisher: 'DocClinic Pro',
    kind: 'instance',
    fhirVersion: '4.0.1',
    format: ['json'],
    rest: [{
      mode: 'server',
      resource: [
        { type: 'Patient', interaction: [{ code: 'read' }, { code: 'create' }, { code: 'search-type' }] },
        { type: 'Appointment', interaction: [{ code: 'read' }] },
        { type: 'MedicationRequest', interaction: [{ code: 'read' }] }
      ]
    }]
  };
}

module.exports = {
  toFhirPatient,
  fromFhirPatient,
  toFhirAppointment,
  toFhirMedicationRequests,
  buildEverythingBundle,
  capabilityStatement,
  externalBaseUrl: () => process.env.FHIR_BASE_URL || null
};
