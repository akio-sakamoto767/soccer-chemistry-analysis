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
  const [loading, setLoading] = useState(false)
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
          <label className="block text-lg font-semibold text-white mb-4">
            Select 11 Players
          </label>
          <PlayerSelect
            value={selectedPlayers}
            onChange={setSelectedPlayers}
            placeholder="Search and select players..."
            isMulti={true}
            maxSelections={11}
            excludeIds={[]}
          />
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
              Chemistry Type
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
              <div className="flex flex-wrap items-center gap-6 text-base">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-2 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full"></div>
                  <span className="font-medium text-white">Excellent (80+)</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-2 bg-gradient-to-r from-lime-400 to-yellow-500 rounded-full"></div>
                  <span className="font-medium text-white">Good (60-79)</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-2 bg-gradient-to-r from-orange-400 to-red-500 rounded-full"></div>
                  <span className="font-medium text-white">Poor (30-59)</span>
                </div>
              </div>
            </div>

            <SoccerPitch
              players={selectedPlayers}
              formation={formation}
              chemistryPairs={chemistryData.pairs}
              viewMode={viewMode}
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