import React, { useState, useEffect } from "react";
import {
  X,
  Users,
  UserPlus,
  ArrowLeftRight,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Shield,
  Search,
} from "lucide-react";
import { Court, Player, SessionSettings } from "../types";

interface CourtOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  court: Court | null;
  courts: Court[];
  players: Player[];
}
export const CourtOverrideModal: React.FC<CourtOverrideModalProps> = ({
  isOpen,
  onClose,
  court,
  courts,
  players,
  settings,
  onSaveOverride,
  onAddQuickPlayer,
}) => {
  const [team1, setTeam1] = useState<string[]>([]);
  const [team2, setTeam2] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [quickName, setQuickName] = useState("");
  const [quickSkill, setQuickSkill] = useState("3.5");
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);

  useEffect(() => {
    if (court) {
      setTeam1(court.team1 || []);
      setTeam2(court.team2 || []);
    } else {
      setTeam1([]);
      setTeam2([]);
    }
    setSearchQuery("");
  }, [court, isOpen]);

  if (!isOpen || !court) return null;

  const maxPerTeam = settings.gameType === "singles" ? 1 : 2;
  const playerMap = new Map<string, Player>(players.map((p) => [p.id, p]));

  const assignedSet = new Set([...team1, ...team2]);

  const handleTogglePlayer = (playerId: string) => {
    if (team1.includes(playerId)) {
      setTeam1(team1.filter((id) => id !== playerId));
    } else if (team2.includes(playerId)) {
      setTeam2(team2.filter((id) => id !== playerId));
    } else {
      // Add to team 1 if not full, otherwise team 2
      if (team1.length < maxPerTeam) {
        setTeam1([...team1, playerId]);
      } else if (team2.length < maxPerTeam) {
        setTeam2([...team2, playerId]);
      }
    }
  };

  const handleSwapTeams = () => {
    const temp = [...team1];
    setTeam1([...team2]);
    setTeam2(temp);
  };

  const handleClearTeams = () => {
    setTeam1([]);
    setTeam2([]);
  };

  const handleRandomFill = () => {
    const activePlayerIds = new Set(
      courts
        .filter((c) => c.status === "playing" && c.id !== court.id)
        .flatMap((c) => [...(c.team1 || []), ...(c.team2 || [])]),
    );

    const available = players.filter(
      (p) =>
        !assignedSet.has(p.id) &&
        !activePlayerIds.has(p.id) &&
        p.status !== "sitting_out",
    );
    const needed = maxPerTeam * 2 - assignedSet.size;
    if (needed <= 0 || available.length === 0) return;

    const shuffled = [...available].sort(() => Math.random() - 0.5);
    let t1 = [...team1];
    let t2 = [...team2];

    for (const p of shuffled) {
      if (t1.length < maxPerTeam) {
        t1.push(p.id);
      } else if (t2.length < maxPerTeam) {
        t2.push(p.id);
      }
    }

    setTeam1(t1);
    setTeam2(t2);
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim() || !onAddQuickPlayer) return;

    try {
      setIsAddingPlayer(true);
      const newId = await onAddQuickPlayer(quickName.trim(), quickSkill);
      if (typeof newId === "string") {
        if (team1.length < maxPerTeam) {
          setTeam1((prev) => [...prev, newId]);
        } else if (team2.length < maxPerTeam) {
          setTeam2((prev) => [...prev, newId]);
        }
      }
      setQuickName("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsAddingPlayer(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSaveOverride(court.id, team1, team2);
      setIsSaving(false);
      onClose();
    } catch (err) {
      console.error("Failed to override court participants:", err);
      setIsSaving(false);
      alert("Failed to update court participants. Please try again.");
    }
  };

  const activePlayerIds = new Set(
    courts
      .filter((c) => c.status === "playing" && c.id !== court.id)
      .flatMap((c) => [...(c.team1 || []), ...(c.team2 || [])]),
  );

  const filteredPlayers = players.filter((p) => {
    const isAlreadyOnThisCourt = team1.includes(p.id) || team2.includes(p.id);

    const isActiveOnAnotherCourt = activePlayerIds.has(p.id);

    return (
      (isAlreadyOnThisCourt || !isActiveOnAnotherCourt) &&
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-6 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
                <span>Override Participants: {court.name}</span>
              </h2>
              <p className="text-xs text-slate-400">
                Manually pick or swap players for Team 1 and Team 2 (
                {settings.gameType === "doubles"
                  ? "Doubles: 2 vs 2"
                  : "Singles: 1 vs 1"}
                )
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            id="close-override-modal-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Active Teams Lineup Board */}
          <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
            {/* Team 1 Box */}
            <div className="md:col-span-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span>
                    Team 1 ({team1.length}/{maxPerTeam})
                  </span>
                </span>
                {team1.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setTeam1([])}
                    className="text-[10px] text-slate-400 hover:text-rose-400"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="space-y-1.5 min-h-[85px] bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex flex-col justify-center">
                {team1.length === 0 ? (
                  <div className="text-center text-xs text-slate-500 py-3">
                    Click players below to assign
                  </div>
                ) : (
                  team1.map((pid) => {
                    const p = playerMap.get(pid);
                    return (
                      <div
                        key={pid}
                        onClick={() => handleTogglePlayer(pid)}
                        className="flex items-center justify-between p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs font-semibold cursor-pointer hover:bg-emerald-900/40 transition-colors"
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold"
                            style={{
                              backgroundColor: p?.avatarColor || "#10b981",
                            }}
                          >
                            {p?.name.charAt(0) || "P"}
                          </div>
                          <span className="truncate">
                            {p?.name || "Unknown"}
                          </span>
                        </div>
                        <X className="w-3.5 h-3.5 text-emerald-400 hover:text-rose-400" />
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Middle Swap Controls */}
            <div className="md:col-span-1 flex md:flex-col items-center justify-center gap-2">
              <button
                type="button"
                onClick={handleSwapTeams}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 transition-colors border border-slate-700"
                title="Swap Team 1 and Team 2"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
            </div>

            {/* Team 2 Box */}
            <div className="md:col-span-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span>
                    Team 2 ({team2.length}/{maxPerTeam})
                  </span>
                </span>
                {team2.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setTeam2([])}
                    className="text-[10px] text-slate-400 hover:text-rose-400"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="space-y-1.5 min-h-[85px] bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex flex-col justify-center">
                {team2.length === 0 ? (
                  <div className="text-center text-xs text-slate-500 py-3">
                    Click players below to assign
                  </div>
                ) : (
                  team2.map((pid) => {
                    const p = playerMap.get(pid);
                    return (
                      <div
                        key={pid}
                        onClick={() => handleTogglePlayer(pid)}
                        className="flex items-center justify-between p-2 rounded-lg bg-blue-950/40 border border-blue-500/40 text-blue-200 text-xs font-semibold cursor-pointer hover:bg-blue-900/40 transition-colors"
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold"
                            style={{
                              backgroundColor: p?.avatarColor || "#3b82f6",
                            }}
                          >
                            {p?.name.charAt(0) || "P"}
                          </div>
                          <span className="truncate">
                            {p?.name || "Unknown"}
                          </span>
                        </div>
                        <X className="w-3.5 h-3.5 text-blue-400 hover:text-rose-400" />
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Quick Lineup Helpers */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <button
              type="button"
              onClick={handleRandomFill}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Fill Empty Spots from Queue</span>
            </button>

            <button
              type="button"
              onClick={handleClearTeams}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 border border-slate-700 font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Lineup</span>
            </button>
          </div>

          {/* Player Selection List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Session Players ({players.length})
              </span>

              {/* Search Bar */}
              <div className="relative w-48">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search player..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
              {filteredPlayers.map((p) => {
                const isT1 = team1.includes(p.id);
                const isT2 = team2.includes(p.id);
                const isSelected = isT1 || isT2;

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleTogglePlayer(p.id)}
                    className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isT1
                        ? "bg-emerald-950/60 border-emerald-500 text-emerald-200"
                        : isT2
                          ? "bg-blue-950/60 border-blue-500 text-blue-200"
                          : "bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600"
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white font-bold shrink-0"
                        style={{ backgroundColor: p.avatarColor || "#10b981" }}
                      >
                        {p.name.charAt(0)}
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-semibold truncate">
                          {p.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {isT1
                            ? "Team 1"
                            : isT2
                              ? "Team 2"
                              : `${p.wins}W / ${p.losses}L`}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <CheckCircle2
                        className={`w-4 h-4 shrink-0 ${isT1 ? "text-emerald-400" : "text-blue-400"}`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Add Player Inline */}
          {onAddQuickPlayer && (
            <form
              onSubmit={handleQuickAdd}
              className="pt-2 border-t border-slate-800 flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Quick add new player name..."
                value={quickName}
                onChange={(e) => setQuickName(e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <select
                value={quickSkill}
                onChange={(e) => setQuickSkill(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="3.0">3.0</option>
                <option value="3.5">3.5</option>
                <option value="4.0">4.0</option>
                <option value="4.5+">4.5+</option>
              </select>
              <button
                type="submit"
                disabled={!quickName.trim() || isAddingPlayer}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-1 shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs sm:text-sm transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs sm:text-sm shadow-lg transition-all flex items-center space-x-2"
            id="confirm-override-btn"
          >
            {isSaving ? (
              <span>Updating Court...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Lineup & Update Court</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
