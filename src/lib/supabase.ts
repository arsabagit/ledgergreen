import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ybucoiognirrwseedctk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlidWNvaW9nbmlycndzZWVkY3RrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NzQ5MjEsImV4cCI6MjA4NjA1MDkyMX0.qlTvkLFbC94P8qpJOInKefs7TMXw519RAYuKi4n0DDc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
