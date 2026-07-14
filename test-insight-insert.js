import { addDoc, collection, db } from './src/lib/db.js';

async function run() {
  try {
    const docRef = await addDoc(collection(db, 'insights'), {
        title: "Test",
        category: "Test",
        content: "Test",
        author: "Test",
        createdAt: new Date().toISOString()
    });
    console.log(docRef);
  } catch (err) {
    console.error(err);
  }
}
run();
