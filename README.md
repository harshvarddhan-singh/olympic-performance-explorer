# Olympic Performance Explorer

A small web app built with **React, TypeScript, HTML and CSS** from the Excel file
`Olympic Games Dataset.xlsx`. It lets a non-technical user explore athlete medals
from seven Olympic Games (2000–2012).

There is no backend, no database, no router and no login. Everything runs in the browser.

## How to run it

You need Node.js (version 22 or newer). Then, in this folder:

```sh
npm install     # downloads the libraries (only needed once)
npm run dev     # starts the app and prints a local address to open
```

Other commands:

```sh
npm test        # runs the automatic checks of the calculations
npm run build   # checks the TypeScript and creates the final app in dist/
npm run format  # tidies the code layout with Prettier
```

## What the app does

- **Overview** – five filters, four KPI cards, a "What stands out" panel, a top-10
  countries chart, medals per Olympic edition and a top-10 athletes table.
- **What stands out** – up to three plain-English observations that change with the
  filters: scale versus population, reliance on one sport, and how much team sports
  inflate athlete-medal totals. Each one ends with a "Keep in mind" caveat.
- **Compare** – two countries side by side for Summer or Winter Games: the same four
  KPIs, their top sports and a trend line for each, plus one comparison sentence.
- **Scenarios** – add, edit and delete hypothetical "what-if" medal results. They are
  saved in the browser and only affect the numbers when "Include scenarios" is on.
  This is the "add or edit data" requirement of the task.

## Where to find things

```
index.html                 the single HTML page; React draws inside <div id="root">
src/
  main.tsx                 starts React
  App.tsx                  state (user choices), header, navigation, page switch
  App.css                  all styling, in 13 commented sections
  types.ts                 TypeScript descriptions of all data shapes
  data.ts                  loads the JSON tables and joins them by ID
  calculations.ts          filtering, KPIs, rankings, trends (pure functions)
  calculations.test.ts     tests that compare our numbers with the Excel workbook
  insights.ts              writes the plain-English "What stands out" observations
  scenarios.ts             validates, loads and saves what-if entries (localStorage)
  pages/
    OverviewPage.tsx       calculates and lays out the Overview screen
    ComparePage.tsx        calculates and lays out the Compare screen
  components/
    DataNote.tsx           the warning about athlete medals
    FilterBar.tsx          the five dropdowns
    KpiCards.tsx           the four number cards (used on both pages)
    TopCountriesChart.tsx  stacked bar chart
    InsightSpotlight.tsx   shows the "What stands out" observations
    EditionTrendChart.tsx  line chart (one line, or two when comparing)
    TopAthletesTable.tsx   HTML table
    ScenarioEditor.tsx     the form and list for what-if entries
  data/                    six JSON files, one per Excel sheet
scripts/convert_excel.py   creates the JSON (and Power BI CSV) files from Excel
source/                    an unchanged copy of the workbook
docs/                      interview guide and verification notes
power-bi/                  CSV files, DAX measures and notes for the Power BI part
```

## How the data flows

```
Excel workbook
   │  scripts/convert_excel.py (run once)
   ▼
six JSON files in src/data
   │  data.ts joins them by ID
   ▼
originalRows (9,107 readable rows, never changed)
   │  App.tsx adds scenario rows if the switch is on
   ▼
rows ──► filterMedals(rows, filters) ──► selected rows
                                             │  calculations.ts
                                             ▼
                              KPI cards, charts and tables
```

The only things stored in React state are the **user's choices** (page, filters,
compare selection, scenarios, the include switch). Every number on screen is
calculated again from those choices each time something changes.

## Important facts about the data

- **Athlete medals, not official medals.** A team medal appears once for every team
  member, so totals are higher than the official medal table. The workbook has no
  event column, so official totals cannot be rebuilt.
- **We sum "Number of Medals won"**, we do not count rows. One row can hold several
  medals (9,107 rows but 9,529 medals).
- **Population is one snapshot**, not a value per Olympic year. "Medals per million"
  is a useful comparison, not a historically exact rate.
- **Five medal rows have no athlete.** They count as medals but not as medallists.
- **Country and sport come from the medal row.** The athlete sheet sometimes disagrees.
- **Scenario rows have no athlete.** They add medals but never add medallists or
  appear in the athlete table. The original data is never edited.

### How "medals per million" is calculated

- Overview: selected medals ÷ combined population of the countries that won medals in
  the selection × 1,000,000. Each country's population is counted once.
- Compare: the country's medals ÷ that country's population × 1,000,000.
- If a population is missing, the card shows "—".

## Changing the Excel data

Only needed if the workbook changes. Requires Python 3 with openpyxl:

```sh
python3 -m pip install -r scripts/requirements.txt
python3 scripts/convert_excel.py
npm test
```

The tests contain totals from the supplied workbook, so they need updating if the
data really changes.

## Not finished

The Power BI report file has not been built yet. The `power-bi/` folder only contains
the prepared CSV tables, DAX measures and a layout description.
