# Power BI report

`Olympic Performance Explorer.pbix` is the completed three-page Power BI Desktop
report built from `../Olympic Games Dataset.xlsx`.

## Pages

### 1. Overview

- Season, Games year and region slicers
- Athlete medals, gold share, distinct medallists, medals per million and top-10
  concentration KPIs
- Top countries by athlete-medal volume
- Top countries by medals per million, with a 50-medal minimum to reduce
  small-sample distortion
- Dynamic DAX narrative that updates with the slicers

### 2. What drives success

- Medals per million by GDP-per-capita band
- Share of countries in each wealth band that won a medal
- Country scatter plot using GDP per capita, medals per million, region and medal
  volume
- Host medals at home compared with the host country's average at other Games of the
  same season
- Host-uplift table and dynamic narrative

These visuals show associations and should not be interpreted as proof that wealth or
hosting caused the result.

### 3. Country profile

- Country, season and date controls
- Athlete medals, rank, gold share, distinct medallists and medals per million
- Medal mix by Games
- Top sports
- Dynamic country summary

## Data model

The report uses a star schema with `FactMedals` connected to country, athlete, Games,
sport, medal-type and date dimensions. Measures are kept in a dedicated `_Measures`
table and grouped into core, per-person, ranking, host-advantage and narrative folders.

The source represents **athlete medals**, not the official event-level medal table. A
team medal appears once for every team member. Population and GDP are snapshot values,
so per-person and wealth analysis are useful comparisons rather than historically exact
rates. Five medal rows have no athlete ID; they remain in medal totals but are excluded
from distinct-medallist calculations.

## Validation values

With all filters cleared:

- 9,107 medal records
- 9,529 athlete medals
- 3,143 gold athlete medals
- 6,955 distinct medallists
- 108 medal-winning countries

Summer contains 8,005 athlete medals, 2,631 gold athlete medals and 5,910 distinct
medallists. United States has 1,312 athlete medals across all Games and Australia has
609.

## Opening and refreshing

Open the PBIX with Power BI Desktop on Windows. The imported data is embedded, so the
saved report can be viewed without reconnecting to the workbook. If a refresh reports
that the workbook path has changed, open **Transform data → Data source settings** and
point the source to the copy of `Olympic Games Dataset.xlsx` in the repository root.

The CSV files, original starter DAX and theme remain in this folder as supporting
artifacts.
