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

// Ensure default session exists
export async function initializeSessionIfNeeded(sessionId: string = DEFAULT_SESSION_ID): Promise<Session> {
  const sessionRef = doc(db, 'sessions', sessionId);
  const snap = await getDoc(sessionRef);

  if (snap.exists()) {
    return snap.data() as Session;
  }

  const newSession: Session = {
    id: sessionId,
    title: 'DinkSync Open Play',
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

  await setDoc(sessionRef, newSession);

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
    await setDoc(courtRef, courtData);
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

// Player Management
export async function addOrUpdatePlayer(
  sessionId: string,
  playerId: string,
  name: string,
  skillLevel?: string
) {
  const playerRef = doc(db, 'sessions', sessionId, 'players', playerId);
  const snap = await getDoc(playerRef);

  if (snap.exists()) {
    await updateDoc(playerRef, {
      name,
      skillLevel: skillLevel || '3.5',
    });
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
    await setDoc(playerRef, newPlayer);
  }
}

export async function setPlayerStatus(sessionId: string, playerId: string, status: PlayerStatus) {
  const playerRef = doc(db, 'sessions', sessionId, 'players', playerId);
  await updateDoc(playerRef, { status });
}

export async function removePlayer(sessionId: string, playerId: string) {
  const playerRef = doc(db, 'sessions', sessionId, 'players', playerId);
  await deleteDoc(playerRef);
}

// Session Settings Management
export async function updateSessionSettings(sessionId: string, settings: Partial<SessionSettings>) {
  const sessionRef = doc(db, 'sessions', sessionId);
  const snap = await getDoc(sessionRef);
  if (snap.exists()) {
    const currentSettings = snap.data().settings || {};
    await updateDoc(sessionRef, {
      settings: { ...currentSettings, ...settings },
      updatedAt: Date.now()
    });
  }
}

export async function updateCourtsConfig(sessionId: string, courtNames: string[]) {
  const sessionRef = doc(db, 'sessions', sessionId);
  await updateDoc(sessionRef, {
    courtCount: courtNames.length,
    courtNames,
    updatedAt: Date.now()
  });

  // Ensure court documents exist or delete extra
  for (let i = 0; i < courtNames.length; i++) {
    const courtId = `court_${i + 1}`;
    const courtRef = doc(db, 'sessions', sessionId, 'courts', courtId);
    const snap = await getDoc(courtRef);
    if (!snap.exists()) {
      await setDoc(courtRef, {
        id: courtId,
        number: i + 1,
        name: courtNames[i],
        status: 'vacant',
        team1: [],
        team2: [],
        team1Score: 0,
        team2Score: 0
      });
    } else {
      await updateDoc(courtRef, {
        name: courtNames[i],
        number: i + 1
      });
    }
  }
}

// Court Assignment & Random Pairing Logic
export async function assignNextCourt(
  sessionId: string,
  courtId: string,
  allPlayers: Player[],
  rotationMode: 'random' | 'balanced' | 'queue' | 'king' = 'random',
  gameType: 'doubles' | 'singles' = 'doubles'
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
  const courtRef = doc(db, 'sessions', sessionId, 'courts', courtId);
  const courtSnap = await getDoc(courtRef);
  const courtName = courtSnap.exists() ? courtSnap.data().name : courtId;

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
  batch.update(courtRef, {
    status: 'playing',
    currentMatchId: matchId,
    team1: team1Ids,
    team2: team2Ids,
    team1Score: 0,
    team2Score: 0,
    startedAt: Date.now()
  });

  // Update selected players status to 'playing'
  selectedPlayers.forEach((p) => {
    const pRef = doc(db, 'sessions', sessionId, 'players', p.id);
    batch.update(pRef, { status: 'playing' });
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
  team2Score: number
) {
  const courtRef = doc(db, 'sessions', sessionId, 'courts', courtId);
  const courtSnap = await getDoc(courtRef);
  if (!courtSnap.exists()) return;

  const courtData = courtSnap.data() as Court;
  const currentMatchId = courtData.currentMatchId;

  const batch = writeBatch(db);
  batch.update(courtRef, {
    team1Score,
    team2Score
  });

  if (currentMatchId) {
    const matchRef = doc(db, 'sessions', sessionId, 'matches', currentMatchId);
    batch.update(matchRef, {
      team1Score,
      team2Score
    });
  }

  await batch.commit();
}

// Finish Match & Update Player Leaderboards
export async function finishMatch(
  sessionId: string,
  courtId: string,
  allPlayers: Player[]
) {
  const courtRef = doc(db, 'sessions', sessionId, 'courts', courtId);
  const courtSnap = await getDoc(courtRef);
  if (!courtSnap.exists()) return;

  const court = courtSnap.data() as Court;
  if (court.status !== 'playing' || !court.currentMatchId) return;

  const team1Ids = court.team1;
  const team2Ids = court.team2;
  const team1Score = court.team1Score;
  const team2Score = court.team2Score;

  let winnerTeam: 1 | 2 = 1;
  if (team2Score > team1Score) {
    winnerTeam = 2;
  }

  const batch = writeBatch(db);

  // 1. Update match record
  const matchRef = doc(db, 'sessions', sessionId, 'matches', court.currentMatchId);
  batch.update(matchRef, {
    team1Score,
    team2Score,
    winnerTeam,
    status: 'completed',
    completedAt: Date.now()
  });

  // 2. Update players statistics
  const playerMap = new Map(allPlayers.map((p) => [p.id, p]));

  // Team 1 processing
  team1Ids.forEach((id) => {
    const player = playerMap.get(id);
    if (!player) return;

    const isWinner = winnerTeam === 1;
    const pRef = doc(db, 'sessions', sessionId, 'players', id);

    const newWins = player.wins + (isWinner ? 1 : 0);
    const newLosses = player.losses + (isWinner ? 0 : 1);
    const newGames = player.gamesPlayed + 1;
    const newPF = player.pointsFor + team1Score;
    const newPA = player.pointsAgainst + team2Score;
    const newDiff = newPF - newPA;
    let newStreak = player.streak;
    if (isWinner) {
      newStreak = newStreak > 0 ? newStreak + 1 : 1;
    } else {
      newStreak = newStreak < 0 ? newStreak - 1 : -1;
    }

    batch.update(pRef, {
      wins: newWins,
      losses: newLosses,
      gamesPlayed: newGames,
      pointsFor: newPF,
      pointsAgainst: newPA,
      pointDiff: newDiff,
      streak: newStreak,
      status: 'active' // Set back to active for next queue
    });
  });

  // Team 2 processing
  team2Ids.forEach((id) => {
    const player = playerMap.get(id);
    if (!player) return;

    const isWinner = winnerTeam === 2;
    const pRef = doc(db, 'sessions', sessionId, 'players', id);

    const newWins = player.wins + (isWinner ? 1 : 0);
    const newLosses = player.losses + (isWinner ? 0 : 1);
    const newGames = player.gamesPlayed + 1;
    const newPF = player.pointsFor + team2Score;
    const newPA = player.pointsAgainst + team1Score;
    const newDiff = newPF - newPA;
    let newStreak = player.streak;
    if (isWinner) {
      newStreak = newStreak > 0 ? newStreak + 1 : 1;
    } else {
      newStreak = newStreak < 0 ? newStreak - 1 : -1;
    }

    batch.update(pRef, {
      wins: newWins,
      losses: newLosses,
      gamesPlayed: newGames,
      pointsFor: newPF,
      pointsAgainst: newPA,
      pointDiff: newDiff,
      streak: newStreak,
      status: 'active'
    });
  });

  // 3. Reset court to vacant
  batch.update(courtRef, {
    status: 'vacant',
    currentMatchId: null,
    team1: [],
    team2: [],
    team1Score: 0,
    team2Score: 0,
    startedAt: null
  });

  await batch.commit();
}

// Clear / Reset Court manually
export async function resetCourt(sessionId: string, courtId: string, playerIds: string[]) {
  const batch = writeBatch(db);
  const courtRef = doc(db, 'sessions', sessionId, 'courts', courtId);

  batch.update(courtRef, {
    status: 'vacant',
    currentMatchId: null,
    team1: [],
    team2: [],
    team1Score: 0,
    team2Score: 0,
    startedAt: null
  });

  // Release players back to active
  playerIds.forEach((id) => {
    if (id) {
      const pRef = doc(db, 'sessions', sessionId, 'players', id);
      batch.update(pRef, { status: 'active' });
    }
  });

  await batch.commit();
}

// Populate sample demo players and games for instant interactive preview
export async function seedDemoData(sessionId: string) {
  const demoNames = [
    { name: 'Alex Rivera', skill: '4.0' },
    { name: 'Jordan Lee', skill: '3.5' },
    { name: 'Taylor Swift', skill: '3.5' },
    { name: 'Morgan Vance', skill: '4.5+' },
    { name: 'Chris Evans', skill: '3.0' },
    { name: 'Sam Miller', skill: '3.5' },
    { name: 'Dakota Johnson', skill: '4.0' },
    { name: 'Riley Smith', skill: '3.0' }
  ];

  const batch = writeBatch(db);

  for (let i = 0; i < demoNames.length; i++) {
    const item = demoNames[i];
    const pid = `demo_player_${i + 1}`;
    const pRef = doc(db, 'sessions', sessionId, 'players', pid);

    // Randomize initial realistic stats
    const wins = Math.floor(Math.random() * 5) + 1;
    const losses = Math.floor(Math.random() * 4);
    const gamesPlayed = wins + losses;
    const pointsFor = wins * 11 + losses * Math.floor(Math.random() * 9);
    const pointsAgainst = losses * 11 + wins * Math.floor(Math.random() * 8);

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
      joinedAt: Date.now() - (demoNames.length - i) * 60000,
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
    batch.update(pRef, {
      wins: 0,
      losses: 0,
      gamesPlayed: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      pointDiff: 0,
      streak: 0,
      status: 'active'
    });
  });

  // Delete all match history
  const matchesRef = collection(db, 'sessions', sessionId, 'matches');
  const matchesSnap = await getDocs(matchesRef);
  matchesSnap.forEach((mSnap) => {
    batch.delete(mSnap.ref);
  });

  // Reset courts
  const courtsRef = collection(db, 'sessions', sessionId, 'courts');
  const courtsSnap = await getDocs(courtsRef);
  courtsSnap.forEach((cSnap) => {
    batch.update(cSnap.ref, {
      status: 'vacant',
      currentMatchId: null,
      team1: [],
      team2: [],
      team1Score: 0,
      team2Score: 0,
      startedAt: null
    });
  });

  await batch.commit();
}
