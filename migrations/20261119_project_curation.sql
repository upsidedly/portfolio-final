BEGIN;

CREATE TEMP TABLE project_curation ON COMMIT DROP AS
SELECT *
FROM (
  VALUES
    ('ftc-simulator', true, 10, 'FTC Simulator runs Java or Kotlin robot code in the browser with a 3D field, live telemetry and gamepads.'),
    ('studyvault', true, 20, 'StudyVault centralizes study tools for Caribbean students and reached 500+ daily users during exam season.'),
    ('bleach', true, 30, 'Bleach cleans macOS storage from a Mac app or CLI, with exclusions and a recovery vault to undo removals.'),
    ('quickanomics', true, 40, NULL),
    ('crocodocs', true, 50, NULL),
    ('fond', false, NULL, NULL),
    ('pikminions', false, NULL, NULL)
) AS changes(slug, featured, sort_order, summary);

DO $$
BEGIN
  PERFORM 1
  FROM payload.projects AS project
  JOIN project_curation AS change USING (slug)
  ORDER BY project.id
  FOR UPDATE OF project;

  IF EXISTS (
    SELECT 1
    FROM project_curation AS change
    LEFT JOIN payload.projects AS project USING (slug)
    WHERE project.id IS NULL
      OR project.hidden IS TRUE
      OR (change.featured AND project.image_id IS NULL)
  ) THEN
    RAISE EXCEPTION 'Project curation requires visible entries and images for the featured projects.';
  END IF;
END $$;

UPDATE payload.projects AS project
SET featured = change.featured,
    "order" = COALESCE(change.sort_order, project."order"),
    summary = COALESCE(change.summary, project.summary),
    updated_at = now()
FROM project_curation AS change
WHERE project.slug = change.slug
  AND (
    project.featured IS DISTINCT FROM change.featured
    OR (change.sort_order IS NOT NULL AND project."order" IS DISTINCT FROM change.sort_order)
    OR (change.summary IS NOT NULL AND project.summary IS DISTINCT FROM change.summary)
  );

COMMIT;
