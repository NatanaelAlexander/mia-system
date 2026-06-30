-- Data: cargos laborales de ejemplo

INSERT INTO job_titles (name) VALUES
  ('Project Manager'),
  ('Backend Developer'),
  ('Frontend Developer'),
  ('QA Engineer'),
  ('DevOps Engineer'),
  ('UI Designer')
ON CONFLICT (name) DO NOTHING;
