-- Normaliza cargos a etiquetas en español y fusiona duplicados inglés/español

DO $$
DECLARE
  pairs text[][] := ARRAY[
    ARRAY['Backend Developer', 'Programador backend'],
    ARRAY['Frontend Developer', 'Programador frontend'],
    ARRAY['UI Designer', 'Diseñador UI'],
    ARRAY['QA Engineer', 'Ingeniero QA'],
    ARRAY['DevOps Engineer', 'Ingeniero DevOps'],
    ARRAY['Project Manager', 'Jefe de proyecto']
  ];
  pair text[];
  en_id uuid;
  es_id uuid;
BEGIN
  FOREACH pair SLICE 1 IN ARRAY pairs
  LOOP
    SELECT id INTO en_id FROM job_titles WHERE name = pair[1];
    SELECT id INTO es_id FROM job_titles WHERE name = pair[2];

    IF en_id IS NOT NULL AND es_id IS NOT NULL AND en_id <> es_id THEN
      INSERT INTO users_job_titles (user_id, job_title_id)
      SELECT ujt.user_id, es_id
      FROM users_job_titles ujt
      WHERE ujt.job_title_id = en_id
      ON CONFLICT DO NOTHING;

      DELETE FROM users_job_titles WHERE job_title_id = en_id;
      DELETE FROM job_titles WHERE id = en_id;
    ELSIF en_id IS NOT NULL AND es_id IS NULL THEN
      UPDATE job_titles SET name = pair[2] WHERE id = en_id;
    END IF;
  END LOOP;
END $$;

INSERT INTO job_titles (name) VALUES
  ('Jefe de proyecto'),
  ('Programador backend'),
  ('Programador frontend'),
  ('Ingeniero QA'),
  ('Ingeniero DevOps'),
  ('Diseñador UI')
ON CONFLICT (name) DO NOTHING;
