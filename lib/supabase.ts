import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://esfahugjquilpwcvbvab.supabase.co/rest/v1/",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzZmFodWdqcXVpbHB3Y3ZidmFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MjU0NTcsImV4cCI6MjA5MjMwMTQ1N30.fvWpVRP44nOKwCzwftPbjOMGqgd0udXCzLns1awFVFE"
);