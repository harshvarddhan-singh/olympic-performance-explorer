// KpiCards.tsx shows the four headline numbers.
// It is used on the Overview page and twice on the Compare page (once per country).

import { formatNumber, formatShare } from '../calculations';
import type { KpiValues } from '../types';

// "Props" are the inputs a parent component passes in.
interface KpiCardsProps {
  values: KpiValues;
  // The "?" makes this prop optional. It is true on the Compare page.
  comparison?: boolean;
}

export default function KpiCards({ values, comparison = false }: KpiCardsProps) {
  // The per-million value can be missing, so we show a dash in that case.
  let perMillionText = '—';
  if (values.perMillion !== null) {
    perMillionText = values.perMillion.toFixed(2);
  }

  // The explanation under "Medals per million" depends on the page.
  let perMillionDetail = 'Uses combined population of selected medal-winning countries';
  if (comparison) {
    perMillionDetail = 'Uses this country’s population snapshot';
  }

  // We describe the four cards as data, then draw them with one loop below.
  const cards = [
    {
      label: 'Athlete medals',
      value: formatNumber(values.total),
      detail: 'Sum of medals won, including team members',
    },
    {
      label: 'Gold athlete medals',
      value: formatNumber(values.gold),
      detail: `${formatShare(values.gold, values.total)}% of selected athlete medals`,
    },
    {
      label: 'Distinct medallists',
      value: formatNumber(values.medallists),
      detail: 'Known athlete IDs; excludes scenario rows',
    },
    {
      label: 'Medals per million',
      value: perMillionText,
      detail: perMillionDetail,
    },
  ];

  return (
    <div className="kpis">
      {/* .map() turns each item of the array into a piece of HTML.
          React needs a unique "key" on each item of a list. */}
      {cards.map((card, index) => (
        <article className={`kpi kpi-${index + 1}`} key={card.label}>
          <h3>{card.label}</h3>
          <strong>{card.value}</strong>
          <p>{card.detail}</p>
        </article>
      ))}
    </div>
  );
}
