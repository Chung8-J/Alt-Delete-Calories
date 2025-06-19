// supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://shidmbowdyumxioxpabh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoaWRtYm93ZHl1bXhpb3hwYWJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNzUxMjgsImV4cCI6MjA2NTg1MTEyOH0.9DijMW4yafpqd9ckkQVnLY2PH2I_CceqzXI9ljcC8UQ';

export const supabase = createClient(supabaseUrl, supabaseKey);