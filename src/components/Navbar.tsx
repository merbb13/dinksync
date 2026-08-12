import React from 'react';
import { Users, Settings, Activity } from 'lucide-react';

interface NavbarProps {
  sessionTitle: string;
  onOpenSettings: () => void;
  activePlayersCount: number;
  activeCourtsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  sessionTitle,
  onOpenSettings,
  activePlayersCount,
  activeCourtsCount
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & App Name */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xl shadow-inner">
              🏓
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-bold text-lg sm:text-xl tracking-tight text-slate-100 flex items-center gap-1.5">
                  <span className="text-emerald-400 font-extrabold">DinkSync</span>
                  <span className="text-slate-400 font-normal text-sm hidden md:inline">|</span>
                  <span className="text-slate-300 font-medium text-sm hidden md:inline">{sessionTitle}</span>
                </h1>
                <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden xs:block">
                Organizer Court & Rotation Manager
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="hidden md:flex items-center space-x-6 text-sm text-slate-300">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span><strong className="text-white font-semibold">{activePlayersCount}</strong> Players Ready</span>
            </div>
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-amber-400" />
              <span><strong className="text-white font-semibold">{activeCourtsCount}</strong> Courts Active</span>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Session Settings Button */}
            <button
              onClick={onOpenSettings}
              className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors flex items-center space-x-1.5 text-xs font-semibold"
              title="Court & Session Settings"
              id="session-settings-btn"
            >
              <Settings className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Settings</span>
            </button>

          </div>
        </div>
      </div>
    </header>
  );
};

