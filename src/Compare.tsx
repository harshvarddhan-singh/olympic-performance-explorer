// Compare.tsx is the "Compare" tab: two countries side by side.
// It reuses KpiCards, EditionTrendChart and InsightSpotlight from shared.tsx.
// Only the rows we give them are different.

import {
  formatNumber,
  getCompareInsight,
  getCountryProfile,
  getEditionTrend,
  getKpis,
  getTopSports,
  getTotalAthleteMedals,
} from './calculations';
import {
  countriesByName,
  events,
  type Country,
  type MedalRow,
  type Season,
} from './data';
import { EditionTrendChart, InsightSpotlight, KpiCards } from './shared';

// The three choices on the Compare page.
export interface CompareSelection {
  countryA: number; // country ID
  countryB: number; // country ID
  season: Season;
}

interface ComparePageProps {
  rows: MedalRow[];
  selection: CompareSelection;
  onSelectionChange: (newSelection: CompareSelection) => void;
}

export default function ComparePage({
  rows,
  selection,
  onSelectionChange,
}: ComparePageProps) {
  // Summer and Winter are never mixed, so we first keep one season.
  const seasonRows = rows.filter((row) => row.season === selection.season);
  const seasonEvents = events.filter((event) => event.season === selection.season);

  // Find the two chosen countries by their ID.
  const countryA = countriesByName.find((country) => country.id === selection.countryA)!;
  const countryB = countriesByName.find((country) => country.id === selection.countryB)!;

  const trend = getEditionTrend(seasonRows, seasonEvents, [countryA.id, countryB.id]);

  // One plain-English comparison of the two countries (see insights.ts).
  // getCompareInsight returns null when there is nothing sensible to say.
  const rowsA = seasonRows.filter((row) => row.countryId === countryA.id);
  const rowsB = seasonRows.filter((row) => row.countryId === countryB.id);
  const compareInsight = getCompareInsight(
    getCountryProfile(rowsA, countryA),
    getCountryProfile(rowsB, countryB),
  );

  // Draws the summary column for one country.
  // It is a function because we need exactly the same layout twice.
  function renderCountrySummary(country: Country, letter: 'A' | 'B') {
    const countryRows = seasonRows.filter((row) => row.countryId === country.id);
    const hasMedals = getTotalAthleteMedals(countryRows) > 0;
    const topSports = getTopSports(countryRows);

    return (
      <section className={`country-summary country-${letter === 'A' ? 0 : 1}`}>
        <p className="eyebrow">COUNTRY {letter}</p>
        <h2>{country.name}</h2>
        <p className="subtitle">
          {selection.season} Games ·{' '}
          {hasMedals ? 'All available editions' : 'No athlete medals in this selection'}
        </p>

        {/* Passing the country makes "medals per million" use only its population. */}
        <KpiCards values={getKpis(countryRows, country)} comparison />

        <div className="panel">
          <h3>Top sports</h3>
          {topSports.length === 0 ? (
            <p className="empty">No sport results.</p>
          ) : (
            <ol className="sport-list">
              {topSports.map((item) => (
                <li key={item.sport}>
                  <span>{item.sport}</span>
                  <strong>{formatNumber(item.total)}</strong>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>
    );
  }

  return (
    <>
      {/* ----- The three dropdowns ----- */}
      <section className="compare-controls filters">
        <label>
          Country A
          <select
            value={selection.countryA}
            onChange={(e) =>
              onSelectionChange({ ...selection, countryA: Number(e.target.value) })
            }
          >
            {countriesByName.map((country) => (
              <option key={country.id} value={country.id}>
                {country.name}
              </option>
            ))}
          </select>
        </label>

        <span className="versus">vs</span>

        <label>
          Country B
          <select
            value={selection.countryB}
            onChange={(e) =>
              onSelectionChange({ ...selection, countryB: Number(e.target.value) })
            }
          >
            {countriesByName.map((country) => (
              <option key={country.id} value={country.id}>
                {country.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Games
          <select
            value={selection.season}
            onChange={(e) =>
              onSelectionChange({ ...selection, season: e.target.value as Season })
            }
          >
            <option value="Summer">Summer</option>
            <option value="Winter">Winter</option>
          </select>
        </label>

        <p>Comparison uses its own selections.</p>
      </section>

      {selection.countryA === selection.countryB && (
        <p className="chart-note">
          Both selections are the same country. Pick another country to compare.
        </p>
      )}

      {compareInsight && <InsightSpotlight insights={[compareInsight]} />}

      {/* ----- Two summary columns ----- */}
      <div className="compare-grid">
        {renderCountrySummary(countryA, 'A')}
        {renderCountrySummary(countryB, 'B')}
      </div>

      {/* ----- One chart with a line for each country ----- */}
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>
              {countryA.name} & {countryB.name} over time
            </h2>
            <p>
              {selection.season} athlete medals · zero means no medals recorded in this
              dataset
            </p>
          </div>
        </div>
        <EditionTrendChart data={trend} names={[countryA.name, countryB.name]} />
      </section>
    </>
  );
}
