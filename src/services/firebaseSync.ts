import { AppSettings, Customer, DocumentRecord, InventoryItem } from '../types';
import { getCustomers, getDocuments, getInventory, getSettings, saveCustomers, saveDocuments, saveInventory, saveSettings } from './storageService';

export interface SyncStatusResult {
  status: 'idle' | 'syncing' | 'connected' | 'error' | 'disabled';
  message: string;
  timestamp: string;
}

// Sync documents and customer records with Firebase Firestore via REST API
export class FirebaseSyncService {
  private static instance: FirebaseSyncService;

  private constructor() {}

  public static getInstance(): FirebaseSyncService {
    if (!FirebaseSyncService.instance) {
      FirebaseSyncService.instance = new FirebaseSyncService();
    }
    return FirebaseSyncService.instance;
  }

  // Test credentials
  public async testConnection(config: AppSettings['firebaseConfig']): Promise<{ success: boolean; message: string }> {
    if (!config.projectId || !config.apiKey) {
      return { success: false, message: 'Please enter a valid Firebase Project ID and API Key.' };
    }

    try {
      const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents?key=${config.apiKey}`;
      const response = await fetch(url);
      
      if (response.ok || response.status === 404) {
        return { success: true, message: 'Connection successful! Firebase Firestore reached.' };
      } else {
        const data = await response.json().catch(() => ({}));
        const errDetail = data?.error?.message || response.statusText;
        return { success: false, message: `Firebase returned status ${response.status}: ${errDetail}` };
      }
    } catch (err: any) {
      return { success: false, message: `Network error connecting to Firebase: ${err.message}` };
    }
  }

  // Push local records to Firestore
  public async syncLocalToCloud(): Promise<{ success: boolean; message: string; count: number }> {
    const settings = getSettings();
    const config = settings.firebaseConfig;

    if (!config.enabled || !config.projectId || !config.apiKey) {
      return { success: false, message: 'Firebase Cloud Sync is currently disabled or unconfigured.', count: 0 };
    }

    try {
      const documents = getDocuments();
      const customers = getCustomers();
      const inventory = getInventory();

      const baseUrl = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents`;
      
      // Store bundled backup document in collection 'mg_backups'
      const payload = {
        fields: {
          timestamp: { stringValue: new Date().toISOString() },
          seller: { stringValue: 'MG Supplytech' },
          documentsJson: { stringValue: JSON.stringify(documents) },
          customersJson: { stringValue: JSON.stringify(customers) },
          inventoryJson: { stringValue: JSON.stringify(inventory) },
          totalDocuments: { integerValue: String(documents.length) },
          totalCustomers: { integerValue: String(customers.length) }
        }
      };

      const res = await fetch(`${baseUrl}/mg_backups/latest_sync?key=${config.apiKey}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `HTTP ${res.status}`);
      }

      // Update sync time
      config.lastSyncedAt = new Date().toISOString();
      saveSettings({ ...settings, firebaseConfig: config });

      const totalCount = documents.length + customers.length + inventory.length;
      return { 
        success: true, 
        message: `Successfully synced ${totalCount} records to Firebase Firestore.`, 
        count: totalCount 
      };
    } catch (err: any) {
      return { success: false, message: `Sync failed: ${err.message}`, count: 0 };
    }
  }

  // Pull cloud records to local storage
  public async pullFromCloud(): Promise<{ success: boolean; message: string }> {
    const settings = getSettings();
    const config = settings.firebaseConfig;

    if (!config.enabled || !config.projectId || !config.apiKey) {
      return { success: false, message: 'Firebase Cloud Sync is disabled or missing credentials.' };
    }

    try {
      const baseUrl = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents`;
      const res = await fetch(`${baseUrl}/mg_backups/latest_sync?key=${config.apiKey}`);

      if (!res.ok) {
        throw new Error(`Failed to fetch cloud records: HTTP ${res.status}`);
      }

      const data = await res.json();
      const fields = data?.fields;

      if (!fields) {
        return { success: false, message: 'No sync records found in Firebase Firestore yet.' };
      }

      if (fields.documentsJson?.stringValue) {
        const docs: DocumentRecord[] = JSON.parse(fields.documentsJson.stringValue);
        saveDocuments(docs);
      }

      if (fields.customersJson?.stringValue) {
        const custs: Customer[] = JSON.parse(fields.customersJson.stringValue);
        saveCustomers(custs);
      }

      if (fields.inventoryJson?.stringValue) {
        const inv: InventoryItem[] = JSON.parse(fields.inventoryJson.stringValue);
        saveInventory(inv);
      }

      config.lastSyncedAt = new Date().toISOString();
      saveSettings({ ...settings, firebaseConfig: config });

      return { success: true, message: 'Successfully restored all records from Firebase Firestore!' };
    } catch (err: any) {
      return { success: false, message: `Pull failed: ${err.message}` };
    }
  }
}

export const firebaseSync = FirebaseSyncService.getInstance();
