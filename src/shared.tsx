// shared.tsx holds the three small components used on BOTH the Overview and
// Compare pages. A component is a function that returns a piece of the screen (JSX).
//
//   KpiCards          the four headline numbers
//   EditionTrendChart a line chart of athlete medals per Olympic edition
//   InsightSpotlight  the "What stands out" sentences

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  formatNumber,
  formatShare,
  type EditionPoint,
  type Insight,
  type KpiValues,
} from './calculations';

// ---------------------------------------------------------------------------
// KpiCards: the four headline numbers.
// Used once on the Overview page and twice on the Compare page (once per country).
// ---------------------------------------------------------------------------

// "Props" are the inputs a parent component passes in.
interface KpiCardsProps {
  values: KpiValues;
  // The "?" makes this prop optional. It is true on the Compare page.
  comparison?: boolean;
}

export function KpiCards({ values, comparison = false }: KpiCardsProps) {
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

// ---------------------------------------------------------------------------
// EditionTrendChart: a line chart of medals per Olympic edition.
// It works in two modes:
//   - Overview page: one line with the total (no "names" prop)
//   - Compare page:  two lines, one per country (the "names" prop is given)
// ---------------------------------------------------------------------------

interface EditionTrendChartProps {
  data: EditionPoint[];
  // Optional: the names of country A and country B.
  names?: [string, string];
}

export function EditionTrendChart({ data, names }: EditionTrendChartProps) {
  if (data.length === 0) {
    return <p className="empty">No Olympic editions in this selection.</p>;
  }

  return (
    <>
      <div className="chart trend-chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 15, right: 22, bottom: 5, left: 0 }}
            accessibilityLayer
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e7ece9" />
            <XAxis dataKey="edition" tickLine={false} axisLine={false} />
            <YAxis width={46} tickLine={false} axisLine={false} />
            <Tooltip />
            {/* itemSorter={null} keeps the legend in the order we wrote the series. */}
            <Legend iconType="circle" itemSorter={null} />

            {/* Conditional rendering: two country lines, or one total line. */}
            {names ? (
              <>
                <Line
                  type="linear"
                  dataKey="a"
                  name={names[0]}
                  stroke="#0085c7"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  isAnimationActive={false}
                />
                {/* The dashed style helps people who cannot tell the colours apart. */}
                <Line
                  type="linear"
                  dataKey="b"
                  name={names[1]}
                  stroke="#df0024"
                  strokeWidth={3}
                  strokeDasharray="5 4"
                  dot={{ r: 4 }}
                  isAnimationActive={false}
                />
              </>
            ) : (
              <Line
                type="linear"
                dataKey="total"
                name="Athlete medals"
                stroke="#0085c7"
                strokeWidth={3}
                dot={{ r: 4 }}
                isAnimationActive={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* The same numbers as a table. */}
      <details className="chart-data">
        <summary>View chart data</summary>
        <table>
          <thead>
            <tr>
              <th>Edition</th>
              {names ? (
                <>
                  <th>{names[0]}</th>
                  <th>{names[1]}</th>
                </>
              ) : (
                <th>Athlete medals</th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.map((point) => (
              <tr key={point.edition}>
                <td>
                  {point.edition} · {point.city}
                </td>
                {names ? (
                  <>
                    <td>{formatNumber(point.a)}</td>
                    <td>{formatNumber(point.b)}</td>
                  </>
                ) : (
                  <td>{formatNumber(point.total)}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </>
  );
}

// ---------------------------------------------------------------------------
// InsightSpotlight: the "What stands out" panel.
// It only displays text. The sentences are written in calculations.ts,
// so this component stays simple and the wording can be tested separately.
// ---------------------------------------------------------------------------

interface InsightSpotlightProps {
  insights: Insight[];
}

export function InsightSpotlight({ insights }: InsightSpotlightProps) {
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
