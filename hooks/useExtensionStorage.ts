import { useState, useEffect } from 'react';
import * as storage from '../lib/chrome/storage';

/**
 * Chrome Storage React Hook
 */
export function useExtensionStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadValue = async () => {
      try {
        const storedValue = await storage.get<T>(key);
        setValue(storedValue ?? defaultValue);
      } catch (error) {
        console.error(`Error loading ${key}:`, error);
      } finally {
        setLoading(false);
      }
    };

    loadValue();

    const handler = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName === 'local' && key in changes) {
        setValue((changes[key].newValue ?? defaultValue) as T);
      }
    };

    storage.onChanged(handler);

    return () => {
      chrome.storage.onChanged.removeListener(handler);
    };
  }, [key, defaultValue]);

  const updateValue = async (newValue: T) => {
    try {
      setValue(newValue);
      await storage.set(key, newValue);
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
      // Revert to previous value on error
      const storedValue = await storage.get<T>(key);
      setValue(storedValue ?? defaultValue);
    }
  };

  return { value, setValue: updateValue, loading };
}
