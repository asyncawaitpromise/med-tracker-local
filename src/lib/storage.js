import { DEFAULT_MED_PHOTO, DEFAULT_MED_EMOJI } from './medPhotos';
import { randomId } from './id';

const MEDICATIONS_KEY = 'med-tracker:medications';
const DOSES_KEY = 'med-tracker:doses';

const DEFAULT_MEDICATIONS = [
  {
    id: 'ibuprofen',
    name: 'Ibuprofen',
    icon: 'ibuprofen',
    unit: 'mg',
    dailyLimit: 1200,
    minHoursBetweenDoses: 4,
    doses: [
      { id: 'ibuprofen-200', amount: 200 },
      { id: 'ibuprofen-400', amount: 400 },
    ],
  },
  {
    id: 'tylenol',
    name: 'Tylenol',
    icon: 'acetaminophen',
    unit: 'mg',
    dailyLimit: 3000,
    minHoursBetweenDoses: 4,
    doses: [
      { id: 'tylenol-325', amount: 325 },
      { id: 'tylenol-500', amount: 500 },
    ],
  },
];

function read(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function write(key, value) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

// Upgrades medications saved under the old single-doseAmount shape to the
// current multi-dose-preset shape, and fills in defaults for the
// photo-vs-emoji icon fields added later.
function normalizeMedication(m) {
  const icon = m.icon || DEFAULT_MED_PHOTO;
  const iconType = m.iconType === 'emoji' ? 'emoji' : 'photo';
  const emoji = m.emoji || DEFAULT_MED_EMOJI;
  if (Array.isArray(m.doses)) {
    return { ...m, icon, iconType, emoji };
  }
  const { doseAmount, ...rest } = m;
  return {
    ...rest,
    icon,
    iconType,
    emoji,
    doses: doseAmount ? [{ id: randomId(), amount: doseAmount }] : [],
  };
}

export function getMedications() {
  const existing = read(MEDICATIONS_KEY, null);
  if (existing === null) {
    const normalizedDefaults = DEFAULT_MEDICATIONS.map(normalizeMedication);
    write(MEDICATIONS_KEY, normalizedDefaults);
    return normalizedDefaults;
  }
  const needsMigration = existing.some(
    (m) => !Array.isArray(m.doses) || !m.iconType || !m.emoji
  );
  const normalized = existing.map(normalizeMedication);
  if (needsMigration) write(MEDICATIONS_KEY, normalized);
  return normalized;
}

export function saveMedications(medications) {
  write(MEDICATIONS_KEY, medications);
}

export function addMedication(medication) {
  const medications = getMedications();
  const withId = { id: randomId(), ...medication };
  saveMedications([...medications, withId]);
  return withId;
}

export function updateMedication(id, updates) {
  const medications = getMedications().map((m) =>
    m.id === id ? { ...m, ...updates } : m
  );
  saveMedications(medications);
}

export function deleteMedication(id) {
  saveMedications(getMedications().filter((m) => m.id !== id));
}

export function getDoses() {
  return read(DOSES_KEY, []);
}

export function saveDoses(doses) {
  write(DOSES_KEY, doses);
}

export function addDose(medicationId, amount) {
  const dose = {
    id: randomId(),
    medicationId,
    amount,
    timestamp: Date.now(),
  };
  saveDoses([dose, ...getDoses()]);
  return dose;
}

export function updateDose(id, updates) {
  saveDoses(getDoses().map((d) => (d.id === id ? { ...d, ...updates } : d)));
}

export function deleteDose(id) {
  saveDoses(getDoses().filter((d) => d.id !== id));
}

export function clearDoses() {
  saveDoses([]);
}
