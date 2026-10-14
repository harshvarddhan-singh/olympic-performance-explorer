// Overview.tsx is the "Overview" tab: filters, KPI cards, the "What stands out"
// panel, two charts and a table.
//
// The file has four components. The first three are only used on this page:
//   FilterBar          the five dropdowns
//   TopCountriesChart  stacked bar chart of the top 10 countries
//   TopAthletesTable   HTML table of the top 10 athletes
//   OverviewPage       puts everything together (used by App.tsx)

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
import {
  emptyFilters,
  filterMedals,
  formatNumber,
  getEditionTrend,
  getKpis,
  getOverviewInsights,
  getTopAthletes,
  getTopCountries,
  type AthleteTotal,
  type CountryTotal,
  type Filters,
} from './calculations';
import {
  countries,
  events,
  regionLabels,
  sports,
  type MedalRow,
  type Season,
} from './data';
import { EditionTrendChart, InsightSpotlight, KpiCards } from './shared';

// ---------------------------------------------------------------------------
// FilterBar: the five dropdowns.
//
// This component does NOT store the filters itself.
// App.tsx owns them and passes them in ("lifting state up").
// When the user changes a dropdown, we call onChange with the new filters.
// ---------------------------------------------------------------------------

interface FilterBarProps {
  filters: Filters;
  // A function prop: the parent tells us what to call when something changes.
  onChange: (newFilters: Filters) => void;
}

function FilterBar({ filters, onChange }: FilterBarProps) {
  // If a season is chosen, only show the editions of that season.
  const visibleEvents = events.filter(
    (event) => filters.season === '' || event.season === filters.season,
  );

  // A Set removes duplicates, so we get each region name once.
  const regions = [...new Set(countries.map((country) => country.region))].sort();

  const sortedSports = [...sports].sort((first, second) =>
    first.name.localeCompare(second.name),
  );

  return (
    <section className="filters" aria-label="Overview filters">
      <label>
        Games
        {/* A "controlled" select: its value always comes from the filters prop. */}
        <select
          value={filters.season}
          onChange={(e) =>
            // { ...filters, season: ... } copies the old filters and replaces one field.
            // We also clear the edition, because it may not belong to the new season.
            onChange({
              ...filters,
              season: e.target.value as Filters['season'],
              eventId: '',
            })
          }
        >
          <option value="">Summer & Winter</option>
          <option value="Summer">Summer</option>
          <option value="Winter">Winter</option>
        </select>
      </label>

      <label>
        Olympic edition
        <select
          value={filters.eventId}
          onChange={(e) => onChange({ ...filters, eventId: e.target.value })}
        >
          <option value="">All editions</option>
          {visibleEvents.map((event) => (
            <option key={event.id} value={event.id}>
              {event.year} · {event.city}
            </option>
          ))}
        </select>
      </label>

      <label>
        Region
        <select
          value={filters.region}
          onChange={(e) => onChange({ ...filters, region: e.target.value })}
        >
          <option value="">All regions</option>
          {regions.map((region) => (
            <option key={region} value={region}>
              {/* Show the friendly name, or the original text if we have none. */}
              {regionLabels[region] ?? region}
            </option>
          ))}
        </select>
      </label>

      <label>
        Sport
        <select
          value={filters.sportId}
          onChange={(e) => onChange({ ...filters, sportId: e.target.value })}
        >
          <option value="">All sports</option>
          {sortedSports.map((sport) => (
            <option key={sport.id} value={sport.id}>
              {sport.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        Medal
        <select
          value={filters.medal}
          onChange={(e) =>
            onChange({ ...filters, medal: e.target.value as Filters['medal'] })
          }
        >
          <option value="">All medals</option>
          <option value="Gold">Gold</option>
          <option value="Silver">Silver</option>
          <option value="Bronze">Bronze</option>
        </select>
      </label>

      <button
        type="button"
        className="text-button reset"
        onClick={() => onChange({ ...emptyFilters })}
      >
        Reset filters
      </button>
    </section>
  );
}

// ---------------------------------------------------------------------------
// TopCountriesChart: one bar per country, split into gold, silver and bronze.
// The chart itself comes from the Recharts library. We only give it the data.
// ---------------------------------------------------------------------------

interface TopCountriesChartProps {
  data: CountryTotal[];
}

function TopCountriesChart({ data }: TopCountriesChartProps) {
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

// ---------------------------------------------------------------------------
// TopAthletesTable: the ten athletes with the most medals as an HTML table.
// ---------------------------------------------------------------------------

interface TopAthletesTableProps {
  athletes: AthleteTotal[];
}

function TopAthletesTable({ athletes }: TopAthletesTableProps) {
  if (athletes.length === 0) {
    return <p className="empty">No known medallists match this selection.</p>;
  }

  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Athlete</th>
            <th>Country</th>
            <th>Sport</th>
            <th className="numeric">Athlete medals</th>
          </tr>
        </thead>
        <tbody>
          {/* The second argument of .map() is the position in the list (0, 1, 2 ...). */}
          {athletes.map((athlete, index) => (
            <tr key={athlete.id}>
              {/* padStart turns 1 into "01" so the ranks line up. */}
              <td className="rank">{String(index + 1).padStart(2, '0')}</td>
              <td className="athlete-name">{athlete.name}</td>
              <td>{athlete.countries.join(', ')}</td>
              <td>{athlete.sports.join(', ')}</td>
              <td className="numeric">{formatNumber(athlete.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// OverviewPage: the whole tab.
//
// The page stores nothing itself. On every render it:
//   1. takes the rows and the filters from App
//   2. filters the rows
//   3. calculates the numbers
//   4. passes the results to the small components above
// ---------------------------------------------------------------------------

interface OverviewPageProps {
  rows: MedalRow[];
  filters: Filters;
  onFiltersChange: (newFilters: Filters) => void;
  includeScenarios: boolean;
}

const seasons: Season[] = ['Summer', 'Winter'];

export default function OverviewPage({
  rows,
  filters,
  onFiltersChange,
  includeScenarios,
}: OverviewPageProps) {
  // "Derived data": everything below is calculated from rows + filters.
  // We do not store these results in state, so they can never get out of date.
  const selectedRows = filterMedals(rows, filters);
  const kpis = getKpis(selectedRows);
  const topCountries = getTopCountries(selectedRows);
  const topAthletes = getTopAthletes(selectedRows);

  // How many different countries won a medal in the current selection.
  const winningCountryCount = new Set(selectedRows.map((row) => row.countryId)).size;

  // The Olympic editions that match the season and edition filters.
  const visibleEvents = events.filter((event) => {
    if (filters.season !== '' && event.season !== filters.season) return false;
    if (filters.eventId !== '' && event.id !== Number(filters.eventId)) return false;
    return true;
  });

  // Summer Games are much bigger than Winter Games.
  // When both are visible we draw one chart per season instead of mixing them.
  const showBothSeasons = filters.season === '' && filters.eventId === '';

  // Plain-English observations that react to the filters (see insights.ts).
  const insights = getOverviewInsights(selectedRows, filters.sportId !== '');

  return (
    <>
      <FilterBar filters={filters} onChange={onFiltersChange} />

      <div className="section-line">
        <h2>Performance at a glance</h2>
        <span>
          {winningCountryCount} medal-winning countries ·{' '}
          {includeScenarios ? 'Includes scenarios' : 'Original data'}
        </span>
      </div>

      <KpiCards values={kpis} />

      <InsightSpotlight insights={insights} />

      <div className="overview-grid">
        {/* ----- Chart 1: top countries ----- */}
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Top countries</h2>
              <p>Top 10 by athlete medals · split by medal type</p>
            </div>
            <span className="pill">Ranking</span>
          </div>
          <TopCountriesChart data={topCountries} />
        </section>

        {/* ----- Chart 2: medals per Olympic edition ----- */}
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Medals by Olympic edition</h2>
              <p>Athlete medals across the selected Games</p>
            </div>
          </div>

          {showBothSeasons ? (
            <>
              <p className="chart-note">
                Summer and Winter have separate lines to keep comparisons meaningful.
              </p>
              {seasons.map((season) => (
                <div key={season}>
                  <h3 className="season-heading">{season}</h3>
                  <EditionTrendChart
                    data={getEditionTrend(
                      selectedRows,
                      visibleEvents.filter((event) => event.season === season),
                    )}
                  />
                </div>
              ))}
            </>
          ) : (
            <EditionTrendChart data={getEditionTrend(selectedRows, visibleEvents)} />
          )}
        </section>
      </div>

      {/* ----- Table: top athletes ----- */}
      <section className="panel athlete-panel">
        <div className="panel-heading">
          <div>
            <h2>Top athletes</h2>
            <p>Top 10 known athlete IDs in the current selection</p>
          </div>
          <span className="pill">Original records only</span>
        </div>
        <TopAthletesTable athletes={topAthletes} />
        <p className="footnote">
          Ranked by source athlete ID. The workbook may merge people with the same name.
          Five original rows have no athlete ID.
        </p>
      </section>
    </>
  );
}
