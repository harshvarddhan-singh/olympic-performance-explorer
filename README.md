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

The whole app is **eight code files in one folder**. Each tab on screen has its own file.

```
src/
  App.tsx              starts React; remembers the user's choices; header and tabs
  Overview.tsx         the Overview tab (filters, bar chart, athletes table)
  Compare.tsx          the Compare tab (two countries side by side)
  Scenarios.tsx        the Scenarios tab (add / edit / delete what-if entries)
  shared.tsx           KPI cards, line chart and "What stands out" panel (used by two tabs)
  data.ts              data types, loading + joining the tables, saving scenarios
  calculations.ts      every number and every "What stands out" sentence
  calculations.test.ts tests that compare our numbers with the Excel workbook
  styles.css           all styling, in commented sections
  olympics.json        the six Excel sheets as data (made by convert_excel.py)

index.html                    the single HTML page; React draws inside <div id="root">
Olympic Games Dataset.xlsx    the original workbook, unchanged
convert_excel.py              turns the workbook into olympics.json and the Power BI CSVs
NOTES.md                      how to explain and demo the app, and how it was verified
power-bi/                     CSV files, DAX measures and notes for the Power BI part
```

The other files (`package.json`, `tsconfig.json`, `vite.config.ts`) are settings for
the tools. You rarely need to open them.

## How the data flows

```
Excel workbook
   │  convert_excel.py (run once)
   ▼
src/olympics.json (six tables)
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
python3 -m pip install openpyxl
python3 convert_excel.py
npm test
```

The tests contain totals from the supplied workbook, so they need updating if the
data really changes.

## Not finished

The Power BI report file has not been built yet. The `power-bi/` folder only contains
the prepared CSV tables, DAX measures and a layout description.
