import { db, doc, setDoc, getDocFromServer, deleteDoc } from '../firebase.ts';

async function run() {
  try {
    console.log('Testing Firestore...');
    const ref = doc(db, '_healthcheck', 'ping');
    await setDoc(ref, { ok: true, time: new Date().toISOString() });
    console.log('Successfully wrote to Firestore!');
    const snap = await getDocFromServer(ref);
    console.log('Read data:', snap.data());
    await deleteDoc(ref);
    console.log('Deleted ping test doc successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Firestore Error:', err);
    process.exit(1);
  }
}

run();
