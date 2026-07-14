import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

function mapDataToDb(data) {
  const mapped = { ...data };
  if (mapped.createdAt) { mapped.created_at = mapped.createdAt; delete mapped.createdAt; }
  if (mapped.videoUrl !== undefined) { mapped.video_url = mapped.videoUrl; delete mapped.videoUrl; }
  if (mapped.sourceUrl !== undefined) { mapped.source_url = mapped.sourceUrl; delete mapped.sourceUrl; }
  return mapped;
}

async function run() {
  const payload = mapDataToDb({
    title: "Test Title",
    category: "Actualidad",
    content: "Test Content",
    author: "Test Author",
    image: "",
    videoUrl: "",
    createdAt: new Date().toISOString()
  });
  console.log('Inserting:', payload);
  const { data, error } = await supabase.from('insights').insert(payload).select().single();
  if (error) {
    console.error('Error inserting:', error);
  } else {
    console.log('Inserted:', data);
  }
}
run();
