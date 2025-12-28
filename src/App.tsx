import { useState } from 'react'
import DraftDashboard from './components/DraftDashboard'
import AdminOperator from './components/AdminOperator'
import ScoreboardView from './components/ScoreboardView'

function App() {
  const [view, setView] = useState<'DRAFT' | 'ADMIN' | 'SCOREBOARD'>('DRAFT');

  if (view === 'SCOREBOARD') {
    return <ScoreboardView />;
  }

  return (
    <div className="bg-gray-900 min-h-screen flex flex-col">
      <div className="bg-gray-900 border-b border-gray-800 p-2 flex justify-center gap-4">
        <button
          onClick={() => setView('DRAFT')}
          className={`px-4 py-1 rounded text-sm font-bold ${view === 'DRAFT' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
        >
          Draft Dashboard
        </button>
        <button
          onClick={() => setView('ADMIN')}
          className={`px-4 py-1 rounded text-sm font-bold ${view === 'ADMIN' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
        >
          Admin Operator
        </button>
        <button
          onClick={() => setView('SCOREBOARD')}
          className={`px-4 py-1 rounded text-sm font-bold bg-yellow-600 text-white hover:bg-yellow-500`}
        >
          Launch Scoreboard
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {view === 'DRAFT' ? <DraftDashboard /> : <AdminOperator />}
      </div>
    </div>
  )
}

export default App
