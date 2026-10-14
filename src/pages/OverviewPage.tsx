// OverviewPage.tsx is the main screen: filters, KPI cards, two charts and a table.
//
// The page stores nothing itself. On every render it:
//   1. takes the rows and the filters from App
//   2. filters the rows
//   3. calculates the numbers
//   4. passes the results to small display components

import {
  filterMedals,
  getEditionTrend,
  getKpis,
  getTopAthletes,
  getTopCountries,
} from '../calculations';
import { events } from '../data';
import type { Filters, MedalRow, Season } from '../types';
import EditionTrendChart from '../components/EditionTrendChart';
import FilterBar from '../components/FilterBar';
import KpiCards from '../components/KpiCards';
import TopAthletesTable from '../components/TopAthletesTable';
import TopCountriesChart from '../components/TopCountriesChart';
import InsightSpotlight from '../components/InsightSpotlight';
import { getOverviewInsights } from '../insights';

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
