import React, { useState } from 'react'
import SoccerPitch from '../TeamNetwork/SoccerPitch'
import { getChemistryColor, formatChemistryScore, getChemistryDescription } from '../../utils/helpers'

const OptimizedLineup = ({ result, squadPool, formation, maximize, weight }) => {
  const [showComparison, setShowComparison] = useState(false)

  if (!result) return null

  const {
    optimized_lineup,
    total_chemistry,
    average_chemistry,
    top_partnerships,
    weakest_link,
    players
  } = result

  // Convert optimized lineup IDs to player objects for visualization
  const optimizedPlayers = optimized_lineup.map(playerId => {
    return squadPool.find(p => p.value === playerId)
  }).filter(Boolean)

  // Create chemistry pairs for visualization (simplified)
  const chemistryPairs = top_partnerships.map(partnership => ({
    player1_id: partnership.player1_id,
    player2_id: partnership.player2_id,
    chemistry: partnership.chemistry
  }))

  return (
    <div className="space-y-8">
      {/* Results Header */}
      <div className="glass-card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-white">
            Optimized Starting XI
          </h2>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-gray-300">
                {maximize ? 'Maximized' : 'Minimized'} Chemistry
              </div>
              <div className={`text-2xl font-bold ${getChemistryColor(average_chemistry)}`}>
                {formatChemistryScore(average_chemistry)}
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 glass-panel rounded-lg border border-primary-400/30">
            <div className="text-2xl font-bold text-primary-400">
              {formatChemistryScore(total_chemistry)}
            </div>
            <div className="text-sm text-primary-300">Total Chemistry</div>
          </div>
          
          <div className="text-center p-4 glass-panel rounded-lg border border-blue-400/30">
            <div className={`text-2xl font-bold ${getChemistryColor(average_chemistry)}`}>
              {formatChemistryScore(average_chemistry)}
            </div>
            <div className="text-sm text-blue-300">Average Chemistry</div>
          </div>
          
          <div className="text-center p-4 glass-panel rounded-lg border border-green-400/30">
            <div className="text-2xl font-bold text-green-400">
              {top_partnerships.length}
            </div>
            <div className="text-sm text-green-300">Top Partnerships</div>
          </div>
          
          <div className="text-center p-4 glass-panel rounded-lg border border-purple-400/30">
            <div className="text-2xl font-bold text-purple-400">
              {formation}
            </div>
            <div className="text-sm text-purple-300">Formation</div>
          </div>
        </div>

        {/* Optimization Summary */}
        <div className="p-4 glass-panel rounded-lg">
          <h3 className="font-semibold text-white mb-2">Optimization Summary</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-300">
            <div>
              <p>• <strong>Goal:</strong> {maximize ? 'Maximize' : 'Minimize'} team chemistry</p>
              <p>• <strong>Squad Pool:</strong> {squadPool.length} players available</p>
              <p>• <strong>Formation:</strong> {formation}</p>
            </div>
            <div>
              <p>• <strong>Chemistry Balance:</strong> {Math.round(weight * 100)}% offensive, {Math.round((1-weight) * 100)}% defensive</p>
              <p>• <strong>Result:</strong> {getChemistryDescription(average_chemistry)} chemistry</p>
              <p>• <strong>Algorithm:</strong> Enhanced greedy optimization</p>
            </div>
          </div>
          
          {/* Parameter Change Indicator */}
          {result.optimization_params && (
            <div className="mt-3 p-3 bg-blue-500/10 rounded-lg border border-blue-400/30">
              <div className="text-xs text-blue-300">
                <strong>💡 Current Settings:</strong> This lineup was optimized for{' '}
                <span className="text-blue-200 font-medium">
                  {result.optimization_params.chemistry_type}
                </span>{' '}
                chemistry. Change the optimization goal or chemistry balance above to see different results.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lineup Visualization */}
      <div className="glass-card">
        <h3 className="text-xl font-semibold text-white mb-4">
          Optimized Lineup Visualization
        </h3>
        
        <SoccerPitch
          players={optimizedPlayers}
          formation={formation}
          chemistryPairs={chemistryPairs}
          viewMode="average"
        />
      </div>

      {/* Top Partnerships */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="glass-card">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <span className="text-green-400 mr-2">🔥</span>
            Best Partnerships
            {result.optimization_params && (
              <span className="ml-2 text-sm text-gray-400">
                ({result.optimization_params.chemistry_type} focus)
              </span>
            )}
          </h3>
          
          {/* Optimization Context */}
          {result.optimization_params && (
            <div className="mb-4 p-3 glass-panel rounded-lg border border-blue-400/30">
              <div className="text-xs text-blue-300 space-y-1">
                <div>
                  <strong>Goal:</strong> {result.optimization_params.maximize ? 'Maximize' : 'Minimize'} chemistry
                </div>
                <div>
                  <strong>Focus:</strong> {Math.round((1 - result.optimization_params.weight) * 100)}% Defensive, {Math.round(result.optimization_params.weight * 100)}% Offensive
                </div>
                <div>
                  <strong>Expected:</strong> {
                    result.optimization_params.weight > 0.6 
                      ? 'FWD-MID partnerships, creative combinations'
                      : result.optimization_params.weight < 0.4
                      ? 'DEF-DEF partnerships, defensive stability'
                      : 'Balanced partnerships across all positions'
                  }
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-3">
            {top_partnerships.slice(0, 5).map((partnership, index) => {
              const player1 = squadPool.find(p => p.value === partnership.player1_id)
              const player2 = squadPool.find(p => p.value === partnership.player2_id)
              
              // Determine partnership type for better display
              const role1 = player1?.player?.role_code || '?'
              const role2 = player2?.player?.role_code || '?'
              const getPartnershipType = (r1, r2) => {
                if ((r1 === 'FWD' && r2 === 'MID') || (r1 === 'MID' && r2 === 'FWD')) return 'Attack Partnership'
                if (r1 === 'DEF' && r2 === 'DEF') return 'Defensive Partnership'
                if ((r1 === 'DEF' && r2 === 'GK') || (r1 === 'GK' && r2 === 'DEF')) return 'Defensive Core'
                if (r1 === 'MID' && r2 === 'MID') return 'Midfield Partnership'
                return 'Mixed Partnership'
              }
              const partnershipType = getPartnershipType(role1, role2)
              
              return (
                <div key={index} className="p-3 glass-panel rounded-lg border border-green-400/30">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-gray-300">
                          #{index + 1}
                        </span>
                        <div className="text-sm font-medium text-white">
                          {player1?.player?.short_name || `Player ${partnership.player1_id}`}
                          <span className="text-xs bg-blue-500/20 px-2 py-1 rounded mx-2">{role1}</span>
                          ↔
                          <span className="text-xs bg-blue-500/20 px-2 py-1 rounded mx-2">{role2}</span>
                          {player2?.player?.short_name || `Player ${partnership.player2_id}`}
                        </div>
                      </div>
                      <div className="text-xs text-gray-300 flex items-center space-x-4">
                        <span>{player1?.player?.role_name} • {player2?.player?.role_name}</span>
                        <span className="text-purple-400">{partnershipType}</span>
                      </div>
                    </div>
                    <div className={`text-sm font-bold ${getChemistryColor(partnership.chemistry)}`}>
                      {formatChemistryScore(partnership.chemistry)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Weakest Link */}
        <div className="glass-card">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <span className="text-yellow-400 mr-2">⚠️</span>
            Area for Improvement
          </h3>
          
          {weakest_link ? (
            <div className="p-4 glass-panel rounded-lg border border-yellow-400/30">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-white">
                  Weakest Partnership
                </div>
                <div className={`text-lg font-bold ${getChemistryColor(weakest_link.chemistry)}`}>
                  {formatChemistryScore(weakest_link.chemistry)}
                </div>
              </div>
              
              <div className="text-sm text-gray-300 mb-3">
                Players {weakest_link.player1_id} ↔ {weakest_link.player2_id}
              </div>
              
              <div className="text-xs text-gray-400">
                This partnership has the lowest chemistry in the optimized lineup. 
                Consider tactical adjustments or training to improve their connection.
              </div>
            </div>
          ) : (
            <div className="p-4 glass-panel rounded-lg border border-green-400/30 text-center">
              <div className="text-green-400 font-medium">
                No weak partnerships detected!
              </div>
              <div className="text-sm text-green-300 mt-1">
                All partnerships are performing well.
              </div>
            </div>
          )}

          {/* Optimization Tips */}
          <div className="mt-4 p-3 glass-panel rounded-lg border border-blue-400/30">
            <h4 className="text-sm font-semibold text-blue-300 mb-2">💡 Tips</h4>
            <ul className="text-xs text-blue-200 space-y-1">
              <li>• Try different formations to see if chemistry improves</li>
              <li>• Adjust the offensive/defensive balance</li>
              <li>• Consider adding more players to the squad pool</li>
              <li>• Focus training on the weakest partnerships</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Player Details */}
      <div className="glass-card">
        <h3 className="text-xl font-semibold text-white mb-4">
          Selected Players
        </h3>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {optimizedPlayers.map((player, index) => (
            <div key={player.value} className="flex items-center space-x-3 p-3 glass-panel rounded-lg">
              <div className="w-10 h-10 bg-primary-400/20 rounded-full flex items-center justify-center border border-primary-400/30">
                <span className="text-sm font-bold text-primary-400">
                  {player.player?.role_code || '?'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">
                  {player.player?.short_name || 'Unknown'}
                </div>
                <div className="text-xs text-gray-300 truncate">
                  {player.player?.team_name} • {player.player?.role_name}
                </div>
                {player.player?.overall_rating && (
                  <div className="text-xs text-gray-400">
                    Rating: {player.player.overall_rating}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default OptimizedLineup