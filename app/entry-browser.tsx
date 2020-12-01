import React from 'react';
import { hydrate } from 'react-dom';
import Remix from '@remix-run/react/browser';

import { App } from './app';

hydrate(
  // @ts-expect-error issue with @types/react-dom
  <Remix>
    <App />
  </Remix>,
  document
);
