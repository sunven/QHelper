import * as tabs from '../lib/chrome/tabs';

/**
 * Chrome Tabs React Hook
 */
export function useChromeTabs() {
  const createTab = async (url: string) => {
    try {
      await tabs.create(url);
    } catch (error) {
      console.error('Error creating tab:', error);
    }
  };

  const getActiveTab = async () => {
    try {
      return await tabs.getCurrent();
    } catch (error) {
      console.error('Error getting active tab:', error);
      return undefined;
    }
  };

  return {
    createTab,
    getActiveTab,
  };
}
