export type RunSplit = {
  id?: string;
  run_id?: string;
  kilometer: number;
  split_seconds: number;
  heart_rate: number;
};

export type Run = {
  id: string;
  athlete_id: string;
  run_date: string;
  distance_km: number;
  duration_seconds: number;
  avg_heart_rate: number;
  perceived_effort: number | null;
  notes: string | null;
  run_splits: RunSplit[];
};

export type WeightEntry = {
  id: string;
  athlete_id: string;
  entry_date: string;
  weight_kg: number;
};

export type Profile = {
  display_name: string | null;
};

export type Athlete = {
  id: string;
  name: string;
  birth_date: string | null;
  start_weight_kg: number | null;
  target_weight_kg: number | null;
};

export type AthleteDraft = Omit<Athlete, "id">;

export type RunDraft = {
  run_date: string;
  perceived_effort: number;
  notes: string;
  splits: Array<{ kilometer: number; split_seconds: number; heart_rate: number }>;
};

export type WeightDraft = { entry_date: string; weight_kg: number };
