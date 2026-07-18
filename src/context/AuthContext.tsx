import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile } from '../types';
import { isMockMode, auth as fAuth, db as fDb } from '../services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { getUserProfile, createUserProfile } from '../services/db';
import { initializeMockDatabase, getStorageItem, setStorageItem, publishTopic, subscribeToTopic } from '../services/mockFirebase';

interface AuthContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserProfile>;
  register: (email: string, password: string, name: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
  provisionDeliveryPartner: (email: string, password: string, name: string) => Promise<UserProfile>;
  loginWithGoogle: () => Promise<UserProfile>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize mock DB if in mock mode
  useEffect(() => {
    if (isMockMode) {
      initializeMockDatabase();
      const savedUser = sessionStorage.getItem('ecom_current_user');
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
      setLoading(false);
    } else if (fAuth) {
      const unsubscribe = onAuthStateChanged(fAuth, async (user) => {
        if (user) {
          const profile = await getUserProfile(user.uid);
          if (profile) {
            setCurrentUser(profile);
          } else {
            // Fallback: create customer profile if it doesn't exist yet
            const fallbackProfile = await createUserProfile(user.uid, {
              email: user.email || '',
              name: user.displayName || 'Customer',
              role: 'customer',
              addresses: []
            });
            setCurrentUser(fallbackProfile);
          }
        } else {
          setCurrentUser(null);
        }
        setLoading(false);
      });
      return unsubscribe;
    }
  }, []);

  // Real-time listener for current user document updates (e.g. new addresses, role shifts)
  useEffect(() => {
    if (!currentUser?.uid) return;

    if (isMockMode) {
      const unsubscribeMock = subscribeToTopic(`user_${currentUser.uid}`, (updatedUser) => {
        if (updatedUser) {
          setCurrentUser(updatedUser);
          sessionStorage.setItem('ecom_current_user', JSON.stringify(updatedUser));
        }
      });
      return () => unsubscribeMock();
    } else {
      const docRef = doc(fDb, 'users', currentUser.uid);
      const unsubscribeSnapshot = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          setCurrentUser(docSnap.data() as UserProfile);
        }
      });
      return () => unsubscribeSnapshot();
    }
  }, [currentUser?.uid]);

  const login = async (email: string, password: string): Promise<UserProfile> => {
    if (isMockMode) {
      const users = getStorageItem<UserProfile[]>('ecom_users', []);
      // Direct mock credential verification
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        throw new Error('User not found in mock database.');
      }
      // Check passwords (mock convention: password equals username/email prefix, or defaults like user123/admin123/rider123)
      const expectedPassword = email.includes('admin') ? 'admin123' : (email.includes('rider') ? 'rider123' : 'user123');
      if (password !== expectedPassword && password !== 'password') {
        throw new Error('Invalid credentials (mock passwords: admin123, user123, rider123).');
      }
      
      sessionStorage.setItem('ecom_current_user', JSON.stringify(user));
      setCurrentUser(user);
      return user;
    }

    const cred = await signInWithEmailAndPassword(fAuth, email, password);
    const profile = await getUserProfile(cred.user.uid);
    if (!profile) {
      throw new Error('User profile does not exist in Firestore.');
    }
    return profile;
  };

  const register = async (email: string, password: string, name: string): Promise<UserProfile> => {
    if (isMockMode) {
      const users = getStorageItem<UserProfile[]>('ecom_users', []);
      if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error('User already exists in mock database.');
      }
      
      const newProfile: UserProfile = {
        uid: 'u_' + Date.now(),
        email,
        name,
        role: 'customer',
        addresses: [],
        createdAt: new Date().toISOString()
      };
      
      users.push(newProfile);
      setStorageItem('ecom_users', users);
      sessionStorage.setItem('ecom_current_user', JSON.stringify(newProfile));
      setCurrentUser(newProfile);
      return newProfile;
    }

    const cred = await createUserWithEmailAndPassword(fAuth, email, password);
    const profile = await createUserProfile(cred.user.uid, {
      email,
      name,
      role: 'customer',
      addresses: []
    });
    return profile;
  };

  const loginWithGoogle = async (): Promise<UserProfile> => {
    if (isMockMode) {
      // Mock Google Sign-In
      const newProfile: UserProfile = {
        uid: 'u_google_' + Date.now(),
        email: 'googleuser@gmail.com',
        name: 'Google Customer',
        role: 'customer',
        addresses: ['789 Google Blvd, Mountain View'],
        createdAt: new Date().toISOString()
      };
      const users = getStorageItem<UserProfile[]>('ecom_users', []);
      if (!users.some(u => u.email === newProfile.email)) {
        users.push(newProfile);
        setStorageItem('ecom_users', users);
      }
      sessionStorage.setItem('ecom_current_user', JSON.stringify(newProfile));
      setCurrentUser(newProfile);
      return newProfile;
    }

    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(fAuth, provider);
    const profile = await getUserProfile(cred.user.uid);
    if (profile) return profile;

    // Create profile
    return await createUserProfile(cred.user.uid, {
      email: cred.user.email || '',
      name: cred.user.displayName || 'Google User',
      role: 'customer',
      addresses: []
    });
  };

  const logout = async (): Promise<void> => {
    if (isMockMode) {
      sessionStorage.removeItem('ecom_current_user');
      setCurrentUser(null);
      return;
    }
    await signOut(fAuth);
  };

  const provisionDeliveryPartner = async (email: string, password: string, name: string): Promise<UserProfile> => {
    const riderUid = 'u_rider_' + Date.now();
    const newRider: UserProfile = {
      uid: riderUid,
      email,
      name,
      role: 'delivery_partner',
      partnerStatus: 'idle',
      cashCollected: 0,
      currentCoordinates: {
        latitude: 14.6626, // Default coordinate center (Nallaballe, AP)
        longitude: 78.3915,
        timestamp: Date.now()
      },
      createdAt: new Date().toISOString()
    };

    if (isMockMode) {
      const users = getStorageItem<UserProfile[]>('ecom_users', []);
      if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error('Account email already registered.');
      }
      users.push(newRider);
      setStorageItem('ecom_users', users);
      publishTopic('delivery_partners_changed', users.filter(u => u.role === 'delivery_partner'));
      return newRider;
    }

    // In real Firebase: Admin creates a rider user using secondary App configuration without logging out current Admin.
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };
    
    // Lazy imports inside function to avoid secondary App reference problems elsewhere
    const { initializeApp, deleteApp } = await import('firebase/app');
    const { getAuth: getSecondaryAuth, createUserWithEmailAndPassword: createSecondaryUser } = await import('firebase/auth');
    
    const secondaryApp = initializeApp(firebaseConfig, 'SecondaryAppProvisioner');
    const secondaryAuth = getSecondaryAuth(secondaryApp);
    
    try {
      const cred = await createSecondaryUser(secondaryAuth, email, password);
      const profile = await createUserProfile(cred.user.uid, {
        email,
        name,
        role: 'delivery_partner',
        partnerStatus: 'idle',
        cashCollected: 0,
        currentCoordinates: {
          latitude: 14.6626, // Default coordinate center (Nallaballe, AP)
          longitude: 78.3915,
          timestamp: Date.now()
        }
      });
      await deleteApp(secondaryApp);
      return profile;
    } catch (e: any) {
      await deleteApp(secondaryApp);
      throw e;
    }
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      loading,
      login,
      register,
      logout,
      provisionDeliveryPartner,
      loginWithGoogle
    }}>
      {children}
    </AuthContext.Provider>
  );
};
