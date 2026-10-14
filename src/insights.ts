// insights.ts turns the numbers into a few plain-English observations
// ("so what?" sentences) for the Overview and Compare pages.
//
// Every observation has the same four parts:
//   1. what the data shows (observation)
//   2. what it is compared with (comparison)
//   3. what it might mean (interpretation)
//   4. what to be careful about (caveat)
//
// The functions only describe patterns. The data cannot tell us WHY a country
// did well, so the sentences avoid words like "because" or "caused by".

import {
  formatNumber,
  getMedalsPerMillion,
  getTopCountries,
  getTotalAthleteMedals,
} from './calculations';
import type { Country, Insight, MedalRow } from './types';

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

// 26.8 -> "27%". Whole numbers read more naturally in a sentence.
function rounded(share: number): string {
  return `${Math.round(share)}%`;
}

// ---------------------------------------------------------------------------
// 1. A short profile of one country, built from its rows
// ---------------------------------------------------------------------------

export interface CountryProfile {
  name: string;
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
    name: country.name,
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
// 2. Overview page: up to three observations about the current selection
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
    'Per million uses one population snapshot, so it is a comparison indicator, ' +
    'not an exact rate for each Games.';

  // Two countries can share first place (for example Canada and the USA in Winter).
  const second = top[1];
  const sharedLead = second.total === leader.total;
  let volumeText =
    `${leader.name} leads on volume with ${formatNumber(leader.total)} athlete medals ` +
    `(${rounded(percent(leader.total, selectionTotal))} of this selection).`;
  if (sharedLead) {
    volumeText =
      `${leader.name} and ${second.name} share the lead on volume with ` +
      `${formatNumber(leader.total)} athlete medals each.`;
  }

  // Case A: the same country leads on both measures.
  if (efficient.name === leader.name) {
    return {
      title: 'Big and efficient',
      text:
        `${volumeText} ${leader.name} also has the most athlete medals per million ` +
        `people among ${groupName(top)}, so here scale and efficiency point the same way.`,
      caveat: caveat,
    };
  }

  // Case B: different leaders. Compare their population-adjusted rates precisely.
  const times = (efficient.perMillion / leader.perMillion).toFixed(1);
  return {
    title: 'Scale is not the same as efficiency',
    text:
      `${volumeText} After adjusting for population, ${efficient.name} records ` +
      `${efficient.perMillion.toFixed(2)} athlete medals per million people—${times} times ` +
      `the rate for ${leader.name} (${leader.perMillion.toFixed(2)}). ` +
      'Which country looks "best" depends on the question being asked.',
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
    'A high share can mean a real specialist strength, but it also means the total ' +
    'depends heavily on how well one sport goes.';
  if (TEAM_SPORTS.includes(narrowest.topSport)) {
    caveat =
      `${narrowest.topSport} is a team sport, and every squad member gets a medal record, ` +
      'so a single tournament result can add dozens of athlete medals.';
  }

  return {
    title: 'One sport or many?',
    text:
      `For ${narrowest.name}, ${narrowest.topSport} provides ${rounded(narrowest.topSportShare)} ` +
      `of its athlete medals, the highest reliance on one sport among ${groupName(top)}. ` +
      `${broadest.name} is the most spread out: its biggest sport ` +
      `(${broadest.topSport}) provides only ${rounded(broadest.topSportShare)}.`,
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
    title: 'Team sports change the picture',
    text:
      `The nine selected team sports account for ` +
      `${rounded(percent(teamTotal, selectionTotal))} of athlete-medal records here. ` +
      `Among ${groupName(top)} this ranges from ${rounded(most.teamSportShare)} for ${most.name} to ` +
      `${rounded(least.teamSportShare)} for ${least.name}. Because every player is counted, ` +
      'team-sport countries look larger here than in the official medal table, and ' +
      'countries that win mostly individual events look smaller.',
    caveat:
      'Team sports here means football, hockey, ice hockey, handball, water polo, ' +
      'basketball, volleyball, baseball and softball. Relays and rowing crews add ' +
      'several records too, so the real effect is a little larger.',
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
// 3. Compare page: one observation about the two chosen countries
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
      `${a.name} and ${b.name} have the same number of athlete medals (${formatNumber(a.total)}).`,
    );
  } else {
    volumeLeader = a.total > b.total ? a : b;
    const other = volumeLeader === a ? b : a;
    sentences.push(
      `${volumeLeader.name} has more athlete medals ` +
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
      sentences.push(`${efficient.name} also leads per million people ${numbers}.`);
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
      sentences.push('Similar totals can hide very different results.');
    }
  }

  // The caveat warns about team sports when one of them dominates a country's total.
  let caveat =
    'Per million uses one population snapshot, so treat it as a comparison indicator.';
  for (const profile of [a, b]) {
    if (profile.total > 0 && TEAM_SPORTS.includes(profile.topSport)) {
      caveat =
        `${profile.topSport} provides ${rounded(profile.topSportShare)} of the athlete medals for ` +
        `${profile.name}. It is a team sport, so one tournament result counts once per ` +
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
