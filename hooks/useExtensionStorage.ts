import { useState, useEffect } from 'react';
import {
  getLocalPersistedData,
  setLocalPersistedData,
  subscribeLocalPersistedDataKey,
} from '@/lib/chrome/local-persisted-data';

/**
 * Chrome Storage React Hook
 */
export function useExtensionStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadValue = async () => {
      try {
        const storedValue = await getLocalPersistedData<T>(key);
        setValue(storedValue ?? defaultValue);
      } catch (error) {
        console.error(`Error loading ${key}:`, error);
      } finally {
        setLoading(false);
      }
    };

    loadValue();

    const unsubscribe = subscribeLocalPersistedDataKey<T>(key, (nextValue) => {
      setValue((nextValue ?? defaultValue) as T);
    });

    return () => {
      unsubscribe();
    };
  }, [key, defaultValue]);

  const updateValue = async (newValue: T) => {
    try {
      setValue(newValue);
      await setLocalPersistedData(key, newValue);
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
      // Revert to previous value on error
      const storedValue = await getLocalPersistedData<T>(key);
      setValue(storedValue ?? defaultValue);
    }
  };

  return { value, setValue: updateValue, loading };
}
