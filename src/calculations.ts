// calculations.ts contains every number and every sentence the app shows.
//
// These are "pure functions": they only read their inputs and return a result.
// They never change anything on screen, which makes them easy to test
// (see calculations.test.ts).
//
// Sections:
//   1. types of the results          5. formatting helpers
//   2. filtering                     6–8. "What stands out" sentences (insights)
//   3. KPIs (the four cards)
//   4. chart and table data

import type { Country, Medal, MedalRow, OlympicEvent, Season } from './data';

// ---------------------------------------------------------------------------
// 1. Types used by the calculations
// ---------------------------------------------------------------------------

// The five Overview filters. An empty string '' means "no filter chosen".
// The IDs are strings because an HTML <select> always gives us text.
export interface Filters {
  season: Season | '';
  eventId: string;
  region: string;
  sportId: string;
  medal: Medal | '';
}

// The starting value of the filters: nothing selected.
export const emptyFilters: Filters = {
  season: '',
  eventId: '',
  region: '',
  sportId: '',
  medal: '',
};

// The four numbers shown in the KPI cards.
export interface KpiValues {
  total: number;
  gold: number;
  medallists: number;
  perMillion: number | null; // null when a population is missing
}

// One bar in the "Top countries" chart.
export interface CountryTotal {
  country: string;
  Gold: number;
  Silver: number;
  Bronze: number;
  total: number;
}

// One point in the "Medals by Olympic edition" line chart.
// "a" and "b" are only used on the Compare page (country A and country B).
export interface EditionPoint {
  edition: string;
  city: string;
  season: Season;
  total: number;
  a: number;
  b: number;
}

// One row in the "Top athletes" table.
export interface AthleteTotal {
  id: number;
  name: string;
  countries: string[];
  sports: string[];
  total: number;
}

// One row in the "Top sports" list on the Compare page.
export interface SportTotal {
  sport: string;
  total: number;
}

// One plain-English observation shown in the "What stands out" panel.
// It always has two parts: what the data shows, and what to be careful about.
export interface Insight {
  title: string;
  text: string; // the observation, comparison and interpretation
  caveat: string; // the limitation the reader should keep in mind
}

// ---------------------------------------------------------------------------
// 2. Filtering
// ---------------------------------------------------------------------------

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
// 3. KPIs (the four cards)
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
// 4. Chart and table data
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
// 5. Formatting helpers
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

// ---------------------------------------------------------------------------
// The "What stands out" sentences (insights)
//
// Every observation has the same four parts:
//   1. what the data shows (observation)
//   2. what it is compared with (comparison)
//   3. what it might mean (interpretation)
//   4. what to be careful about (caveat)
//
// The functions only describe patterns. The data cannot tell us WHY a country
// did well, so the sentences avoid words like "because" or "caused by".
// ---------------------------------------------------------------------------

// Sports where a whole squad receives a medal. In this dataset every squad member
// gets their own medal record, so ONE official team medal can become 15–25 athlete medals.
// Relays and rowing crews also add several records, but they are left out here
// to keep the list short and clear.
export const TEAM_SPORTS = [
  'Football',
  'Hockey',
  'Ice Hockey',
  'Handball',
  'Waterpolo',
  'Basketball',
  'Volleyball',
  'Baseball',
  'Softball',
];

// part / whole as a percentage, for example 26.8.
// We keep the decimals for comparing countries (39.3 is more than 38.9)
// and only round when we write the sentence (see "rounded" below).
function percent(part: number, whole: number): number {
  if (whole === 0) return 0;
  return (part / whole) * 100;
}

// Some country names need "the" or a different word order inside a sentence.
// For example the workbook says "Korea, South", but people write "South Korea".
// Only countries that won medals are listed here.
const SENTENCE_NAMES: Record<string, string> = {
  'Bahamas, The': 'the Bahamas',
  'Czech Republic': 'the Czech Republic',
  'Dominican Republic': 'the Dominican Republic',
  'Korea, North': 'North Korea',
  'Korea, South': 'South Korea',
  Netherlands: 'the Netherlands',
  'United Arab Emirates': 'the United Arab Emirates',
  'United Kingdom': 'the United Kingdom',
  'United States': 'the United States',
};

// "United States" -> "the United States". Other names stay as they are.
function sentenceName(name: string): string {
  return SENTENCE_NAMES[name] ?? name;
}

// Capital first letter, for a name at the start of a sentence: "the USA" -> "The USA".
function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// 26.8 -> "27%". Whole numbers read more naturally in a sentence.
function rounded(share: number): string {
  return `${Math.round(share)}%`;
}

// ---------------------------------------------------------------------------
// 6. Insights: a short profile of one country, built from its rows
// ---------------------------------------------------------------------------

export interface CountryProfile {
  name: string; // written the way it reads in a sentence, e.g. "the United States"
  total: number;
  gold: number;
  perMillion: number | null;
  topSport: string; // the sport with the most athlete medals
  topSportShare: number; // % of the country's athlete medals from that sport
  teamSportShare: number; // % of the country's athlete medals from TEAM_SPORTS
}

// Builds the profile for one country. "rows" must only contain that country's rows.
export function getCountryProfile(rows: MedalRow[], country: Country): CountryProfile {
  const total = getTotalAthleteMedals(rows);

  let gold = 0;
  let teamTotal = 0;
  const sportTotals = new Map<string, number>();

  for (const row of rows) {
    if (row.medal === 'Gold') gold = gold + row.count;
    if (TEAM_SPORTS.includes(row.sport)) teamTotal = teamTotal + row.count;
    const current = sportTotals.get(row.sport) ?? 0;
    sportTotals.set(row.sport, current + row.count);
  }

  // Find the biggest sport. On a tie, the name that comes first A–Z wins,
  // which matches the order of the "Top sports" list on the Compare page.
  let topSport = '';
  let topSportTotal = 0;
  for (const [sport, sportTotal] of sportTotals) {
    const isBigger = sportTotal > topSportTotal;
    const isTieButEarlierName = sportTotal === topSportTotal && sport < topSport;
    if (isBigger || isTieButEarlierName) {
      topSport = sport;
      topSportTotal = sportTotal;
    }
  }

  return {
    name: sentenceName(country.name),
    total: total,
    gold: gold,
    perMillion: getMedalsPerMillion(rows, country),
    topSport: topSport,
    topSportShare: percent(topSportTotal, total),
    teamSportShare: percent(teamTotal, total),
  };
}

// Profiles of the (up to) ten countries shown in the "Top countries" chart.
// We only compare these ten on purpose: a country with 15 athlete medals and a tiny
// population can top a "per million" list, which is true but not very meaningful.
function getTopTenProfiles(rows: MedalRow[]): CountryProfile[] {
  const profiles: CountryProfile[] = [];

  for (const item of getTopCountries(rows)) {
    const countryRows = rows.filter((row) => row.country === item.country);
    const first = countryRows[0];
    // Rebuild a small Country object from the row, so we can reuse getCountryProfile.
    const country: Country = {
      id: first.countryId,
      name: first.country,
      region: first.region,
      population: first.population,
    };
    profiles.push(getCountryProfile(countryRows, country));
  }

  return profiles;
}

// "the top 10" when the chart is full, otherwise for example "these 2 countries".
function groupName(top: CountryProfile[]): string {
  if (top.length === 10) return 'the top 10';
  return `these ${top.length} countries`;
}

// ---------------------------------------------------------------------------
// 7. Insights for the Overview page: up to three observations
// ---------------------------------------------------------------------------

// Observation 1: the biggest country is not always the strongest for its size.
function scaleVersusPopulation(
  top: CountryProfile[],
  selectionTotal: number,
): Insight | null {
  if (top.length < 2) return null;

  const leader = top[0];

  // Find the highest "per million" value among the top ten.
  let efficient: CountryProfile | null = null;
  for (const profile of top) {
    if (profile.perMillion === null) continue;
    if (efficient === null || profile.perMillion > (efficient.perMillion ?? 0)) {
      efficient = profile;
    }
  }
  if (efficient === null || efficient.perMillion === null || leader.perMillion === null) {
    return null;
  }

  const caveat =
    'The population figure is from one year only, so treat "per million" as a rough ' +
    'comparison, not an exact rate for each Games.';

  // Two countries can share first place (for example Canada and the USA in Winter).
  const second = top[1];
  const sharedLead = second.total === leader.total;
  let volumeText =
    `${capitalise(leader.name)} has the most athlete medals: ${formatNumber(leader.total)}, ` +
    `or ${rounded(percent(leader.total, selectionTotal))} of all those shown.`;
  if (sharedLead) {
    volumeText =
      `${capitalise(leader.name)} and ${second.name} are joint top with ` +
      `${formatNumber(leader.total)} athlete medals each.`;
  }

  // Case A: the same country leads on both measures.
  if (efficient.name === leader.name) {
    return {
      title: 'Top on both counts',
      text:
        `${volumeText} ${capitalise(leader.name)} also wins the most medals per million people ` +
        `of ${groupName(top)}, so here the total and the population view agree.`,
      caveat: caveat,
    };
  }

  // Case B: different leaders. Compare their population-adjusted rates precisely.
  const times = (efficient.perMillion / leader.perMillion).toFixed(1);
  return {
    title: 'Biggest total, or best for its size?',
    text:
      `${volumeText} After adjusting for population, ${efficient.name} records ` +
      `${efficient.perMillion.toFixed(2)} athlete medals per million people. That is ` +
      `${times} times the rate for ${leader.name} (${leader.perMillion.toFixed(2)}). ` +
      'So which country looks "best" depends on what you measure.',
    caveat: caveat,
  };
}

// Observation 2: some countries rely on one sport, others spread their medals widely.
function sportDependence(top: CountryProfile[]): Insight | null {
  if (top.length < 2) return null;

  // Find the most and the least concentrated country among the top ten.
  let narrowest = top[0];
  let broadest = top[0];
  for (const profile of top) {
    if (profile.topSportShare > narrowest.topSportShare) narrowest = profile;
    if (profile.topSportShare < broadest.topSportShare) broadest = profile;
  }
  if (narrowest.name === broadest.name) return null;

  // The caveat depends on whether the biggest sport is a team sport.
  let caveat =
    'Leaning on one sport can mean real strength in it, but one bad Games in that ' +
    'sport would pull the total down a lot.';
  if (TEAM_SPORTS.includes(narrowest.topSport)) {
    caveat =
      `${narrowest.topSport} is a team sport. Every player on the team gets a medal ` +
      'here, so one tournament can add dozens of athlete medals.';
  }

  return {
    title: 'One sport or many?',
    text:
      `Of ${groupName(top)}, ${narrowest.name} leans most on one sport: ` +
      `${narrowest.topSport} gives it ${rounded(narrowest.topSportShare)} of its athlete ` +
      `medals. ${capitalise(broadest.name)} is the most spread out. Its biggest sport, ` +
      `${broadest.topSport}, gives only ${rounded(broadest.topSportShare)}.`,
    caveat: caveat,
  };
}

// Observation 3: how much team sports inflate the athlete-medal totals.
function teamSportEffect(
  rows: MedalRow[],
  top: CountryProfile[],
  selectionTotal: number,
): Insight | null {
  let teamTotal = 0;
  for (const row of rows) {
    if (TEAM_SPORTS.includes(row.sport)) teamTotal = teamTotal + row.count;
  }
  if (teamTotal === 0 || top.length < 2) return null;

  // Find the top-ten countries with the highest and lowest team-sport share.
  let most = top[0];
  let least = top[0];
  for (const profile of top) {
    if (profile.teamSportShare > most.teamSportShare) most = profile;
    if (profile.teamSportShare < least.teamSportShare) least = profile;
  }
  if (most.name === least.name) return null;

  return {
    title: 'Team sports make some totals bigger',
    text:
      `The nine selected team sports make up ` +
      `${rounded(percent(teamTotal, selectionTotal))} of the athlete medals shown. ` +
      `Of ${groupName(top)}, ${most.name} gets the most from team sports ` +
      `(${rounded(most.teamSportShare)}) and ${least.name} the least ` +
      `(${rounded(least.teamSportShare)}). Because every player counts, countries that ` +
      'are good at team sports look bigger here than in the official medal table. ' +
      'Countries that win mostly in individual events look smaller.',
    caveat:
      'By team sports we mean football, hockey, ice hockey, handball, water polo, ' +
      'basketball, volleyball, baseball and softball. Relays and rowing crews also ' +
      'count several people per medal, so the real effect is a bit bigger.',
  };
}

// Collects the observations for the Overview page.
// "selectedRows" are the rows after the filters have been applied.
// When one sport is selected, the sport observations would be trivial (100%),
// so only the population observation is shown.
export function getOverviewInsights(
  selectedRows: MedalRow[],
  sportSelected: boolean,
): Insight[] {
  const selectionTotal = getTotalAthleteMedals(selectedRows);
  const top = getTopTenProfiles(selectedRows);

  const candidates = [scaleVersusPopulation(top, selectionTotal)];
  if (!sportSelected) {
    candidates.push(sportDependence(top));
    candidates.push(teamSportEffect(selectedRows, top, selectionTotal));
  }

  // Keep only the observations that could be made (not null).
  const insights: Insight[] = [];
  for (const insight of candidates) {
    if (insight !== null) insights.push(insight);
  }
  return insights;
}

// ---------------------------------------------------------------------------
// 8. Insight for the Compare page: one observation about two countries
// ---------------------------------------------------------------------------

// Writes a short comparison of two country profiles for the same season.
// Returns null when there is nothing sensible to say.
export function getCompareInsight(a: CountryProfile, b: CountryProfile): Insight | null {
  if (a.name === b.name) return null;
  if (a.total === 0 && b.total === 0) return null;

  const sentences: string[] = [];

  // 1. Volume
  let volumeLeader: CountryProfile | null = null;
  if (a.total === b.total) {
    sentences.push(
      `${capitalise(a.name)} and ${b.name} have the same number of athlete medals (${formatNumber(a.total)}).`,
    );
  } else {
    volumeLeader = a.total > b.total ? a : b;
    const other = volumeLeader === a ? b : a;
    sentences.push(
      `${capitalise(volumeLeader.name)} has more athlete medals ` +
        `(${formatNumber(volumeLeader.total)} vs ${formatNumber(other.total)}).`,
    );
  }

  // 2. Population-adjusted. The wording depends on whether the same country leads.
  if (a.perMillion !== null && b.perMillion !== null && a.perMillion !== b.perMillion) {
    const efficient = a.perMillion > b.perMillion ? a : b;
    const other = efficient === a ? b : a;
    const numbers = `(${efficient.perMillion!.toFixed(2)} vs ${other.perMillion!.toFixed(2)})`;

    if (volumeLeader === null) {
      sentences.push(`Per million people, ${efficient.name} is ahead ${numbers}.`);
    } else if (efficient === volumeLeader) {
      sentences.push(
        `${capitalise(efficient.name)} is also ahead per million people ${numbers}.`,
      );
    } else {
      sentences.push(`But per million people, ${efficient.name} is ahead ${numbers}.`);
    }
  }

  // 3. Gold share: same volume can hide very different results.
  if (a.total > 0 && b.total > 0) {
    sentences.push(
      `Gold makes up ${rounded(percent(a.gold, a.total))} of athlete medals for ${a.name} ` +
        `and ${rounded(percent(b.gold, b.total))} for ${b.name}.`,
    );

    // Similar totals (within 10%) with very different gold shares (20+ points)
    // are worth pointing out, because the totals alone would hide it.
    const similarTotals = Math.abs(a.total - b.total) <= 0.1 * Math.max(a.total, b.total);
    const goldGap = Math.abs(percent(a.gold, a.total) - percent(b.gold, b.total));
    if (similarTotals && goldGap >= 20) {
      sentences.push('So two similar totals can hide very different results.');
    }
  }

  // The caveat warns about team sports when one of them dominates a country's total.
  let caveat =
    'The population figure is from one year only, so treat "per million" as a rough ' +
    'comparison.';
  for (const profile of [a, b]) {
    if (profile.total > 0 && TEAM_SPORTS.includes(profile.topSport)) {
      caveat =
        `${profile.topSport} gives ${profile.name} ${rounded(profile.topSportShare)} of ` +
        'its athlete medals. It is a team sport, so one tournament counts once for every ' +
        'player and can move these numbers a lot.';
      break;
    }
  }

  return {
    title: 'How they compare',
    text: sentences.join(' '),
    caveat: caveat,
  };
}
