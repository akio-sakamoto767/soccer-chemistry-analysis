import React from 'react'
import { getFormationCoordinates, getChemistryColorHex, getLineThickness } from '../../utils/helpers'

const SoccerPitch = ({ players, formation, chemistryPairs, viewMode, chemistryFilter = 'all' }) => {
  if (!players || players.length !== 11) {
    return (
      <div className="w-full h-96 glass-panel rounded-lg flex items-center justify-center">
        <p className="text-gray-300">Select 11 players to visualize team chemistry</p>
      </div>
    )
  }

  const coordinates = getFormationCoordinates(formation)
  const pitchWidth = 800
  const pitchHeight = 600
  const playerRadius = 25

  // Filter connections to show only meaningful ones (above threshold)
  const significantConnections = chemistryPairs ? 
    chemistryPairs.filter(pair => {
      const chemistry = pair.chemistry
      
      // Lower threshold to show more connections
      if (chemistry <= 20) return false
      
      // Then filter by selected quality
      if (chemistryFilter === 'all') return true
      if (chemistryFilter === 'excellent') return chemistry >= 80
      if (chemistryFilter === 'good') return chemistry >= 60 && chemistry < 80
      if (chemistryFilter === 'poor') return chemistry >= 20 && chemistry < 60
      
      return true
    }) : []

  // Debug: Log chemistry values to see the range
  React.useEffect(() => {
    console.log('=== SoccerPitch Debug ===')
    console.log('chemistryPairs:', chemistryPairs)
    console.log('chemistryFilter:', chemistryFilter)
    console.log('significantConnections:', significantConnections.length)
    
    if (chemistryPairs && chemistryPairs.length > 0) {
      const scores = chemistryPairs.map(pair => pair.chemistry)
      console.log('Chemistry scores range:', {
        min: Math.min(...scores),
        max: Math.max(...scores),
        avg: scores.reduce((a, b) => a + b, 0) / scores.length,
        total: scores.length,
        sample: scores.slice(0, 10)
      })
    }
  }, [chemistryPairs, chemistryFilter])

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[800px]">
        <svg
          width={pitchWidth}
          height={pitchHeight}
          viewBox={`0 0 ${pitchWidth} ${pitchHeight}`}
          className="w-full h-auto glass-panel rounded-lg"
        >
          {/* Pitch Background */}
          <rect
            width={pitchWidth}
            height={pitchHeight}
            fill="rgba(34, 197, 94, 0.1)"
            rx="8"
          />

          {/* Pitch Lines */}
          <g stroke="rgba(34, 197, 94, 0.6)" strokeWidth="2" fill="none">
            {/* Outer boundary */}
            <rect x="40" y="40" width={pitchWidth - 80} height={pitchHeight - 80} rx="4" />
            
            {/* Center line (vertical) */}
            <line x1={pitchWidth / 2} y1="40" x2={pitchWidth / 2} y2={pitchHeight - 40} />
            
            {/* Center circle */}
            <circle cx={pitchWidth / 2} cy={pitchHeight / 2} r="60" />
            
            {/* Penalty areas (left and right) */}
            <rect x="40" y="160" width="120" height="280" />
            <rect x={pitchWidth - 160} y="160" width="120" height="280" />
            
            {/* Goal areas (left and right) */}
            <rect x="40" y="220" width="60" height="160" />
            <rect x={pitchWidth - 100} y="220" width="60" height="160" />
            
            {/* Goals (left and right) */}
            <rect x="30" y="270" width="10" height="60" fill="rgba(34, 197, 94, 0.8)" />
            <rect x={pitchWidth - 40} y="270" width="10" height="60" fill="rgba(34, 197, 94, 0.8)" />
          </g>

          {/* Chemistry Lines */}
          <g>
            {significantConnections.map((pair, index) => {
              // Convert IDs to strings for comparison since they might be different types
              const player1Id = String(pair.player1_id)
              const player2Id = String(pair.player2_id)
              
              const player1Index = players.findIndex(p => String(p.value) === player1Id)
              const player2Index = players.findIndex(p => String(p.value) === player2Id)
              
              // Debug first few pairs
              if (index < 3) {
                console.log(`Pair ${index}:`, {
                  pair,
                  player1Id,
                  player2Id,
                  player1Index,
                  player2Index,
                  playerValues: players.map(p => p.value)
                })
              }
              
              if (player1Index === -1 || player2Index === -1) {
                if (index < 3) {
                  console.warn(`Player not found for pair ${index}:`, pair)
                }
                return null
              }

              const coord1 = coordinates[player1Index]
              const coord2 = coordinates[player2Index]
              
              if (!coord1 || !coord2) {
                console.warn(`Coordinates not found for indices ${player1Index}, ${player2Index}`)
                return null
              }
              
              const x1 = (coord1.x / 100) * (pitchWidth - 80) + 40
              const y1 = (coord1.y / 100) * (pitchHeight - 80) + 40
              const x2 = (coord2.x / 100) * (pitchWidth - 80) + 40
              const y2 = (coord2.y / 100) * (pitchHeight - 80) + 40

              // Get chemistry score
              let chemistry = pair.chemistry
              
              const color = getChemistryColorHex(chemistry)
              const thickness = getLineThickness(chemistry, 1, 6)

              return (
                <line
                  key={`${pair.player1_id}-${pair.player2_id}-${viewMode}-${index}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={color}
                  strokeWidth={thickness}
                  opacity="0.8"
                  className="transition-all duration-500"
                />
              )
            })}
          </g>

          {/* Players */}
          <g>
            {players.map((player, index) => {
              const coord = coordinates[index]
              const x = (coord.x / 100) * (pitchWidth - 80) + 40
              const y = (coord.y / 100) * (pitchHeight - 80) + 40

              return (
                <g key={`${player.value}-${formation}`} className="cursor-pointer">
                  {/* Player circle */}
                  <circle
                    cx={x}
                    cy={y}
                    r={playerRadius}
                    fill="rgba(255, 255, 255, 0.9)"
                    stroke="#16a34a"
                    strokeWidth="3"
                    className="drop-shadow-md hover:stroke-primary-400 transition-all duration-500"
                  />
                  
                  {/* Player role */}
                  <text
                    x={x}
                    y={y - 5}
                    textAnchor="middle"
                    className="text-xs font-bold fill-blue-800 transition-all duration-500"
                  >
                    {player.player?.role_code || '?'}
                  </text>
                  
                  {/* Player name */}
                  <text
                    x={x}
                    y={y + 8}
                    textAnchor="middle"
                    className="text-xs font-medium fill-blue-800 transition-all duration-500"
                  >
                    {player.player?.short_name?.substring(0, 8) || 'Player'}
                  </text>
                  
                  {/* Player team name */}
                  <text
                    x={x}
                    y={y + 45}
                    textAnchor="middle"
                    className="text-xs fill-blue-700 transition-all duration-500"
                    style={{ fontSize: '10px' }}
                  >
                    {player.player?.team_name?.substring(0, 10) || ''}
                  </text>
                </g>
              )
            })}
          </g>

          {/* Formation Label */}
          <text
            x={pitchWidth - 100}
            y={30}
            textAnchor="middle"
            className="text-lg font-bold fill-white"
          >
            {formation}
          </text>

          {/* View Mode Label */}
          <text
            x={100}
            y={30}
            textAnchor="middle"
            className="text-sm font-medium fill-white capitalize"
          >
            {viewMode} Chemistry
          </text>

          {/* Connection Count */}
          <text
            x={pitchWidth / 2}
            y={pitchHeight - 15}
            textAnchor="middle"
            className="text-sm font-medium fill-white"
          >
            {significantConnections.length} connection{significantConnections.length !== 1 ? 's' : ''} shown
            {chemistryFilter !== 'all' && ` (${chemistryFilter})`}
          </text>
        </svg>
      </div>

      {/* Player Legend */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
        {players.map((player, index) => (
          <div key={player.value} className="flex items-center space-x-2 p-2 glass-panel rounded">
            <div className="w-4 h-4 bg-slate-700 border-2 border-slate-400 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-white">
                {player.player?.role_code || '?'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-white truncate">
                {player.player?.short_name || 'Unknown'}
              </div>
              <div className="text-slate-400 truncate">
                {player.player?.team_name || ''}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SoccerPitch