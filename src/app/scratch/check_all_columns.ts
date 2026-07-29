import { createClient } from '@supabase/supabase-js';

const url = 'https://vmiiykbmvzvwcrcmphsn.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtaWl5a2Jtdnp2d2NyY21waHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2Njg4MzksImV4cCI6MjA5MjI0NDgzOX0.YH4r8JJ_TorDszG1NQmIHCHDh4lcoLP6nh0x-E9U9Zc';

const supabase = createClient(url, key);

const columns = [
  'id', 'tier', 'amount', 'price', 'currency', 'status', 
  'paystack_reference', 'created_by', 'created_at', 'organization_id'
];

async function checkColumns() {
  for (const col of columns) {
    const { error } = await supabase.from('subscriptions').select(col).limit(1);
    if (error) {
      console.log(`❌ Column '${col}':`, error.message);
    } else {
      console.log(`✅ Column '${col}': Exists`);
    }
  }
}

checkColumns();
