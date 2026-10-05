'use client';

import { useMemo, useState } from 'react';
import { inferGroupCategory, type GroupCategory } from '@/lib/championship/qualification';

type Category = GroupCategory;

interface Team {
  name: string;
  players: string[];
  category?: Category;
}

interface DraftGroup {
  key: string;
  name: string;
  teamIndices: number[];
  category: Category;
}

interface Props {
  tournamentId: string;
  teams: Team[];
  initialGroups?: { name: string; teamIndices: number[]; category?: Category }[];
  onSaved?: () => void;
  onConfirmed?: () => void;
}

function labelFor(index: number) {
  return index < 26 ? `Group ${String.fromCharCode(65 + index)}` : `Group ${index + 1}`;
}

function CategoryPill({ category }: { category?: Category }) {
  if (category === 'men') return <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/40 text-blue-300 border border-blue-700/40">Men</span>;
  if (category === 'women') return <span className="text-[10px] px-1.5 py-0.5 rounded bg-pink-900/40 text-pink-300 border border-pink-700/40">Women</span>;
  return <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 border border-slate-700">Unset</span>;
}

function TeamChip({ team, index }: { team: Team; index: number }) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', String(index));
        e.dataTransfer.effectAllowed = 'move';
      }}
      className="cursor-grab active:cursor-grabbing bg-slate-900/80 border border-white/10 rounded-lg px-3 py-2"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-white truncate">{team.name}</p>
        <CategoryPill category={team.category} />
      </div>
      <p className="text-[11px] text-slate-500 truncate">{team.players?.join(' & ')}</p>
    </div>
  );
}

export default function GroupBuilder({ tournamentId, teams, initialGroups, onSaved, onConfirmed }: Props) {
  const [groups, setGroups] = useState<DraftGroup[]>(() => {
    if (initialGroups?.length) {
      return initialGroups.map((g, i) => {
        const name = g.name || labelFor(i);
        return {
          key: `${name}-${i}`,
          name,
          teamIndices: [...g.teamIndices],
          category: inferGroupCategory(g),
        };
      });
    }
    return [
      { key: 'a', name: 'Group A', teamIndices: [], category: 'men' },
      { key: 'b', name: 'Group B', teamIndices: [], category: 'men' },
    ];
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const assigned = useMemo(() => new Set(groups.flatMap((g) => g.teamIndices)), [groups]);
  const unassigned = teams.map((_, i) => i).filter((i) => !assigned.has(i));

  const moveTeam = (teamIndex: number, dest: 'pool' | number) => {
    setGroups((prev) =>
      prev.map((g, i) => {
        const without = g.teamIndices.filter((t) => t !== teamIndex);
        if (dest === 'pool' || dest !== i) return { ...g, teamIndices: without };
        return { ...g, teamIndices: without.includes(teamIndex) ? without : [...without, teamIndex] };
      })
    );
  };

  const onDrop = (dest: 'pool' | number) => (e: React.DragEvent) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('text/plain');
    const teamIndex = Number(raw);
    if (!Number.isInteger(teamIndex)) return;
    moveTeam(teamIndex, dest);
  };

  const payload = () => groups.map((g) => ({ name: g.name, teamIndices: g.teamIndices, category: g.category }));

  const saveDraft = async () => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/groups`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ groups: payload() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save groups');
      setMessage('Group draw saved. You can keep editing until you confirm.');
      onSaved?.();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const confirmGroups = async () => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/groups/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ groups: payload() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to confirm groups');
      setMessage(`${data.matchesAdded} group matches created.`);
      onConfirmed?.();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-sm text-slate-300">
        <p className="font-semibold text-white mb-1">Build the group draw</p>
        <p>Drag teams into groups and mark each group Men or Women. After you confirm, every team plays every other team in its group once.</p>
        <p className="text-slate-400 mt-2 text-xs">
          Men: 1st → Gold · 2nd–4th → Silver · 5th–6th → Bronze.
          Women: 1st–2nd → Gold · 3rd–4th → Silver · 5th–6th → Bronze.
          A 5-team group has no 6th place, so only 5th goes to Bronze.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setGroups((prev) => {
            const name = labelFor(prev.length);
            return [...prev, { key: `g-${Date.now()}`, name, teamIndices: [], category: inferGroupCategory({ name }) }];
          })}
          className="text-xs px-3 py-1.5 rounded bg-slate-700 text-white hover:bg-slate-600"
        >
          + Add group
        </button>
        <button
          onClick={saveDraft}
          disabled={busy}
          className="text-xs px-3 py-1.5 rounded border border-slate-500 text-slate-200 hover:bg-slate-700 disabled:opacity-50"
        >
          Save draft
        </button>
        <button
          onClick={confirmGroups}
          disabled={busy || unassigned.length > 0 || groups.some((g) => g.teamIndices.length < 2)}
          className="text-xs px-3 py-1.5 rounded bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-50"
        >
          Confirm groups & create matches
        </button>
        <span className="text-xs text-slate-500 self-center">
          {unassigned.length} unassigned · {groups.length} groups
        </span>
      </div>

      {message && <div className="text-sm text-cyan-400">{message}</div>}
      {error && <div className="text-sm text-red-400">{error}</div>}

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop('pool')}
        className="bg-slate-900/50 border border-dashed border-slate-600 rounded-xl p-4 min-h-[88px]"
      >
        <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Unassigned teams</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {unassigned.map((i) => <TeamChip key={i} team={teams[i]} index={i} />)}
          {unassigned.length === 0 && <p className="text-slate-600 text-sm">All teams are in a group.</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {groups.map((group, gi) => (
          <div
            key={group.key}
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop(gi)}
            className={`bg-slate-800 border rounded-xl p-4 min-h-[180px] ${group.category === 'women' ? 'border-pink-700/40' : 'border-slate-700'}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <input
                value={group.name}
                onChange={(e) => setGroups((prev) => prev.map((g, i) => i === gi ? { ...g, name: e.target.value } : g))}
                className="flex-1 min-w-0 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-amber-300 font-semibold"
              />
              <span className="text-xs text-slate-500 shrink-0">{group.teamIndices.length} teams</span>
              {group.teamIndices.length === 0 && (
                <button
                  onClick={() => setGroups((prev) => prev.filter((_, i) => i !== gi))}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 mb-3">
              <button
                type="button"
                onClick={() => setGroups((prev) => prev.map((g, i) => i === gi ? { ...g, category: 'men' } : g))}
                className={`text-[10px] px-2 py-1 rounded border ${group.category === 'men' ? 'bg-blue-700 text-white border-blue-500' : 'border-blue-700/50 text-blue-300'}`}
              >
                Men
              </button>
              <button
                type="button"
                onClick={() => setGroups((prev) => prev.map((g, i) => i === gi ? { ...g, category: 'women' } : g))}
                className={`text-[10px] px-2 py-1 rounded border ${group.category === 'women' ? 'bg-pink-700 text-white border-pink-500' : 'border-pink-700/50 text-pink-300'}`}
              >
                Women
              </button>
              <span className="text-[10px] text-slate-500">
                {group.category === 'women' ? '1–2 Gold · 3–4 Silver · 5–6 Bronze' : '1st Gold · 2–4 Silver · 5–6 Bronze'}
              </span>
            </div>
            <div className="space-y-2">
              {group.teamIndices.map((ti) => (
                <TeamChip key={ti} team={teams[ti]} index={ti} />
              ))}
              {group.teamIndices.length === 0 && (
                <p className="text-slate-600 text-sm py-6 text-center">Drop teams here</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
