// EditionTrendChart.tsx draws a line chart of medals per Olympic edition.
//
// It works in two modes:
//   - Overview page: one line with the total (no "names" prop)
//   - Compare page:  two lines, one per country (the "names" prop is given)

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
import { formatNumber } from '../calculations';
import type { EditionPoint } from '../types';

interface EditionTrendChartProps {
  data: EditionPoint[];
  // Optional: the names of country A and country B.
  names?: [string, string];
}

export default function EditionTrendChart({ data, names }: EditionTrendChartProps) {
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
