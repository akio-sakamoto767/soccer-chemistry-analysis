import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { getChemistryColor, formatChemistryScore, getChemistryDescription } from '../../utils/helpers'

const TeamStatsFixed = ({ chemistryData, selectedPlayers }) => {
  if (!chemistryData) return null

  const { total_chemistry, average_chemistry, pairs, strongest_pairs, weakest_pairs } = chemistryData

  // Create a lookup for player data by ID with debugging
  const playerLookup = {}
  console.log('=== DEBUGGING PLAYER NAMES ===')
  console.log('Selected players:', selectedPlayers)
  console.log('Chemistry pairs sample:', pairs?.slice(0, 3))
  
  if (selectedPlayers) {
    selectedPlayers.forEach((playerOption, index) => {
      console.log(`Player ${index}:`, playerOption)
      if (playerOption && playerOption.player) {
        // Store with multiple key formats to handle type mismatches
        const playerId = playerOption.value
        const playerData = playerOption.player
        
        playerLookup[playerId] = playerData
        playerLookup[String(playerId)] = playerData
        playerLookup[Number(playerId)] = playerData
        
        console.log(`Added to lookup - ID: ${playerId} (type: ${typeof playerId}), Name: ${playerData.short_name}`)
      }
    })
  }
  

  // Helper function to get player name with detailed debugging
  const getPlayerName = (playerId) => {
    console.log(`Looking up player ID: ${playerId} (type: ${typeof playerId})`)
    
    // Try different key formats
    let player = playerLookup[playerId] || 
                 playerLookup[String(playerId)] || 
                 playerLookup[Number(playerId)]
    
    if (!player) {
      // If not found, try to find by matching any key
      const allKeys = Object.keys(playerLookup)
      console.log(`Player ${playerId} not found. Available keys:`, allKeys)
      
      // Try to find a matching key
      const matchingKey = allKeys.find(key => 
        key == playerId || 
        String(key) === String(playerId) || 
        Number(key) === Number(playerId)
      )
      
      if (matchingKey) {
        player = playerLookup[matchingKey]
        console.log(`Found player via matching key ${matchingKey}:`, player?.short_name)
      }
    }
    
    const name = player?.short_name || `Player ${playerId}`
    console.log(`Final name for ID ${playerId}:`, name)
    return name
  }

  // Helper function to get player role
  const getPlayerRole = (playerId) => {
    const player = playerLookup[playerId] || playerLookup[String(playerId)] || playerLookup[Number(playerId)]
    return player?.role_code || '?'
  }

  // Helper function to get player team
  const getPlayerTeam = (playerId) => {
    const player = playerLookup[playerId] || playerLookup[String(playerId)] || playerLookup[Number(playerId)]
    return player?.team_name || 'Unknown'
  }

  // Prepare data for chemistry distribution chart
  const chemistryRanges = [
    { range: '90-100', count: 0, label: 'Exceptional' },
    { range: '80-89', count: 0, label: 'Excellent' },
    { range: '70-79', count: 0, label: 'Very Good' },
    { range: '60-69', count: 0, label: 'Good' },
    { range: '50-59', count: 0, label: 'Average' },
    { range: '40-49', count: 0, label: 'Below Average' },
    { range: '0-39', count: 0, label: 'Poor' },
  ]

  pairs.forEach(pair => {
    const score = pair.chemistry
    if (score >= 90) chemistryRanges[0].count++
    else if (score >= 80) chemistryRanges[1].count++
    else if (score >= 70) chemistryRanges[2].count++
    else if (score >= 60) chemistryRanges[3].count++
    else if (score >= 50) chemistryRanges[4].count++
    else if (score >= 40) chemistryRanges[5].count++
    else chemistryRanges[6].count++
  })

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="glass-panel p-3 rounded-lg shadow-lg backdrop-blur-md">
          <p className="font-semibold text-white">{data.label}</p>
          <p className="text-primary-400">
            {payload[0].value} partnerships ({data.range})
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-8">

      {/* Overall Statistics */}
      <div className="glass-card">
        <h2 className="text-2xl font-semibold text-white mb-6">
          Team Chemistry Statistics
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center p-6 glass-panel rounded-lg border border-primary-400/30">
            <div className="text-3xl font-bold text-primary-400 mb-2">
              {formatChemistryScore(total_chemistry)}
            </div>
            <div className="text-sm text-primary-300 font-medium">
              Total Chemistry
            </div>
            <div className="text-xs text-primary-400 mt-1">
              Sum of all {pairs.length} pairs
            </div>
          </div>

          <div className="text-center p-6 glass-panel rounded-lg border border-blue-400/30">
            <div className={`text-3xl font-bold mb-2 ${getChemistryColor(average_chemistry)}`}>
              {formatChemistryScore(average_chemistry)}
            </div>
            <div className="text-sm text-blue-300 font-medium">
              Average Chemistry
            </div>
            <div className="text-xs text-blue-400 mt-1">
              {getChemistryDescription(average_chemistry)}
            </div>
          </div>

          <div className="text-center p-6 glass-panel rounded-lg border border-purple-400/30">
            <div className="text-3xl font-bold text-purple-400 mb-2">
              {pairs.length}
            </div>
            <div className="text-sm text-purple-300 font-medium">
              Player Pairs
            </div>
            <div className="text-xs text-purple-400 mt-1">
              11 players = 55 pairs
            </div>
          </div>
        </div>

        {/* Chemistry Type Indicator */}
        <div className="mt-4 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-blue-500/20 rounded-full border border-blue-400/30">
            <span className="text-sm text-blue-300 font-medium">
              Currently showing: <span className="text-white font-bold capitalize">{chemistryData.chemistry_type || 'Average'}</span> Chemistry
            </span>
          </div>
        </div>


      </div>

      {/* Chemistry Distribution */}
      <div className="glass-card">
        <h3 className="text-xl font-semibold text-white mb-4">
          Chemistry Distribution
        </h3>
        
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chemistryRanges} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis 
                dataKey="range" 
                tick={{ fontSize: 12, fill: '#d1d5db' }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12, fill: '#d1d5db' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="count" 
                fill="#16a34a" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Partnerships with Names */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Strongest Partnerships */}
        <div className="glass-card">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <span className="text-green-400 mr-2">🔥</span>
            Strongest Partnerships
          </h3>
          
          <div className="space-y-3">
            {strongest_pairs.slice(0, 5).map((pair, index) => {
              const player1Name = getPlayerName(pair.player1_id)
              const player2Name = getPlayerName(pair.player2_id)
              const player1Role = getPlayerRole(pair.player1_id)
              const player2Role = getPlayerRole(pair.player2_id)
              const player1Team = getPlayerTeam(pair.player1_id)
              const player2Team = getPlayerTeam(pair.player2_id)
              
              return (
                <div key={`${pair.player1_id}-${pair.player2_id}`} className="p-3 glass-panel rounded-lg border border-green-400/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-300">
                        #{index + 1}
                      </span>
                      <div className="text-sm text-white">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium">{player1Name}</span>
                          <span className="text-xs bg-blue-500/20 px-2 py-1 rounded">{player1Role}</span>
                          <span className="text-gray-400">↔</span>
                          <span className="font-medium">{player2Name}</span>
                          <span className="text-xs bg-blue-500/20 px-2 py-1 rounded">{player2Role}</span>
                        </div>
                        <div className="text-xs text-gray-400">
                          {player1Team === player2Team 
                            ? `Both from ${player1Team}` 
                            : `${player1Team} × ${player2Team}`
                          }
                        </div>
                      </div>
                    </div>
                    <div className={`text-sm font-bold ${getChemistryColor(pair.chemistry)}`}>
                      {formatChemistryScore(pair.chemistry)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Weakest Partnerships */}
        <div className="glass-card">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <span className="text-red-400 mr-2">⚠️</span>
            Areas for Improvement
          </h3>
          
          <div className="space-y-3">
            {weakest_pairs.slice(0, 5).map((pair, index) => {
              const player1Name = getPlayerName(pair.player1_id)
              const player2Name = getPlayerName(pair.player2_id)
              const player1Role = getPlayerRole(pair.player1_id)
              const player2Role = getPlayerRole(pair.player2_id)
              
              return (
                <div key={`${pair.player1_id}-${pair.player2_id}`} className="p-3 glass-panel rounded-lg border border-red-400/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-300">
                        #{index + 1}
                      </span>
                      <div className="text-sm text-white">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{player1Name}</span>
                          <span className="text-xs bg-blue-500/20 px-2 py-1 rounded">{player1Role}</span>
                          <span className="text-gray-400">↔</span>
                          <span className="font-medium">{player2Name}</span>
                          <span className="text-xs bg-blue-500/20 px-2 py-1 rounded">{player2Role}</span>
                        </div>
                      </div>
                    </div>
                    <div className={`text-sm font-bold ${getChemistryColor(pair.chemistry)}`}>
                      {formatChemistryScore(pair.chemistry)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="glass-card">
        <h3 className="text-xl font-semibold text-white mb-4">
          💡 Team Chemistry Insights
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-medium text-white">Strengths:</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              {average_chemistry >= 70 && (
                <li>• Excellent overall team chemistry</li>
              )}
              {strongest_pairs[0]?.chemistry >= 80 && (
                <li>• Strong core partnerships in the team</li>
              )}
              {chemistryRanges.slice(0, 3).reduce((sum, range) => sum + range.count, 0) > pairs.length * 0.3 && (
                <li>• Good distribution of high-quality partnerships</li>
              )}
              <li>• {pairs.filter(p => p.chemistry >= 60).length} partnerships above average</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium text-white">Recommendations:</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              {average_chemistry < 50 && (
                <li>• Consider formation changes to improve chemistry</li>
              )}
              {weakest_pairs[0]?.chemistry < 30 && (
                <li>• Address weak partnerships through training</li>
              )}
              {chemistryRanges[6].count > pairs.length * 0.2 && (
                <li>• Focus on improving communication between players</li>
              )}
              <li>• Build on strongest partnerships for key plays</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TeamStatsFixed