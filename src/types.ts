// types.ts describes the "shape" of every piece of data in the app.
// TypeScript uses these descriptions to warn us about mistakes before the app runs.
// This file contains no logic, only descriptions.

// A union type: a Season can only be one of these two exact words.
export type Season = 'Summer' | 'Winter';
export type Medal = 'Gold' | 'Silver' | 'Bronze';

// The three screens of the app. We switch between them with a state variable.
export type PageName = 'Overview' | 'Compare' | 'Scenarios';

// ---------------------------------------------------------------------------
// 1. Raw tables. These match the six JSON files in src/data,
//    which were created from the six sheets of the Excel workbook.
// ---------------------------------------------------------------------------

export interface Country {
  id: number;
  name: string;
  region: string;
  // "number | null" means the value can be missing.
  population: number | null;
}

export interface OlympicEvent {
  id: number;
  year: number;
  season: Season;
  city: string;
  hostCountry: string;
}

export interface Athlete {
  id: number;
  name: string;
  country: string;
  sport: string;
  birthYear: number | null;
}

// Used for the two small lookup tables: sports and medal types.
export interface NamedItem {
  id: number;
  name: string;
}

// One row of the fact table (the "Medal Victories" sheet).
// It only stores ID numbers. The names live in the lookup tables.
export interface MedalRecord {
  id: number;
  athleteId: number | null; // five rows in the workbook have no athlete
  countryId: number;
  eventId: number;
  sportId: number;
  medalTypeId: number;
  age: number | null;
  count: number; // "Number of Medals won" in the workbook
}

// ---------------------------------------------------------------------------
// 2. Joined row. After we look up every ID, we get one readable row.
//    All filters, KPIs and charts work with this type.
// ---------------------------------------------------------------------------

export interface MedalRow {
  id: string;
  athleteId: number | null;
  athleteName: string | null;
  countryId: number;
  country: string;
  region: string;
  population: number | null;
  eventId: number;
  year: number;
  season: Season;
  city: string;
  sportId: number;
  sport: string;
  medal: Medal;
  count: number;
  // true = a hypothetical row added by the user, false = original workbook data
  scenario: boolean;
}

// ---------------------------------------------------------------------------
// 3. User choices.
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

// One hypothetical "what-if" medal result created by the user.
export interface Scenario {
  id: string;
  countryId: number;
  eventId: number;
  sportId: number;
  medalTypeId: number;
  count: number;
}

// ---------------------------------------------------------------------------
// 4. Results of calculations. These are what the cards, charts and tables show.
// ---------------------------------------------------------------------------

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

// The three choices on the Compare page.
export interface CompareSelection {
  countryA: number; // country ID
  countryB: number; // country ID
  season: Season;
}

// One plain-English observation shown in the "What stands out" panel.
// It always has two parts: what the data shows, and what to be careful about.
export interface Insight {
  title: string;
  text: string; // the observation, comparison and interpretation
  caveat: string; // the limitation the reader should keep in mind
}
