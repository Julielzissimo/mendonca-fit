import type { Athlete, Profile, Run, WeightEntry } from "@/lib/types";

const dateFromToday = (daysAgo: number) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().slice(0, 10);
};

const makeSplits = (paces: number[]) =>
  paces.map((split_seconds, index) => ({
    id: `split-${index}-${split_seconds}`,
    kilometer: index + 1,
    split_seconds,
  }));

export const demoRuns: Run[] = [
  { id: "run-1", athlete_id: "athlete-juliel", run_date: dateFromToday(20), distance_km: 5, duration_seconds: 1778, perceived_effort: 6, notes: "Rodagem leve", run_splits: makeSplits([368, 361, 354, 349, 346]) },
  { id: "run-2", athlete_id: "athlete-juliel", run_date: dateFromToday(14), distance_km: 8, duration_seconds: 2726, perceived_effort: 7, notes: "Progressivo", run_splits: makeSplits([356, 349, 346, 341, 338, 335, 332, 329]) },
  { id: "run-3", athlete_id: "athlete-juliel", run_date: dateFromToday(8), distance_km: 6, duration_seconds: 2022, perceived_effort: 6, notes: "Ritmo confortável", run_splits: makeSplits([345, 341, 337, 335, 333, 331]) },
  { id: "run-4", athlete_id: "athlete-juliel", run_date: dateFromToday(3), distance_km: 10, duration_seconds: 3280, perceived_effort: 8, notes: "Longão da semana", run_splits: makeSplits([340, 335, 331, 329, 326, 325, 324, 323, 324, 323]) },
  { id: "run-5", athlete_id: "athlete-marina", run_date: dateFromToday(12), distance_km: 4, duration_seconds: 1518, perceived_effort: 5, notes: "Corrida leve", run_splits: makeSplits([388, 382, 377, 371]) },
  { id: "run-6", athlete_id: "athlete-marina", run_date: dateFromToday(5), distance_km: 5, duration_seconds: 1840, perceived_effort: 6, notes: "Ritmo contínuo", run_splits: makeSplits([378, 372, 367, 364, 359]) },
];

export const demoWeights: WeightEntry[] = [
  { id: "weight-1", athlete_id: "athlete-juliel", entry_date: dateFromToday(28), weight_kg: 82 },
  { id: "weight-2", athlete_id: "athlete-juliel", entry_date: dateFromToday(21), weight_kg: 81.2 },
  { id: "weight-3", athlete_id: "athlete-juliel", entry_date: dateFromToday(14), weight_kg: 80.4 },
  { id: "weight-4", athlete_id: "athlete-juliel", entry_date: dateFromToday(7), weight_kg: 79.3 },
  { id: "weight-5", athlete_id: "athlete-juliel", entry_date: dateFromToday(0), weight_kg: 78.6 },
  { id: "weight-6", athlete_id: "athlete-marina", entry_date: dateFromToday(21), weight_kg: 68.4 },
  { id: "weight-7", athlete_id: "athlete-marina", entry_date: dateFromToday(7), weight_kg: 67.6 },
];

export const demoProfile: Profile = {
  display_name: "Juliel",
};

export const demoAthletes: Athlete[] = [
  { id: "athlete-juliel", name: "Juliel", birth_date: "1990-05-12", start_weight_kg: 82, target_weight_kg: 72 },
  { id: "athlete-marina", name: "Marina", birth_date: "1993-08-24", start_weight_kg: 68.4, target_weight_kg: 62 },
];
