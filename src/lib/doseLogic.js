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

// Doses still "active" in the trailing window (oldest first), i.e. those
// that count toward the rolling per-window cap.
export function dosesInWindow(doses, medicationId, windowHours) {
  const cutoff = Date.now() - windowHours * 60 * 60 * 1000;
  return doses
    .filter((d) => d.medicationId === medicationId && d.timestamp > cutoff)
    .sort((a, b) => a.timestamp - b.timestamp);
}

function sumAmounts(doses) {
  return doses.reduce((sum, d) => sum + d.amount, 0);
}

// The earliest time an additional `amount` fits under the window cap, given
// doses (oldest first) that currently count toward it. As each dose ages
// past windowHours it stops counting, freeing up capacity.
function earliestWindowFit(windowedDoses, windowHours, windowCap, amount) {
  const windowMs = windowHours * 60 * 60 * 1000;
  let remaining = sumAmounts(windowedDoses);
  if (remaining + amount <= windowCap) return Date.now();
  for (const dose of windowedDoses) {
    remaining -= dose.amount;
    if (remaining + amount <= windowCap) return dose.timestamp + windowMs;
  }
  return Date.now();
}

// Medication-level status shared by all of its dose-size buttons: how much
// has been taken today, and how much of the rolling per-window cap
// (minHoursBetweenDoses wide, capped at the medication's largest configured
// dose) is currently used up.
export function getMedicationStatus(medication, doses) {
  const todayTotal = todaysTotal(doses, medication.id);
  const windowHours = medication.minHoursBetweenDoses;
  const windowCap = medication.doses?.length
    ? Math.max(...medication.doses.map((d) => d.amount))
    : 0;
  const windowedDoses = dosesInWindow(doses, medication.id, windowHours);
  const windowTotal = sumAmounts(windowedDoses);

  return {
    todayTotal,
    remainingToday: Math.max(0, medication.dailyLimit - todayTotal),
    windowHours,
    windowCap,
    windowedDoses,
    windowTotal,
  };
}

// Whether a specific dose size can be taken right now, given the
// medication's shared status.
export function canTakeAmount(status, medication, amount) {
  return (
    status.todayTotal + amount <= medication.dailyLimit &&
    status.windowTotal + amount <= status.windowCap
  );
}

// Why a specific dose size is currently blocked, and when it next becomes
// available. Returns null if it's available now.
export function blockedReason(status, medication, amount) {
  if (status.windowTotal + amount > status.windowCap) {
    const at = earliestWindowFit(
      status.windowedDoses,
      status.windowHours,
      status.windowCap,
      amount
    );
    return { reason: 'window-limit', at };
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
