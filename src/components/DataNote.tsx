// DataNote.tsx shows the most important warning about this dataset.
// It is the simplest kind of component: no props, no state, just HTML.

export default function DataNote() {
  return (
    <div className="data-note">
      <span className="note-icon" aria-hidden="true">
        i
      </span>
      <p>
        <strong>Athlete medals, not the official medal table.</strong> Team members each
        contribute medals. Population is a single snapshot, not a value for each Olympic
        year.
      </p>
    </div>
  );
}
