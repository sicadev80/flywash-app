import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dypwdplqvgvvucgfiqbs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5cHdkcGxxdmd2dnVjZ2ZpcWJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMTcxNDEsImV4cCI6MjA4ODc5MzE0MX0.-QH98kyM-D1CaYJRqPXtu7prG_01zc3mGqzTu9qq9ZQ';

export const supabase = createClient(supabaseUrl, supabaseKey);

