// FilterBar.tsx shows the five dropdowns on the Overview page.
//
// This component does NOT store the filters itself.
// The page above it owns them and passes them in ("lifting state up").
// When the user changes a dropdown, we call onChange with the new filters.

import { countries, events, regionLabels, sports } from '../data';
import { emptyFilters, type Filters } from '../types';

interface FilterBarProps {
  filters: Filters;
  // A function prop: the parent tells us what to call when something changes.
  onChange: (newFilters: Filters) => void;
}

export default function FilterBar({ filters, onChange }: FilterBarProps) {
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
