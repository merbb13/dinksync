import React from 'react';
import { X, Trophy, History, Clock } from 'lucide-react';
import { Match } from '../types';

interface MatchHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  matches: Match[];
}

export const MatchHistoryModal: React.FC<MatchHistoryModalProps> = ({
  isOpen,
  onClose,
  matches
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-slate-100 relative max-h-[85vh] flex flex-col">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          id="close-match-history-modal-btn"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4 border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xl">
            📜
          </div>
          <div>
            <h2 className="text-xl font-bold">Match History</h2>
            <p className="text-xs text-slate-400">
              Completed matches from this session ({matches.length})
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {matches.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              No recorded matches yet. Play and finish games on court to record history!
            </div>
          ) : (
            matches.map((m) => {
              const isFinished = m.status === 'completed';
              const team1Win = m.winnerTeam === 1;
              const team2Win = m.winnerTeam === 2;

              const timeStr = m.completedAt
                ? new Date(m.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : new Date(m.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <div
                  key={m.id}
                  className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-emerald-400">{m.courtName}</span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{timeStr}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-11 gap-2 items-center text-sm font-semibold">
                    <div className={`col-span-5 text-left ${team1Win ? 'text-amber-300 font-bold' : 'text-slate-300'}`}>
                      {m.team1Names?.join(' & ') || 'Team 1'}
                      {team1Win && ' 🏆'}
                    </div>

                    <div className="col-span-1 text-center font-mono font-black text-slate-400 bg-slate-900 rounded py-0.5 text-xs">
                      {m.team1Score} - {m.team2Score}
                    </div>

                    <div className={`col-span-5 text-right ${team2Win ? 'text-amber-300 font-bold' : 'text-slate-300'}`}>
                      {team2Win && '🏆 '}
                      {m.team2Names?.join(' & ') || 'Team 2'}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};
