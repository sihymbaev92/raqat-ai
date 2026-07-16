import { Platform } from "react-native";
import { mushafPagePadded } from "../config/mushafPagesBase";
import type { Qcf4PageJson } from "./qcf4Types";

const DB_NAME = "raqat-hatim-qcf4";
const DB_VERSION = 1;
const STORE = "pages";

function openDb(): Promise<IDBDatabase | null> {
  if (Platform.OS !== "web" || typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onerror = () => resolve(null);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
    } catch {
      resolve(null);
    }
  });
}

function pageKey(page: number): string {
  return mushafPagePadded(page);
}

export async function readQcf4PageFromWebIndexedDb(page: number): Promise<Qcf4PageJson | null> {
  const db = await openDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, "readonly");
      const store = tx.objectStore(STORE);
      const req = store.get(pageKey(page));
      req.onsuccess = () => {
        const raw = req.result;
        if (!raw || typeof raw !== "object") {
          resolve(null);
          return;
        }
        const data = raw as Qcf4PageJson;
        resolve(typeof data.page === "number" && Array.isArray(data.lines) ? data : null);
      };
      req.onerror = () => resolve(null);
      tx.oncomplete = () => db.close();
      tx.onerror = () => {
        db.close();
        resolve(null);
      };
    } catch {
      db.close();
      resolve(null);
    }
  });
}

export async function writeQcf4PageToWebIndexedDb(page: number, data: Qcf4PageJson): Promise<void> {
  const db = await openDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(data, pageKey(page));
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        resolve();
      };
    } catch {
      db.close();
      resolve();
    }
  });
}

export async function hasAnyQcf4PageInWebIndexedDb(): Promise<boolean> {
  const db = await openDb();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).count();
      req.onsuccess = () => resolve((req.result ?? 0) > 0);
      req.onerror = () => resolve(false);
      tx.oncomplete = () => db.close();
      tx.onerror = () => {
        db.close();
        resolve(false);
      };
    } catch {
      db.close();
      resolve(false);
    }
  });
}
