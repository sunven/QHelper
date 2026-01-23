import { useState, useEffect } from 'react';
import * as cookies from '../lib/chrome/cookies';

/**
 * Chrome Cookies React Hook
 */
export function useChromeCookies() {
  const [cookieCount, setCookieCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCookies = async () => {
      try {
        const allCookies = await cookies.getAll();
        setCookieCount(allCookies.length);
      } catch (error) {
        console.error('Error loading cookies:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCookies();
  }, []);

  const clearAllCookies = async () => {
    try {
      await cookies.removeAll();
      setCookieCount(0);
    } catch (error) {
      console.error('Error clearing cookies:', error);
    }
  };

  return {
    cookieCount,
    clearAllCookies,
    loading,
  };
}
