/// <reference types="chrome" />
/// <reference types="wxt/vite-builder-env" />

/**
 * WXT global type declarations
 */
declare global {
  function defineBackground(
    def: () => void
  ): void;
}

export {};
