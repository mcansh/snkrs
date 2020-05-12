export type MetricName =
  | 'FCP'
  | 'LCP'
  | 'CLS'
  | 'FID'
  | 'TTFB'
  | 'Next.js-hydration'
  | 'Next.js-route-change-to-render'
  | 'Next.js-render';

export type MetricLabel = 'custom' | 'web-vital';

export interface Metric {
  label: MetricLabel;
  name: MetricName;
  startTime: number;
  value: number;
}

function logMetric({ name, value }: { name: MetricName; value: number }) {
  const url = `https://qckm.io?m=${name}&v=${value}&k=${process.env.QUICKMETRICS_API_KEY}`;

  if (navigator.sendBeacon) {
    navigator.sendBeacon(url);
  } else {
    fetch(url, { method: 'POST', keepalive: true });
  }
}

export { logMetric };
