
-- Enable pg_cron and pg_net extensions for scheduled function calls
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule weekly meal plan regeneration every Monday at 6:00 AM UTC
SELECT cron.schedule(
  'weekly-meal-plan-regeneration',
  '0 6 * * 1',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/cron-weekly-regeneration',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', current_setting('app.settings.cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
