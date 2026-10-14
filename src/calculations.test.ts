// calculations.test.ts checks that our numbers are correct.
// The expected values were calculated separately from the Excel workbook with Python,
// so a passing test means the app agrees with the source data.
//
// Run the tests with:  npm test

import { describe, expect, it, vi } from 'vitest';
import {
  emptyFilters,
  filterMedals,
  getCompareInsight,
  getCountryProfile,
  getDistinctMedallists,
  getEditionTrend,
  getGoldAthleteMedals,
  getMedalsPerMillion,
  getOverviewInsights,
  getTopAthletes,
  getTopCountries,
  getTotalAthleteMedals,
} from './calculations';
import {
  countries,
  events,
  isScenario,
  joinScenarios,
  loadScenarios,
  originalRows,
  saveScenarios,
} from './data';

describe('totals match the Excel workbook', () => {
  it('sums the medal count instead of counting rows', () => {
    expect(originalRows).toHaveLength(9107); // rows in the Medal Victories sheet
    expect(getTotalAthleteMedals(originalRows)).toBe(9529);
    expect(getGoldAthleteMedals(originalRows)).toBe(3143);
    expect(getDistinctMedallists(originalRows)).toBe(6955);
  });

  it('keeps the five rows that have no athlete', () => {
    const rowsWithoutAthlete = originalRows.filter((row) => row.athleteId === null);
    expect(rowsWithoutAthlete).toHaveLength(5);
  });

  it('matches the total of each Olympic edition', () => {
    const totals = getEditionTrend(originalRows, events).map((point) => point.total);
    //                     2000  2002 2004  2006 2008  2010 2012
    expect(totals).toEqual([2005, 478, 2004, 526, 2050, 520, 1946]);
  });

  it('matches the Summer and Winter totals', () => {
    const summer = filterMedals(originalRows, { ...emptyFilters, season: 'Summer' });
    const winter = filterMedals(originalRows, { ...emptyFilters, season: 'Winter' });
    expect(getTotalAthleteMedals(summer)).toBe(8005);
    expect(getTotalAthleteMedals(winter)).toBe(1524);
  });

  it('ranks countries and athletes correctly', () => {
    expect(getTopCountries(originalRows)[0]).toMatchObject({
      country: 'United States',
      total: 1312,
    });
    expect(getTopAthletes(originalRows)[0]).toMatchObject({
      name: 'Michael Phelps',
      total: 22,
    });

    const australia = originalRows.filter((row) => row.country === 'Australia');
    expect(getTotalAthleteMedals(australia)).toBe(609);
  });
});

describe('filters', () => {
  it('applies all five filters together', () => {
    // Use the first row as an example and filter for exactly its values.
    const example = originalRows[0];
    const selected = filterMedals(originalRows, {
      season: example.season,
      eventId: String(example.eventId),
      region: example.region,
      sportId: String(example.sportId),
      medal: example.medal,
    });

    expect(selected.length).toBeGreaterThan(0);
    for (const row of selected) {
      expect(row.season).toBe(example.season);
      expect(row.eventId).toBe(example.eventId);
      expect(row.region).toBe(example.region);
      expect(row.sportId).toBe(example.sportId);
      expect(row.medal).toBe(example.medal);
    }
  });

  it('returns nothing for an impossible combination', () => {
    // Edition 1 is Sydney 2000, which was a Summer Games.
    const selected = filterMedals(originalRows, {
      ...emptyFilters,
      season: 'Winter',
      eventId: '1',
    });
    expect(selected).toEqual([]);
  });
});

describe('medals per million', () => {
  const row = originalRows[0];

  it('counts the population of each country only once', () => {
    // Two rows of the same country: 5 medals / 1 million people = 5
    const sameCountry = [
      { ...row, count: 2, population: 1_000_000 },
      { ...row, count: 3, population: 1_000_000 },
    ];
    expect(getMedalsPerMillion(sameCountry)).toBe(5);

    // Two different countries: 6 medals / 3 million people = 2
    const twoCountries = [
      { ...row, count: 2, population: 1_000_000 },
      { ...row, countryId: 999, count: 4, population: 2_000_000 },
    ];
    expect(getMedalsPerMillion(twoCountries)).toBe(2);
  });

  it('gives no result when the population is missing or there are no rows', () => {
    expect(getMedalsPerMillion([{ ...row, population: null }])).toBeNull();
    expect(getMedalsPerMillion([])).toBeNull();
  });

  it('gives zero for a chosen country without medals', () => {
    const country = { ...countries[0], population: 1_000_000 };
    expect(getMedalsPerMillion([], country)).toBe(0);
  });
});

describe('country comparison', () => {
  it('keeps editions with zero medals in the trend', () => {
    const winterEvents = events.filter((event) => event.season === 'Winter');
    const trend = getEditionTrend([], winterEvents, [1, 2]);

    expect(trend).toHaveLength(3);
    for (const point of trend) {
      expect(point.a).toBe(0);
      expect(point.b).toBe(0);
    }
  });
});

describe('scenarios', () => {
  const first = originalRows[0];
  const validScenario = {
    id: 'test',
    countryId: first.countryId,
    eventId: first.eventId,
    sportId: first.sportId,
    medalTypeId: 1, // Gold
    count: 7,
  };

  it('adds medals but never adds athletes', () => {
    const combined = [...originalRows, ...joinScenarios([validScenario])];

    expect(getTotalAthleteMedals(combined)).toBe(9529 + 7);
    expect(getGoldAthleteMedals(combined)).toBe(3143 + 7);
    expect(getDistinctMedallists(combined)).toBe(6955);
    expect(getTopAthletes(combined)).toEqual(getTopAthletes(originalRows));
  });

  it('rejects invalid entries', () => {
    expect(isScenario(validScenario)).toBe(true);
    expect(isScenario({ ...validScenario, count: 1.5 })).toBe(false); // not a whole number
    expect(isScenario({ ...validScenario, count: 0 })).toBe(false); // too small
    expect(isScenario({ ...validScenario, countryId: -1 })).toBe(false); // unknown country
    // Edition 2 is a Winter Games and sport 1 is Swimming.
    expect(isScenario({ ...validScenario, eventId: 2, sportId: 1 })).toBe(false);
  });

  it('does not crash when browser storage is broken or blocked', () => {
    // Replace localStorage with a fake one that misbehaves.
    vi.stubGlobal('localStorage', {
      getItem: () => '{bad json',
      setItem: () => {
        throw new Error('blocked');
      },
    });

    expect(loadScenarios().rows).toEqual([]);
    expect(loadScenarios().message).not.toBe('');
    expect(saveScenarios([])).toContain('lost when you reload');

    vi.unstubAllGlobals();
  });
});

// The expected numbers below were calculated separately from the Excel workbook
// with Python (pandas), so these tests check that the sentences use correct values.
describe('insights', () => {
  const summer = filterMedals(originalRows, { ...emptyFilters, season: 'Summer' });
  const winter = filterMedals(originalRows, { ...emptyFilters, season: 'Winter' });

  it('contrasts volume with population for the whole dataset', () => {
    const [scale, sport, team] = getOverviewInsights(originalRows, false);
    // USA has the most; Australia is 30.05 per million vs 4.40 for the USA.
    expect(scale.text).toContain('The United States has the most athlete medals: 1,312');
    expect(scale.text).toContain(
      'Australia records 30.05 athlete medals per million people. That is 6.8 times the rate for the United States (4.40)',
    );
    // Netherlands relies most on one sport (Hockey 35.5%); China least (Diving 10.4%).
    expect(sport.text).toContain(
      'the Netherlands leans most on one sport: Hockey gives it 36%',
    );
    expect(sport.text).toContain('China is the most spread out');
    // Team sports: 2,754 of 9,529 = 28.9%, from 39% (Netherlands) to 5% (UK).
    expect(team.text).toContain('The nine selected team sports make up 29%');
    expect(team.text).toContain('the Netherlands gets the most from team sports (39%)');
    expect(team.text).toContain('the United Kingdom the least (5%)');
  });

  it('points to ice hockey in the Winter Games', () => {
    const [scale, sport] = getOverviewInsights(winter, false);
    // Canada and the USA both have 233 Winter athlete medals.
    expect(scale.text).toContain('Canada and the United States are joint top');
    expect(sport.text).toContain(
      'Finland leans most on one sport: Ice Hockey gives it 63%',
    );
    expect(sport.caveat).toContain('team sport');
  });

  it('only shows the population observation when one sport is selected', () => {
    expect(getOverviewInsights(summer, true)).toHaveLength(1);
    expect(getOverviewInsights([], false)).toEqual([]);
  });

  it('compares Canada and the USA in the Winter Games', () => {
    const canada = countries.find((country) => country.name === 'Canada')!;
    const usa = countries.find((country) => country.name === 'United States')!;
    const insight = getCompareInsight(
      getCountryProfile(
        winter.filter((row) => row.countryId === canada.id),
        canada,
      ),
      getCountryProfile(
        winter.filter((row) => row.countryId === usa.id),
        usa,
      ),
    )!;
    // Same volume (233 each), but gold is 149/233 = 64% vs 32/233 = 14%.
    expect(insight.text).toContain('the same number of athlete medals (233)');
    expect(insight.text).toContain('64% of athlete medals for Canada and 14%');
    expect(insight.text).toContain('similar totals can hide very different results.');
    expect(insight.caveat).toContain('Ice Hockey');
  });

  it('says nothing when the same country is chosen twice', () => {
    const profile = getCountryProfile([], countries[0]);
    expect(getCompareInsight(profile, profile)).toBeNull();
  });
});
