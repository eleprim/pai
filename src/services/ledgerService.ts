import { 
  collection, 
  doc, 
  getDoc,
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs, 
  writeBatch,
  serverTimestamp,
  orderBy,
  getDocFromServer
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { JournalEntry, TransactionLine, Account, AppSettings } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  const errorMessage = `Firestore ${operationType} failed at ${path}: ${errInfo.error}`;
  console.error(errorMessage, JSON.stringify(errInfo));
  throw new Error(errorMessage);
}

export const ledgerService = {
  async createAccount(account: Omit<Account, 'id' | 'createdBy' | 'isActive'>) {
    if (!auth.currentUser) throw new Error("Authentication required to perform this action.");
    const path = 'accounts';
    try {
      const accountRef = doc(collection(db, path));
      const newAccount: Account = {
        ...account,
        id: accountRef.id,
        isActive: true,
        createdBy: auth.currentUser.uid,
      };
      await setDoc(accountRef, newAccount);
      return newAccount;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async getAccounts() {
    if (!auth.currentUser) return [];
    const path = 'accounts';
    try {
      // Simplified query to avoid index requirements for now
      const q = query(
        collection(db, path), 
        where('createdBy', '==', auth.currentUser.uid)
      );
      const snapshot = await getDocs(q);
      const accounts = snapshot.docs.map(doc => doc.data() as Account);
      // Sort in memory to avoid index requirements
      return accounts.sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        return a.code.localeCompare(b.code);
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return [];
    }
  },

  async updateAccountOrder(reorderedAccounts: Account[]) {
    if (!auth.currentUser) throw new Error("Authentication required.");
    const batch = writeBatch(db);
    try {
      reorderedAccounts.forEach((acc, index) => {
        const ref = doc(db, 'accounts', acc.id);
        batch.update(ref, { order: index });
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'accounts/reorder');
    }
  },

  async createJournalEntry(entry: Omit<JournalEntry, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>, lines: Omit<TransactionLine, 'id' | 'entryId' | 'date' | 'createdBy' | 'category' | 'createdAt'>[], accounts: Account[]) {
    if (!auth.currentUser) throw new Error("Authentication required.");
    const batch = writeBatch(db);
    const entryPath = 'journalEntries';
    const txPath = 'transactions';
    
    try {
      const entryRef = doc(collection(db, entryPath));
      const entryId = entryRef.id;

      const newEntry: JournalEntry = {
        ...entry,
        id: entryId,
        attachments: [], // Ensure required field from type is present
        createdBy: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      batch.set(entryRef, newEntry);

      lines.forEach(line => {
        const txRef = doc(collection(db, txPath));
        const account = accounts.find(a => a.id === line.accountId);
        if (!account) throw new Error(`Account reference ${line.accountId} not found in pillar registry.`);
        
        const txLine: TransactionLine & { date: string, category: string, createdBy: string, description: string } = {
          ...line,
          id: txRef.id,
          entryId,
          date: entry.date,
          description: entry.description,
          category: account.category,
          createdBy: auth.currentUser!.uid,
          createdAt: serverTimestamp()
        };
        batch.set(txRef, txLine);
      });

      await batch.commit();
      return newEntry;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `batch/${entryPath}`);
    }
  },

  async deleteAccount(accountId: string) {
    if (!auth.currentUser) throw new Error("Authentication required.");
    const path = `accounts/${accountId}`;
    try {
      const accountRef = doc(db, 'accounts', accountId);
      await deleteDoc(accountRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async updateAccount(accountId: string, updates: Partial<Omit<Account, 'id' | 'createdBy'>>) {
    if (!auth.currentUser) throw new Error("Authentication required.");
    const path = `accounts/${accountId}`;
    try {
      const accountRef = doc(db, 'accounts', accountId);
      await updateDoc(accountRef, updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async initializeDefaultAccounts() {
    if (!auth.currentUser) throw new Error("Authentication required.");
    const defaults: Omit<Account, 'id' | 'createdBy' | 'isActive'>[] = [
      { code: '1000', name: 'Cash', category: 'Asset', cashFlowCategory: 'Cash', description: 'Primary cash and bank accounts' },
      { code: '1200', name: 'Accounts Receivable', category: 'Asset', cashFlowCategory: 'Operating', description: 'Outstanding customer invoices' },
      { code: '1500', name: 'Equipment', category: 'Asset', cashFlowCategory: 'Investing', description: 'Office and business equipment' },
      { code: '2000', name: 'Accounts Payable', category: 'Liability', cashFlowCategory: 'Operating', description: 'Outstanding vendor bills' },
      { code: '2100', name: 'Credit Card', category: 'Liability', cashFlowCategory: 'Operating', description: 'Corporate credit line' },
      { code: '3000', name: 'Owner\'s Equity', category: 'Equity', cashFlowCategory: 'Financing', description: 'Initial investment' },
      { code: '3100', name: 'Retained Earnings', category: 'Equity', cashFlowCategory: 'None', description: 'Accumulated net income' },
      { code: '4000', name: 'Sales Revenue', category: 'Revenue', cashFlowCategory: 'Operating', description: 'Revenue from sales' },
      { code: '4100', name: 'Service Revenue', category: 'Revenue', cashFlowCategory: 'Operating', description: 'Revenue from services' },
      { code: '5000', name: 'Rent Expense', category: 'Expense', cashFlowCategory: 'Operating', description: 'Monthly office rent' },
      { code: '5100', name: 'Utilities Expense', category: 'Expense', cashFlowCategory: 'Operating', description: 'Electricity, water, and internet' },
      { code: '5200', name: 'Salary Expense', category: 'Expense', cashFlowCategory: 'Operating', description: 'Employee payroll' },
    ];

    const batch = writeBatch(db);
    const userId = auth.currentUser.uid;

    defaults.forEach(acc => {
      const ref = doc(collection(db, 'accounts'));
      batch.set(ref, {
        ...acc,
        id: ref.id,
        isActive: true,
        createdBy: userId
      });
    });

    await batch.commit();
  },

  async getTransactions(startDate?: string, endDate?: string) {
    if (!auth.currentUser) return [];
    const path = 'transactions';
    try {
      let q = query(
        collection(db, path),
        where('createdBy', '==', auth.currentUser.uid)
      );

      if (startDate) {
        q = query(q, where('date', '>=', startDate));
      }
      if (endDate) {
        q = query(q, where('date', '<=', endDate));
      }

      const snapshot = await getDocs(q);
      const transactions = snapshot.docs.map(doc => doc.data() as TransactionLine & { category: string, date: string });
      return transactions.sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return [];
    }
  },

  async getJournalEntryWithLines(entryId: string) {
    if (!auth.currentUser) return null;
    try {
      const entryRef = doc(db, 'journalEntries', entryId);
      const entrySnap = await getDoc(entryRef);
      
      if (!entrySnap.exists()) {
        console.warn(`Entry ${entryId} not found`);
        return null;
      }
      
      const entry = entrySnap.data() as JournalEntry;

      const txQ = query(
        collection(db, 'transactions'), 
        where('entryId', '==', entryId),
        where('createdBy', '==', auth.currentUser.uid)
      );
      const txSnap = await getDocs(txQ);
      const lines = txSnap.docs.map(doc => doc.data() as TransactionLine);

      return { entry, lines };
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `journalEntries/${entryId}`);
      return null;
    }
  },

  async updateJournalEntry(entryId: string, entryUpdates: Partial<JournalEntry>, lines: Omit<TransactionLine, 'id' | 'entryId' | 'date' | 'createdBy' | 'category' | 'createdAt'>[], accounts: Account[]) {
    if (!auth.currentUser) throw new Error("Authentication required.");
    const batch = writeBatch(db);
    
    try {
      const entryRef = doc(db, 'journalEntries', entryId);
      
      // 1. Update the entry
      batch.update(entryRef, {
        ...entryUpdates,
        updatedAt: serverTimestamp()
      });

      // 2. Delete old lines
      const txQ = query(
        collection(db, 'transactions'), 
        where('entryId', '==', entryId),
        where('createdBy', '==', auth.currentUser.uid)
      );
      const txSnap = await getDocs(txQ);
      txSnap.docs.forEach(d => {
        batch.delete(d.ref);
      });

      // 3. Create new lines
      lines.forEach(line => {
        const txRef = doc(collection(db, 'transactions'));
        const account = accounts.find(a => a.id === line.accountId);
        if (!account) throw new Error(`Account reference ${line.accountId} not found.`);
        
        const txLine: TransactionLine & { date: string, category: string, createdBy: string, description: string } = {
          ...line,
          id: txRef.id,
          entryId,
          date: entryUpdates.date || (entryUpdates as any).date, // Fallback if date wasn't updated
          description: entryUpdates.description || (entryUpdates as any).description,
          category: account.category,
          createdBy: auth.currentUser!.uid,
          createdAt: serverTimestamp()
        };
        batch.set(txRef, txLine);
      });

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `journalEntries/${entryId}`);
    }
  },

  async deleteJournalEntry(entryId: string) {
    if (!auth.currentUser) throw new Error("Authentication required.");
    const batch = writeBatch(db);
    try {
      const entryRef = doc(db, 'journalEntries', entryId);
      batch.delete(entryRef);

      const txQ = query(
        collection(db, 'transactions'), 
        where('entryId', '==', entryId),
        where('createdBy', '==', auth.currentUser.uid)
      );
      const txSnap = await getDocs(txQ);
      txSnap.docs.forEach(d => {
        batch.delete(d.ref);
      });

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `journalEntries/${entryId}`);
    }
  },

  async getSettings() {
    if (!auth.currentUser) return null;
    const path = 'settings';
    try {
      const settingsRef = doc(db, path, auth.currentUser.uid);
      const snapshot = await getDocFromServer(settingsRef);
      
      if (!snapshot.exists()) {
        // Create default settings if they don't exist
        const defaultSettings: AppSettings = {
          id: auth.currentUser.uid,
          orgName: 'EPRM Accounting',
          currency: 'USD',
          updatedAt: serverTimestamp(),
          updatedBy: auth.currentUser.uid
        };
        await setDoc(settingsRef, defaultSettings);
        return defaultSettings;
      }
      
      return snapshot.data() as AppSettings;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },

  async updateSettings(updates: Partial<Omit<AppSettings, 'id' | 'updatedAt' | 'updatedBy'>>) {
    if (!auth.currentUser) throw new Error("Authentication required.");
    const path = 'settings';
    try {
      const settingsRef = doc(db, path, auth.currentUser.uid);
      await updateDoc(settingsRef, {
        ...updates,
        updatedAt: serverTimestamp(),
        updatedBy: auth.currentUser.uid
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }
};
