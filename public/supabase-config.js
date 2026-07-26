// supabase-config.js
const SUPABASE_URL = 'https://jymjdemtadolahcdvnxq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5bWpkZW10YWRvbGFoY2R2bnhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwODk1MjQsImV4cCI6MjEwMDY2NTUyNH0.AdXrhafJz5C4e0yapTPZfUoJqiQNcZ_4fbsVehhqQjo';

// Lo guardamos en 'window' para que sea global y 100% visible para todo el juego
window.clienteSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Agregamos este mensaje para ver en la consola si funcionó
console.log("✅ Cliente Supabase cargado:", window.clienteSupabase);