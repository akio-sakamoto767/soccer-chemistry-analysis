import React, { useState } from 'react'
import AdvancedPlayerSelect from '../common/AdvancedPlayerSelect'
import ChemistryScore from './ChemistryScore'
import ChemistryBreakdown from './ChemistryBreakdown'
import { apiClient } from '../../api/client'
import { LoadingIcon, AlertIcon, UsersIcon } from '../common/Icons'

const PairChemistry = () => {
  const [player1, setPlayer1] = useState(null)
  const [player2, setPlayer2] = useState(null)
  const [chemistryResult, setChemistryResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleCalculate = async () => {
    if (!player1 || !player2) {
      setError('Please select both players')
      return
    }

    if (player1.value === player2.value) {
      setError('Please select two different players')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await apiClient.calculatePairChemistry(player1.value, player2.value)
      setChemistryResult(response.data)
    } catch (err) {
      console.error('Error calculating chemistry:', err)
      setError(err.response?.data?.detail || 'Failed to calculate chemistry')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setPlayer1(null)
    setPlayer2(null)
    setChemistryResult(null)
    setError(null)
  }

  const excludeIds = []
  if (player1) excludeIds.push(player1.value)
  if (player2) excludeIds.push(player2.value)

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-6">
        </div>
        <h1 className="text-5xl font-bold gradient-text text-glow mb-6">
          Player Chemistry Calculator
        </h1>
        <p className="text-xl text-slate-300 max-w-4xl mx-auto leading-relaxed mt-3">
          Calculate offensive and defensive chemistry between any two players. 
          Chemistry is based on role compatibility, statistical complementarity, 
          performance alignment, and contextual factors.
        </p>
      </div>

      {/* Player Selection */}
      <div className="card-gradient mb-12">
        <h2 className="text-3xl font-bold gradient-text text-glow mb-8 text-center">
          Select Players
        </h2>
        
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="space-y-3">
            <label className="block text-lg font-semibold text-white">
              Player 1
            </label>
            <AdvancedPlayerSelect
              value={player1}
              onChange={setPlayer1}
              placeholder="Search for first player..."
              excludeIds={player2 ? [player2.value] : []}
              showFilters={true}
            />
          </div>
          
          <div className="space-y-3">
            <label className="block text-lg font-semibold text-white">
              Player 2
            </label>
            <AdvancedPlayerSelect
              value={player2}
              onChange={setPlayer2}
              placeholder="Search for second player..."
              excludeIds={player1 ? [player1.value] : []}
              showFilters={true}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={handleCalculate}
            disabled={!player1 || !player2 || loading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-lg px-8 py-4 glow-blue"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <LoadingIcon className="w-6 h-6 mr-3" />
                Calculating Chemistry...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <UsersIcon className="w-6 h-6 mr-3" />
                Calculate Chemistry
              </span>
            )}
          </button>
          
          <button
            onClick={handleReset}
            className="btn-secondary text-lg px-8 py-4"
          >
            Reset Selection
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-6 p-6 bg-red-500/20 backdrop-blur-md border-2 border-red-400/50 rounded-2xl">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertIcon className="h-8 w-8 text-red-400" />
              </div>
              <div className="ml-4">
                <p className="text-lg font-semibold text-red-300">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {chemistryResult && (
        <div className="space-y-12">
          {/* Player Cards */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="card-gradient glow-blue">
              <div className="flex items-center space-x-6">
                <div className="icon-container bg-gradient-to-br from-blue-500/80 to-cyan-500/80 w-20 h-20 glow-blue">
                  <span className="text-2xl font-bold text-white">
                    {chemistryResult.player1.role_code || '?'}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-2 text-glow">
                    {chemistryResult.player1.short_name}
                  </h3>
                  <p className="text-lg text-white/80 mb-1">
                    {chemistryResult.player1.team_name} • {chemistryResult.player1.role_name}
                  </p>
                  {chemistryResult.player1.overall_rating && (
                    <p className="text-base text-white/60">
                      Rating: {chemistryResult.player1.overall_rating}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="card-gradient glow-purple">
              <div className="flex items-center space-x-6">
                <div className="icon-container bg-gradient-to-br from-purple-500/80 to-pink-500/80 w-20 h-20 glow-purple">
                  <span className="text-2xl font-bold text-white">
                    {chemistryResult.player2.role_code || '?'}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-2 text-glow">
                    {chemistryResult.player2.short_name}
                  </h3>
                  <p className="text-lg text-white/80 mb-1">
                    {chemistryResult.player2.team_name} • {chemistryResult.player2.role_name}
                  </p>
                  {chemistryResult.player2.overall_rating && (
                    <p className="text-base text-white/60">
                      Rating: {chemistryResult.player2.overall_rating}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Chemistry Scores */}
          <ChemistryScore chemistry={chemistryResult.chemistry} />

          {/* Chemistry Breakdown */}
          <ChemistryBreakdown chemistry={chemistryResult.chemistry} />
        </div>
      )}
    </div>
  )
}

export default PairChemistry