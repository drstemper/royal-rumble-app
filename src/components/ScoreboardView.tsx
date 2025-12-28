import React, { useMemo } from 'react';
import { useGame } from '../context/GameContext';


const ScoreboardView: React.FC = () => {
    const { participants, wrestlers, logs } = useGame();

    // Sort participants by score descending
    const sortedParticipants = useMemo(() => {
        return [...participants].sort((a, b) => b.totalScore - a.totalScore);
    }, [participants]);

    const inRingWrestlers = wrestlers.filter(w => w.status === 'IN_RING');

    // Ticker logs (last 10)
    const recentLogs = logs.slice(0, 10);

    return (
        <div className="h-screen flex flex-col bg-black text-white overflow-hidden font-sans">
            {/* Header */}
            <header className="h-20 bg-gradient-to-r from-blue-900 to-red-900 flex items-center justify-center border-b-4 border-yellow-500 shadow-2xl z-10">
                <h1 className="text-5xl font-black uppercase tracking-widest text-shadow-lg text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                    Royal Rumble Scoreboard
                </h1>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Column: Leaderboard (40%) */}
                <div className="w-[40%] bg-gray-900 border-r-4 border-gray-700 flex flex-col">
                    <div className="bg-gray-800 p-4 border-b-2 border-gray-600">
                        <h2 className="text-3xl font-bold text-yellow-500 uppercase tracking-wider text-center">Leaderboard</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {sortedParticipants.map((p, index) => (
                            <div
                                key={p.id}
                                className={`flex items-center justify-between p-4 rounded-lg transform transition-all duration-500 border-2 ${index === 0 ? 'bg-gradient-to-r from-yellow-700/50 to-yellow-900/50 border-yellow-500 scale-[1.02] mb-4' :
                                    index === 1 ? 'bg-gray-800 border-gray-400' :
                                        index === 2 ? 'bg-gray-800 border-orange-700' :
                                            'bg-gray-800 border-gray-700'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <span className={`text-4xl font-black w-12 text-center ${index === 0 ? 'text-yellow-400' :
                                        index === 1 ? 'text-gray-300' :
                                            index === 2 ? 'text-orange-400' :
                                                'text-gray-600'
                                        }`}>
                                        {index + 1}
                                    </span>
                                    <div>
                                        <div className="text-2xl font-bold leading-none">{p.name}</div>
                                        <div className="text-sm text-gray-400 mt-1">{p.roster.length} Wrestlers</div>
                                    </div>
                                </div>
                                <div className="text-4xl font-mono font-bold text-green-400 tabular-nums">
                                    {p.totalScore.toFixed(2)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column: In The Ring (60%) */}
                <div className="w-[60%] bg-black relative flex flex-col p-6">
                    {/* Ring Background Effect */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black pointer-events-none"></div>

                    <h2 className="text-3xl font-bold text-red-500 uppercase tracking-widest text-center mb-6 relative z-10 shadow-black drop-shadow-md">
                        Current In-Ring Status
                    </h2>

                    <div className="flex-1 grid grid-cols-3 gap-6 relative z-10 content-start">
                        {inRingWrestlers.length === 0 && (
                            <div className="col-span-3 h-full flex items-center justify-center">
                                <span className="text-4xl text-gray-700 italic font-black uppercase">Ring is Empty</span>
                            </div>
                        )}
                        {inRingWrestlers.map(w => {
                            const owner = participants.find(p => p.id === w.draftedBy);
                            return (
                                <div key={w.id} className="bg-gray-800 rounded-xl overflow-hidden shadow-2xl border-2 border-blue-500/50 flex flex-col aspect-video relative group animate-in fade-in zoom-in duration-300">
                                    <div className="absolute top-2 right-2 text-xs font-bold text-gray-400 border border-gray-600 px-2 py-0.5 rounded bg-black/50">
                                        ENTRY #{w.entryOrder ? new Date(w.entryOrder).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }) : 'EARLY'}
                                    </div>
                                    <div className="flex-1 flex items-center justify-center p-4 text-center bg-gradient-to-b from-gray-800 to-gray-900">
                                        <span className="text-3xl font-black text-white leading-tight drop-shadow-md">{w.name}</span>
                                    </div>
                                    <div className="bg-blue-900 py-2 px-3 flex justify-between items-center text-sm font-bold tracking-wider uppercase text-blue-100">
                                        <span>OWNER</span>
                                        <span className="text-yellow-400">{owner?.name || 'Unknown'}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Bottom Ticker */}
            <footer className="h-16 bg-red-900 border-t-4 border-red-700 flex items-center overflow-hidden relative shadow-[0_-5px_15px_rgba(0,0,0,0.5)] z-20">
                <div className="bg-red-800 h-full px-6 flex items-center z-10 shadow-xl border-r border-red-950 font-black text-white italic text-xl tracking-tighter">
                    LATEST ACTION
                </div>
                <div className="flex-1 overflow-hidden relative flex items-center h-full">
                    {/* Static ticker for simplicity (scrolling can be tricky without careful width calc) */}
                    {/* We will fade in the latest log */}
                    <div className="absolute inset-0 flex items-center gap-12 px-8 animate-marquee whitespace-nowrap">
                        {recentLogs.map((log, i) => (
                            <span key={log.timestamp + i} className="text-2xl font-bold text-white/90 flex items-center gap-4">
                                <span className="text-yellow-400/50 text-lg">●</span>
                                {log.message}
                            </span>
                        ))}
                    </div>
                </div>
            </footer>

            {/* Victory Overlay */}
            {wrestlers.length > 0 && wrestlers.filter(w => w.status === 'POOL').length === 0 && wrestlers.filter(w => w.status === 'DRAFTED').length === 0 && inRingWrestlers.length === 1 && (
                <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center animate-in fade-in duration-1000">
                    <div className="text-center">
                        <h1 className="text-6xl font-black text-yellow-500 mb-8 uppercase tracking-widest animate-bounce">
                            WINNER
                        </h1>
                        <div className="bg-gradient-to-b from-yellow-600 to-yellow-800 p-12 rounded-3xl border-8 border-yellow-300 shadow-[0_0_100px_rgba(234,179,8,0.5)] transform hover:scale-105 transition-transform duration-500">
                            <div className="text-8xl font-black text-white mb-4 drop-shadow-xl">
                                {inRingWrestlers[0].name}
                            </div>
                            <div className="text-3xl font-bold text-yellow-100 uppercase tracking-widest">
                                Managed By: {participants.find(p => p.id === inRingWrestlers[0].draftedBy)?.name || 'Unknown'}
                            </div>
                        </div>
                        <div className="mt-12 text-gray-400 font-mono">
                            ROYAL RUMBLE CHAMPION
                        </div>
                    </div>
                    {/* Simple Confetti CSS */}
                    <style>{`
                        .confetti {
                            position: fixed;
                            width: 10px;
                            height: 10px;
                            background-color: #f00;
                            animation: fall linear forwards;
                        }
                        @keyframes fall {
                            to { transform: translateY(100vh) rotate(720deg); }
                        }
                    `}</style>
                </div>
            )}

            <style>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-100%); }
                }
                .animate-marquee {
                    animation: marquee 30s linear infinite;
                }
                .text-shadow-lg {
                    text-shadow: 2px 2px 0 #000;
                }
            `}</style>
        </div>
    );
};

export default ScoreboardView;
