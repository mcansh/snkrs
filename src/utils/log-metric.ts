import { NextWebVitalsMetric } from 'next/app';

function logMetric({ name, value }: NextWebVitalsMetric) {
  const url = `https://qckm.io?m=${name}&v=${value}&k=${process.env.QUICKMETRICS_API_KEY}`;

  if (navigator.sendBeacon) {
    navigator.sendBeacon(url);
  } else {
    fetch(url, { method: 'POST', keepalive: true });
  }
}

export { logMetric };
