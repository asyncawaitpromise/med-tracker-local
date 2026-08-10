function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function startOfTomorrow() {
  return startOfToday() + 24 * 60 * 60 * 1000;
}

export function todaysDoses(doses, medicationId) {
  const start = startOfToday();
  return doses.filter(
    (d) => d.medicationId === medicationId && d.timestamp >= start
  );
}

export function todaysTotal(doses, medicationId) {
  return todaysDoses(doses, medicationId).reduce((sum, d) => sum + d.amount, 0);
}

export function lastDoseTime(doses, medicationId) {
  const mine = doses.filter((d) => d.medicationId === medicationId);
  if (mine.length === 0) return null;
  return Math.max(...mine.map((d) => d.timestamp));
}

// Medication-level status shared by all of its dose-size buttons: how much
// has been taken today, and whether the minimum interval since the last
// dose has elapsed yet.
export function getMedicationStatus(medication, doses) {
  const todayTotal = todaysTotal(doses, medication.id);
  const last = lastDoseTime(doses, medication.id);
  const intervalReadyAt = last
    ? last + medication.minHoursBetweenDoses * 60 * 60 * 1000
    : 0;

  return {
    todayTotal,
    remainingToday: Math.max(0, medication.dailyLimit - todayTotal),
    timeOk: Date.now() >= intervalReadyAt,
    intervalReadyAt,
  };
}

// Whether a specific dose size can be taken right now, given the
// medication's shared status.
export function canTakeAmount(status, medication, amount) {
  return status.timeOk && status.todayTotal + amount <= medication.dailyLimit;
}

// Why a specific dose size is currently blocked, and when it next becomes
// available. Returns null if it's available now.
export function blockedReason(status, medication, amount) {
  if (!status.timeOk) {
    return { reason: 'interval', at: status.intervalReadyAt };
  }
  if (status.todayTotal + amount > medication.dailyLimit) {
    return { reason: 'daily-limit', at: startOfTomorrow() };
  }
  return null;
}

export function formatTimeUntil(timestamp) {
  const diffMs = timestamp - Date.now();
  if (diffMs <= 0) return 'now';
  const totalMinutes = Math.ceil(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}
