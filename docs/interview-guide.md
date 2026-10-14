# Understand and demonstrate the app

## Explain it in a minute

"I built an explorer for athlete medals from seven Olympic Games. A user can filter the
data or compare two countries, also per million people. I noticed that every team
member has their own medal record, so I call the totals athlete medals and not official
medal counts. Users can add what-if scenarios, which are kept separate from the
original data. The app uses React state, TypeScript types and simple calculation
functions."

## Suggested reading order for the code

1. `index.html` and `src/main.tsx` – how the app starts.
2. `src/types.ts` – what the data looks like.
3. `src/data.ts` – how the six tables are joined.
4. `src/calculations.ts` – how every number is calculated.
5. `src/App.tsx` – state and page switching.
6. `src/pages/OverviewPage.tsx` – how a page uses calculations and components.
7. `src/components/KpiCards.tsx` and `FilterBar.tsx` – props in and events out.
8. `src/components/ScenarioEditor.tsx` and `src/scenarios.ts` – forms and saving.
9. `src/App.css` – styling, section by section.

## The concepts to be able to explain

| Concept | Meaning | Where to point |
|---|---|---|
| Component | A function that returns a piece of the screen | `DataNote.tsx` (simplest), `KpiCards.tsx` |
| Props | Inputs a parent gives to a component | `KpiCardsProps` in `KpiCards.tsx` |
| State | Values that change and are remembered | the five `useState` lines in `App.tsx` |
| Lifting state up | State lives in the parent so several children can use it | `filters` in `App.tsx`, used by `OverviewPage` and `FilterBar` |
| Callback prop | A child tells the parent that something changed | `onChange` in `FilterBar.tsx` |
| Controlled input | The input always shows the value from state | every `<select value=... onChange=...>` |
| Derived data | Calculated from state on each render, not stored | top of `OverviewPage.tsx` |
| Conditional rendering | Show something only if a condition is true | `page === 'Overview' && ...` in `App.tsx` |
| Lists and keys | `.map()` turns an array into elements; each needs a `key` | `TopAthletesTable.tsx` |
| Immutable updates | Make a new array/object instead of changing the old one | `[...rows, entry]` in `ScenarioEditor.tsx` |
| Interface | Describes the fields of an object | `types.ts` |
| Union type | A value limited to a few exact options | `Season`, `Medal`, `PageName` in `types.ts` |
| `number \| null` | A value that may be missing | `population` in `types.ts` |
| Type guard | A runtime check that also informs TypeScript | `isScenario` in `scenarios.ts` |

## Why this architecture?

The dataset has only 9,107 medal rows, so ordinary array functions are fast enough.
JSON avoids reading Excel in the browser. The six tables mirror a Power BI star model.
One state variable switches the page, so a router is unnecessary. Recharts draws the
charts. Plain CSS is enough for the layout. There is no server to deploy.

## Three-minute demonstration

1. Overview, no filters, scenarios off. Show 9,529 athlete medals and explain the caveat.
2. Select Summer, then a sport. All cards, charts and the table respond.
3. Reset filters. Explain why Summer and Winter have separate trend charts.
4. Compare Germany and Australia in Summer. Point at medals per million. Switch to
   Winter and pick Norway.
5. Scenarios: add Germany / 2000 Sydney / Swimming / Gold / 3. Turn "Include scenarios"
   on. Totals rise by three, distinct medallists stay the same. Edit it to 5, reload the
   page to show it was saved, then delete it.
6. Open `calculations.ts` and explain `getTotalAthleteMedals` and `getDistinctMedallists`.

## Practice these live changes

- **Top 10 → Top 5 countries:** change `.slice(0, 10)` in `getTopCountries`
  (`calculations.ts`) and the subtitle text in `OverviewPage.tsx`.
- **Change a colour:** edit a variable in section 1 of `App.css`, or a `fill` / `stroke`
  in a chart component.
- **Add a fifth KPI card (for example silver medals):** add a field to `KpiValues` in
  `types.ts`, calculate it in `getKpis`, add one object to the `cards` array in
  `KpiCards.tsx`, and change the `4` to `5` in `grid-template-columns` of `.kpis` in `App.css`.
- **Change a default:** edit `emptyFilters` in `types.ts` or `startSelection` in `App.tsx`.
- **Add a table column:** add a `<th>` and a `<td>` in `TopAthletesTable.tsx`.
- **Add a new filter:** add a field to `Filters`, one `if` line in `filterMedals`, and
  one `<label><select>` block in `FilterBar.tsx`.

## Be candid about AI and validation

"AI helped create the implementation and the tests. I checked the source structure,
compared the totals with the workbook, tried the filters and scenarios in the browser,
and read through the code so that I can explain where state lives and how the
calculations work." Only claim the parts you have personally reviewed and practised.

## Limits and sensible next steps

The workbook cannot produce an official medal table or true historical per-capita
rates. Some athlete records may merge people with the same name. Scenarios are stored
in one browser only. The Power BI report still has to be built in Power BI Desktop.
