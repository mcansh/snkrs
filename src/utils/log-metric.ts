import type { NextWebVitalsMetric } from 'next/app';

async function logMetric({ name, value }: NextWebVitalsMetric) {
  const url = `https://qckm.io?m=${name}&v=${value}&k=${process.env.QUICKMETRICS_API_KEY}`;

  if ('sendBeacon' in navigator) {
    navigator.sendBeacon(url);
  } else {
    await fetch(url, { method: 'POST', keepalive: true });
  }
}

export { logMetric };
