// InsightSpotlight.tsx shows a few plain-English observations ("what stands out").
// It only displays text. The sentences are written in insights.ts,
// so this component stays simple and the wording can be tested separately.

import type { Insight } from '../types';

interface InsightSpotlightProps {
  insights: Insight[];
}

export default function InsightSpotlight({ insights }: InsightSpotlightProps) {
  // Nothing to say (for example an empty selection): draw nothing at all.
  if (insights.length === 0) return null;

  return (
    <section className="spotlight" aria-labelledby="spotlight-title">
      <h2 id="spotlight-title">What stands out</h2>
      <ul>
        {insights.map((insight) => (
          <li key={insight.title}>
            <h3>{insight.title}</h3>
            <p>{insight.text}</p>
            <p className="spotlight-caveat">
              <strong>Keep in mind:</strong> {insight.caveat}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
