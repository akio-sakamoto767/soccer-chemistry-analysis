import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/common/Navbar'
import Home from './components/common/Home'
import PairChemistry from './components/PairChemistry/PairChemistry'
import TeamNetwork from './components/TeamNetwork/TeamNetwork'
import Optimizer from './components/Optimizer/Optimizer'

function App() {
  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/pair-chemistry" element={<PairChemistry />} />
          <Route path="/team-network" element={<TeamNetwork />} />
          <Route path="/optimizer" element={<Optimizer />} />
        </Routes>
      </main>
    </div>
  )
}

export default App