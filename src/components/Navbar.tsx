import React from "react";
import {
  Users,
  Settings,
  Activity,
  Layers,
  ChevronDown,
  Sparkles,
  Trophy,
  PlusCircle,
} from "lucide-react";

interface NavbarProps {
  sessionTitle: string;
  onOpenSettings: () => void;
  onOpenSessionManager: () => void;
  onOpenWelcome: () => void;
  onOpenEndSession: () => void;
  activePlayersCount: number;
  activeCourtsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  sessionTitle,
  onOpenSettings,
  onOpenSessionManager,
  onOpenWelcome,
  onOpenEndSession,
  activePlayersCount,
  activeCourtsCount,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Rebranded Name */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xl shadow-inner">
              🏓
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-bold text-lg sm:text-xl tracking-tight text-slate-100 flex items-center gap-1.5">
                  <span className="text-emerald-400 font-extrabold tracking-tight">
                    DinkSync
                  </span>
                  <span className="text-amber-400 font-bold text-xs px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                    PRO
                  </span>
                  <span className="text-slate-600 font-normal text-sm hidden md:inline">
                    |
                  </span>
                  <button
                    onClick={onOpenSessionManager}
                    className="hover:text-emerald-300 font-medium text-sm hidden md:flex items-center space-x-1.5 text-slate-300 transition-colors bg-slate-800/80 hover:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700/80"
                    title="Switch or Manage Sessions"
                  >
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="max-w-[150px] lg:max-w-[220px] truncate">
                      {sessionTitle}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Live
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden xs:block">
                Pickleball Open Play Rotation & Match Engine
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="hidden lg:flex items-center space-x-6 text-sm text-slate-300">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>
                <strong className="text-white font-semibold">
                  {activePlayersCount}
                </strong>{" "}
                Players Ready
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-amber-400" />
              <span>
                <strong className="text-white font-semibold">
                  {activeCourtsCount}
                </strong>{" "}
                Courts Active
              </span>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* End Session Button (Podium & Results) */}
            <button
              onClick={onOpenEndSession}
              className="px-3 py-1.5 text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 rounded-lg transition-all flex items-center space-x-1.5 text-xs font-bold shadow-sm"
              title="End session and display top 3 player podium awards"
              id="end-session-nav-btn"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>End Session</span>
            </button>

            {/* Create Session / Welcome Launcher */}
            <button
              onClick={onOpenWelcome}
              className="px-3 py-1.5 text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-all flex items-center space-x-1.5 text-xs font-bold shadow-sm"
              title="Create a New Session or Quick Start"
              id="welcome-session-btn"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">+ New Session</span>
              <span className="xs:hidden">+ New</span>
            </button>

            {/* Session Manager / Switcher Button */}
            <button
              onClick={onOpenSessionManager}
              className="px-2.5 sm:px-3 py-1.5 text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500/50 rounded-lg transition-all flex items-center space-x-1.5 text-xs font-semibold"
              title="Manage & Switch Sessions"
              id="manage-sessions-btn"
            >
              <Layers className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Sessions</span>
            </button>

            {/* Session Settings Button */}
            <button
              onClick={onOpenSettings}
              className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors flex items-center space-x-1.5 text-xs font-semibold"
              title="Court & Scoring Settings"
              id="session-settings-btn"
            >
              <Settings className="w-4 h-4 text-amber-400" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
