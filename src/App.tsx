// App.tsx is the top component of the application.
//
// It has two jobs:
//   1. Remember the user's choices ("state").
//   2. Show the header, the navigation and the page the user selected.
//
// The state lives here, and not inside the pages, so that the choices
// are still remembered when the user switches between pages.

import { useState } from 'react';
import { countries, joinScenarios, originalRows } from './data';
import { loadScenarios, saveScenarios, type SavedScenarios } from './scenarios';
import {
  emptyFilters,
  type CompareSelection,
  type Filters,
  type MedalRow,
  type PageName,
  type Scenario,
} from './types';
import DataNote from './components/DataNote';
import ScenarioEditor from './components/ScenarioEditor';
import ComparePage from './pages/ComparePage';
import OverviewPage from './pages/OverviewPage';

const pageNames: PageName[] = ['Overview', 'Compare', 'Scenarios'];

// The Compare page starts with Germany vs Australia in the Summer Games.
const startSelection: CompareSelection = {
  countryA: countries.find((country) => country.name === 'Germany')!.id,
  countryB: countries.find((country) => country.name === 'Australia')!.id,
  season: 'Summer',
};

export default function App() {
  // ----- State -----
  // useState gives us [the current value, a function to change it].
  // Calling the "set" function makes React draw the screen again with the new value.

  // Which page is visible. The app has no router, just this one variable.
  const [page, setPage] = useState<PageName>('Overview');

  // The five Overview filters.
  const [filters, setFilters] = useState<Filters>(emptyFilters);

  // The two countries and the season on the Compare page.
  const [selection, setSelection] = useState<CompareSelection>(startSelection);

  // The user's saved scenarios. Passing the function loadScenarios (without brackets)
  // makes React read the browser storage only once, when the app starts.
  const [saved, setSaved] = useState<SavedScenarios>(loadScenarios);

  // Whether scenarios are added to the numbers. Always starts switched off.
  const [includeScenarios, setIncludeScenarios] = useState(false);

  // ----- Derived data -----
  // The rows that every page works with:
  // the original data, plus the scenarios when the switch is on.
  let rows: MedalRow[] = originalRows;
  if (includeScenarios) {
    rows = [...originalRows, ...joinScenarios(saved.rows)];
  }

  // Called by the ScenarioEditor after an add, edit or delete.
  // It saves the new list in the browser and in state.
  function handleScenariosChange(newRows: Scenario[]) {
    const warning = saveScenarios(newRows);
    setSaved({ rows: newRows, message: warning });
  }

  const scenarioCount = saved.rows.length;

  return (
    <>
      {/* Lets keyboard users jump straight to the content. */}
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      {/* ----- Top bar ----- */}
      <header className="site-header">
        <div className="brand">
          <span className="rings-mark" role="img" aria-label="Five coloured rings">
            <span />
            <span />
            <span />
            <span />
            <span />
          </span>
          <span>OLYMPIC EXPLORER</span>
        </div>
        <span className="header-meta">
          Dataset study <span>2000—2012</span>
        </span>
      </header>

      <main id="main">
        {/* ----- Title area ----- */}
        <section className="intro">
          <div className="hero-copy">
            <p className="eyebrow">SEVEN GAMES. MANY PERSPECTIVES.</p>
            <h1>Olympic Performance Explorer</h1>
            <p className="subtitle">
              Explore the countries, athletes and sports behind the results.
            </p>
            <div className="hero-chips" aria-label="Dataset coverage">
              <span>2000—2012</span>
              <span>49 sports</span>
              <span>108 medal-winning countries</span>
            </div>
          </div>
          <div className="coverage">
            <strong>7</strong>
            <span>
              Olympic editions
              <br />4 Summer · 3 Winter
            </span>
          </div>
        </section>

        <DataNote />

        {/* ----- Navigation: three buttons and the scenario switch ----- */}
        <div className="navigation">
          <nav aria-label="Main sections">
            {pageNames.map((name) => (
              <button
                key={name}
                type="button"
                className={page === name ? 'active' : ''}
                aria-current={page === name ? 'page' : undefined}
                onClick={() => setPage(name)}
              >
                {name}
                {/* Show how many scenarios are saved, next to the Scenarios button. */}
                {name === 'Scenarios' && scenarioCount > 0 && (
                  <span className="nav-count">{scenarioCount}</span>
                )}
              </button>
            ))}
          </nav>

          <label className="toggle">
            <input
              type="checkbox"
              checked={includeScenarios}
              onChange={(e) => setIncludeScenarios(e.target.checked)}
            />
            Include scenarios{' '}
            <span className="pill">{includeScenarios ? 'On' : 'Off'}</span>
          </label>
        </div>

        {/* A warning if the browser storage could not be read or written. */}
        {saved.message !== '' && (
          <p className="storage-warning" role="alert">
            {saved.message}
          </p>
        )}

        {includeScenarios && (
          <p className="scenario-banner">
            Scenario mode · Original data + {scenarioCount} hypothetical{' '}
            {scenarioCount === 1 ? 'entry' : 'entries'}. Filters still apply.
          </p>
        )}

        {/* ----- The selected page -----
            "condition && <Component />" only draws the component when the condition is true. */}
        {page === 'Overview' && (
          <OverviewPage
            rows={rows}
            filters={filters}
            onFiltersChange={setFilters}
            includeScenarios={includeScenarios}
          />
        )}

        {page === 'Compare' && (
          <ComparePage
            rows={rows}
            selection={selection}
            onSelectionChange={setSelection}
          />
        )}

        {page === 'Scenarios' && (
          <ScenarioEditor rows={saved.rows} onChange={handleScenariosChange} />
        )}

        <footer>
          <span>Source: Olympic Games Dataset.xlsx</span>
          <span>2000–2012 · Population snapshot · Athlete medals</span>
        </footer>
      </main>
    </>
  );
}
