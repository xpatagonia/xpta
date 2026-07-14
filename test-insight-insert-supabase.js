import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const payload = {
    title: "Test Title",
    category: "Actualidad",
    content: "Test Content",
    author: "Test Author",
    image: "",
    videoUrl: "",
    created_at: new Date().toISOString()
  };
  console.log('Inserting:', payload);
  const { data, error } = await supabase.from('insights').insert(payload).select().single();
  if (error) {
    console.error('Error inserting:', error);
  } else {
    console.log('Inserted:', data);
  }
}
run();
