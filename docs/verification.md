# Verification record

Checked on 5 October 2026 with the included workbook.

## Automated checks

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
(pandas) and match `docs/source-checks.json`.

`npm run build` passes: the TypeScript check reports no errors and Vite creates `dist/`.
Vite warns about one large JavaScript file, because the charts and the data are bundled
together. That is acceptable for a dataset of this size.

## Browser checks

Run in headless Chromium at 1440, 900 and 390 pixels wide, with no console errors or
warnings.

| Step | Athlete medals | Gold | Medallists | Per million |
|---|---|---|---|---|
| Start | 9,529 | 3,143 | 6,955 | 1.72 |
| Summer | 8,005 | 2,631 | 5,910 | 1.45 |
| Summer + Ice Hockey | 0 | 0 | 0 | — (empty-state messages shown) |
| Region Oceania + Gold | 181 | 181 | 149 | 7.44 |
| Compare, Summer: Germany | 460 | 159 | 335 | 5.58 |
| Compare, Summer: Australia | 602 | 158 | 410 | 29.71 |
| Compare, Winter: Norway | 103 | 41 | 57 | 22.34 |
| Scenario +3 gold included | 9,532 | 3,146 | 6,955 | 1.72 |

Also checked: filters are kept when switching pages; a count of 1.5 is rejected;
editing a scenario to 5 survives a page reload; "Include scenarios" is off again after
a reload; deleting the scenario leaves an empty saved list.

## Conversion script

`scripts/convert_excel.py` checks unique IDs, links between sheets and whole-number
medal counts. Running it again on the workbook reproduces the JSON and CSV files
exactly. The workbook in `source/` is identical to the supplied one.

## Not checked

- Safari, Firefox and Edge were not tested, only Chromium.
- Power BI: no report file has been built and the DAX measures have not been run.

## Insight panel (added 14 October 2026)

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
