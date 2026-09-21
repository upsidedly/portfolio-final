"use client";

import { useCallback, useEffect, useRef, useState } from "react";

async function database(): Promise<IDBDatabase> {
  if (!globalThis.indexedDB) throw new Error("Browser storage unavailable");
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("portfolio-tools", 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore("preferences");
    request.onerror = () => reject(new Error("Browser storage unavailable"));
    request.onblocked = () => reject(new Error("Browser storage blocked"));
    request.onsuccess = () => resolve(request.result);
  });
}

async function read(key: string): Promise<unknown> {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction("preferences", "readonly");
      const request = transaction.objectStore("preferences").get(key);
      request.onsuccess = () => resolve(request.result as unknown);
      request.onerror = () => reject(new Error("Could not read preferences"));
    });
  } finally {
    db.close();
  }
}

async function write(key: string, value: unknown) {
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction("preferences", "readwrite");
      transaction.objectStore("preferences").put(value, key);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(new Error("Could not save preferences"));
      transaction.onabort = () =>
        reject(new Error("Could not save preferences"));
    });
  } finally {
    db.close();
  }
}

export function usePreferences<T>(
  key: string,
  defaults: T,
  validate: (value: unknown) => value is T,
) {
  const [value, setValue] = useState(defaults);
  const [storage, setStorage] = useState<
    "loading" | "ready" | "saving" | "unavailable"
  >("loading");
  const touched = useRef(false);
  const revision = useRef(0);
  const pending = useRef(Promise.resolve());
  useEffect(() => {
    let active = true;
    void read(key)
      .then((saved) => {
        if (!active) return;
        if (!touched.current && validate(saved)) setValue(saved);
        if (!touched.current) setStorage("ready");
      })
      .catch(() => {
        if (active) setStorage("unavailable");
      });
    return () => {
      active = false;
    };
  }, [key, validate]);

  const save = useCallback(
    (next: T) => {
      touched.current = true;
      const current = ++revision.current;
      setValue(next);
      setStorage("saving");
      pending.current = pending.current
        .catch(() => undefined)
        .then(() => write(key, next))
        .then(() => {
          if (revision.current === current) setStorage("ready");
        })
        .catch(() => {
          if (revision.current === current) setStorage("unavailable");
        });
    },
    [key],
  );
  return { value, save, storage };
}
