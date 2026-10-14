// TopAthletesTable.tsx shows the ten athletes with the most medals as an HTML table.

import { formatNumber } from '../calculations';
import type { AthleteTotal } from '../types';

interface TopAthletesTableProps {
  athletes: AthleteTotal[];
}

export default function TopAthletesTable({ athletes }: TopAthletesTableProps) {
  if (athletes.length === 0) {
    return <p className="empty">No known medallists match this selection.</p>;
  }

  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Athlete</th>
            <th>Country</th>
            <th>Sport</th>
            <th className="numeric">Athlete medals</th>
          </tr>
        </thead>
        <tbody>
          {/* The second argument of .map() is the position in the list (0, 1, 2 ...). */}
          {athletes.map((athlete, index) => (
            <tr key={athlete.id}>
              {/* padStart turns 1 into "01" so the ranks line up. */}
              <td className="rank">{String(index + 1).padStart(2, '0')}</td>
              <td className="athlete-name">{athlete.name}</td>
              <td>{athlete.countries.join(', ')}</td>
              <td>{athlete.sports.join(', ')}</td>
              <td className="numeric">{formatNumber(athlete.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
