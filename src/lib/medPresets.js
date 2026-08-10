// Generic adult OTC package-label dosing for common self-care medications —
// a starting point to prefill the add-medication form, not personalized
// medical advice. Everything stays editable after applying a template.
// Deliberately limited to OTC items; prescription dosing is patient-specific
// and set by a doctor, so those are matched by image search only, not preset.
export const MED_PRESETS = [
  { key: 'ibuprofen', name: 'Ibuprofen', icon: 'ibuprofen', unit: 'mg', dailyLimit: 1200, minHoursBetweenDoses: 4, doseAmounts: [200, 400], aliases: ['advil', 'motrin'] },
  { key: 'acetaminophen', name: 'Acetaminophen (Tylenol)', icon: 'acetaminophen', unit: 'mg', dailyLimit: 3000, minHoursBetweenDoses: 4, doseAmounts: [325, 500, 650], aliases: ['tylenol', 'paracetamol'] },
  { key: 'aspirin', name: 'Aspirin', icon: 'aspirin', unit: 'mg', dailyLimit: 4000, minHoursBetweenDoses: 4, doseAmounts: [325, 500], aliases: ['bayer'] },
  { key: 'naproxen', name: 'Naproxen', icon: 'naproxen', unit: 'mg', dailyLimit: 660, minHoursBetweenDoses: 8, doseAmounts: [220], aliases: ['aleve'] },
  { key: 'diphenhydramine', name: 'Diphenhydramine', icon: 'diphenhydramine', unit: 'mg', dailyLimit: 300, minHoursBetweenDoses: 6, doseAmounts: [25, 50], aliases: ['benadryl'] },
  { key: 'loratadine', name: 'Loratadine', icon: 'loratadine', unit: 'mg', dailyLimit: 10, minHoursBetweenDoses: 24, doseAmounts: [10], aliases: ['claritin'] },
  { key: 'cetirizine', name: 'Cetirizine', icon: 'cetirizine', unit: 'mg', dailyLimit: 10, minHoursBetweenDoses: 24, doseAmounts: [10], aliases: ['zyrtec'] },
  { key: 'famotidine', name: 'Famotidine', icon: 'famotidine', unit: 'mg', dailyLimit: 40, minHoursBetweenDoses: 12, doseAmounts: [10, 20], aliases: ['pepcid'] },
  { key: 'melatonin', name: 'Melatonin', icon: 'melatonin', unit: 'mg', dailyLimit: 10, minHoursBetweenDoses: 24, doseAmounts: [3, 5, 10], aliases: [] },
  { key: 'guaifenesin', name: 'Guaifenesin', icon: 'guaifenesin', unit: 'mg', dailyLimit: 2400, minHoursBetweenDoses: 12, doseAmounts: [400, 600], aliases: ['mucinex'] },
  { key: 'loperamide', name: 'Loperamide', icon: 'loperamide', unit: 'mg', dailyLimit: 8, minHoursBetweenDoses: 24, doseAmounts: [2], aliases: ['imodium'] },
  { key: 'pseudoephedrine', name: 'Pseudoephedrine', icon: 'pseudoephedrine', unit: 'mg', dailyLimit: 240, minHoursBetweenDoses: 4, doseAmounts: [30, 60], aliases: ['sudafed'] },
  { key: 'calcium-carbonate', name: 'Calcium Carbonate (Tums)', icon: 'calcium-carbonate', unit: 'mg', dailyLimit: 7500, minHoursBetweenDoses: 2, doseAmounts: [750, 1000], aliases: ['tums'] },
  { key: 'simethicone', name: 'Simethicone', icon: 'simethicone', unit: 'mg', dailyLimit: 500, minHoursBetweenDoses: 1, doseAmounts: [125, 166], aliases: ['gas-x', 'gasx'] },
  { key: 'fish-oil', name: 'Fish Oil (Omega-3)', icon: 'fish-oil', unit: 'mg', dailyLimit: 3000, minHoursBetweenDoses: 24, doseAmounts: [1000], aliases: ['omega-3', 'omega3'] },
  { key: 'vitamin-d3', name: 'Vitamin D3', icon: 'vitamin-d3', unit: 'IU', dailyLimit: 4000, minHoursBetweenDoses: 24, doseAmounts: [1000, 2000], aliases: ['vitamin d'] },
  { key: 'multivitamin', name: 'Multivitamin', icon: 'multivitamin', unit: 'tablet', dailyLimit: 1, minHoursBetweenDoses: 24, doseAmounts: [1], aliases: [] },
  { key: 'magnesium', name: 'Magnesium', icon: 'magnesium', unit: 'mg', dailyLimit: 350, minHoursBetweenDoses: 24, doseAmounts: [200, 350], aliases: [] },
  { key: 'ferrous-sulfate', name: 'Iron Supplement (Ferrous Sulfate)', icon: 'ferrous-sulfate', unit: 'mg', dailyLimit: 325, minHoursBetweenDoses: 24, doseAmounts: [325], aliases: ['iron'] },
  { key: 'hydrocortisone-cream', name: 'Hydrocortisone Cream', icon: 'hydrocortisone-cream', unit: 'application', dailyLimit: 4, minHoursBetweenDoses: 4, doseAmounts: [1], aliases: ['cortizone'] },
];

export function findMatchingPresets(query) {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  return MED_PRESETS.filter((p) =>
    [p.name, p.key, ...p.aliases].some((h) => h.toLowerCase().includes(q))
  );
}
