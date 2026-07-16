-- Feature: project_description

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS description TEXT;
