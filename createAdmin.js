import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse .env file manually
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.error("Error: .env file not found. Please make sure VITE_FIREBASE_ keys are set.");
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const value = parts.slice(1).join('=').trim();
    env[key] = value;
  }
});

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

// Admin details
const adminEmail = 'gourmet.admin@restaurant.com';
const adminPassword = 'AdminSecurePass101!';
const adminName = 'System Administrator';

async function run() {
  console.log("Connecting to Firebase project:", firebaseConfig.projectId);
  
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  
  try {
    console.log(`Creating Authentication account for: ${adminEmail}...`);
    const cred = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
    const uid = cred.user.uid;
    
    console.log(`Auth account created. Provisioning Admin profile in Firestore for UID: ${uid}...`);
    await setDoc(doc(db, 'users', uid), {
      uid,
      email: adminEmail,
      name: adminName,
      role: 'admin',
      createdAt: new Date().toISOString()
    });
    
    console.log("---------------------------------------------------------");
    console.log("✅ SUCCESS: Permanent Admin Credentials provisioned!");
    console.log("---------------------------------------------------------");
    console.log(`📧 Email:    ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
    console.log("---------------------------------------------------------");
    console.log("You can now log in using these credentials.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error provisioning admin credentials:", error.message);
    process.exit(1);
  }
}

run();
