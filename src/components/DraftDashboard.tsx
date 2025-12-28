import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { INITIAL_WRESTLERS } from '../data/seedData';

const DraftDashboard: React.FC = () => {
    const {
        wrestlers,
        participants,
        currentDrafterIndex,
        addWrestler,
        handleDraftPick,
        isDrafting,
        addParticipant
    } = useGame();

    const [newWrestlerName, setNewWrestlerName] = useState('');
    const [newWrestlerAffiliation, setNewWrestlerAffiliation] = useState('');
    const [newWrestlerOdds, setNewWrestlerOdds] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const handleAddWrestler = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newWrestlerName.trim()) return;

        addWrestler({
            name: newWrestlerName,
            affiliation: newWrestlerAffiliation,
            odds: newWrestlerOdds
        });

        setNewWrestlerName('');
        setNewWrestlerAffiliation('');
        setNewWrestlerOdds('');
    };

    const handleLoadSeedData = () => {
        if (confirm("Load default wrestler data? This will add 30+ wrestlers to the pool.")) {
            // We'll iterate and add them. Logic lives in component for now, could be in context.
            // Since addWrestler triggers a saveCheckpoint each time, this might be spammy for history.
            // But for 30 items it's okay. A bulk add would be better optimization later if needed.
            INITIAL_WRESTLERS.forEach(w => {
                addWrestler(w);
            });
        }
    };

    const poolWrestlers = wrestlers
        .filter(w => w.status === 'POOL')
        .filter(w => w.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const currentDrafter = participants.length > 0 ? participants[currentDrafterIndex] : null;

    const [newParticipantName, setNewParticipantName] = useState('');

    const handleAddParticipant = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newParticipantName.trim()) return;

        addParticipant(newParticipantName);
        setNewParticipantName('');
    };

    // Setup Mode: Active if flag is true OR (participants exist but no picks made yet and we want to allow editing)
    // Actually, let's keep it simple: If totalPicks === 0, we can toggle setup.
    // For now, default to open if no participants.

    // We'll use a local state to control the "Setup View" visibility.
    // It defaults to TRUE if we have no participants.
    // We can also toggle it if we haven't started drafting yet (totalPicks === 0).
    const [isSetupOpen, setIsSetupOpen] = useState(() => participants.length === 0);
    const { setParticipants } = useGame();

    // Re-open setup if we have 0 picks and manual toggle (we'll add a button later maybe)
    // For now, rely on the initial state and the "Start Draft" button.

    const handleStartDraft = () => {
        if (participants.length === 0) return;
        setIsSetupOpen(false);
    };

    const moveParticipant = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === participants.length - 1) return;

        const newParticipants = [...participants];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;

        [newParticipants[index], newParticipants[swapIndex]] = [newParticipants[swapIndex], newParticipants[index]];

        setParticipants(newParticipants);
    };

    if (isSetupOpen) {
        return (
            <div className="h-screen flex flex-col bg-gray-900 text-white items-center justify-center p-4">
                <div className="max-w-xl w-full bg-gray-800 p-8 rounded-lg border border-gray-700 shadow-2xl">
                    <h1 className="text-3xl font-black text-center mb-2 text-yellow-500 uppercase tracking-widest">
                        Rumble Setup
                    </h1>
                    <p className="text-gray-400 text-center mb-8 text-sm">
                        Register Managers and set the Draft Order.
                    </p>

                    <div className="space-y-6">
                        {/* Add Form */}
                        <form onSubmit={handleAddParticipant} className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Enter Manager Name"
                                className="flex-1 bg-gray-900 border border-gray-600 rounded px-4 py-2 focus:outline-none focus:border-red-500"
                                value={newParticipantName}
                                onChange={(e) => setNewParticipantName(e.target.value)}
                                autoFocus
                            />
                            <button
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded uppercase tracking-wide text-sm"
                            >
                                Add
                            </button>
                        </form>

                        {/* List of Managers */}
                        <div className="bg-gray-900 rounded border border-gray-700 max-h-60 overflow-y-auto">
                            {participants.map((p, idx) => (
                                <div key={p.id} className="flex justify-between items-center p-3 border-b border-gray-800 last:border-0 hover:bg-gray-800/50">
                                    <div className="flex items-center gap-3">
                                        <span className="text-gray-500 font-mono text-sm w-6 text-right">{idx + 1}.</span>
                                        <span className="font-bold">{p.name}</span>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => moveParticipant(idx, 'up')}
                                            disabled={idx === 0}
                                            className="p-1 text-gray-400 hover:text-white disabled:opacity-30"
                                        >
                                            ▲
                                        </button>
                                        <button
                                            onClick={() => moveParticipant(idx, 'down')}
                                            disabled={idx === participants.length - 1}
                                            className="p-1 text-gray-400 hover:text-white disabled:opacity-30"
                                        >
                                            ▼
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {participants.length === 0 && (
                                <div className="p-4 text-center text-gray-600 italic">No managers added yet.</div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <button
                            onClick={handleStartDraft}
                            disabled={participants.length === 0}
                            className={`w-full font-black py-4 rounded text-xl uppercase tracking-widest transition transform hover:scale-[1.02] ${participants.length > 0
                                ? 'bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white shadow-lg'
                                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            Start Draft
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Correction: We need to allow adding more participants even after the first one.
    // Let's add an "Add Participant" logic to the Header or somewhere in the Dashboard if drafting hasn't started fully?
    // Or just make the "Registration" a modal that overlays?

    // Better Approach:
    // If no participants, force registration.
    // If participants exist, show dashboard, BUT include an "Add Participant" button in the Roster column header?

    return (
        <div className="h-screen flex flex-col bg-gray-900 text-white">
            <header className="p-4 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-red-500 bg-clip-text text-transparent">
                    Royal Rumble Draft
                </h1>
                <div className="flex gap-4 items-center">
                    <form onSubmit={handleAddParticipant} className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Add Manager..."
                            className="bg-gray-900 border border-gray-600 rounded px-3 py-1 text-sm w-40"
                            value={newParticipantName}
                            onChange={(e) => setNewParticipantName(e.target.value)}
                        />
                        <button type="submit" className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-sm font-bold">+</button>
                    </form>
                    <div className="text-sm text-gray-400 border-l border-gray-600 pl-4">
                        {isDrafting ? 'Draft In Progress' : 'Draft Complete'}
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-hidden grid grid-cols-12 gap-4 p-4">
                {/* Left Column: The Pool (3 cols) */}
                <div className="col-span-3 flex flex-col bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                    <div className="p-4 bg-gray-750 border-b border-gray-700 space-y-3">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-yellow-500">The Pool</h2>
                            <button onClick={handleLoadSeedData} className="text-xs text-gray-500 hover:text-white underline">Load Defaults</button>
                        </div>
                        <input
                            type="text"
                            placeholder="Search wrestlers..."
                            className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <form onSubmit={handleAddWrestler} className="space-y-2 pt-2 border-t border-gray-700">
                            <input
                                type="text"
                                placeholder="Wrestler Name"
                                className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-1 text-sm"
                                value={newWrestlerName}
                                onChange={(e) => setNewWrestlerName(e.target.value)}
                            />
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Affiliation"
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-1 text-sm"
                                    value={newWrestlerAffiliation}
                                    onChange={(e) => setNewWrestlerAffiliation(e.target.value)}
                                />
                                <input
                                    type="text"
                                    placeholder="Odds"
                                    className="w-1/3 bg-gray-900 border border-gray-600 rounded px-3 py-1 text-sm"
                                    value={newWrestlerOdds}
                                    onChange={(e) => setNewWrestlerOdds(e.target.value)}
                                />
                            </div>
                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-1 rounded transition">
                                Add Wrestler
                            </button>
                        </form>
                    </div>
                    <div className="flex-1 overflow-y-auto p-0">
                        {poolWrestlers.length > 0 ? (
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-700 text-gray-400 sticky top-0">
                                    <tr>
                                        <th className="p-3 font-semibold">Name</th>
                                        <th className="p-3 font-semibold">Affiliation</th>
                                        <th className="p-3 font-semibold">Odds</th>
                                        <th className="p-3 font-semibold text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {poolWrestlers.map(w => (
                                        <tr
                                            key={w.id}
                                            className={`hover:bg-gray-700/50 transition group ${!isDrafting ? 'opacity-50' : 'cursor-pointer'}`}
                                            onClick={() => isDrafting && handleDraftPick(w.id)}
                                        >
                                            <td className="p-3 font-bold text-white group-hover:text-yellow-400">
                                                {w.name}
                                                {w.confirmed && (
                                                    <span className="ml-2 text-xs bg-green-900 text-green-300 px-1.5 py-0.5 rounded border border-green-700" title="Confirmed Entry">
                                                        ✓
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-3 text-gray-400">{w.affiliation}</td>
                                            <td className="p-3 text-gray-400 font-mono">{w.odds}</td>
                                            <td className="p-3 text-right">
                                                <span className="text-xs text-green-400 font-bold opacity-0 group-hover:opacity-100 transition uppercase tracking-wider bg-green-900/30 px-2 py-1 rounded border border-green-800">
                                                    Draft
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="text-center text-gray-500 py-10">
                                <div className="mb-2">No active wrestlers in pool</div>
                                <button
                                    onClick={handleLoadSeedData}
                                    className="text-blue-400 hover:text-blue-300 underline text-sm"
                                >
                                    Load Default Roster?
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Center Column: The Draft (5 cols) */}
                <div className="col-span-5 flex flex-col space-y-4">
                    {/* Current Pick Indicator */}
                    <div className="bg-gradient-to-br from-red-600 to-red-900 p-8 rounded-lg shadow-2xl border-2 border-red-500 text-center transform hover:scale-[1.01] transition duration-300">
                        <div className="text-red-200 uppercase tracking-widest text-sm font-semibold mb-2">Current Pick</div>
                        {currentDrafter ? (
                            <div className="text-5xl font-black text-white drop-shadow-md">
                                {currentDrafter.name}
                            </div>
                        ) : (
                            <div className="text-3xl text-gray-400 italic">Draft Complete or No Participants</div>
                        )}
                        {/* Draft Status / Animation Placeholder */}
                        <div className="mt-4 h-1 bg-red-400/30 rounded-full overflow-hidden">
                            <div className="h-full bg-white/50 w-full animate-pulse"></div>
                        </div>
                    </div>

                    {/* Draft Order List */}
                    <div className="flex-1 bg-gray-800 rounded-lg overflow-hidden border border-gray-700 flex flex-col">
                        <div className="p-3 bg-gray-750 border-b border-gray-700 font-bold text-gray-300">Draft Order</div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {participants.length === 0 && <div className="p-4 text-center text-gray-500">Add participants (top right) to start!</div>}
                            {participants.map((p, idx) => (
                                <div
                                    key={p.id}
                                    className={`p-3 rounded flex items-center justify-between border ${idx === currentDrafterIndex ? 'bg-red-900/40 border-red-500/50' : 'bg-transparent border-transparent text-gray-400'}`}
                                >
                                    <span className="font-medium text-lg">{p.name}</span>
                                    <span className="text-sm bg-gray-900 px-2 py-1 rounded text-gray-500">
                                        {p.roster.length} Picks
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Rosters (4 cols) */}
                <div className="col-span-4 bg-gray-800 rounded-lg overflow-hidden border border-gray-700 flex flex-col">
                    <div className="p-4 bg-gray-750 border-b border-gray-700">
                        <h2 className="text-xl font-bold text-blue-400">Rosters</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        {participants.length === 0 && <div className="text-center text-gray-500 mt-10">No Participants</div>}
                        {participants.map(p => (
                            <div key={p.id} className="space-y-2">
                                <div className="flex justify-between items-baseline border-b border-gray-600 pb-1">
                                    <h3 className="font-bold text-lg text-white">{p.name}</h3>
                                    <span className="text-sm text-gray-400">Score: {p.totalScore}</span>
                                </div>
                                <div className="space-y-1">
                                    {p.roster.map(wrestlerId => {
                                        const wrestler = wrestlers.find(w => w.id === wrestlerId);
                                        return wrestler ? (
                                            <div key={wrestlerId} className="text-sm text-gray-300 flex justify-between bg-gray-700/50 px-2 py-1 rounded">
                                                <span>{wrestler.name}</span>
                                                <span className={`text-xs px-1 rounded ${wrestler.status === 'ELIMINATED' ? 'bg-red-900 text-red-300' : 'bg-green-900 text-green-300'}`}>
                                                    {wrestler.status}
                                                </span>
                                            </div>
                                        ) : null;
                                    })}
                                    {p.roster.length === 0 && <div className="text-xs text-gray-500 italic">No wrestlers yet</div>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DraftDashboard;
