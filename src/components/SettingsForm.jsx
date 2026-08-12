import { useEffect, useState } from 'react';
import { ArrowLeft, Trash2, X } from 'lucide-react';
import {
  getMedications,
  saveMedications,
  addMedication,
  deleteMedication,
} from '../lib/storage';
import {
  MED_PHOTOS,
  MED_EMOJIS,
  DEFAULT_MED_PHOTO,
  DEFAULT_MED_EMOJI,
  getMedPhoto,
} from '../lib/medPhotos';
import { findMatchingPresets } from '../lib/medPresets';
import { randomId } from '../lib/id';
import MedIcon from './MedIcon';
import InstallPwaButton from './InstallPwaButton';

const emptyForm = {
  name: '',
  icon: DEFAULT_MED_PHOTO,
  iconType: 'photo',
  emoji: DEFAULT_MED_EMOJI,
  unit: 'mg',
  dailyLimit: '',
  minHoursBetweenDoses: '',
  doses: [],
};

// A deliberate action to browse/search every available photo — separate
// from any name typed elsewhere, so it always shows results.
function ImageSearchModal({ open, initialQuery, selected, onSelect, onClose }) {
  const [query, setQuery] = useState(initialQuery || '');

  useEffect(() => {
    if (open) setQuery(initialQuery || '');
  }, [open, initialQuery]);

  if (!open) return null;

  const q = query.trim().toLowerCase();
  const filtered = q
    ? MED_PHOTOS.filter((p) => p.label.toLowerCase().includes(q))
    : MED_PHOTOS;

  return (
    <div
      className="modal modal-open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-2">Choose an image</h3>
        <input
          autoFocus
          className="input input-sm input-bordered w-full mb-2"
          placeholder="Search medications…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex flex-wrap gap-1 max-h-64 overflow-y-auto p-1 border border-base-300 rounded">
          {filtered.map((photo) => (
            <button
              key={photo.key}
              type="button"
              className={`w-11 h-11 shrink-0 rounded overflow-hidden ${
                photo.key === selected ? 'ring-2 ring-primary' : 'ring-1 ring-base-300'
              }`}
              onClick={() => {
                onSelect(photo.key);
                onClose();
              }}
              aria-label={`Use photo for ${photo.label}`}
              title={photo.label}
            >
              <img src={photo.file} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-xs opacity-70 p-1">No matches.</p>
          )}
        </div>
        <div className="modal-action">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function PhotoPicker({ icon, nameHint, onSelect }) {
  const [modalOpen, setModalOpen] = useState(false);
  const photo = getMedPhoto(icon);

  return (
    <>
      <button
        type="button"
        className="btn btn-sm btn-outline gap-2 self-start"
        onClick={() => setModalOpen(true)}
      >
        <img src={photo.file} alt="" className="w-6 h-6 rounded object-cover" />
        {photo.label}
        <span className="opacity-60 font-normal">— search images</span>
      </button>
      <ImageSearchModal
        open={modalOpen}
        initialQuery={nameHint}
        selected={icon}
        onSelect={onSelect}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}

// Lets a medication use either a photo or a free-choice emoji as its icon.
function IconEditor({ iconType, icon, emoji, name, onChange }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="join">
        <button
          type="button"
          className={`btn btn-xs join-item ${iconType !== 'emoji' ? 'btn-active' : ''}`}
          onClick={() => onChange({ iconType: 'photo' })}
        >
          Photo
        </button>
        <button
          type="button"
          className={`btn btn-xs join-item ${iconType === 'emoji' ? 'btn-active' : ''}`}
          onClick={() => onChange({ iconType: 'emoji' })}
        >
          Emoji
        </button>
      </div>

      {iconType === 'emoji' ? (
        <div className="flex flex-wrap items-center gap-1">
          {MED_EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              className={`w-9 h-9 shrink-0 rounded text-xl flex items-center justify-center ${
                e === emoji ? 'ring-2 ring-primary' : 'ring-1 ring-base-300'
              }`}
              onClick={() => onChange({ emoji: e })}
              aria-label={`Use emoji ${e}`}
            >
              {e}
            </button>
          ))}
          <input
            className="input input-sm input-bordered w-16 text-center text-lg"
            value={emoji}
            maxLength={4}
            placeholder="✏️"
            onChange={(e) => onChange({ emoji: e.target.value })}
            aria-label="Custom emoji"
          />
        </div>
      ) : (
        <PhotoPicker icon={icon} nameHint={name} onSelect={(icon) => onChange({ icon })} />
      )}
    </div>
  );
}

// Shared doses UI: a list of removable dose-size badges plus an input to add
// another. Used both for editing a saved medication and for building up an
// unsaved one in the add form.
function DoseEditor({ doses, unit, pendingAmount, onPendingAmountChange, onAdd, onRemove }) {
  return (
    <div className="flex flex-col gap-1 text-sm">
      <span className="opacity-70">Doses (all count toward the same daily limit)</span>
      <div className="flex flex-wrap gap-2">
        {doses.map((dose) => (
          <span key={dose.id} className="badge badge-lg gap-1">
            {dose.amount}
            {unit}
            <button
              type="button"
              onClick={() => onRemove(dose.id)}
              aria-label={`Remove ${dose.amount}${unit} dose`}
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <div className="join">
          <input
            type="number"
            placeholder="amount"
            className="input input-sm input-bordered join-item w-24"
            value={pendingAmount}
            onChange={(e) => onPendingAmountChange(e.target.value)}
          />
          <button type="button" className="btn btn-sm join-item" onClick={onAdd}>
            Add dose
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsForm() {
  const [medications, setMedications] = useState(getMedications);
  const [mode, setMode] = useState(null); // null | 'edit' | 'add'
  const [form, setForm] = useState(emptyForm);
  const [appliedPresetKey, setAppliedPresetKey] = useState(null);
  const [newDoseInputs, setNewDoseInputs] = useState({});
  const [newFormDoseInput, setNewFormDoseInput] = useState('');
  const [pendingPreset, setPendingPreset] = useState(null);

  function persist(updated) {
    setMedications(updated);
    saveMedications(updated);
  }

  function handleFieldChange(id, field, value) {
    setMedications((meds) =>
      meds.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  }

  function handleFieldCommit(id, field, value, isNumber) {
    const parsed = isNumber ? Number(value) : value;
    persist(medications.map((m) => (m.id === id ? { ...m, [field]: parsed } : m)));
  }

  function handleIconChange(id, patch) {
    persist(medications.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }

  function handleAddDose(id) {
    const raw = newDoseInputs[id];
    const amount = Number(raw);
    if (!raw || !amount || amount <= 0) return;
    persist(
      medications.map((m) =>
        m.id === id
          ? { ...m, doses: [...m.doses, { id: randomId(), amount }] }
          : m
      )
    );
    setNewDoseInputs((inputs) => ({ ...inputs, [id]: '' }));
  }

  function handleRemoveDose(medId, doseId) {
    persist(
      medications.map((m) =>
        m.id === medId
          ? { ...m, doses: m.doses.filter((d) => d.id !== doseId) }
          : m
      )
    );
  }

  function handleDelete(id) {
    deleteMedication(id);
    setMedications(getMedications());
  }

  function handleNameChange(value) {
    setForm((f) => ({ ...f, name: value }));
    setAppliedPresetKey(null);
  }

  function handleConfirmPreset() {
    handleApplyPreset(pendingPreset);
    setPendingPreset(null);
  }

  function handleApplyPreset(preset) {
    setForm((f) => ({
      ...f,
      name: preset.name,
      icon: preset.icon,
      iconType: 'photo',
      unit: preset.unit,
      dailyLimit: String(preset.dailyLimit),
      minHoursBetweenDoses: String(preset.minHoursBetweenDoses),
      doses: preset.doseAmounts.map((amount) => ({ id: randomId(), amount })),
    }));
    setAppliedPresetKey(preset.key);
  }

  function handleAddFormDose() {
    const amount = Number(newFormDoseInput);
    if (!newFormDoseInput || !amount || amount <= 0) return;
    setForm((f) => ({ ...f, doses: [...f.doses, { id: randomId(), amount }] }));
    setNewFormDoseInput('');
  }

  function handleRemoveFormDose(doseId) {
    setForm((f) => ({ ...f, doses: f.doses.filter((d) => d.id !== doseId) }));
  }

  function handleAdd(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    addMedication({
      name: form.name.trim(),
      icon: form.icon || DEFAULT_MED_PHOTO,
      iconType: form.iconType === 'emoji' ? 'emoji' : 'photo',
      emoji: form.emoji || DEFAULT_MED_EMOJI,
      unit: form.unit.trim() || 'mg',
      dailyLimit: Number(form.dailyLimit) || 0,
      minHoursBetweenDoses: Number(form.minHoursBetweenDoses) || 0,
      doses: form.doses,
    });
    setMedications(getMedications());
    setForm(emptyForm);
    setAppliedPresetKey(null);
    setNewFormDoseInput('');
    setMode(null);
  }

  const matchingPresets = appliedPresetKey
    ? []
    : findMatchingPresets(form.name).slice(0, 3);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <a href="/" className="btn btn-ghost btn-sm btn-circle">
          <ArrowLeft size={20} />
        </a>
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      {mode === null && (
        <div className="flex flex-col gap-3">
          <p className="text-sm opacity-70">What would you like to do?</p>
          <button
            type="button"
            className="btn btn-primary justify-start"
            onClick={() => setMode('edit')}
          >
            Edit existing medications
            <span className="ml-auto opacity-70 font-normal">
              {medications.length}
            </span>
          </button>
          <button
            type="button"
            className="btn btn-outline justify-start"
            onClick={() => setMode('add')}
          >
            Add a medication
          </button>
          <InstallPwaButton />
        </div>
      )}

      {mode === 'edit' && (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            className="btn btn-ghost btn-sm self-start gap-1"
            onClick={() => setMode(null)}
          >
            <ArrowLeft size={16} />
            Back
          </button>

          {medications.length === 0 && (
            <p className="text-sm opacity-70">No medications yet.</p>
          )}

          {medications.map((med) => (
            <div key={med.id} className="card bg-base-200 shadow-sm">
              <div className="card-body p-4 gap-3">
                <div className="flex items-center gap-2">
                  <MedIcon medication={med} size="md" />
                  <input
                    className="input input-sm input-bordered font-semibold flex-1 min-w-0"
                    value={med.name}
                    onChange={(e) =>
                      handleFieldChange(med.id, 'name', e.target.value)
                    }
                    onBlur={(e) =>
                      handleFieldCommit(med.id, 'name', e.target.value, false)
                    }
                  />
                  <button
                    className="btn btn-ghost btn-sm btn-circle text-error shrink-0"
                    onClick={() => handleDelete(med.id)}
                    aria-label={`Delete ${med.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <IconEditor
                  iconType={med.iconType}
                  icon={med.icon}
                  emoji={med.emoji}
                  name={med.name}
                  onChange={(patch) => handleIconChange(med.id, patch)}
                />

                <DoseEditor
                  doses={med.doses}
                  unit={med.unit}
                  pendingAmount={newDoseInputs[med.id] || ''}
                  onPendingAmountChange={(v) =>
                    setNewDoseInputs((inputs) => ({ ...inputs, [med.id]: v }))
                  }
                  onAdd={() => handleAddDose(med.id)}
                  onRemove={(doseId) => handleRemoveDose(med.id, doseId)}
                />

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <label className="flex flex-col gap-1">
                    Unit
                    <input
                      className="input input-sm input-bordered"
                      value={med.unit}
                      onChange={(e) =>
                        handleFieldChange(med.id, 'unit', e.target.value)
                      }
                      onBlur={(e) =>
                        handleFieldCommit(med.id, 'unit', e.target.value, false)
                      }
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    Daily limit
                    <input
                      type="number"
                      className="input input-sm input-bordered"
                      value={med.dailyLimit}
                      onChange={(e) =>
                        handleFieldChange(med.id, 'dailyLimit', e.target.value)
                      }
                      onBlur={(e) =>
                        handleFieldCommit(med.id, 'dailyLimit', e.target.value, true)
                      }
                    />
                  </label>
                  <label className="flex flex-col gap-1 col-span-2">
                    Min hours between doses
                    <input
                      type="number"
                      className="input input-sm input-bordered"
                      value={med.minHoursBetweenDoses}
                      onChange={(e) =>
                        handleFieldChange(
                          med.id,
                          'minHoursBetweenDoses',
                          e.target.value
                        )
                      }
                      onBlur={(e) =>
                        handleFieldCommit(
                          med.id,
                          'minHoursBetweenDoses',
                          e.target.value,
                          true
                        )
                      }
                    />
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {mode === 'add' && (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            className="btn btn-ghost btn-sm self-start gap-1"
            onClick={() => setMode(null)}
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <form onSubmit={handleAdd} className="card bg-base-200 shadow-sm">
            <div className="card-body p-4 gap-2">
              <h2 className="font-semibold">Add medication</h2>
              <input
                className="input input-sm input-bordered"
                placeholder="Name"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
              />

              {matchingPresets.length > 0 && (
                <div className="flex flex-col gap-1">
                  {matchingPresets.map((preset) => (
                    <button
                      key={preset.key}
                      type="button"
                      className="btn btn-sm btn-outline justify-start gap-2 h-auto py-1.5"
                      onClick={() => setPendingPreset(preset)}
                    >
                      <img
                        src={getMedPhoto(preset.icon).file}
                        alt=""
                        className="w-5 h-5 rounded object-cover shrink-0"
                      />
                      <span className="text-left whitespace-normal">
                        Use template for {preset.name}
                        <span className="block opacity-60 font-normal text-xs">
                          {preset.doseAmounts.join('/')}
                          {preset.unit} doses, {preset.dailyLimit}
                          {preset.unit}/day limit
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <IconEditor
                iconType={form.iconType}
                icon={form.icon}
                emoji={form.emoji}
                name={form.name}
                onChange={(patch) => setForm({ ...form, ...patch })}
              />

              <DoseEditor
                doses={form.doses}
                unit={form.unit}
                pendingAmount={newFormDoseInput}
                onPendingAmountChange={setNewFormDoseInput}
                onAdd={handleAddFormDose}
                onRemove={handleRemoveFormDose}
              />

              <div className="grid grid-cols-2 gap-2 text-sm">
                <label className="flex flex-col gap-1">
                  Unit
                  <input
                    className="input input-sm input-bordered"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  Daily limit
                  <input
                    type="number"
                    className="input input-sm input-bordered"
                    value={form.dailyLimit}
                    onChange={(e) =>
                      setForm({ ...form, dailyLimit: e.target.value })
                    }
                  />
                </label>
                <label className="flex flex-col gap-1 col-span-2">
                  Min hours between doses
                  <input
                    type="number"
                    className="input input-sm input-bordered"
                    value={form.minHoursBetweenDoses}
                    onChange={(e) =>
                      setForm({ ...form, minHoursBetweenDoses: e.target.value })
                    }
                  />
                </label>
              </div>
              <button type="submit" className="btn btn-primary btn-sm mt-1">
                Add
              </button>
            </div>
          </form>
        </div>
      )}

      <a href="/credits" className="link text-xs opacity-60 self-center">
        Medication photo credits
      </a>

      {pendingPreset && (
        <div
          className="modal modal-open"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPendingPreset(null);
          }}
        >
          <div className="modal-box">
            <h3 className="font-bold text-lg">Not medical advice</h3>
            <p className="py-2 text-sm opacity-70">
              The "{pendingPreset.name}" template is a generic OTC label
              default, not personalized medical advice. Verify the dose
              amounts and limits with a pharmacist, doctor, or the product
              packaging before relying on them.
            </p>
            <div className="modal-action">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setPendingPreset(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleConfirmPreset}
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
