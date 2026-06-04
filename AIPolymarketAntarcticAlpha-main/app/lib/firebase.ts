import { initializeApp, getApps } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  onSnapshot,
  writeBatch,
  deleteDoc,
  doc,
  setDoc,
  getDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDXPaMdMeCN7YA1FB_VHGocVrZZL5czX7E',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'polymarket-ai-99bf6.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'polymarket-ai-99bf6',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'polymarket-ai-99bf6.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '1039609396263',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:1039609396263:web:63add757eba79f30f5e202',
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db: Firestore = getFirestore(app);
export const auth: Auth = getAuth(app);

const ADMIN_EMAILS = [
  'admin-Artyom-dex@antarctic-alpha.ru',
  'admin-xenia-lilit-03-5-!@antarctic-alpha.ru',
];

export function checkIsAdmin(email: string | null | undefined): boolean {
  return ADMIN_EMAILS.includes(email || '');
}

export interface AnalysisData {
  userId: string;
  symbol: string;
  timeframe: string;
  marketId: string;
  signal: {
    verdict: string;
    emoji: string;
    positiveCount: number;
    details: Record<string, string>;
  };
  pm: { up: number; down: number; spread: number; endDate: string };
  price: number;
  ind: {
    rsi: number;
    macdHist: number;
    prevMacdHist: number;
    ema9: number;
    ema21: number;
    vwap: number;
    atr: number;
    hl10High: number;
    hl10Low: number;
    price: number;
    bbUpper: number;
    bbLower: number;
    bbPercentB: number;
    adx: number;
    plusDI: number;
    minusDI: number;
    obvSlope: number;
  };
  atrPct: number;
  atrValue: string;
  session: {
    name: string;
    emoji: string;
    sessionTime: string;
    totalMinutes: number;
    currentMin: string;
  };
  volEmoji: string;
  volComment: string;
  polymarketUrl: string;
  createdAt: Timestamp;
}

export type AnalysisDoc = AnalysisData & { id: string };

export async function saveAnalysis(
  userId: string,
  data: Omit<AnalysisData, 'createdAt' | 'userId'>
): Promise<string | null> {
  try {
    const docRef = await addDoc(collection(db, 'history'), {
      ...data,
      userId,
      createdAt: Timestamp.now(),
    });
    console.log('[fb] saveAnalysis success:', docRef.id);
    return docRef.id;
  } catch (e) {
    console.warn('[fb] saveAnalysis failed:', e);
    return null;
  }
}

export async function getHistory(
  userId: string,
  limitCount: number = 20
): Promise<AnalysisDoc[]> {
  try {
    const q = query(
      collection(db, 'history'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as AnalysisDoc));
  } catch (e) {
    console.warn('Firebase getHistory failed:', e);
    return [];
  }
}

export async function deleteAnalysis(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'history', id));
  } catch (e) {
    console.warn('Firebase deleteAnalysis failed:', e);
  }
}

export async function cleanupHistory(userId: string, maxDocs: number = 30): Promise<void> {
  try {
    const q = query(collection(db, 'history'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    if (snapshot.docs.length <= maxDocs) return;
    const toDelete = snapshot.docs.slice(maxDocs);
    const batch = writeBatch(db);
    toDelete.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  } catch (e) {
    console.warn('Firebase cleanupHistory failed:', e);
  }
}

const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

export async function cleanupOldHistory(): Promise<void> {
  try {
    const cutoff = Timestamp.fromMillis(Date.now() - FORTY_EIGHT_HOURS_MS);
    const q = query(collection(db, 'history'), where('createdAt', '<', cutoff));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return;
    const batch = writeBatch(db);
    snapshot.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    console.log(`[fb] cleanupOldHistory: deleted ${snapshot.docs.length} old entries`);
  } catch (e) {
    console.warn('Firebase cleanupOldHistory failed:', e);
  }
}

export function subscribeHistory(
  userId: string,
  callback: (entries: AnalysisDoc[]) => void,
  limitCount: number = 20
): Unsubscribe {
  const q = query(
    collection(db, 'history'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  console.log('[fb] subscribeHistory called');
  return onSnapshot(q,
    (snapshot) => {
      const entries = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as AnalysisDoc)
      );
      console.log('[fb] history snapshot received:', entries.length, 'entries');
      callback(entries);
    },
    (error) => {
      console.warn('[fb] subscribeHistory error:', error.code, error.message);
    }
  );
}
