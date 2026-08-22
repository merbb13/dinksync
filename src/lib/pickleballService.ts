import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  writeBatch,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Player,
  Court,
  Match,
  Session,
  SessionSettings,
  PlayerStatus
} from '../types';

export const DEFAULT_SESSION_ID = 'open-play-main';

const AVATAR_COLORS = [
  '#0284c7', '#0d9488', '#16a34a', '#d97706', '#dc2626',
  '#9333ea', '#c026d3', '#2563eb', '#4f46e5', '#059669'
];

export function getRandomColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

// Safe document fetcher that handles offline/unconnected Firestore states gracefully
async function safeGetDoc(docRef: any) {
  try {
    return await getDoc(docRef);
  } catch (err: any) {
    console.warn(`safeGetDoc offline fallback for ${docRef?.path || 'unknown'}:`, err?.message || err);
    return null;
  }
}

// Ensure default session exists
export async function initializeSessionIfNeeded(sessionId: string = DEFAULT_SESSION_ID): Promise<Session> {
  const sessionRef = doc(db, 'sessions', sessionId);
  const snap = await safeGetDoc(sessionRef);

  if (snap && snap.exists()) {
    return snap.data() as Session;
  }

  const cleanTitle = sessionId === DEFAULT_SESSION_ID
    ? 'DinkSync Open Play'
    : sessionId.split('_')[0].replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const newSession: Session = {
    id: sessionId,
    title: cleanTitle || 'DinkSync Open Play',
    passcode: '1234',
    status: 'active',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    courtCount: 3,
    courtNames: ['Court 1', 'Court 2', 'Court 3'],
    settings: {
      targetScore: 11,
      winByTwo: true,
      gameType: 'doubles',
      rotationMode: 'random'
    }
  };

  try {
    await setDoc(sessionRef, newSession, { merge: true });

    // Initialize courts
    for (let i = 1; i <= newSession.courtCount; i++) {
      const courtRef = doc(db, 'sessions', sessionId, 'courts', `court_${i}`);
      const courtData: Court = {
        id: `court_${i}`,
        number: i,
        name: `Court ${i}`,
        status: 'vacant',
        team1: [],
        team2: [],
        team1Score: 0,
        team2Score: 0
      };
      await setDoc(courtRef, courtData, { merge: true });
    }
  } catch (err) {
    console.warn('Error setting session document in Firestore:', err);
  }

  return newSession;
}

// Real-time Subscriptions
export function subscribeSession(sessionId: string, callback: (session: Session | null) => void) {
  const sessionRef = doc(db, 'sessions', sessionId);
  return onSnapshot(sessionRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as Session);
    } else {
      callback(null);
    }
  }, (err) => {
    console.error('Error listening to session:', err);
  });
}

export function subscribePlayers(sessionId: string, callback: (players: Player[]) => void) {
  const playersRef = collection(db, 'sessions', sessionId, 'players');
  return onSnapshot(playersRef, (snapshot) => {
    const players: Player[] = [];
    snapshot.forEach((docSnap) => {
      players.push({ id: docSnap.id, ...docSnap.data() } as Player);
    });
    players.sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));
    callback(players);
  }, (err) => {
    console.error('Error listening to players:', err);
  });
}

export function subscribeCourts(sessionId: string, callback: (courts: Court[]) => void) {
  const courtsRef = collection(db, 'sessions', sessionId, 'courts');
  return onSnapshot(courtsRef, (snapshot) => {
    const courts: Court[] = [];
    snapshot.forEach((docSnap) => {
      courts.push({ id: docSnap.id, ...docSnap.data() } as Court);
    });
    courts.sort((a, b) => (a.number || 0) - (b.number || 0));
    callback(courts);
  }, (err) => {
    console.error('Error listening to courts:', err);
  });
}

export function subscribeMatches(sessionId: string, callback: (matches: Match[]) => void) {
  const matchesRef = collection(db, 'sessions', sessionId, 'matches');
  return onSnapshot(matchesRef, (snapshot) => {
    const matches: Match[] = [];
    snapshot.forEach((docSnap) => {
      matches.push({ id: docSnap.id, ...docSnap.data() } as Match);
    });
    matches.sort((a, b) => (b.startedAt || 0) - (a.startedAt || 0));
    callback(matches);
  }, (err) => {
    console.error('Error listening to matches:', err);
  });
}

export function subscribeAllSessions(callback: (sessions: Session[]) => void) {
  const sessionsRef = collection(db, 'sessions');
  const q = query(sessionsRef, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const sessions: Session[] = [];
    snapshot.forEach((docSnap) => {
      sessions.push({ id: docSnap.id, ...docSnap.data() } as Session);
    });
    callback(sessions);
  }, (err) => {
    console.error('Error listening to all sessions:', err);
  });
}

export async function createNewSession(
  title: string,
  courtCount: number = 3,
  customSettings?: Partial<SessionSettings>,
  isPrivate: boolean = false,
  passcode: string = '1234',
  rosterType: 'generated' | 'empty' | 'custom' = 'generated',
  customPlayerNames?: string[]
): Promise<string> {
  const cleanTitle = title.trim() || 'DinkSync Open Play';
  const slug = cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const sessionId = `${slug.substring(0, 20) || 'session'}_${Date.now().toString(36)}`;

  const courtNames = Array.from({ length: courtCount }, (_, i) => `Court ${i + 1}`);

  const newSession: Session = {
    id: sessionId,
    title: cleanTitle,
    passcode: passcode || '1234',
    isPrivate,
    status: 'active',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    courtCount,
    courtNames,
    settings: {
      targetScore: 11,
      winByTwo: true,
      gameType: 'doubles',
      rotationMode: 'random',
      ...customSettings
    }
  };

  await setDoc(doc(db, 'sessions', sessionId), newSession);

  // Initialize courts
  for (let i = 1; i <= courtCount; i++) {
    const courtRef = doc(db, 'sessions', sessionId, 'courts', `court_${i}`);
    const courtData: Court = {
      id: `court_${i}`,
      number: i,
      name: `Court ${i}`,
      status: 'vacant',
      team1: [],
      team2: [],
      team1Score: 0,
      team2Score: 0
    };
    await setDoc(courtRef, courtData);
  }

  // Seed session players with unique roster or custom players
  await seedDemoData(sessionId, customPlayerNames, rosterType);

  return sessionId;
}

export async function deleteSession(sessionId: string) {
  if (sessionId === DEFAULT_SESSION_ID) {
    throw new Error('Cannot delete the default session!');
  }
  const sessionRef = doc(db, 'sessions', sessionId);
  await deleteDoc(sessionRef);
}

// Player Management
export async function addOrUpdatePlayer(
  sessionId: string,
  playerId: string,
  name: string,
  skillLevel?: string
) {
  const playerRef = doc(db, 'sessions', sessionId, 'players', playerId);
  const snap = await safeGetDoc(playerRef);

  if (snap && snap.exists()) {
    const existing = snap.data() as Player;
    await setDoc(playerRef, {
      name,
      skillLevel: skillLevel || existing.skillLevel || '3.5',
    }, { merge: true });
  } else {
    const newPlayer: Player = {
      id: playerId,
      name,
      skillLevel: skillLevel || '3.5',
      status: 'active',
      wins: 0,
      losses: 0,
      gamesPlayed: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      pointDiff: 0,
      streak: 0,
      joinedAt: Date.now(),
      avatarColor: getRandomColor()
    };
    await setDoc(playerRef, newPlayer, { merge: true });
  }
}

export async function setPlayerStatus(sessionId: string, playerId: string, status: PlayerStatus) {
  const playerRef = doc(db, 'sessions', sessionId, 'players', playerId);
  await setDoc(playerRef, { status }, { merge: true });
}

export async function removePlayer(sessionId: string, playerId: string) {
  const playerRef = doc(db, 'sessions', sessionId, 'players', playerId);
  await deleteDoc(playerRef);
}

// Session Settings Management
export async function updateSessionSettings(sessionId: string, settings: Partial<SessionSettings>) {
  const sessionRef = doc(db, 'sessions', sessionId);
  const snap = await safeGetDoc(sessionRef);
  const currentSettings = snap && snap.exists() ? ((snap.data() as Session).settings || {}) : {};
  
  await setDoc(sessionRef, {
    settings: { ...currentSettings, ...settings },
    updatedAt: Date.now()
  }, { merge: true });
}

export async function updateCourtsConfig(
  sessionId: string,
  courtNames: string[],
  allPlayers: Player[] = []
) {
  const sessionRef = doc(db, 'sessions', sessionId);
  const courtsRef = collection(db, 'sessions', sessionId, 'courts');

  // 1. Fetch all existing court documents
  let existingCourtDocs: { id: string; ref: any; data: Court }[] = [];
  try {
    const snap = await getDocs(courtsRef);
    snap.forEach((d) => {
      existingCourtDocs.push({
        id: d.id,
        ref: d.ref,
        data: { id: d.id, ...d.data() } as Court
      });
    });
  } catch (err) {
    console.warn('Could not read existing courts before update:', err);
  }

  const batch = writeBatch(db);

  // 2. Update session metadata
  batch.set(sessionRef, {
    courtCount: courtNames.length,
    courtNames,
    updatedAt: Date.now()
  }, { merge: true });

  const targetCourtIds = new Set<string>();

  // 3. Update / write the configured courts (court_1, court_2, ...)
  for (let i = 0; i < courtNames.length; i++) {
    const courtId = `court_${i + 1}`;
    targetCourtIds.add(courtId);
    const courtRef = doc(db, 'sessions', sessionId, 'courts', courtId);
    
    // Find if this court existed before to preserve match status if still within range
    const existing = existingCourtDocs.find((c) => c.id === courtId);

    batch.set(courtRef, {
      id: courtId,
      number: i + 1,
      name: courtNames[i],
      status: existing?.data?.status || 'vacant',
      team1: existing?.data?.team1 || [],
      team2: existing?.data?.team2 || [],
      team1Score: existing?.data?.team1Score || 0,
      team2Score: existing?.data?.team2Score || 0,
      currentMatchId: existing?.data?.currentMatchId || null,
      startedAt: existing?.data?.startedAt || null
    }, { merge: true });
  }

  // 4. Delete any court document that is no longer part of the configured count
  for (const existing of existingCourtDocs) {
    if (!targetCourtIds.has(existing.id) || (existing.data.number && existing.data.number > courtNames.length)) {
      // Free any players on the removed court back to active
      const playerIds = [...(existing.data.team1 || []), ...(existing.data.team2 || [])];
      for (const pid of playerIds) {
        const pRef = doc(db, 'sessions', sessionId, 'players', pid);
        batch.set(pRef, { status: 'active' }, { merge: true });
      }
      batch.delete(existing.ref);
    }
  }

  await batch.commit();
}

// Dedicated Delete Court Function
export async function deleteCourt(
  sessionId: string,
  courtId: string,
  allPlayers: Player[],
  allCourts: Court[]
): Promise<void> {
  const targetCourt = allCourts.find((c) => c.id === courtId);
  if (!targetCourt) return;

  const remainingCourts = allCourts.filter((c) => c.id !== courtId);
  const remainingNames = remainingCourts.map((c) => c.name);

  const batch = writeBatch(db);
  const sessionRef = doc(db, 'sessions', sessionId);

  // 1. Update session document
  batch.set(sessionRef, {
    courtCount: remainingNames.length,
    courtNames: remainingNames,
    updatedAt: Date.now()
  }, { merge: true });

  // 2. Free any players who were playing on this deleted court
  const assignedPlayers = [...(targetCourt.team1 || []), ...(targetCourt.team2 || [])];
  for (const pid of assignedPlayers) {
    const pRef = doc(db, 'sessions', sessionId, 'players', pid);
    batch.set(pRef, { status: 'active' }, { merge: true });
  }

  // 3. Clear all old court documents from Firestore to prevent orphaned IDs
  const courtsRef = collection(db, 'sessions', sessionId, 'courts');
  try {
    const snap = await getDocs(courtsRef);
    snap.forEach((d) => {
      batch.delete(d.ref);
    });
  } catch (err) {
    const targetRef = doc(db, 'sessions', sessionId, 'courts', courtId);
    batch.delete(targetRef);
  }

  // 4. Re-create remaining courts with normalized numbering (court_1, court_2, ...)
  remainingCourts.forEach((c, idx) => {
    const newId = `court_${idx + 1}`;
    const newCourtRef = doc(db, 'sessions', sessionId, 'courts', newId);
    batch.set(newCourtRef, {
      id: newId,
      number: idx + 1,
      name: c.name,
      status: c.status || 'vacant',
      team1: c.team1 || [],
      team2: c.team2 || [],
      team1Score: c.team1Score || 0,
      team2Score: c.team2Score || 0,
      currentMatchId: c.currentMatchId || null,
      startedAt: c.startedAt || null
    });
  });

  await batch.commit();
}

// Dedicated Add Court Function
export async function addCourt(
  sessionId: string,
  allCourts: Court[],
  customName?: string
): Promise<void> {
  const newNumber = allCourts.length + 1;
  const newName = customName?.trim() || `Court ${newNumber}`;
  const newNames = [...allCourts.map((c) => c.name), newName];
  await updateCourtsConfig(sessionId, newNames);
}

// Court Assignment & Random Pairing Logic
export async function assignNextCourt(
  sessionId: string,
  courtId: string,
  allPlayers: Player[],
  rotationMode: 'random' | 'balanced' | 'queue' | 'king' = 'random',
  gameType: 'doubles' | 'singles' = 'doubles',
  courtNameParam?: string
): Promise<{ success: boolean; message: string; assignedNames?: string[] }> {
  const neededPlayersCount = gameType === 'doubles' ? 4 : 2;

  // Available players are those with status === 'active'
  const availablePlayers = allPlayers.filter((p) => p.status === 'active');

  if (availablePlayers.length < neededPlayersCount) {
    return {
      success: false,
      message: `Need at least ${neededPlayersCount} active players in queue! Currently available: ${availablePlayers.length}.`
    };
  }

  let selectedPlayers: Player[] = [];

  if (rotationMode === 'queue') {
    // Sort by games played (ascending), then joinedAt (ascending)
    const sorted = [...availablePlayers].sort((a, b) => {
      if (a.gamesPlayed !== b.gamesPlayed) return a.gamesPlayed - b.gamesPlayed;
      return a.joinedAt - b.joinedAt;
    });
    selectedPlayers = sorted.slice(0, neededPlayersCount);
  } else if (rotationMode === 'balanced') {
    // Sort by skill level numeric value or games played
    const sorted = [...availablePlayers].sort((a, b) => {
      const skillA = parseFloat(a.skillLevel || '3.5');
      const skillB = parseFloat(b.skillLevel || '3.5');
      return skillB - skillA;
    });
    // Pick top available or balanced mix
    selectedPlayers = sorted.slice(0, neededPlayersCount);
  } else {
    // Random shuffle
    const shuffled = [...availablePlayers].sort(() => Math.random() - 0.5);
    selectedPlayers = shuffled.slice(0, neededPlayersCount);
  }

  // Shuffle selected players into Team 1 and Team 2
  const teamShuffled = [...selectedPlayers].sort(() => Math.random() - 0.5);
  const team1: Player[] = [];
  const team2: Player[] = [];

  if (neededPlayersCount === 4) {
    team1.push(teamShuffled[0], teamShuffled[1]);
    team2.push(teamShuffled[2], teamShuffled[3]);
  } else {
    team1.push(teamShuffled[0]);
    team2.push(teamShuffled[1]);
  }

  const team1Ids = team1.map((p) => p.id);
  const team2Ids = team2.map((p) => p.id);
  const team1Names = team1.map((p) => p.name);
  const team2Names = team2.map((p) => p.name);

  // Get court name
  let courtName = courtNameParam || courtId;
  const courtRef = doc(db, 'sessions', sessionId, 'courts', courtId);
  const courtSnap = await safeGetDoc(courtRef);
  if (courtSnap && courtSnap.exists()) {
    courtName = (courtSnap.data() as Court).name || courtName;
  }

  // Create match document
  const matchId = `match_${Date.now()}`;
  const matchRef = doc(db, 'sessions', sessionId, 'matches', matchId);
  const matchData: Match = {
    id: matchId,
    courtId,
    courtName,
    team1: team1Ids,
    team2: team2Ids,
    team1Names,
    team2Names,
    team1Score: 0,
    team2Score: 0,
    status: 'in_progress',
    startedAt: Date.now()
  };

  const batch = writeBatch(db);

  // Save match
  batch.set(matchRef, matchData);

  // Update court
  batch.set(courtRef, {
    status: 'playing',
    currentMatchId: matchId,
    team1: team1Ids,
    team2: team2Ids,
    team1Score: 0,
    team2Score: 0,
    startedAt: Date.now()
  }, { merge: true });

  // Update selected players status to 'playing'
  selectedPlayers.forEach((p) => {
    const pRef = doc(db, 'sessions', sessionId, 'players', p.id);
    batch.set(pRef, { status: 'playing' }, { merge: true });
  });

  await batch.commit();

  const allAssigned = [...team1Names, ...team2Names];
  return {
    success: true,
    message: `Match assigned on ${courtName}: ${team1Names.join(' & ')} vs ${team2Names.join(' & ')}!`,
    assignedNames: allAssigned
  };
}

// Live Score Update
export async function updateCourtScore(
  sessionId: string,
  courtId: string,
  team1Score: number,
  team2Score: number,
  currentMatchId?: string | null
) {
  const courtRef = doc(db, 'sessions', sessionId, 'courts', courtId);
  let matchId = currentMatchId;

  if (!matchId) {
    const courtSnap = await safeGetDoc(courtRef);
    if (courtSnap && courtSnap.exists()) {
      matchId = (courtSnap.data() as Court).currentMatchId;
    }
  }

  const batch = writeBatch(db);
  batch.set(courtRef, {
    team1Score,
    team2Score
  }, { merge: true });

  if (matchId) {
    const matchRef = doc(db, 'sessions', sessionId, 'matches', matchId);
    batch.set(matchRef, {
      team1Score,
      team2Score
    }, { merge: true });
  }

  await batch.commit();
}

// 11-Point Win-by-2 Pickleball Match Condition Checker
export function checkMatchWinCondition(
  team1Score: number,
  team2Score: number,
  targetScore: number = 11,
  winByTwo: boolean = true
) {
  const maxScore = Math.max(team1Score, team2Score);
  const diff = Math.abs(team1Score - team2Score);
  const isWon = maxScore >= targetScore && (winByTwo ? diff >= 2 : diff >= 1);
  const winnerTeam: 1 | 2 | null = isWon ? (team1Score > team2Score ? 1 : 2) : null;
  
  // Match point check: A team needs just 1 point to win
  const team1CanWinNext = (team1Score + 1 >= targetScore) && (!winByTwo || (team1Score + 1) - team2Score >= 2);
  const team2CanWinNext = (team2Score + 1 >= targetScore) && (!winByTwo || (team2Score + 1) - team1Score >= 2);
  const isMatchPoint = !isWon && (team1CanWinNext || team2CanWinNext);
  const matchPointTeam: 1 | 2 | null = team1CanWinNext ? 1 : team2CanWinNext ? 2 : null;
  
  // Deuce / Win by 2 required (tied at >= 10-10)
  const isDeuce = !isWon && team1Score >= targetScore - 1 && team2Score >= targetScore - 1 && team1Score === team2Score;

  return {
    isWon,
    winnerTeam,
    isMatchPoint,
    matchPointTeam,
    isDeuce,
    diff,
    leader: team1Score > team2Score ? 1 : team2Score > team1Score ? 2 : 0
  };
}

// Override / Manually Set Court Participants (Team 1 & Team 2)
export async function overrideCourtParticipants(
  sessionId: string,
  courtId: string,
  newTeam1Ids: string[],
  newTeam2Ids: string[],
  allPlayers: Player[],
  courtObj?: Court
): Promise<{ success: boolean; message: string }> {
  const courtRef = doc(db, 'sessions', sessionId, 'courts', courtId);
  const playerMap = new Map(allPlayers.map((p) => [p.id, p]));

  let court = courtObj;
  if (!court) {
    const snap = await safeGetDoc(courtRef);
    if (snap && snap.exists()) {
      court = snap.data() as Court;
    }
  }

  const oldPlayerIds = new Set([...(court?.team1 || []), ...(court?.team2 || [])]);
  const newPlayerIds = new Set([...newTeam1Ids, ...newTeam2Ids]);

  const batch = writeBatch(db);

  // 1. Release players who were in the match previously but are no longer in this court
  for (const pid of oldPlayerIds) {
    if (!newPlayerIds.has(pid)) {
      const pRef = doc(db, 'sessions', sessionId, 'players', pid);
      batch.set(pRef, { status: 'active' }, { merge: true });
    }
  }

  // 2. Mark new players as 'playing'
  for (const pid of newPlayerIds) {
    const pRef = doc(db, 'sessions', sessionId, 'players', pid);
    batch.set(pRef, { status: 'playing' }, { merge: true });
  }

  const team1Names = newTeam1Ids.map((id) => playerMap.get(id)?.name || 'Player').filter(Boolean);
  const team2Names = newTeam2Ids.map((id) => playerMap.get(id)?.name || 'Player').filter(Boolean);

  const hasPlayers = newTeam1Ids.length > 0 || newTeam2Ids.length > 0;

  if (!hasPlayers) {
    // Empty lineup -> Reset court to vacant
    batch.set(courtRef, {
      status: 'vacant',
      currentMatchId: null,
      team1: [],
      team2: [],
      team1Score: 0,
      team2Score: 0,
      startedAt: null
    }, { merge: true });

    await batch.commit();
    return { success: true, message: 'Court participants cleared and reset to vacant.' };
  }

  // Generate or maintain Match record
  const matchId = court?.currentMatchId || `match_${Date.now()}`;
  const matchRef = doc(db, 'sessions', sessionId, 'matches', matchId);

  batch.set(matchRef, {
    id: matchId,
    courtId,
    courtName: court?.name || courtId,
    team1: newTeam1Ids,
    team2: newTeam2Ids,
    team1Names,
    team2Names,
    team1Score: court?.team1Score || 0,
    team2Score: court?.team2Score || 0,
    status: 'in_progress',
    startedAt: court?.startedAt || Date.now()
  }, { merge: true });

  // Update Court document
  batch.set(courtRef, {
    status: 'playing',
    currentMatchId: matchId,
    team1: newTeam1Ids,
    team2: newTeam2Ids,
    team1Score: court?.team1Score || 0,
    team2Score: court?.team2Score || 0,
    startedAt: court?.startedAt || Date.now()
  }, { merge: true });

  await batch.commit();
  return {
    success: true,
    message: `Lineup updated: ${team1Names.join(' & ') || 'None'} vs ${team2Names.join(' & ') || 'None'}`
  };
}

// End & Complete Session
export async function endSession(sessionId: string) {
  const sessionRef = doc(db, 'sessions', sessionId);
  await setDoc(sessionRef, {
    status: 'completed',
    updatedAt: Date.now()
  }, { merge: true });
}

// Finish Match & Update Player Leaderboards
export async function finishMatch(
  sessionId: string,
  courtId: string,
  allPlayers: Player[],
  courtParam?: Court
) {
  const courtRef = doc(db, 'sessions', sessionId, 'courts', courtId);
  let court = courtParam || null;
  if (!court) {
    const courtSnap = await safeGetDoc(courtRef);
    if (courtSnap && courtSnap.exists()) {
      court = courtSnap.data() as Court;
    }
  }

  if (!court || court.status !== 'playing' || !court.currentMatchId) return;

  const team1Ids = court.team1 || [];
  const team2Ids = court.team2 || [];
  const team1Score = court.team1Score || 0;
  const team2Score = court.team2Score || 0;

  // Pickleball winning condition:
  // Must reach at least 11 points AND win by at least 2.
  const isGameOver =
    (team1Score >= 11 || team2Score >= 11) &&
    Math.abs(team1Score - team2Score) >= 2;

  if (!isGameOver) {
    return;
  }

  let winnerTeam: 1 | 2 = 1;
  if (team2Score > team1Score) {
    winnerTeam = 2;
  }

  const batch = writeBatch(db);

  // 1. Update match record
  const matchRef = doc(db, 'sessions', sessionId, 'matches', court.currentMatchId);
  batch.set(matchRef, {
    team1Score,
    team2Score,
    winnerTeam,
    status: 'completed',
    completedAt: Date.now()
  }, { merge: true });

  // 2. Update players statistics
  const playerMap = new Map(allPlayers.map((p) => [p.id, p]));

  // Team 1 processing
  team1Ids.forEach((id) => {
    const player = playerMap.get(id);
    if (!player) return;

    const isWinner = winnerTeam === 1;
    const pRef = doc(db, 'sessions', sessionId, 'players', id);

    const newWins = (player.wins || 0) + (isWinner ? 1 : 0);
    const newLosses = (player.losses || 0) + (isWinner ? 0 : 1);
    const newGames = (player.gamesPlayed || 0) + 1;
    const newPF = (player.pointsFor || 0) + team1Score;
    const newPA = (player.pointsAgainst || 0) + team2Score;
    const newDiff = newPF - newPA;
    let newStreak = player.streak || 0;
    if (isWinner) {
      newStreak = newStreak > 0 ? newStreak + 1 : 1;
    } else {
      newStreak = newStreak < 0 ? newStreak - 1 : -1;
    }

    batch.set(pRef, {
      wins: newWins,
      losses: newLosses,
      gamesPlayed: newGames,
      pointsFor: newPF,
      pointsAgainst: newPA,
      pointDiff: newDiff,
      streak: newStreak,
      status: 'active' // Set back to active for next queue
    }, { merge: true });
  });

  // Team 2 processing
  team2Ids.forEach((id) => {
    const player = playerMap.get(id);
    if (!player) return;

    const isWinner = winnerTeam === 2;
    const pRef = doc(db, 'sessions', sessionId, 'players', id);

    const newWins = (player.wins || 0) + (isWinner ? 1 : 0);
    const newLosses = (player.losses || 0) + (isWinner ? 0 : 1);
    const newGames = (player.gamesPlayed || 0) + 1;
    const newPF = (player.pointsFor || 0) + team2Score;
    const newPA = (player.pointsAgainst || 0) + team1Score;
    const newDiff = newPF - newPA;
    let newStreak = player.streak || 0;
    if (isWinner) {
      newStreak = newStreak > 0 ? newStreak + 1 : 1;
    } else {
      newStreak = newStreak < 0 ? newStreak - 1 : -1;
    }

    batch.set(pRef, {
      wins: newWins,
      losses: newLosses,
      gamesPlayed: newGames,
      pointsFor: newPF,
      pointsAgainst: newPA,
      pointDiff: newDiff,
      streak: newStreak,
      status: 'active'
    }, { merge: true });
  });

  // 3. Reset court to vacant
  batch.set(courtRef, {
    status: 'vacant',
    currentMatchId: null,
    team1: [],
    team2: [],
    team1Score: 0,
    team2Score: 0,
    startedAt: null
  }, { merge: true });

  await batch.commit();
}

// Clear / Reset Court manually
export async function resetCourt(sessionId: string, courtId: string, playerIds: string[]) {
  const batch = writeBatch(db);
  const courtRef = doc(db, 'sessions', sessionId, 'courts', courtId);

  batch.set(courtRef, {
    status: 'vacant',
    currentMatchId: null,
    team1: [],
    team2: [],
    team1Score: 0,
    team2Score: 0,
    startedAt: null
  }, { merge: true });

  // Release players back to active
  playerIds.forEach((id) => {
    if (id) {
      const pRef = doc(db, 'sessions', sessionId, 'players', id);
      batch.set(pRef, { status: 'active' }, { merge: true });
    }
  });

  await batch.commit();
}

const FIRST_NAMES = [
  'Liam', 'Maya', 'Noah', 'Elena', 'Lucas', 'Sofia', 'Ethan', 'Chloe',
  'Mateo', 'Zoe', 'Jackson', 'Aaliyah', 'Derek', 'Priya', 'Marcus', 'Camila',
  'Nico', 'Hannah', 'Tariq', 'Amara', 'Gavin', 'Sienna', 'Dante', 'Kira',
  'Brandon', 'Seraphina', 'Julian', 'Kai', 'Leilani', 'Xavier', 'Tessa', 'Rowan'
];

const LAST_NAMES = [
  'Patel', 'Chen', 'Vance', 'Tanaka', 'Silva', 'O\'Connor', 'Kravitz', 'Santos',
  'Rossi', 'Okafor', 'Gomez', 'Al-Mansoor', 'Abbott', 'Rodriguez', 'Taylor', 'Nguyen',
  'Kim', 'Wright', 'Novak', 'Sorensen', 'Dupont', 'Fischer', 'Moreno', 'Sinclair'
];

const SKILL_LEVELS = ['3.0', '3.5', '3.5', '4.0', '4.0', '4.5+'];

export function generateUniqueRosterForSession(count: number = 8): { name: string; skill: string }[] {
  const result: { name: string; skill: string }[] = [];
  const used = new Set<string>();

  while (result.length < count) {
    const fn = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const ln = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const fullName = `${fn} ${ln}`;
    if (!used.has(fullName)) {
      used.add(fullName);
      const skill = SKILL_LEVELS[Math.floor(Math.random() * SKILL_LEVELS.length)];
      result.push({ name: fullName, skill });
    }
  }

  return result;
}

// Populate sample demo players and games for instant interactive preview
export async function seedDemoData(
  sessionId: string,
  customPlayerNames?: string[],
  rosterType: 'generated' | 'empty' | 'custom' = 'generated'
) {
  if (rosterType === 'empty') return;

  let playerList: { name: string; skill: string }[] = [];

  if (rosterType === 'custom' && customPlayerNames && customPlayerNames.length > 0) {
    playerList = customPlayerNames
      .map((n) => ({ name: n.trim(), skill: '3.5' }))
      .filter((p) => p.name.length > 0);
  } else if (sessionId === DEFAULT_SESSION_ID) {
    playerList = [
      { name: 'Alex Rivera', skill: '4.0' },
      { name: 'Jordan Lee', skill: '3.5' },
      { name: 'Taylor Swift', skill: '3.5' },
      { name: 'Morgan Vance', skill: '4.5+' },
      { name: 'Chris Evans', skill: '3.0' },
      { name: 'Sam Miller', skill: '3.5' },
      { name: 'Dakota Johnson', skill: '4.0' },
      { name: 'Riley Smith', skill: '3.0' }
    ];
  } else {
    playerList = generateUniqueRosterForSession(8);
  }

  if (playerList.length === 0) return;

  const batch = writeBatch(db);

  for (let i = 0; i < playerList.length; i++) {
    const item = playerList[i];
    const pid = `player_${Date.now()}_${i + 1}_${Math.random().toString(36).substring(2, 6)}`;
    const pRef = doc(db, 'sessions', sessionId, 'players', pid);

    const wins = Math.floor(Math.random() * 4);
    const losses = Math.floor(Math.random() * 3);
    const gamesPlayed = wins + losses;
    const pointsFor = wins * 11 + losses * Math.floor(Math.random() * 8);
    const pointsAgainst = losses * 11 + wins * Math.floor(Math.random() * 7);

    batch.set(pRef, {
      id: pid,
      name: item.name,
      skillLevel: item.skill,
      status: 'active',
      wins,
      losses,
      gamesPlayed,
      pointsFor,
      pointsAgainst,
      pointDiff: pointsFor - pointsAgainst,
      streak: wins > losses ? wins - losses : 0,
      joinedAt: Date.now() - (playerList.length - i) * 60000,
      avatarColor: getRandomColor()
    });
  }

  await batch.commit();
}

// Reset Session Stats
export async function resetSessionStats(sessionId: string, players: Player[]) {
  const batch = writeBatch(db);

  // Reset player stats
  players.forEach((p) => {
    const pRef = doc(db, 'sessions', sessionId, 'players', p.id);
    batch.set(pRef, {
      wins: 0,
      losses: 0,
      gamesPlayed: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      pointDiff: 0,
      streak: 0,
      status: 'active'
    }, { merge: true });
  });

  // Delete match history if readable
  try {
    const matchesRef = collection(db, 'sessions', sessionId, 'matches');
    const matchesSnap = await getDocs(matchesRef);
    matchesSnap.forEach((mSnap) => {
      batch.delete(mSnap.ref);
    });
  } catch (err) {
    console.warn('Could not query matches for deletion during stats reset:', err);
  }

  // Reset courts if readable
  try {
    const courtsRef = collection(db, 'sessions', sessionId, 'courts');
    const courtsSnap = await getDocs(courtsRef);
    courtsSnap.forEach((cSnap) => {
      batch.set(cSnap.ref, {
        status: 'vacant',
        currentMatchId: null,
        team1: [],
        team2: [],
        team1Score: 0,
        team2Score: 0,
        startedAt: null
      }, { merge: true });
    });
  } catch (err) {
    console.warn('Could not query courts for reset during stats reset:', err);
  }

  await batch.commit();
}
