/// <reference types="chrome"/>

interface ChromeMessage {
  type: 'SHOW_NOTIFICATION' | 'SHOW_RESPONSE';
  payload: {
    type?: 'error' | 'loading' | 'success';
    title: string;
    message?: string;
    response?: string;
  };
}

declare global {
  interface Window {
    chrome: typeof chrome;
  }
} 