import { onCLS, onINP, onLCP } from '../../vendor/web-vitals/web-vitals.js';

// One rating per metric per document. No metric ID, navigation URL, raw value,
// performance entry, DOM reference or attribution crosses this boundary.
export function startAggregatePerformance(report, observers = { onCLS, onINP, onLCP }) {
  const sampled = new Set();
  for (const [name, observe] of Object.entries(observers)) {
    const metric = { onCLS: 'cls', onINP: 'inp', onLCP: 'lcp' }[name];
    if (!metric) continue;
    try {
      observe(({ rating }) => {
        if (sampled.has(metric) || !['good', 'needs-improvement', 'poor'].includes(rating)) return;
        sampled.add(metric);
        report(`vital.${metric}.${rating.replace('-', '_')}`);
      });
    } catch { /* Unsupported performance APIs leave a missing sample, never a fake zero. */ }
  }
}
