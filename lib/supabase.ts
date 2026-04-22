import { createClient } from '@supabase/supabase-js';

// URL corretto: rimosso "/rest/v1/" che causava l'errore "Invalid path"
const supabaseUrl = "https://esfahugjquilpwcvbvab.supabase.co";

// La tua chiave anonima pubblica
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzZmFodWdqcXVpbHB3Y3ZidmFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MjU0NTcsImV4cCI6MjA5MjMwMTQ1N30.fvWpVRP44nOKwCzwftPbjOMGqgd0udXCzLns1awFVFE";

// Inizializzazione del client Supabase
// Questo oggetto verrà usato dal tuo sito per inviare foto e messaggi
export const supabase = createClient(supabaseUrl, supabaseAnonKey);