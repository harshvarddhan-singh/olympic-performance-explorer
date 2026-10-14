"""
convert_excel.py - turns the Excel workbook into files the app can use.

It reads the six sheets and writes:
  - src/olympics.json          one file with all six tables (used by the React app)
  - one CSV file per sheet in power-bi/   (used by Power BI)

It also checks the data (unique IDs, no broken links between sheets)
and prints some totals so we can compare them with the numbers the app shows.

The workbook itself is never changed.

Run it from the project folder:
    python3 convert_excel.py
or with another workbook:
    python3 convert_excel.py "/path/to/Olympic Games Dataset.xlsx"

It needs the openpyxl library:  python3 -m pip install openpyxl
"""

import csv
import hashlib
import json
import sys
from pathlib import Path

import openpyxl

# The project folder (the folder this script is in).
ROOT = Path(__file__).resolve().parent

# Use the path given on the command line, or the workbook in the project folder.
if len(sys.argv) > 1:
    SOURCE = Path(sys.argv[1])
else:
    SOURCE = ROOT / "Olympic Games Dataset.xlsx"

workbook = openpyxl.load_workbook(SOURCE, read_only=True, data_only=True)


def read_sheet(sheet_name, columns):
    """Read one sheet and return a list of dictionaries (one per row).

    "columns" maps the Excel column name to the shorter name used in the app,
    for example {"Number of Medals won": "count"}.
    """
    rows = iter(workbook[sheet_name].values)
    headers = next(rows)  # the first row holds the column names

    records = []
    for row in rows:
        if row[0] is None:  # skip empty rows at the end of a sheet
            continue

        record = {}
        for excel_name, app_name in columns.items():
            value = row[headers.index(excel_name)]
            if isinstance(value, str):
                value = value.strip()  # remove spaces around text
            record[app_name] = value
        records.append(record)

    return records


# ---------------------------------------------------------------------------
# 1. Read the six sheets
# ---------------------------------------------------------------------------

tables = {
    "medals": read_sheet(
        "Medal Victories",
        {
            "ID": "id",
            "ATHLETE_ID": "athleteId",
            "COUNTRY_ID": "countryId",
            "OLYMPIC_EVENT_ID": "eventId",
            "SPORTS_ID": "sportId",
            "MEDAL_TYPE_ID": "medalTypeId",
            "Age of Athlete": "age",
            "Number of Medals won": "count",
        },
    ),
    "athletes": read_sheet(
        "Athletes",
        {
            "ID": "id",
            "Athlete": "name",
            "Country": "country",
            "Athlete Sport": "sport",
            "Year of birth": "birthYear",
        },
    ),
    "countries": read_sheet(
        "Country Data",
        {"ID": "id", "Country": "name", "Region": "region", "Population": "population"},
    ),
    "events": read_sheet(
        "Olympic Events",
        {
            "ID": "id",
            "Year": "year",
            "Type of Games": "season",
            "Location": "city",
            "Country": "hostCountry",
        },
    ),
    "sports": read_sheet("Sport Types", {"ID": "id", "Sport": "name"}),
    "medalTypes": read_sheet("Medal Types", {"ID": "id", "Medal Type": "name"}),
}

medals = tables["medals"]

# ---------------------------------------------------------------------------
# 2. Check the data
# ---------------------------------------------------------------------------

# Every ID must be unique inside its own table.
for table_name, rows in tables.items():
    ids = {row["id"] for row in rows}
    assert len(ids) == len(rows), f"Duplicate IDs in {table_name}"

# Every ID used in the medals table must exist in its lookup table.
links = [
    ("athleteId", "athletes"),
    ("countryId", "countries"),
    ("eventId", "events"),
    ("sportId", "sports"),
    ("medalTypeId", "medalTypes"),
]
known_ids = {table_name: {row["id"] for row in rows} for table_name, rows in tables.items()}

for medal in medals:
    count = medal["count"]
    assert isinstance(count, (int, float)), f"Medal count is not a number: {medal}"
    assert count > 0 and count == int(count), f"Medal count is not a whole number: {medal}"

    for column, table_name in links:
        value = medal[column]
        # The athlete is allowed to be missing (five rows in the workbook).
        if column == "athleteId" and value is None:
            continue
        assert value in known_ids[table_name], f"Unknown {column}: {medal}"

# ---------------------------------------------------------------------------
# 3. Write the JSON and CSV files
# ---------------------------------------------------------------------------

# All six tables go into one JSON file: {"medals": [...], "athletes": [...], ...}
json_text = json.dumps(tables, ensure_ascii=False, separators=(",", ":"))
(ROOT / "src" / "olympics.json").write_text(json_text + "\n")

for table_name, rows in tables.items():
    csv_path = ROOT / "power-bi" / f"{table_name}.csv"
    with csv_path.open("w", newline="", encoding="utf-8-sig") as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)

# ---------------------------------------------------------------------------
# 4. Print totals that the app's tests are compared against
# ---------------------------------------------------------------------------


def total_medals(rows):
    """Add up the "count" column. One row can hold more than one medal."""
    return sum(row["count"] for row in rows)


by_medal = {}
for medal_type in tables["medalTypes"]:
    matching = [row for row in medals if row["medalTypeId"] == medal_type["id"]]
    by_medal[medal_type["name"]] = total_medals(matching)

by_edition = {}
for event in tables["events"]:
    matching = [row for row in medals if row["eventId"] == event["id"]]
    by_edition[str(event["year"])] = total_medals(matching)

by_season = {}
for season in ["Summer", "Winter"]:
    season_event_ids = {event["id"] for event in tables["events"] if event["season"] == season}
    matching = [row for row in medals if row["eventId"] in season_event_ids]
    by_season[season] = total_medals(matching)

summary = {
    "sourceSha256": hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
    "tableRows": {table_name: len(rows) for table_name, rows in tables.items()},
    "athleteMedals": total_medals(medals),
    "distinctMedallists": len({row["athleteId"] for row in medals if row["athleteId"] is not None}),
    "missingAthleteRows": sum(1 for row in medals if row["athleteId"] is None),
    "medalWinningCountries": len({row["countryId"] for row in medals}),
    "byMedal": by_medal,
    "byEdition": by_edition,
    "bySeason": by_season,
}

print(json.dumps(summary, indent=2))
