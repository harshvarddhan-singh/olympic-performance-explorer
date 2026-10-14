// data.ts holds everything about the DATA:
//   1. TypeScript descriptions ("types") of the tables
//   2. loading the tables from olympics.json (made from the Excel file by convert_excel.py)
//   3. lookup maps, so we can find an item by its ID quickly
//   4. joining the tables into one readable row per medal record
//   5. small helpers for the dropdowns
//   6. saving and loading the user's what-if scenarios in the browser
//
// It runs once when the app starts. The original data never changes afterwards.

import olympicData from './olympics.json';

// ---------------------------------------------------------------------------
// 1. Types. They describe the "shape" of the data, so TypeScript can warn us
//    about mistakes before the app runs. They contain no logic.
// ---------------------------------------------------------------------------

// A union type: a Season can only be one of these two exact words.
export type Season = 'Summer' | 'Winter';
export type Medal = 'Gold' | 'Silver' | 'Bronze';

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

// The joined row. After we look up every ID, we get one readable row.
// All filters, KPIs and charts work with this type.
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
// 2. The raw tables, read from olympics.json.
// ---------------------------------------------------------------------------

export const countries: Country[] = olympicData.countries;
// "as" is needed here because JSON only knows "string", not our Season type.
export const events = olympicData.events as OlympicEvent[];
export const sports: NamedItem[] = olympicData.sports;
export const medalTypes: NamedItem[] = olympicData.medalTypes;
const athletes: Athlete[] = olympicData.athletes;
const medalRecords: MedalRecord[] = olympicData.medals;

// ---------------------------------------------------------------------------
// 3. Lookup maps. A Map finds an item by its ID immediately,
//    which is much faster than searching a whole array every time.
// ---------------------------------------------------------------------------

const countryById = new Map<number, Country>();
for (const country of countries) {
  countryById.set(country.id, country);
}

const eventById = new Map<number, OlympicEvent>();
for (const event of events) {
  eventById.set(event.id, event);
}

const sportById = new Map<number, NamedItem>();
for (const sport of sports) {
  sportById.set(sport.id, sport);
}

const medalTypeById = new Map<number, NamedItem>();
for (const medalType of medalTypes) {
  medalTypeById.set(medalType.id, medalType);
}

const athleteById = new Map<number, Athlete>();
for (const athlete of athletes) {
  athleteById.set(athlete.id, athlete);
}

// ---------------------------------------------------------------------------
// 4. The join. It replaces ID numbers with readable names.
//    This is the same idea as relationships in Power BI or a JOIN in SQL.
// ---------------------------------------------------------------------------

// Turns ONE fact record into ONE readable row.
// The "!" after .get(...) means "this ID definitely exists".
// That is safe because the conversion script checks every ID.
function joinOneRecord(record: MedalRecord, isScenario: boolean): MedalRow {
  const country = countryById.get(record.countryId)!;
  const event = eventById.get(record.eventId)!;
  const sport = sportById.get(record.sportId)!;
  const medalType = medalTypeById.get(record.medalTypeId)!;

  // Five original rows have no athlete, so the name can be null.
  let athleteName: string | null = null;
  if (record.athleteId !== null) {
    athleteName = athleteById.get(record.athleteId)!.name;
  }

  // Note: country and sport come from the medal record, not from the athlete sheet.
  // The two sometimes disagree in the workbook, and the medal record is more reliable.
  return {
    id: String(record.id),
    athleteId: record.athleteId,
    athleteName: athleteName,
    countryId: country.id,
    country: country.name,
    region: country.region,
    population: country.population,
    eventId: event.id,
    year: event.year,
    season: event.season,
    city: event.city,
    sportId: sport.id,
    sport: sport.name,
    medal: medalType.name as Medal,
    count: record.count,
    scenario: isScenario,
  };
}

// All 9,107 original rows, joined once.
export const originalRows: MedalRow[] = medalRecords.map((record) =>
  joinOneRecord(record, false),
);

// Turns the user's scenarios into rows that look like the original rows,
// so the same calculations and charts can use them.
export function joinScenarios(scenarios: Scenario[]): MedalRow[] {
  return scenarios.map((scenario) => {
    // A scenario has no athlete and no age.
    const record: MedalRecord = {
      id: 0,
      athleteId: null,
      countryId: scenario.countryId,
      eventId: scenario.eventId,
      sportId: scenario.sportId,
      medalTypeId: scenario.medalTypeId,
      age: null,
      count: scenario.count,
    };
    const row = joinOneRecord(record, true);
    row.id = scenario.id;
    return row;
  });
}

// ---------------------------------------------------------------------------
// 5. Small helpers used by the dropdowns.
// ---------------------------------------------------------------------------

// The sports that really took place at one Olympic edition.
// Example: Ice Hockey only appears at Winter Games.
export function sportsForEvent(eventId: number): NamedItem[] {
  return sports.filter((sport) =>
    originalRows.some((row) => row.eventId === eventId && row.sportId === sport.id),
  );
}

// Countries sorted A to Z. [...countries] makes a copy first,
// because .sort() would otherwise change the original array.
export const countriesByName: Country[] = [...countries].sort((first, second) =>
  first.name.localeCompare(second.name),
);

// The workbook uses short region codes. These are friendlier names for the screen.
export const regionLabels: Record<string, string> = {
  'ASIA (EX. NEAR EAST)': 'Asia',
  'C.W. OF IND. STATES': 'Commonwealth of Independent States',
  'EASTERN EUROPE': 'Eastern Europe',
  'WESTERN EUROPE': 'Western Europe',
  'NEAR EAST': 'Near East',
  'NORTHERN AFRICA': 'Northern Africa',
  'SUB-SAHARAN AFRICA': 'Sub-Saharan Africa',
  'NORTHERN AMERICA': 'Northern America',
  'LATIN AMER. & CARIB': 'Latin America & Caribbean',
  OCEANIA: 'Oceania',
  BALTICS: 'Baltics',
};

// ---------------------------------------------------------------------------
// 6. Scenarios: checking, loading and saving the user's what-if entries.
//    They are stored in localStorage, a small storage area inside the browser.
//    The original workbook data is never changed.
// ---------------------------------------------------------------------------

// The name under which the browser stores our list.
const STORAGE_KEY = 'olympic-explorer-scenarios-v1';

export const MAX_MEDAL_COUNT = 10000;

// Checks that a value really is a valid Scenario.
// We need this for two reasons:
//   1. to validate what the user typed in the form
//   2. to validate what we read back from the browser, which could be old or broken
// "value is Scenario" tells TypeScript that after a true result it can trust the type.
export function isScenario(value: unknown): value is Scenario {
  if (typeof value !== 'object' || value === null) return false;
  const scenario = value as Scenario;

  // The ID must be non-empty text.
  if (typeof scenario.id !== 'string' || scenario.id.length === 0) return false;

  // Country, edition and medal type must exist in our data.
  if (!countries.some((country) => country.id === scenario.countryId)) return false;
  if (!events.some((event) => event.id === scenario.eventId)) return false;
  if (!medalTypes.some((medalType) => medalType.id === scenario.medalTypeId))
    return false;

  // The sport must have taken place at the chosen edition (no Ice Hockey in summer).
  const allowedSports = sportsForEvent(scenario.eventId);
  if (!allowedSports.some((sport) => sport.id === scenario.sportId)) return false;

  // The count must be a whole number from 1 to 10,000.
  if (!Number.isInteger(scenario.count)) return false;
  if (scenario.count < 1 || scenario.count > MAX_MEDAL_COUNT) return false;

  return true;
}

// What loadScenarios gives back: the saved rows, plus a warning message if needed.
export interface SavedScenarios {
  rows: Scenario[];
  message: string;
}

// Reads the saved scenarios from the browser.
// try/catch stops the app from crashing if storage is blocked or the text is broken.
export function loadScenarios(): SavedScenarios {
  try {
    const text = localStorage.getItem(STORAGE_KEY);
    if (!text) {
      return { rows: [], message: '' }; // nothing saved yet
    }

    // localStorage only stores text, so we turn the text back into data.
    const parsed: unknown = JSON.parse(text);
    if (!Array.isArray(parsed) || !parsed.every(isScenario)) {
      throw new Error('Invalid saved data');
    }

    // Every entry must have its own unique ID.
    const uniqueIds = new Set(parsed.map((scenario) => scenario.id));
    if (uniqueIds.size !== parsed.length) {
      throw new Error('Duplicate IDs in saved data');
    }

    return { rows: parsed, message: '' };
  } catch {
    return {
      rows: [],
      message:
        'Your saved what-if entries could not be read, so they are not shown. ' +
        'The original data still works. Adding a new entry will replace the old list.',
    };
  }
}

// Saves the list in the browser. Returns '' on success or a warning message on failure.
export function saveScenarios(rows: Scenario[]): string {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    return '';
  } catch {
    return 'This browser is not letting the app save. Your changes will be lost when you reload the page.';
  }
}
