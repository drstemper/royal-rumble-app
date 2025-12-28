import React, { useState } from 'react';
import { useGame } from '../context/GameContext';


const AdminOperator: React.FC = () => {
    const {
        wrestlers,
        participants,
        enterRing,
        handleElimination,
        updateParticipantScore,
        undo,
        exportState,
        importState,
        history
    } = useGame();

    const [isEliminationModalOpen, setIsEliminationModalOpen] = useState<boolean>(false);
    const [selectedWrestlerId, setSelectedWrestlerId] = useState<string | null>(null);
    const [selectedEliminators, setSelectedEliminators] = useState<string[]>([]);
    const [modalSearchTerm, setModalSearchTerm] = useState('');

    // Manual Score Adjustment State
    const [isEditScoreModalOpen, setIsEditScoreModalOpen] = useState(false);
    const [editingParticipant, setEditingParticipant] = useState<{ id: string, name: string, score: number } | null>(null);

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const json = event.target?.result as string;
            if (json) importState(json);
        };
        reader.readAsText(file);
    };

    // Derived Lists
    const draftedWrestlers = wrestlers.filter(w => w.status === 'DRAFTED');
    const inRingWrestlers = wrestlers.filter(w => w.status === 'IN_RING');

    // Elimination Flow
    const initiateElimination = (id: string) => {
        setSelectedWrestlerId(id);
        setSelectedEliminators([]);
        setIsEliminationModalOpen(true);
    };

    const toggleEliminator = (id: string) => {
        if (selectedEliminators.includes(id)) {
            setSelectedEliminators(prev => prev.filter(eId => eId !== id));
        } else {
            setSelectedEliminators(prev => [...prev, id]);
        }
    };

    const confirmElimination = () => {
        if (selectedWrestlerId) {
            handleElimination(selectedWrestlerId, selectedEliminators);
            setIsEliminationModalOpen(false);
            setSelectedWrestlerId(null);
        }
    };

    // Score Editing
    const startEditingScore = (participantId: string, name: string, currentScore: number) => {
        setEditingParticipant({ id: participantId, name, score: currentScore });
        setIsEditScoreModalOpen(true);
    };

    const saveScore = () => {
        if (editingParticipant) {
            updateParticipantScore(editingParticipant.id, editingParticipant.score);
            setIsEditScoreModalOpen(false);
            setEditingParticipant(null);
        }
    };

    return (
        <div className="h-full flex flex-col bg-gray-900 text-white p-4">
            <header className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
                <h1 className="text-3xl font-bold uppercase text-red-500 tracking-wider">Event Operator</h1>
                <div className="flex gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".json"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded font-bold text-sm"
                    >
                        Import
                    </button>
                    <button
                        onClick={exportState}
                        className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded font-bold text-sm"
                    >
                        Export
                    </button>
                    <div className="w-px bg-gray-600 mx-2"></div>
                    <button
                        onClick={undo}
                        disabled={history.length === 0}
                        className={`px-4 py-2 rounded font-bold text-sm uppercase flex items-center gap-2 ${history.length === 0 ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-yellow-600 hover:bg-yellow-500 text-white'
                            }`}
                    >
                        <span>↶</span> Undo
                    </button>
                </div>
            </header>

            <div className="flex-1 flex gap-6 overflow-hidden">
                {/* Left Column: Queue & Score Control */}
                <div className="w-1/3 flex flex-col gap-6">
                    {/* Queue */}
                    <div className="bg-gray-800 rounded-lg p-4 flex-1 flex flex-col">
                        <h2 className="text-xl font-bold mb-4 text-blue-400 uppercase tracking-wide">On Deck (Queue)</h2>
                        <div className="flex-1 overflow-y-auto space-y-2">
                            {draftedWrestlers.length === 0 && <p className="text-gray-500 italic">Queue is empty.</p>}
                            {draftedWrestlers.map(w => (
                                <div key={w.id} className="bg-gray-700 p-3 rounded flex justify-between items-center border-l-4 border-blue-500">
                                    <div>
                                        <div className="font-bold text-lg">{w.name}</div>
                                        <div className="text-xs text-gray-400">
                                            Drafted by: <span className="text-blue-200">{participants.find(p => p.id === w.draftedBy)?.name}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => enterRing(w.id)}
                                        className="bg-green-600 hover:bg-green-500 text-white font-bold py-1 px-3 rounded uppercase text-sm tracking-wide"
                                    >
                                        Enter Ring
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Score Control */}
                    <div className="bg-gray-800 rounded-lg p-4 h-1/3 flex flex-col">
                        <h2 className="text-xl font-bold mb-4 text-purple-400 uppercase tracking-wide">Score Adjustment</h2>
                        <div className="flex-1 overflow-y-auto space-y-2">
                            {participants.map(p => (
                                <div key={p.id} className="flex items-center justify-between bg-gray-700 p-2 rounded">
                                    <span className="font-bold">{p.name}</span>
                                    <div className="flex items-center gap-4">
                                        <span className="text-xl font-mono text-purple-300">{p.totalScore}</span>
                                        <button
                                            onClick={() => startEditingScore(p.id, p.name, p.totalScore)}
                                            className="text-gray-400 hover:text-white text-sm underline"
                                        >
                                            Edit
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: In The Ring */}
                <div className="w-2/3 bg-gray-800 rounded-lg p-4 flex flex-col">
                    <h2 className="text-xl font-bold mb-4 text-red-500 uppercase tracking-wide flex justify-between">
                        <span>In The Ring</span>
                        <span className="text-sm bg-red-900/50 px-2 rounded text-red-300">{inRingWrestlers.length} Active</span>
                    </h2>

                    <div className="flex-1 overflow-y-auto grid grid-cols-3 gap-4 content-start">
                        {inRingWrestlers.length === 0 && (
                            <div className="col-span-3 h-full flex items-center justify-center">
                                <span className="text-2xl text-gray-600 font-bold uppercase italic">Empty Ring</span>
                            </div>
                        )}
                        {inRingWrestlers.map(w => (
                            <div key={w.id} className="bg-gray-900 border-2 border-red-500/30 rounded-lg p-4 flex flex-col justify-between aspect-video relative group hover:border-red-500 transition-colors">
                                <div className="text-center">
                                    <h3 className="text-xl font-black text-white leading-tight mb-1">{w.name}</h3>
                                    <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">
                                        Owner: {participants.find(p => p.id === w.draftedBy)?.name}
                                    </div>
                                </div>
                                <button
                                    onClick={() => initiateElimination(w.id)}
                                    className="w-full mt-4 bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded uppercase tracking-wider shadow-lg transform active:scale-95 transition-all"
                                >
                                    ELIMINATED
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Elimination Modal */}
            {isEliminationModalOpen && selectedWrestlerId && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-700">
                        <div className="p-6 border-b border-gray-700">
                            <h2 className="text-2xl font-bold text-white">Confirm Elimination</h2>
                            <p className="text-gray-400 mt-2 text-lg">
                                Who eliminated <span className="text-white font-bold">{wrestlers.find(w => w.id === selectedWrestlerId)?.name}</span>?
                            </p>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            <input
                                type="text"
                                placeholder="Search eliminators..."
                                className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={modalSearchTerm}
                                onChange={(e) => setModalSearchTerm(e.target.value)}
                            />

                            <div className="grid grid-cols-2 gap-3">
                                {inRingWrestlers.filter(w => w.id !== selectedWrestlerId).length === 0 && (
                                    <p className="text-gray-500 col-span-2 text-center py-4">No other wrestlers in ring (Self Elimination?)</p>
                                )}
                                {inRingWrestlers
                                    .filter(w => w.id !== selectedWrestlerId)
                                    .filter(w => w.name.toLowerCase().includes(modalSearchTerm.toLowerCase()))
                                    .map(w => (
                                        <button
                                            key={w.id}
                                            onClick={() => toggleEliminator(w.id)}
                                            className={`p-4 rounded border-2 text-left transition-all ${selectedEliminators.includes(w.id)
                                                    ? 'bg-blue-900/50 border-blue-500 text-white'
                                                    : 'bg-gray-700 border-transparent hover:bg-gray-600 text-gray-300'
                                                }`}
                                        >
                                            <div className="font-bold">{w.name}</div>
                                        </button>
                                    ))}
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-700 flex justify-end gap-4 bg-gray-800 rounded-b-xl">
                            <button
                                onClick={() => setIsEliminationModalOpen(false)}
                                className="px-6 py-3 rounded font-bold text-gray-300 hover:text-white hover:bg-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmElimination}
                                className="px-8 py-3 rounded bg-red-600 hover:bg-red-500 text-white font-bold uppercase tracking-wider shadow-lg"
                            >
                                Confirm Elimination
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Score Modal */}
            {isEditScoreModalOpen && editingParticipant && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                    <div className="bg-gray-800 p-6 rounded-lg w-96 border border-gray-600 shadow-xl">
                        <h3 className="text-xl font-bold mb-4 text-purple-400">Edit Score: {editingParticipant.name}</h3>
                        <input
                            type="number"
                            className="w-full bg-gray-900 border border-gray-700 rounded p-2 mb-4 text-white font-mono text-xl"
                            value={editingParticipant.score}
                            onChange={(e) => setEditingParticipant({ ...editingParticipant, score: parseFloat(e.target.value) || 0 })}
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setIsEditScoreModalOpen(false)}
                                className="px-4 py-2 text-gray-400 hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveScore}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded font-bold"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminOperator;
