/* eslint-disable no-console */
import React from 'react';

const useServiceWorker = () => {
  React.useEffect(() => {
    const sw = async () => {
      if (
        process.env.NODE_ENV === 'production' &&
        'serviceWorker' in navigator
      ) {
        try {
          await navigator.serviceWorker.register('/sw.js');
          console.log('Service Worker registered successfully');
        } catch (error) {
          console.warn('Service Worker failed to register');
        }
      }
    };
    sw();
  }, []);
};

export { useServiceWorker };
