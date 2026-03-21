import React, { useState, useEffect } from 'react'
import PlayerSelect from '../common/PlayerSelect'
import SoccerPitch from './SoccerPitch'
import TeamStatsFixed from './TeamStatsFixed'
import { apiClient } from '../../api/client'
import { LoadingIcon, AlertIcon, NetworkIcon, CheckIcon } from '../common/Icons'

const TeamNetwork = () => {
  const [selectedPlayers, setSelectedPlayers] = useState([])
  const [formation, setFormation] = useState('4-3-3')
  const [formations, setFormations] = useState([])
  const [chemistryData, setChemistryData] = useState(null)
  const [viewMode, setViewMode] = useState('average')
  const [chemistryFilter, setChemistryFilter] = useState('all') // 'all', 'excellent', 'good', 'poor'
  const [chemistryTypeForRecommend, setChemistryTypeForRecommend] = useState('balanced') // NEW: for optimization
  const [loading, setLoading] = useState(false)
  const [loadingRecommend, setLoadingRecommend] = useState(false)
  const [error, setError] = useState(null)

  // Load formations on component mount
  useEffect(() => {
    const loadFormations = async () => {
      try {
        const response = await apiClient.getFormations()
        setFormations(response.data.formations)
      } catch (err) {
        console.error('Error loading formations:', err)
      }
    }
    loadFormations()
  }, [])

  // Extract the chemistry calculation logic
  const calculateChemistry = async (players, formationToUse, viewModeToUse) => {
    if (players.length !== 11) {
      setError('Please select exactly 11 players')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const playerIds = players.map(p => p.value)
      const response = await apiClient.calculateTeamChemistry(
        playerIds,
        formationToUse,
        viewModeToUse
      )
      console.log('=== Team Chemistry Response ===')
      console.log('Response data:', response.data)
      console.log('Pairs count:', response.data.pairs?.length)
      console.log('Sample pairs:', response.data.pairs?.slice(0, 3))
      setChemistryData(response.data)
    } catch (err) {
      console.error('Error calculating team chemistry:', err)
      setError(err.response?.data?.detail || 'Failed to calculate team chemistry')
    } finally {
      setLoading(false)
    }
  }

  // Auto-update visualization when formation, viewMode, or players change
  useEffect(() => {
    if (selectedPlayers.length === 11 && chemistryData) {
      // Debug: Log the chemistry type change
      console.log('Chemistry type changed to:', viewMode)
      // Automatically recalculate when formation or chemistry type changes
      calculateChemistry(selectedPlayers, formation, viewMode)
    }
  }, [formation, viewMode])

  const handleVisualize = async () => {
    await calculateChemistry(selectedPlayers, formation, viewMode)
  }

  const handleReset = () => {
    setSelectedPlayers([])
    setChemistryData(null)
    setError(null)
  }

  const handleRecommendTeam = async () => {
    setLoadingRecommend(true)
    setError(null)

    try {
      console.log('=== Recommending Team (Chemistry-Optimized) ===')
      console.log('Formation:', formation)
      console.log('Chemistry Type:', chemistryTypeForRecommend)
      
      const response = await apiClient.recommendTeam(
        formation, 
        70, 
        chemistryTypeForRecommend,  // Pass chemistry type for optimization
        100  // Pool size
      )
      
      console.log('Recommended players:', response.data.players.length)
      console.log('Optimization metadata:', response.data.optimization_metadata)
      
      const recommendedPlayers = response.data.players.map(player => ({
        value: player.id,
        label: player.short_name || 'Unknown',
        player: player
      }))
      
      console.log('Formatted players:', recommendedPlayers.length)
      setSelectedPlayers(recommendedPlayers)
      
      // IMPORTANT: Sync viewMode with the optimization strategy
      // Map optimization strategy to visualization chemistry type
      const viewModeMap = {
        'offensive': 'offensive',
        'balanced': 'average',
        'defensive': 'defensive'
      }
      const newViewMode = viewModeMap[chemistryTypeForRecommend] || 'average'
      setViewMode(newViewMode)
      console.log('Setting viewMode to:', newViewMode)
      
      // Wait a bit for state to update, then visualize
      setTimeout(async () => {
        if (recommendedPlayers.length === 11) {
          console.log('Auto-visualizing recommended team with chemistry type:', newViewMode)
          await calculateChemistry(recommendedPlayers, formation, newViewMode)
        }
      }, 100)
    } catch (err) {
      console.error('Error recommending team:', err)
      setError(err.response?.data?.error || 'Failed to recommend team')
    } finally {
      setLoadingRecommend(false)
    }
  }

  const excludeIds = selectedPlayers.map(p => p.value)

  return (
    <div className="max-w-8xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold gradient-text text-glow mb-7">
          Team Chemistry Network
        </h1>
        <p className="text-xl text-slate-300 max-w-5xl mx-auto leading-relaxed">
          Visualize chemistry connections between 11 players on an interactive soccer pitch. 
          Lines connect players with thickness and color representing chemistry strength.
        </p>
      </div>

      {/* Configuration Panel */}
      <div className="card-gradient mb-12">
        <h2 className="text-3xl font-bold gradient-text text-glow mb-8 text-center">
          Team Configuration
        </h2>

        {/* Player Selection */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <label className="block text-lg font-semibold text-white">
              Select 11 Players
            </label>
            <button
              onClick={handleRecommendTeam}
              disabled={loadingRecommend}
              className="btn-secondary text-sm px-6 py-2 flex items-center gap-2"
            >
              {loadingRecommend ? (
                <>
                  <LoadingIcon className="w-4 h-4" />
                  Optimizing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Recommend Team
                </>
              )}
            </button>
          </div>
      
          
          <PlayerSelect
            value={selectedPlayers}
            onChange={setSelectedPlayers}
            placeholder="Search and select players..."
            isMulti={true}
            maxSelections={11}
            excludeIds={[]}
          />
          <p className="mt-2 text-sm text-slate-400">
            💡 Click "Recommend Team" to auto-select 11 players optimized for chemistry based on your chosen strategy
          </p>
        </div>

        {/* Formation and View Mode */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div>
            <label className="block text-lg font-semibold text-white mb-3">
              Formation
            </label>
            <select
              value={formation}
              onChange={(e) => setFormation(e.target.value)}
              className="w-full px-4 py-3 text-lg rounded-md bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
              disabled={loading}
              style={{
                backgroundColor: '#334155',
                color: '#ffffff',
                border: '1px solid #475569'
              }}
            >
              <option value="4-3-3" style={{ backgroundColor: '#334155', color: '#ffffff' }}>4-3-3</option>
              <option value="4-4-2" style={{ backgroundColor: '#334155', color: '#ffffff' }}>4-4-2</option>
              <option value="4-2-3-1" style={{ backgroundColor: '#334155', color: '#ffffff' }}>4-2-3-1</option>
              <option value="3-5-2" style={{ backgroundColor: '#334155', color: '#ffffff' }}>3-5-2</option>
              <option value="3-4-3" style={{ backgroundColor: '#334155', color: '#ffffff' }}>3-4-3</option>
            </select>
          </div>

          <div>
            <label className="block text-lg font-semibold text-white mb-3">
              Chemistry Type (Visualization)
            </label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="w-full px-4 py-3 text-lg rounded-md bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
              disabled={loading}
              style={{
                backgroundColor: '#334155',
                color: '#ffffff',
                border: '1px solid #475569'
              }}
            >
              <option value="average" style={{ backgroundColor: '#334155', color: '#ffffff' }}>Average Chemistry</option>
              <option value="offensive" style={{ backgroundColor: '#334155', color: '#ffffff' }}>Offensive Chemistry</option>
              <option value="defensive" style={{ backgroundColor: '#334155', color: '#ffffff' }}>Defensive Chemistry</option>
            </select>
            <p className="text-xs text-slate-400 mt-1">
              Auto-syncs with Recommend Team strategy
            </p>
          </div>

          <div className="flex items-end">
            <div className="w-full space-y-3">
              <button
                onClick={handleVisualize}
                disabled={selectedPlayers.length !== 11 || loading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-lg py-4 glow-green"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <LoadingIcon className="w-6 h-6 mr-3" />
                    Calculating...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <NetworkIcon className="w-6 h-6 mr-3" />
                    Visualize Team
                  </span>
                )}
              </button>
              <button
                onClick={handleReset}
                className="w-full btn-secondary text-lg py-4"
              >
                Reset Selection
              </button>
            </div>
          </div>
        </div>

        {/* Player Count Indicator */}
        <div className="flex items-center justify-between text-lg p-4 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
          <span className="text-white font-medium">
            Selected: {selectedPlayers.length}/11 players
          </span>
          {selectedPlayers.length > 0 && (
            <span className={`font-semibold flex items-center ${
              selectedPlayers.length === 11 ? 'text-green-400' : 'text-orange-400'
            }`}>
              {selectedPlayers.length === 11 ? (
                <>
                  <CheckIcon className="w-5 h-5 mr-2" />
                  Ready to visualize
                </>
              ) : (
                `Need ${11 - selectedPlayers.length} more`
              )}
            </span>
          )}
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

      {/* Visualization */}
      {chemistryData && (
        <div className="space-y-12">
          {/* Soccer Pitch Visualization */}
          <div className="card-gradient glow-green relative">
            {loading && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
                <div className="flex items-center space-x-3 text-white">
                  <LoadingIcon className="w-8 h-8" />
                  <span className="text-lg font-medium">Updating visualization...</span>
                </div>
              </div>
            )}
            
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
              <h2 className="text-3xl font-bold gradient-text text-glow">
                Team Chemistry Network
              </h2>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-white/80 mr-2">Filter by Quality:</span>
                <button
                  onClick={() => setChemistryFilter('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    chemistryFilter === 'all'
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  All Lines
                </button>
                <button
                  onClick={() => setChemistryFilter('excellent')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    chemistryFilter === 'excellent'
                      ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-green-500/50'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  <div className="w-4 h-1.5 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full"></div>
                  Excellent (80+)
                </button>
                <button
                  onClick={() => setChemistryFilter('good')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    chemistryFilter === 'good'
                      ? 'bg-gradient-to-r from-lime-500 to-yellow-500 text-white shadow-lg shadow-yellow-500/50'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  <div className="w-4 h-1.5 bg-gradient-to-r from-lime-400 to-yellow-500 rounded-full"></div>
                  Good (60-79)
                </button>
                <button
                  onClick={() => setChemistryFilter('poor')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    chemistryFilter === 'poor'
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-red-500/50'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  <div className="w-4 h-1.5 bg-gradient-to-r from-orange-400 to-red-500 rounded-full"></div>
                  Poor (30-59)
                </button>
              </div>
            </div>

            <SoccerPitch
              players={selectedPlayers}
              formation={formation}
              chemistryPairs={chemistryData.pairs}
              viewMode={viewMode}
              chemistryFilter={chemistryFilter}
            />
          </div>

          {/* Team Statistics */}
          <TeamStatsFixed 
            chemistryData={chemistryData} 
            selectedPlayers={selectedPlayers}
          />
        </div>
      )}
    </div>
  )
}

export default TeamNetwork