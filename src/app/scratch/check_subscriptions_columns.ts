import { createClient } from '@supabase/supabase-js';

const url = 'https://vmiiykbmvzvwcrcmphsn.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtaWl5a2Jtdnp2d2NyY21waHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2Njg4MzksImV4cCI6MjA5MjI0NDgzOX0.YH4r8JJ_TorDszG1NQmIHCHDh4lcoLP6nh0x-E9U9Zc';

const supabase = createClient(url, key);

async function test() {
  const { data, error } = await supabase.from('subscriptions').select('amount').limit(1);
  if (error) {
    console.error('Error selecting amount:', error.message, error.details, error.code);
  } else {
    console.log('Successfully selected amount column! Data:', data);
  }
}

test();
