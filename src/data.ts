// data.ts loads the six JSON tables and joins them into readable rows.
// This happens once, when the app starts. The original data never changes afterwards.

import medalData from './data/medals.json';
import athleteData from './data/athletes.json';
import countryData from './data/countries.json';
import eventData from './data/events.json';
import sportData from './data/sports.json';
import medalTypeData from './data/medalTypes.json';
import type {
  Athlete,
  Country,
  Medal,
  MedalRecord,
  MedalRow,
  NamedItem,
  OlympicEvent,
  Scenario,
} from './types';

// ---------------------------------------------------------------------------
// 1. The raw tables, with their TypeScript types.
// ---------------------------------------------------------------------------

export const countries: Country[] = countryData;
// "as" is needed here because JSON only knows "string", not our Season type.
export const events = eventData as OlympicEvent[];
export const sports: NamedItem[] = sportData;
export const medalTypes: NamedItem[] = medalTypeData;
const athletes: Athlete[] = athleteData;
const medalRecords: MedalRecord[] = medalData;

// ---------------------------------------------------------------------------
// 2. Lookup maps. A Map finds an item by its ID immediately,
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
// 3. The join. It replaces ID numbers with readable names.
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
// 4. Small helpers used by the dropdowns.
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
