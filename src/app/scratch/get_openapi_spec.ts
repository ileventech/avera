const url = 'https://vmiiykbmvzvwcrcmphsn.supabase.co/rest/v1/?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtaWl5a2Jtdnp2d2NyY21waHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2Njg4MzksImV4cCI6MjA5MjI0NDgzOX0.YH4r8JJ_TorDszG1NQmIHCHDh4lcoLP6nh0x-E9U9Zc';

async function test() {
  try {
    const res = await fetch(url);
    const text = await res.text();
    console.log('Response head:', text.slice(0, 500));
  } catch (err: any) {
    console.error('Error fetching:', err.message);
  }
}

test();
