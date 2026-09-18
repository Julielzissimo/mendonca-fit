# Estrutura do Appwrite

Database: `Mendonça Fit Data` (`6aabf1350013c770ea82`), tipo TablesDB.

Todas as tabelas têm permissões `create`, `read`, `update` e `delete` para `users`. O sistema usa o identificador nativo `$id` do Appwrite.

## athletes

- `name`: varchar(80), obrigatório
- `birth_date`: datetime
- `start_weight_kg`: double
- `target_weight_kg`: double
- `created_by`: varchar(36), obrigatório
- índice `athletes_name_idx` em `name`

## runs

- `athlete_id`: varchar(36), obrigatório
- `run_date`: datetime, obrigatório
- `distance_km`: double, obrigatório
- `duration_seconds`: integer, obrigatório
- `avg_heart_rate`: integer, obrigatório no esquema legado; o frontend grava `0` apenas por compatibilidade e não expõe o campo
- `perceived_effort`: integer, 1–10
- `notes`: varchar(500)
- `created_by`: varchar(36), obrigatório
- índice `runs_athlete_date_idx` em `athlete_id`, `run_date`

## run_splits

- `run_id`: varchar(36), obrigatório
- `athlete_id`: varchar(36), obrigatório
- `kilometer`: double, obrigatório; representa a distância acumulada ao fim da parcial (por exemplo: `1`, `2`, ..., `6`, `6.6`)
- `split_seconds`: integer, obrigatório
- `heart_rate`: integer, obrigatório no esquema legado; o frontend grava `0` apenas por compatibilidade e não expõe o campo
- `created_by`: varchar(36), obrigatório
- índices `splits_run_km_idx` e `splits_athlete_idx`

## weight_entries

- `athlete_id`: varchar(36), obrigatório
- `entry_date`: datetime, obrigatório
- `weight_kg`: double, obrigatório
- `created_by`: varchar(36), obrigatório
- índice único `weights_athlete_date_uq` em `athlete_id`, `entry_date`
