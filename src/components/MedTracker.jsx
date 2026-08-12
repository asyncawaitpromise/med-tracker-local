import { useEffect, useState } from 'react';
import { Settings, X, Pencil } from 'lucide-react';
import {
  getMedications,
  getDoses,
  addDose,
  updateDose,
  deleteDose,
  clearDoses,
} from '../lib/storage';
import {
  getMedicationStatus,
  canTakeAmount,
  blockedReason,
  formatTimeUntil,
} from '../lib/doseLogic';
import MedIcon from './MedIcon';

// Local-time <input type="datetime-local"> value for a timestamp, and back.
function toDatetimeLocal(timestamp) {
  const d = new Date(timestamp);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocal(value) {
  return new Date(value).getTime();
}

export default function MedTracker() {
  const [medications, setMedications] = useState(getMedications);
  const [doses, setDoses] = useState(getDoses);
  const [, forceTick] = useState(0);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);
  const [editingDose, setEditingDose] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editTimestamp, setEditTimestamp] = useState('');

  useEffect(() => {
    const tick = setInterval(() => forceTick((t) => t + 1), 30000);
    return () => clearInterval(tick);
  }, []);

  function handleTake(medication, amount) {
    addDose(medication.id, amount);
    setDoses(getDoses());
  }

  function handleDelete(doseId) {
    deleteDose(doseId);
    setDoses(getDoses());
    setConfirmingDeleteId(null);
  }

  function handleStartEdit(dose) {
    setEditingDose(dose);
    setEditAmount(String(dose.amount));
    setEditTimestamp(toDatetimeLocal(dose.timestamp));
  }

  function handleSaveEdit(e) {
    e.preventDefault();
    const amount = Number(editAmount);
    const timestamp = fromDatetimeLocal(editTimestamp);
    if (!amount || amount <= 0 || Number.isNaN(timestamp)) return;
    updateDose(editingDose.id, { amount, timestamp });
    setDoses(getDoses());
    setEditingDose(null);
  }

  function handleClearHistory() {
    clearDoses();
    setDoses(getDoses());
    setConfirmingClear(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Med Tracker</h1>
        <a href="/settings" className="btn btn-ghost btn-sm btn-circle">
          <Settings size={20} />
        </a>
      </div>

      <div className="flex flex-col gap-3">
        {medications.length === 0 && (
          <p className="text-sm opacity-70">
            No medications configured. Add one in{' '}
            <a href="/settings" className="link">
              settings
            </a>
            .
          </p>
        )}
        {medications.map((med) => {
          const status = getMedicationStatus(med, doses);
          const medDoses = med.doses || [];
          const smallestAmount = medDoses.length
            ? Math.min(...medDoses.map((d) => d.amount))
            : 0;
          const blocked = medDoses.length
            ? blockedReason(status, med, smallestAmount)
            : null;

          return (
            <div key={med.id} className="card bg-base-200 shadow-sm">
              <div className="card-body p-4 gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <MedIcon medication={med} size="md" />
                  <span className="font-semibold truncate">{med.name}</span>
                  <span className="ml-auto text-xs opacity-70 whitespace-nowrap shrink-0">
                    {status.todayTotal}/{med.dailyLimit}
                    {med.unit} today
                  </span>
                </div>

                {medDoses.length === 0 ? (
                  <p className="text-xs opacity-70">
                    No doses configured — add one in{' '}
                    <a href="/settings" className="link">
                      settings
                    </a>
                    .
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {medDoses.map((dose) => (
                      <button
                        key={dose.id}
                        className="btn btn-primary btn-sm"
                        disabled={!canTakeAmount(status, med, dose.amount)}
                        onClick={() => handleTake(med, dose.amount)}
                      >
                        Take {dose.amount}
                        {med.unit}
                      </button>
                    ))}
                  </div>
                )}

                {blocked && (
                  <div className="text-xs px-2 py-1 rounded bg-warning/20 w-fit">
                    {blocked.reason === 'daily-limit'
                      ? `Daily limit reached — resets in ${formatTimeUntil(blocked.at)}`
                      : `Next dose available in ${formatTimeUntil(blocked.at)}`}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold uppercase opacity-60">
            History
          </h2>
          {doses.length > 0 && (
            <button
              className="btn btn-ghost btn-xs"
              onClick={() => setConfirmingClear(true)}
            >
              Clear history
            </button>
          )}
        </div>
        <ul className="flex flex-col gap-1">
          {doses.length === 0 && (
            <li className="text-sm opacity-70">No doses logged yet.</li>
          )}
          {doses.map((dose) => {
            const med = medications.find((m) => m.id === dose.medicationId);
            return (
              <li
                key={dose.id}
                className="flex flex-wrap items-center justify-between gap-x-2 text-sm py-1 border-b border-base-200"
              >
                <span className="flex items-center gap-1.5 truncate min-w-0">
                  {med && <MedIcon medication={med} size="sm" />}
                  <span className="truncate">
                    {med ? med.name : 'Unknown'} — {dose.amount}
                    {med ? med.unit : ''}
                  </span>
                </span>
                <span className="flex items-center gap-2 opacity-70 shrink-0">
                  {new Date(dose.timestamp).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                  <button
                    className="btn btn-ghost btn-xs btn-circle"
                    onClick={() => handleStartEdit(dose)}
                    aria-label="Edit entry"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    className="btn btn-ghost btn-xs btn-circle"
                    onClick={() => setConfirmingDeleteId(dose.id)}
                    aria-label="Delete entry"
                  >
                    <X size={14} />
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {(confirmingClear || confirmingDeleteId) && (
        <div
          className="modal modal-open"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setConfirmingClear(false);
              setConfirmingDeleteId(null);
            }
          }}
        >
          <div className="modal-box">
            {confirmingClear ? (
              <>
                <h3 className="font-bold text-lg">Clear all history?</h3>
                <p className="py-2 text-sm opacity-70">
                  This deletes all {doses.length} logged dose
                  {doses.length === 1 ? '' : 's'}. This can't be undone.
                </p>
              </>
            ) : (
              <>
                <h3 className="font-bold text-lg">Delete this entry?</h3>
                <p className="py-2 text-sm opacity-70">This can't be undone.</p>
              </>
            )}
            <div className="modal-action">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setConfirmingClear(false);
                  setConfirmingDeleteId(null);
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-error btn-sm"
                onClick={
                  confirmingClear
                    ? handleClearHistory
                    : () => handleDelete(confirmingDeleteId)
                }
              >
                {confirmingClear ? 'Clear history' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingDose && (
        <div
          className="modal modal-open"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingDose(null);
          }}
        >
          <div className="modal-box">
            <h3 className="font-bold text-lg">Edit entry</h3>
            <form onSubmit={handleSaveEdit} className="flex flex-col gap-3 py-2">
              <label className="flex flex-col gap-1 text-sm">
                Amount
                <input
                  type="number"
                  autoFocus
                  className="input input-sm input-bordered"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Taken at
                <input
                  type="datetime-local"
                  className="input input-sm input-bordered"
                  value={editTimestamp}
                  onChange={(e) => setEditTimestamp(e.target.value)}
                />
              </label>
              <div className="modal-action">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setEditingDose(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
