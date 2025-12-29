import React, { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';
import type { Wrestler, Participant, LogEvent } from '../types';

interface GameState {
    wrestlers: Wrestler[];
    participants: Participant[];
    currentDrafterIndex: number;
    isDrafting: boolean;
    totalPicks: number;
    logs: LogEvent[];
}

interface GameContextType extends GameState {
    setWrestlers: (wrestlers: Wrestler[]) => void;
    setParticipants: (participants: Participant[]) => void;
    setIsDrafting: (isDrafting: boolean) => void;
    setCurrentDrafterIndex: (index: number) => void;
    handleElimination: (eliminatedId: string, eliminatorIds: string[]) => void;
    addParticipant: (name: string) => void;
    addWrestler: (wrestler: Omit<Wrestler, 'id' | 'status' | 'draftedBy' | 'eliminatedBy' | 'entryOrder' | 'eliminationTime'>) => void;
    removeWrestler: (wrestlerId: string) => void;
    handleDraftPick: (wrestlerId: string) => void;
    enterRing: (wrestlerId: string) => void;
    updateParticipantScore: (participantId: string, newScore: number) => void;
    resetGame: () => void;
    addLog: (message: string) => void;
    undo: () => void;
    exportState: () => void;
    importState: (json: string) => void;
    history: GameState[];
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const STORAGE_KEY = 'royal-rumble-state';
const CHANNEL_NAME = 'rumble_sync';

const MAX_HISTORY = 20;

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [wrestlers, setWrestlers] = useState<Wrestler[]>([]);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [currentDrafterIndex, setCurrentDrafterIndex] = useState<number>(0);
    const [isDrafting, setIsDrafting] = useState<boolean>(true);
    const [totalPicks, setTotalPicks] = useState<number>(0);
    const [logs, setLogs] = useState<LogEvent[]>([]);

    // History Stack for Undo
    const [history, setHistory] = useState<GameState[]>([]);

    const isRemoteUpdate = useRef(false);

    // Audio Helpers
    const playTone = (freq: number, type: OscillatorType, duration: number) => {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.frequency.value = freq;
            osc.type = type;
            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);
            osc.stop(ctx.currentTime + duration);
        } catch (e) {
            console.error("Audio error", e);
        }
    };

    const playBuzzer = () => playTone(150, 'sawtooth', 1.5);
    const playBell = () => playTone(800, 'sine', 0.8);

    // Snapshot current state to history
    const saveCheckpoint = () => {
        const currentState: GameState = { wrestlers, participants, currentDrafterIndex, isDrafting, totalPicks, logs };
        setHistory(prev => [...prev, currentState].slice(-MAX_HISTORY));
    };

    const undo = () => {
        if (history.length === 0) return;
        const previous = history[history.length - 1];

        // Restore state
        setWrestlers(previous.wrestlers);
        setParticipants(previous.participants);
        setCurrentDrafterIndex(previous.currentDrafterIndex);
        setIsDrafting(previous.isDrafting);
        setTotalPicks(previous.totalPicks);
        setLogs(previous.logs);

        // Remove from history
        setHistory(prev => prev.slice(0, -1));
        addLog("Undid last action.");
    };

    const exportState = () => {
        const state = { wrestlers, participants, currentDrafterIndex, isDrafting, totalPicks, logs };
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `royal-rumble-state-${new Date().toISOString()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const importState = (jsonString: string) => {
        try {
            saveCheckpoint(); // Save before overwriting
            const parsed = JSON.parse(jsonString);
            if (parsed.wrestlers) setWrestlers(parsed.wrestlers);
            if (parsed.participants) setParticipants(parsed.participants);
            if (parsed.currentDrafterIndex !== undefined) setCurrentDrafterIndex(parsed.currentDrafterIndex);
            if (parsed.isDrafting !== undefined) setIsDrafting(parsed.isDrafting);
            if (parsed.totalPicks !== undefined) setTotalPicks(parsed.totalPicks);
            if (parsed.logs) setLogs(parsed.logs);
            addLog("Game state imported successfully.");
        } catch (e) {
            console.error("Failed to import state", e);
            alert("Invalid JSON file");
        }
    };

    // Load state from localStorage on mount
    useEffect(() => {
        const savedState = localStorage.getItem(STORAGE_KEY);
        if (savedState) {
            try {
                const parsed = JSON.parse(savedState);
                setWrestlers(parsed.wrestlers || []);
                setParticipants(parsed.participants || []);
                setCurrentDrafterIndex(parsed.currentDrafterIndex || 0);
                setIsDrafting(parsed.isDrafting !== undefined ? parsed.isDrafting : true);
                setTotalPicks(parsed.totalPicks || 0);
                setLogs(parsed.logs || []);
            } catch (error) {
                console.error("Failed to load game state:", error);
            }
        }

        // Setup BroadcastChannel Listener
        const channel = new BroadcastChannel(CHANNEL_NAME);
        channel.onmessage = (event) => {
            const newState = event.data;
            if (newState) {
                isRemoteUpdate.current = true;
                setWrestlers(newState.wrestlers || []);
                setParticipants(newState.participants || []);
                setCurrentDrafterIndex(newState.currentDrafterIndex || 0);
                setIsDrafting(newState.isDrafting !== undefined ? newState.isDrafting : true);
                setTotalPicks(newState.totalPicks || 0);
                setLogs(newState.logs || []);
            }
        };

        return () => {
            channel.close();
        };
    }, []);

    // Save state to localStorage and Broadcast on every change
    useEffect(() => {
        if (isRemoteUpdate.current) {
            isRemoteUpdate.current = false;
            return;
        }

        const state = { wrestlers, participants, currentDrafterIndex, isDrafting, totalPicks, logs };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

        const channel = new BroadcastChannel(CHANNEL_NAME);
        channel.postMessage(state);
        channel.close();

    }, [wrestlers, participants, currentDrafterIndex, isDrafting, totalPicks, logs]);

    const addLog = (message: string) => {
        const newLog: LogEvent = {
            message,
            timestamp: Date.now()
        };
        // Keep only last 50 logs
        setLogs(prev => [newLog, ...prev].slice(0, 50));
    };

    const handleElimination = (eliminatedId: string, eliminatorIds: string[]) => {
        saveCheckpoint();

        playBell(); // SOUND EFFECT

        setWrestlers(prevWrestlers => {
            const updatedWrestlers = prevWrestlers.map(w => {
                if (w.id === eliminatedId) {
                    return { ...w, status: 'ELIMINATED' as const, eliminationTime: Date.now(), eliminatedBy: eliminatorIds };
                }
                return w;
            });
            return updatedWrestlers;
        });

        // Log Elimination
        const exWrestler = wrestlers.find(w => w.id === eliminatedId);
        if (exWrestler) {
            const eliminatorNames = eliminatorIds.map(id => wrestlers.find(w => w.id === id)?.name).filter(Boolean).join(', ');
            addLog(`${exWrestler.name} eliminated by ${eliminatorNames || 'Unknown'}!`);
        }

        setParticipants(prevParticipants => {
            const updatedParticipants = [...prevParticipants];

            // 1. Elimination Points
            if (eliminatorIds.length > 0) {
                const pointsPerEliminator = 3 / eliminatorIds.length;
                eliminatorIds.forEach(eliminatorId => {
                    // Find the owner of the eliminator
                    const eliminator = wrestlers.find(w => w.id === eliminatorId);
                    if (eliminator && eliminator.draftedBy) { // Safety Check
                        const ownerIndex = updatedParticipants.findIndex(p => p.id === eliminator.draftedBy);
                        if (ownerIndex !== -1) {
                            updatedParticipants[ownerIndex].totalScore += pointsPerEliminator;
                        }
                    }
                });
            }

            // 2. Survival Points
            // Identify ALL wrestlers currently with status 'IN_RING' (excluding the one just eliminated)
            // Note: We use the 'prevWrestlers' state for current status, but exclude the eliminatedId
            const survivors = wrestlers.filter(w => w.status === 'IN_RING' && w.id !== eliminatedId);

            survivors.forEach(survivor => {
                if (survivor.draftedBy) { // Safety Check
                    const ownerIndex = updatedParticipants.findIndex(p => p.id === survivor.draftedBy);
                    if (ownerIndex !== -1) {
                        updatedParticipants[ownerIndex].totalScore += 1;
                    }
                }
            });

            return updatedParticipants;
        });
    };

    const addParticipant = (name: string) => {
        saveCheckpoint();
        const newParticipant: Participant = {
            id: crypto.randomUUID(),
            name,
            totalScore: 0,
            roster: []
        };
        setParticipants(prev => [...prev, newParticipant]);
        addLog(`Participant ${name} joined the Rumble!`);
    };

    const addWrestler = (newWrestlerData: Omit<Wrestler, 'id' | 'status' | 'draftedBy' | 'eliminatedBy' | 'entryOrder' | 'eliminationTime'>) => {
        saveCheckpoint();
        const newWrestler: Wrestler = {
            ...newWrestlerData,
            id: crypto.randomUUID(),
            status: 'POOL',
            draftedBy: null,
            eliminatedBy: [],
            entryOrder: null,
            eliminationTime: null,
            confirmed: newWrestlerData.confirmed ?? false
        };
        setWrestlers(prev => [...prev, newWrestler]);
        // No log for adding to pool to keep clutter down, or maybe detailed?
    };

    const removeWrestler = (wrestlerId: string) => {
        saveCheckpoint();
        setWrestlers(prev => prev.filter(w => w.id !== wrestlerId));
        // No log needed for simple deletion
    };

    const handleDraftPick = (wrestlerId: string) => {
        if (participants.length === 0) return;
        saveCheckpoint();

        const currentParticipantId = participants[currentDrafterIndex].id;
        const wrestlerName = wrestlers.find(w => w.id === wrestlerId)?.name;
        const participantName = participants[currentDrafterIndex].name;

        // 1. Assign wrestler to participant
        setWrestlers(prev => prev.map(w =>
            w.id === wrestlerId ? { ...w, status: 'DRAFTED', draftedBy: currentParticipantId } : w
        ));

        setParticipants(prev => prev.map(p =>
            p.id === currentParticipantId ? { ...p, roster: [...p.roster, wrestlerId] } : p
        ));

        if (wrestlerName) {
            addLog(`${participantName} drafted ${wrestlerName}.`);
        }

        // 2. Advance Draft Logic (Snake Draft)
        setTotalPicks(prev => prev + 1);

        // We use the *next* total picks (current totalPicks + 1) to determine the NEXT drafter
        const nextPickNumber = totalPicks + 1;
        const numParticipants = participants.length;
        const roundNumber = Math.floor(nextPickNumber / numParticipants);
        const positionInRound = nextPickNumber % numParticipants;

        let nextDrafterIndex;
        if (roundNumber % 2 === 0) {
            // Even round (0, 2, 4...) -> Forward direction
            nextDrafterIndex = positionInRound;
        } else {
            // Odd round (1, 3, 5...) -> Reverse direction
            // For example with 3 participants:
            // Round 0: 0, 1, 2
            // Round 1 (Pick 3): 2 (3-1-0)
            // Round 1 (Pick 4): 1 (3-1-1)
            // Round 1 (Pick 5): 0 (3-1-2)
            nextDrafterIndex = numParticipants - 1 - positionInRound;
        }

        setCurrentDrafterIndex(nextDrafterIndex);
    };

    const enterRing = (wrestlerId: string) => {
        saveCheckpoint();
        playBuzzer(); // SOUND EFFECT

        setWrestlers(prev => prev.map(w =>
            w.id === wrestlerId ? { ...w, status: 'IN_RING', entryOrder: Date.now() } : w
        ));
        const w = wrestlers.find(w => w.id === wrestlerId);
        if (w) {
            addLog(`${w.name} has entered the ring!`);
        }
    };

    const updateParticipantScore = (participantId: string, newScore: number) => {
        saveCheckpoint();
        setParticipants(prev => prev.map(p =>
            p.id === participantId ? { ...p, totalScore: newScore } : p
        ));
    };

    const resetGame = () => {
        saveCheckpoint();
        localStorage.removeItem(STORAGE_KEY);
        setWrestlers([]);
        setParticipants([]);
        setCurrentDrafterIndex(0);
        setIsDrafting(true);
        setTotalPicks(0);
        setLogs([]);
    };

    return (
        <GameContext.Provider value={{
            wrestlers,
            participants,
            currentDrafterIndex,
            isDrafting,
            totalPicks,
            logs,
            setWrestlers,
            setParticipants,
            setIsDrafting,
            setCurrentDrafterIndex,
            handleElimination,
            addParticipant,
            addWrestler,
            removeWrestler,
            handleDraftPick,
            enterRing,
            updateParticipantScore,
            resetGame,
            addLog,
            undo,
            exportState,
            importState,
            history
        }}>
            {children}
        </GameContext.Provider>
    );
};

export const useGame = () => {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error('useGame must be used within a GameProvider');
    }
    return context;
};
