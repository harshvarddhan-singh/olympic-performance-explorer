// TopCountriesChart.tsx draws a stacked bar chart: one bar per country,
// split into gold, silver and bronze.
// The chart itself comes from the Recharts library. We only give it the data.

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatNumber } from '../calculations';
import type { CountryTotal } from '../types';

interface TopCountriesChartProps {
  data: CountryTotal[];
}

export default function TopCountriesChart({ data }: TopCountriesChartProps) {
  // Show a friendly message instead of an empty chart.
  if (data.length === 0) {
    return (
      <p className="empty">No results for this selection. Try resetting the filters.</p>
    );
  }

  return (
    <>
      <div className="chart country-chart">
        {/* ResponsiveContainer makes the chart fill the width of its box. */}
        <ResponsiveContainer width="100%" height="100%">
          {/* layout="vertical" draws horizontal bars, which leaves room for names. */}
          <BarChart
            data={data}
            layout="vertical"
            margin={{ right: 15, left: 0 }}
            accessibilityLayer
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e7ece9" />
            <XAxis type="number" tickLine={false} axisLine={false} />
            <YAxis
              type="category"
              dataKey="country"
              width={118}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip cursor={{ fill: '#f1f5f2' }} />
            {/* itemSorter={null} keeps the legend in the order we wrote the series. */}
            <Legend iconType="circle" itemSorter={null} />

            {/* dataKey says which field of the data each bar reads.
                The same stackId puts the three bars on top of each other. */}
            <Bar
              dataKey="Gold"
              stackId="medals"
              fill="#c69a35"
              maxBarSize={20}
              isAnimationActive={false}
            />
            <Bar
              dataKey="Silver"
              stackId="medals"
              fill="#94a6ae"
              maxBarSize={20}
              isAnimationActive={false}
            />
            <Bar
              dataKey="Bronze"
              stackId="medals"
              fill="#ae7251"
              radius={[0, 3, 3, 0]}
              maxBarSize={20}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* The same numbers as a table, for screen readers and exact values. */}
      <details className="chart-data">
        <summary>View chart data</summary>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Country</th>
                <th>Gold</th>
                <th>Silver</th>
                <th>Bronze</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.country}>
                  <td>{row.country}</td>
                  <td>{formatNumber(row.Gold)}</td>
                  <td>{formatNumber(row.Silver)}</td>
                  <td>{formatNumber(row.Bronze)}</td>
                  <td>{formatNumber(row.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}
