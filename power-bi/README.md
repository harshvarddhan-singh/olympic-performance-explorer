# Power BI handoff

This folder contains the actual six source tables, ready for import, DAX measures, a theme and an exact one-page report specification. This is not a finished PBIX. Power BI Desktop cannot run natively on the Mac used here, so the DAX and report must be checked in Power BI on Windows. No native Power BI rendering or execution is claimed.

## 1. Import and model

In Power BI Desktop, Get data → Text/CSV. Load `medals.csv`, `athletes.csv`, `countries.csv`, `events.csv`, `sports.csv`, `medalTypes.csv` from this folder. Use UTF-8 and comma delimiters. These CSVs were extracted directly from the included Excel workbook. Alternatively import the six original Excel tables and rename their columns to the CSV headers.

Set all ID fields, count, age, population, year and birthYear to Whole number. Empty athleteId, age and birthYear values stay null. All other fields are Text. Do not replace missing athleteId with zero. Keep `id` unique on every dimension. Do not summarize ID columns.

Create these active one-to-many relationships, using **single** filter direction from the lookup to medals:

| Lookup (one side) | Fact (many side) |
|---|---|
| countries[id] | medals[countryId] |
| athletes[id] | medals[athleteId] |
| events[id] | medals[eventId] |
| sports[id] | medals[sportId] |
| medalTypes[id] | medals[medalTypeId] |

Do not relate athlete country or sport text to the country/sport dimensions. The medal fact's IDs are authoritative. Five medals rows have no athlete: keep them. Disable automatic date/time if desired; year is a numeric category, not a full date.

## 2. Measures

Copy each expression from `measures.dax` into a separate New measure. Use count formats `#,0`, per-million format `0.00`, and percentage `0.0%`. The Overview population denominator counts each country with medals in the current selection once. Unknown or nonpositive population produces blank, not an inflated rate. Do not average country-level ratios.

Scenarios are intentionally browser-only. The BI tables contain original records. If scenarios are later imported, leave athleteId null, retain the source/scenario flag, and use that flag to explicitly exclude them from the distinct-athlete measure.

## 3. One-page report (16:9, 1280 × 720)

Title: **Olympic performance, 2000–2012**

Subtitle/message: **Population changes the perspective: the USA leads total athlete medals; smaller countries can lead per person.** This is a dataset-wide observation. Slicers can change the leaders.

| Position (x, y, width, height) | Visual and fields |
|---|---|
| 24, 85, 300, 55 | events[season] slicer, single select, default Summer |
| 340, 85, 300, 55 | events[year] dropdown slicer, all years |
| 656, 85, 300, 55 | countries[region] dropdown slicer |
| 24, 155, 292, 85 | Athlete Medals card |
| 332, 155, 292, 85 | Gold Athlete Medals card |
| 640, 155, 292, 85 | Distinct Medallists card |
| 948, 155, 308, 85 | Medals per Million card |
| 24, 260, 600, 330 | Horizontal bar: countries[name], Athlete Medals; Top N 10 by Athlete Medals, descending |
| 648, 260, 608, 330 | Horizontal bar: countries[name], Medals per Million; Top N 10 by that measure, descending |
| 24, 605, 1232, 85 | Text explaining athlete medals and population snapshot; small validation note if desired |

The pair of rankings communicates one message. Add athlete-medal totals as tooltips on the per-capita chart. Ensure the single-season selection is visible, and all slicers filter both charts and cards. Apply `theme.json` through View → Themes → Browse for themes. Keep gold/silver/bronze colors explicit if adding a stacked medal chart later.

For interview live changes, replacing the per-capita chart with a line chart is simple: X = events[year], Y = Athlete Medals, legend = countries[name], then select two countries in a slicer. Always select one season.

## 4. Check before saving PBIX

Clear all slicers temporarily. Expected original totals: **9,529 athlete medals; 3,143 gold; 6,955 distinct medallists; 108 medal-winning countries**. Row count is 9,107 and is deliberately different from the medal total. Summer is 8,005, Winter 1,524. Reconcile each year with `../docs/source-checks.json`.

United States total = 1,312; Australia = 609. Test Gold and Silver filters: the gold measure must respect Silver and show zero. Verify a country filter changes the population denominator. Restore Summer as the default, and save as `Olympic Performance Explorer.pbix`.

The assignment requires a native Power BI dashboard/report and live DAX changes. The final Windows import, visual creation, DAX execution check and PBIX save remain necessary.

Microsoft references: [Desktop requirements](https://learn.microsoft.com/power-bi/fundamentals/desktop-get-the-desktop), [star schema](https://learn.microsoft.com/power-bi/guidance/star-schema), [TREATAS](https://learn.microsoft.com/dax/treatas-function-dax), [DISTINCTCOUNTNOBLANK](https://learn.microsoft.com/dax/distinctcountnoblank-function-dax).
