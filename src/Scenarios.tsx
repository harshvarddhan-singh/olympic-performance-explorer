// Scenarios.tsx is the "Scenarios" tab: the "add or edit data" part of the app.
// The user can add, edit and delete hypothetical ("what-if") medal results.
//
// The saved list lives in App.tsx, because the other pages need it too.
// This component only keeps the form the user is currently filling in (the "draft").
// Checking and saving the entries happens in data.ts (section 6).

import { useState } from 'react';
import {
  countriesByName,
  events,
  isScenario,
  MAX_MEDAL_COUNT,
  medalTypes,
  sports,
  sportsForEvent,
  type Scenario,
} from './data';

interface ScenarioEditorProps {
  rows: Scenario[];
  onChange: (newRows: Scenario[]) => void;
}

// The values of an empty form. An empty id means "this is a new entry".
function createEmptyDraft(): Scenario {
  const firstEvent = events[0];
  const germany = countriesByName.find((country) => country.name === 'Germany')!;
  return {
    id: '',
    countryId: germany.id,
    eventId: firstEvent.id,
    sportId: sportsForEvent(firstEvent.id)[0].id,
    medalTypeId: medalTypes[0].id,
    count: 1,
  };
}

// Small helpers to show names instead of ID numbers in the table.
function countryName(id: number): string {
  return countriesByName.find((country) => country.id === id)?.name ?? 'Unknown';
}
function eventLabel(id: number): string {
  const event = events.find((item) => item.id === id);
  return event ? `${event.year} · ${event.city}` : 'Unknown';
}
function sportName(id: number): string {
  return sports.find((sport) => sport.id === id)?.name ?? 'Unknown';
}
function medalName(id: number): string {
  return medalTypes.find((medalType) => medalType.id === id)?.name ?? 'Unknown';
}

export default function ScenarioEditor({ rows, onChange }: ScenarioEditorProps) {
  // draft = what is currently in the form. message = feedback shown under the form.
  const [draft, setDraft] = useState<Scenario>(createEmptyDraft);
  const [message, setMessage] = useState('');

  // We are editing when the draft already has an ID.
  const isEditing = draft.id !== '';

  // Only sports that took place at the chosen edition can be selected.
  const availableSports = sportsForEvent(draft.eventId);

  // Runs when the user presses "Add scenario" or "Save changes".
  function handleSubmit(e: React.FormEvent) {
    // By default the browser reloads the page when a form is sent. We stop that.
    e.preventDefault();

    // A new entry gets a random unique ID from the browser.
    const entry: Scenario = { ...draft, id: draft.id || crypto.randomUUID() };

    if (!isScenario(entry)) {
      setMessage(
        `Please enter a whole number of medals between 1 and ${MAX_MEDAL_COUNT.toLocaleString('en-US')}.`,
      );
      return;
    }

    if (isEditing) {
      // Replace the old entry with the edited one and keep all the others.
      onChange(rows.map((row) => (row.id === entry.id ? entry : row)));
      setMessage('Changes saved.');
    } else {
      // Make a new array with the new entry at the end.
      // We never change the old array directly. React needs a new one to notice the change.
      onChange([...rows, entry]);
      setMessage('Added. Switch on “Include scenarios” to see it in the charts.');
    }

    setDraft(createEmptyDraft());
  }

  function handleEdit(row: Scenario) {
    // Copy the row into the form.
    setDraft({ ...row });
    setMessage('You are now editing this entry.');
  }

  function handleDelete(row: Scenario) {
    // Keep every row except the one that was deleted.
    onChange(rows.filter((item) => item.id !== row.id));
    // If that row was open in the form, clear the form as well.
    if (draft.id === row.id) {
      setDraft(createEmptyDraft());
    }
    setMessage('Entry deleted.');
  }

  function handleCancel() {
    setDraft(createEmptyDraft());
    setMessage('Edit cancelled.');
  }

  // When the edition changes, the old sport may not exist there.
  // So we also switch to the first sport of the new edition.
  function handleEventChange(eventId: number) {
    setDraft({ ...draft, eventId: eventId, sportId: sportsForEvent(eventId)[0].id });
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>Try a what-if result</h2>
          <p>
            Add made-up medals to see how the numbers would change. The real data is never
            touched.
          </p>
        </div>
        <span className="pill">
          {rows.length} saved {rows.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      <p className="scenario-note">
        Pick a country, Games and sport, then enter how many medals to add. These entries
        have no athlete, so they never change the medallist count or the athletes table.
        They are saved in this browser only.
      </p>

      {/* ----- The form ----- */}
      <form onSubmit={handleSubmit} className="scenario-form">
        <label>
          Country
          {/* e.target.value is always text, so Number() converts it to a number. */}
          <select
            value={draft.countryId}
            onChange={(e) => setDraft({ ...draft, countryId: Number(e.target.value) })}
          >
            {countriesByName.map((country) => (
              <option key={country.id} value={country.id}>
                {country.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Edition
          <select
            value={draft.eventId}
            onChange={(e) => handleEventChange(Number(e.target.value))}
          >
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.year} {event.season} · {event.city}
              </option>
            ))}
          </select>
        </label>

        <label>
          Sport
          <select
            value={draft.sportId}
            onChange={(e) => setDraft({ ...draft, sportId: Number(e.target.value) })}
          >
            {availableSports.map((sport) => (
              <option key={sport.id} value={sport.id}>
                {sport.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Medal
          <select
            value={draft.medalTypeId}
            onChange={(e) => setDraft({ ...draft, medalTypeId: Number(e.target.value) })}
          >
            {medalTypes.map((medalType) => (
              <option key={medalType.id} value={medalType.id}>
                {medalType.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Medal count
          {/* While the box is empty the number is NaN ("not a number"),
              so we show an empty box instead. */}
          <input
            type="number"
            min="1"
            max={MAX_MEDAL_COUNT}
            step="1"
            required
            value={Number.isNaN(draft.count) ? '' : draft.count}
            onChange={(e) => setDraft({ ...draft, count: e.target.valueAsNumber })}
          />
        </label>

        <div className="form-actions">
          <button className="primary" type="submit">
            {isEditing ? 'Save changes' : 'Add scenario'}
          </button>
          {/* The Cancel button only appears while editing. */}
          {isEditing && (
            <button type="button" onClick={handleCancel}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* role="status" makes screen readers announce the message. */}
      <p role="status" className="status">
        {message}
      </p>

      {/* ----- The list of saved scenarios ----- */}
      {rows.length === 0 ? (
        <div className="empty">
          No what-if entries yet. Add one above to see how it changes the charts.
        </div>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Country</th>
                <th>Edition</th>
                <th>Sport</th>
                <th>Medal</th>
                <th>Count</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{countryName(row.countryId)}</td>
                  <td>{eventLabel(row.eventId)}</td>
                  <td>{sportName(row.sportId)}</td>
                  <td>{medalName(row.medalTypeId)}</td>
                  <td>{row.count}</td>
                  <td className="actions">
                    <button type="button" onClick={() => handleEdit(row)}>
                      Edit
                    </button>
                    <button type="button" onClick={() => handleDelete(row)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
