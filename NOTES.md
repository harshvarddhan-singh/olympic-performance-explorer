# Notes: explain, demonstrate and verify the app

## Explain it in a minute

"I built an explorer for athlete medals from seven Olympic Games. A user can filter the
data or compare two countries, also per million people. I noticed that every team
member has their own medal record, so I call the totals athlete medals and not official
medal counts. Users can add what-if scenarios, which are kept separate from the
original data. The app uses React state, TypeScript types and simple calculation
functions."

## Suggested reading order for the code

All code is in `src/`, with no sub-folders. Read the files in this order:

1. `data.ts` – what the data looks like (types), how the tables are joined, and how
   scenarios are saved.
2. `calculations.ts` – every number and every "What stands out" sentence.
3. `App.tsx` – state, the navigation, and where React starts.
4. `Overview.tsx` – the Overview tab: filters, charts and the athletes table.
5. `shared.tsx` – the KPI cards, line chart and insight panel used by both tabs.
6. `Compare.tsx` – the Compare tab.
7. `Scenarios.tsx` – the form for adding, editing and deleting what-if entries.
8. `styles.css` – styling, section by section.

## The concepts to be able to explain

| Concept               | Meaning                                                   | Where to point                                                                   |
| --------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Component             | A function that returns a piece of the screen             | `InsightSpotlight` (simplest) and `KpiCards` in `shared.tsx`                     |
| Props                 | Inputs a parent gives to a component                      | `KpiCardsProps` in `shared.tsx`                                                  |
| State                 | Values that change and are remembered                     | the five `useState` lines in `App.tsx`                                           |
| Lifting state up      | State lives in the parent so several children can use it  | `filters` in `App.tsx`, used by `OverviewPage` and `FilterBar` in `Overview.tsx` |
| Callback prop         | A child tells the parent that something changed           | `onChange` of `FilterBar` in `Overview.tsx`                                      |
| Controlled input      | The input always shows the value from state               | every `<select value=... onChange=...>`                                          |
| Derived data          | Calculated from state on each render, not stored          | top of `OverviewPage` in `Overview.tsx`                                          |
| Conditional rendering | Show something only if a condition is true                | `page === 'Overview' && ...` in `App.tsx`                                        |
| Lists and keys        | `.map()` turns an array into elements; each needs a `key` | `TopAthletesTable` in `Overview.tsx`                                             |
| Immutable updates     | Make a new array/object instead of changing the old one   | `[...rows, entry]` in `Scenarios.tsx`                                            |
| Interface             | Describes the fields of an object                         | section 1 of `data.ts`                                                           |
| Union type            | A value limited to a few exact options                    | `Season` and `Medal` in `data.ts`, `PageName` in `App.tsx`                       |
| `number \| null`      | A value that may be missing                               | `population` in `data.ts`                                                        |
| Type guard            | A runtime check that also informs TypeScript              | `isScenario` in `data.ts`                                                        |

## Why this architecture?

The dataset has only 9,107 medal rows, so ordinary array functions are fast enough.
JSON avoids reading Excel in the browser. `olympics.json` keeps the six tables separate,
like a Power BI star model.
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
  (`calculations.ts`) and the subtitle text in `Overview.tsx`.
- **Change a colour:** edit a variable in section 1 of `styles.css`, or a `fill` / `stroke`
  in a chart (`Overview.tsx` or `shared.tsx`).
- **Add a fifth KPI card (for example silver medals):** add a field to `KpiValues` in
  `calculations.ts`, calculate it in `getKpis`, add one object to the `cards` array of
  `KpiCards` in `shared.tsx`, and change the `4` to `5` in `grid-template-columns` of
  `.kpis` in `styles.css`.
- **Change a default:** edit `emptyFilters` in `calculations.ts` or `startSelection` in `App.tsx`.
- **Add a table column:** add a `<th>` and a `<td>` in `TopAthletesTable` (`Overview.tsx`).
- **Add a new filter:** add a field to `Filters`, one `if` line in `filterMedals`, and
  one `<label><select>` block in `FilterBar` (`Overview.tsx`).

## Be candid about AI and validation

"AI helped create the implementation and the tests. I checked the source structure,
compared the totals with the workbook, tried the filters and scenarios in the browser,
and read through the code so that I can explain where state lives and how the
calculations work." Only claim the parts you have personally reviewed and practised.

## Limits and sensible next steps

The workbook cannot produce an official medal table or true historical per-capita
rates. Some athlete records may merge people with the same name. Scenarios are stored
in one browser only. The Power BI report still has to be built in Power BI Desktop.

## Verification record

Checked on 5 October 2026 with the included workbook.

### Automated checks

`npm test` passes 14 tests. They cover:

- workbook totals: 9,107 rows; 9,529 athlete medals; 3,143 gold; 6,955 distinct
  medallists; five rows without an athlete;
- edition totals: 2,005, 478, 2,004, 526, 2,050, 520 and 1,946;
- Summer 8,005 and Winter 1,524;
- United States 1,312, Australia 609 and Michael Phelps 22;
- all five filters together, and an impossible combination;
- medals-per-million rules: each country counted once, missing population, zero medals;
- zero points kept in comparison trends;
- scenarios adding medals without adding medallists or changing athlete rankings;
- scenario validation and broken or blocked browser storage.

The expected totals were calculated independently from the Excel file with Python
(pandas) and match the totals printed by `convert_excel.py`.

`npm run build` passes: the TypeScript check reports no errors and Vite creates `dist/`.
Vite warns about one large JavaScript file, because the charts and the data are bundled
together. That is acceptable for a dataset of this size.

### Browser checks

Run in headless Chromium at 1440, 900 and 390 pixels wide, with no console errors or
warnings.

| Step                       | Athlete medals | Gold  | Medallists | Per million                    |
| -------------------------- | -------------- | ----- | ---------- | ------------------------------ |
| Start                      | 9,529          | 3,143 | 6,955      | 1.72                           |
| Summer                     | 8,005          | 2,631 | 5,910      | 1.45                           |
| Summer + Ice Hockey        | 0              | 0     | 0          | — (empty-state messages shown) |
| Region Oceania + Gold      | 181            | 181   | 149        | 7.44                           |
| Compare, Summer: Germany   | 460            | 159   | 335        | 5.58                           |
| Compare, Summer: Australia | 602            | 158   | 410        | 29.71                          |
| Compare, Winter: Norway    | 103            | 41    | 57         | 22.34                          |
| Scenario +3 gold included  | 9,532          | 3,146 | 6,955      | 1.72                           |

Also checked: filters are kept when switching pages; a count of 1.5 is rejected;
editing a scenario to 5 survives a page reload; "Include scenarios" is off again after
a reload; deleting the scenario leaves an empty saved list.

### Conversion script

`convert_excel.py` checks unique IDs, links between sheets and whole-number
medal counts. Running it again on the workbook reproduces the JSON and CSV files
exactly. The workbook in this folder is identical to the supplied one.

### Not checked

- Safari, Firefox and Edge were not tested, only Chromium.
- Power BI: no report file has been built and the DAX measures have not been run.

### Insight panel (added 14 October 2026)

`npm test` now passes 19 tests. Five new tests check the "What stands out" sentences
against values calculated separately with Python from the workbook:

- All data: USA 1,312 athlete medals, Australia 6.8 times higher per million
  (30.05 vs 4.40); Netherlands relies most on one sport (Hockey 36%), China least
  (Diving 10%); team sports are 29% of athlete medals, from 39% (Netherlands) to 5% (UK).
- Winter: Canada and the USA share the lead (233 each); Finland gets 63% from Ice Hockey.
- Compare, Winter, Canada vs USA: gold share 64% vs 14%.
- With one sport selected only the population observation is shown; an empty
  selection shows none; the same country twice shows no comparison.

Browser check in headless Chromium at 1440 and 390 pixels, no console errors:
start 9,529 / 3,143 / 6,955 / 1.72; Summer 8,005; Oceania + Gold 181 / 149 / 7.44;
Compare Germany 460 and Australia 602; a +3 gold Norway scenario gives 9,532 athlete
medals and still 6,955 medallists, and Michael Phelps stays first in the athlete table.
