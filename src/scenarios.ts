// scenarios.ts checks, loads and saves the user's "what-if" entries.
// They are stored in localStorage, a small storage area inside the browser.
// The original workbook data is never changed.

import { countries, events, medalTypes, sportsForEvent } from './data';
import type { Scenario } from './types';

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
        'Saved scenarios could not be read. Original data is available. ' +
        'Saving a new entry will replace the unreadable saved data.',
    };
  }
}

// Saves the list in the browser. Returns '' on success or a warning message on failure.
export function saveScenarios(rows: Scenario[]): string {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    return '';
  } catch {
    return 'Browser storage is unavailable. These changes will last only until you reload this page.';
  }
}
