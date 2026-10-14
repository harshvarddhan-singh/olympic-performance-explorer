// calculations.ts contains every number the app shows.
// These are "pure functions": they only read their inputs and return a result.
// They never change anything on screen, which makes them easy to test
// (see calculations.test.ts).

import type {
  AthleteTotal,
  Country,
  CountryTotal,
  EditionPoint,
  Filters,
  KpiValues,
  MedalRow,
  OlympicEvent,
  SportTotal,
} from './types';

// ---------------------------------------------------------------------------
// 1. Filtering
// ---------------------------------------------------------------------------

// Keeps only the rows that match every filter the user has chosen.
// An empty filter ('') matches everything.
export function filterMedals(rows: MedalRow[], filters: Filters): MedalRow[] {
  return rows.filter((row) => {
    if (filters.season !== '' && row.season !== filters.season) return false;
    // The filter stores IDs as text, so we convert them with Number().
    if (filters.eventId !== '' && row.eventId !== Number(filters.eventId)) return false;
    if (filters.region !== '' && row.region !== filters.region) return false;
    if (filters.sportId !== '' && row.sportId !== Number(filters.sportId)) return false;
    if (filters.medal !== '' && row.medal !== filters.medal) return false;
    return true;
  });
}

// ---------------------------------------------------------------------------
// 2. KPIs (the four cards)
// ---------------------------------------------------------------------------

// Adds up the medal count of every row.
// Important: we SUM the count instead of counting rows,
// because one row can hold several medals (Michael Phelps 2008 = 8).
export function getTotalAthleteMedals(rows: MedalRow[]): number {
  let total = 0;
  for (const row of rows) {
    total = total + row.count;
  }
  return total;
}

export function getGoldAthleteMedals(rows: MedalRow[]): number {
  const goldRows = rows.filter((row) => row.medal === 'Gold');
  return getTotalAthleteMedals(goldRows);
}

// Counts how many different athletes appear in the rows.
// A Set only keeps unique values, so its size is the number of distinct athletes.
// Scenario rows and rows without an athlete are skipped.
export function getDistinctMedallists(rows: MedalRow[]): number {
  const athleteIds = new Set<number>();
  for (const row of rows) {
    if (!row.scenario && row.athleteId !== null) {
      athleteIds.add(row.athleteId);
    }
  }
  return athleteIds.size;
}

// Medals per one million people.
//
// Overview page (no country given):
//   total medals / combined population of the countries that won medals.
// Compare page (one country given):
//   that country's medals / that country's population.
//
// Population is one snapshot in the workbook, not a value per Olympic year.
// If any population is missing, we return null instead of a misleading number.
export function getMedalsPerMillion(rows: MedalRow[], country?: Country): number | null {
  let populations: (number | null)[];

  if (country) {
    populations = [country.population];
  } else {
    // A Map keeps one entry per country ID,
    // so each country's population is only counted once.
    const populationByCountry = new Map<number, number | null>();
    for (const row of rows) {
      populationByCountry.set(row.countryId, row.population);
    }
    populations = [...populationByCountry.values()];
  }

  if (populations.length === 0) return null;

  let totalPopulation = 0;
  for (const population of populations) {
    if (population === null || population <= 0) return null;
    totalPopulation = totalPopulation + population;
  }

  return (getTotalAthleteMedals(rows) / totalPopulation) * 1_000_000;
}

// Collects the four KPI numbers in one object for the KpiCards component.
export function getKpis(rows: MedalRow[], country?: Country): KpiValues {
  return {
    total: getTotalAthleteMedals(rows),
    gold: getGoldAthleteMedals(rows),
    medallists: getDistinctMedallists(rows),
    perMillion: getMedalsPerMillion(rows, country),
  };
}

// ---------------------------------------------------------------------------
// 3. Chart and table data
// ---------------------------------------------------------------------------

// Top 10 countries, each with its gold, silver and bronze totals.
// To show a Top 5 instead, change the number in .slice(0, 10).
export function getTopCountries(rows: MedalRow[]): CountryTotal[] {
  // Step 1: group the rows by country and add up the medals.
  const totals = new Map<number, CountryTotal>();
  for (const row of rows) {
    let item = totals.get(row.countryId);
    if (!item) {
      item = { country: row.country, Gold: 0, Silver: 0, Bronze: 0, total: 0 };
      totals.set(row.countryId, item);
    }
    // row.medal is 'Gold', 'Silver' or 'Bronze', so this picks the matching field.
    item[row.medal] = item[row.medal] + row.count;
    item.total = item.total + row.count;
  }

  // Step 2: sort from most to fewest medals. Ties are sorted by name.
  const sorted = [...totals.values()].sort((first, second) => {
    if (second.total !== first.total) return second.total - first.total;
    return first.country.localeCompare(second.country);
  });

  // Step 3: keep the first ten.
  return sorted.slice(0, 10);
}

// One point per Olympic edition, ordered by year, for the line chart.
// countryIds is optional. On the Compare page it holds [country A, country B].
export function getEditionTrend(
  rows: MedalRow[],
  editions: OlympicEvent[],
  countryIds?: [number, number],
): EditionPoint[] {
  const sortedEditions = [...editions].sort((first, second) => first.year - second.year);

  return sortedEditions.map((edition) => {
    const editionRows = rows.filter((row) => row.eventId === edition.id);

    let totalA = 0;
    let totalB = 0;
    if (countryIds) {
      totalA = getTotalAthleteMedals(
        editionRows.filter((row) => row.countryId === countryIds[0]),
      );
      totalB = getTotalAthleteMedals(
        editionRows.filter((row) => row.countryId === countryIds[1]),
      );
    }

    return {
      edition: String(edition.year),
      city: edition.city,
      season: edition.season,
      total: getTotalAthleteMedals(editionRows),
      a: totalA,
      b: totalB,
    };
  });
}

// Top 10 athletes by medals. Scenario rows and rows without an athlete are skipped.
export function getTopAthletes(rows: MedalRow[]): AthleteTotal[] {
  const totals = new Map<number, AthleteTotal>();

  for (const row of rows) {
    if (row.scenario || row.athleteId === null) continue;

    let item = totals.get(row.athleteId);
    if (!item) {
      item = {
        id: row.athleteId,
        name: row.athleteName ?? 'Unknown',
        countries: [],
        sports: [],
        total: 0,
      };
      totals.set(row.athleteId, item);
    }

    item.total = item.total + row.count;
    // An athlete can appear with more than one country or sport, so we keep a list.
    if (!item.countries.includes(row.country)) item.countries.push(row.country);
    if (!item.sports.includes(row.sport)) item.sports.push(row.sport);
  }

  const sorted = [...totals.values()].sort((first, second) => {
    if (second.total !== first.total) return second.total - first.total;
    return first.name.localeCompare(second.name);
  });

  return sorted.slice(0, 10);
}

// Top 5 sports by medals. Used on the Compare page for one country.
export function getTopSports(rows: MedalRow[]): SportTotal[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const current = totals.get(row.sport) ?? 0; // ?? 0 means "use 0 if not found yet"
    totals.set(row.sport, current + row.count);
  }

  const list: SportTotal[] = [];
  for (const [sport, total] of totals) {
    list.push({ sport: sport, total: total });
  }

  list.sort((first, second) => {
    if (second.total !== first.total) return second.total - first.total;
    return first.sport.localeCompare(second.sport);
  });

  return list.slice(0, 5);
}

// ---------------------------------------------------------------------------
// 4. Formatting helpers
// ---------------------------------------------------------------------------

// 9529 -> "9,529"
export function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}

// part / whole as a percentage with one decimal, for example "33.0".
// Returns "0.0" when the whole is zero, to avoid dividing by zero.
export function formatShare(part: number, whole: number): string {
  if (whole === 0) return '0.0';
  return ((part / whole) * 100).toFixed(1);
}
