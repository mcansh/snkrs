import crypto from 'crypto';

import React from 'react';
import type { DocumentProps } from 'next/document';
import { NextScript } from 'next/document';

const cspHashOf = (text: string) => {
  const hash = crypto.createHash('sha256');
  hash.update(text);
  return `'sha256-${hash.digest('base64')}'`;
};

const CSP = (props: DocumentProps) => {
  const cspSettings = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-eval'",
      "'unsafe-inline'",
      'https://kiwi.mcan.sh/script.js',
    ],
    'connect-src': ["'self'", 'ws://localhost:*', 'https://qckm.io'],
    'style-src': [
      "'self'",
      "'unsafe-inline'",
      'https://rsms.me/inter/inter.css',
    ],
    'img-src': [
      "'self'",
      'data:',
      'https://res.cloudinary.com',
      'https://kiwi.mcan.sh',
    ],
    'font-src': ['https://rsms.me/inter/'],
  };

  const csp = `${Object.entries(cspSettings)
    .map(([key, val]) => `${key} ${val.join(' ')}`)
    .join(';')} ${cspHashOf(NextScript.getInlineScriptSource(props))}`;

  return <meta httpEquiv="Content-Security-Policy" content={csp} />;
};

export { CSP };
