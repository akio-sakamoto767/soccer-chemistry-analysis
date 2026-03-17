import React, { useState, useEffect } from 'react'
import { apiClient } from '../../api/client'
import { formatChemistryScore } from '../../utils/helpers'

const ChemistryComparison = ({ selectedPlayers, formation }) => {
  const [comparisonData, setComparisonData] = useState(null)
  const [loading, setLoading] = useState(false)

  // Create player lookup
  const playerLookup = {}
  if (selectedPlayers) {
    selectedPlayers.forEach(playerOption => {
      if (playerOption.player) {
        playerLookup[playerOption.value] = playerOption.player
      }
    })
  }

  const calculateAllChemistryTypes = async () => {
    if (selectedPlayers.length !== 11) return

    setLoading(true)
    try {
      const playerIds = selectedPlayers.map(p => p.value)
      
      // Calculate all three chemistry types
      const [offensiveResponse, defensiveResponse, averageResponse] = await Promise.all([
        apiClient.calculateTeamChemistry(playerIds, formation, 'offensive'),
        apiClient.calculateTeamChemistry(playerIds, formation, 'defensive'),
        apiClient.calculateTeamChemistry(playerIds, formation, 'average')
      ])

      setComparisonData({
        offensive: offensiveResponse.data,
        defensive: defensiveResponse.data,
        average: averageResponse.data
      })
    } catch (error) {
      console.error('Error calculating chemistry comparison:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    calculateAllChemistryTypes()
  }, [selectedPlayers, formation])

  if (!comparisonData || loading) {
    return (
      <div className="glass-card p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Chemistry Type Comparison</h3>
        <div className="text-center text-gray-400">
          {loading ? 'Calculating all chemistry types...' : 'Select 11 players to see comparison'}
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card p-6">
      <h3 className="text-xl font-semibold text-white mb-4">Chemistry Type Comparison</h3>
      
      {/* Average Chemistry Comparison */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-red-500/10 rounded-lg border border-red-400/30">
          <div className="text-2xl font-bold text-red-400">
            {formatChemistryScore(comparisonData.offensive.average_chemistry)}
          </div>
          <div className="text-sm text-red-300">Offensive Chemistry</div>
        </div>
        
        <div className="text-center p-4 bg-blue-500/10 rounded-lg border border-blue-400/30">
          <div className="text-2xl font-bold text-blue-400">
            {formatChemistryScore(comparisonData.defensive.average_chemistry)}
          </div>
          <div className="text-sm text-blue-300">Defensive Chemistry</div>
        </div>
        
        <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-400/30">
          <div className="text-2xl font-bold text-green-400">
            {formatChemistryScore(comparisonData.average.average_chemistry)}
          </div>
          <div className="text-sm text-green-300">Average Chemistry</div>
        </div>
      </div>

      {/* Top Partnership Comparison */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-white">Top Partnership by Chemistry Type</h4>
        
        <div className="grid md:grid-cols-3 gap-4">
          {/* Offensive Top Partnership */}
          <div className="p-3 bg-red-500/10 rounded-lg border border-red-400/30">
            <div className="text-sm font-medium text-red-300 mb-2">Offensive Leader</div>
            {comparisonData.offensive.strongest_pairs[0] && (
              <div className="text-xs text-white">
                <div className="font-medium">
                  {playerLookup[comparisonData.offensive.strongest_pairs[0].player1_id]?.short_name || `Player ${comparisonData.offensive.strongest_pairs[0].player1_id}`} ↔ 
                  {playerLookup[comparisonData.offensive.strongest_pairs[0].player2_id]?.short_name || `Player ${comparisonData.offensive.strongest_pairs[0].player2_id}`}
                </div>
                <div className="text-red-400 font-bold">
                  {formatChemistryScore(comparisonData.offensive.strongest_pairs[0].chemistry)}
                </div>
              </div>
            )}
          </div>

          {/* Defensive Top Partnership */}
          <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-400/30">
            <div className="text-sm font-medium text-blue-300 mb-2">Defensive Leader</div>
            {comparisonData.defensive.strongest_pairs[0] && (
              <div className="text-xs text-white">
                <div className="font-medium">
                  {playerLookup[comparisonData.defensive.strongest_pairs[0].player1_id]?.short_name || `Player ${comparisonData.defensive.strongest_pairs[0].player1_id}`} ↔ 
                  {playerLookup[comparisonData.defensive.strongest_pairs[0].player2_id]?.short_name || `Player ${comparisonData.defensive.strongest_pairs[0].player2_id}`}
                </div>
                <div className="text-blue-400 font-bold">
                  {formatChemistryScore(comparisonData.defensive.strongest_pairs[0].chemistry)}
                </div>
              </div>
            )}
          </div>

          {/* Average Top Partnership */}
          <div className="p-3 bg-green-500/10 rounded-lg border border-green-400/30">
            <div className="text-sm font-medium text-green-300 mb-2">Overall Leader</div>
            {comparisonData.average.strongest_pairs[0] && (
              <div className="text-xs text-white">
                <div className="font-medium">
                  {playerLookup[comparisonData.average.strongest_pairs[0].player1_id]?.short_name || `Player ${comparisonData.average.strongest_pairs[0].player1_id}`} ↔ 
                  {playerLookup[comparisonData.average.strongest_pairs[0].player2_id]?.short_name || `Player ${comparisonData.average.strongest_pairs[0].player2_id}`}
                </div>
                <div className="text-green-400 font-bold">
                  {formatChemistryScore(comparisonData.average.strongest_pairs[0].chemistry)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Differences Indicator */}
      <div className="mt-4 p-3 bg-yellow-500/10 rounded-lg border border-yellow-400/30">
        <div className="text-sm text-yellow-300">
          <strong>Key Insight:</strong> If the top partnerships are different across chemistry types, 
          the system is working correctly. Different chemistry types should emphasize different player combinations.
        </div>
      </div>
    </div>
  )
}

export default ChemistryComparison