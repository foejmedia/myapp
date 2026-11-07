import { localDay } from '../lib/day';
import { PER_PLANT } from '../lib/engine';
import type { DuaTree, SavedState, Settings } from '../lib/storage';

export type Action =
  | { type: 'hydrate'; state: SavedState }
  | { type: 'count'; dhikrId: string; at: number }
  | { type: 'setSettings'; patch: Partial<Settings> }
  | { type: 'addDuaTree'; tree: DuaTree }
  | { type: 'removeDuaTree'; id: string }
  | { type: 'importState'; state: SavedState }
  | { type: 'backedUp'; at: string }
  | { type: 'reset'; state: SavedState };

export function reducer(state: SavedState, action: Action): SavedState {
  switch (action.type) {
    case 'hydrate':
    case 'importState':
    case 'reset':
      return action.state;
    case 'count': {
      const { dhikrId, at } = action;
      const total = (state.totals[dhikrId] ?? 0) + 1;
      const day = localDay(at);
      const reached = total % PER_PLANT === 0;
      return {
        ...state,
        totals: { ...state.totals, [dhikrId]: total },
        milestones: reached
          ? { ...state.milestones, [dhikrId]: [...(state.milestones[dhikrId] ?? []), new Date(at).toISOString()] }
          : state.milestones,
        days: { ...state.days, [day]: { ...state.days[day], [dhikrId]: (state.days[day]?.[dhikrId] ?? 0) + 1 } },
      };
    }
    case 'setSettings':
      return { ...state, settings: { ...state.settings, ...action.patch } };
    case 'addDuaTree':
      return { ...state, duaTrees: [...state.duaTrees, action.tree] };
    case 'removeDuaTree':
      return { ...state, duaTrees: state.duaTrees.filter(t => t.id !== action.id) };
    case 'backedUp':
      return { ...state, lastBackupAt: action.at };
    default:
      return state;
  }
}
