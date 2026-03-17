// Utility functions for the frontend

/**
 * Get chemistry color class based on score
 */
export const getChemistryColor = (score) => {
  if (score >= 75) return 'chemistry-high'
  if (score >= 50) return 'chemistry-medium'
  return 'chemistry-low'
}

/**
 * Get chemistry color for visualizations
 */
export const getChemistryColorHex = (score) => {
  if (score >= 75) return '#16a34a' // green-600
  if (score >= 50) return '#ca8a04' // yellow-600
  return '#dc2626' // red-600
}

/**
 * Format player name for display (clean version without team)
 */
export const formatPlayerName = (player) => {
  if (!player) return 'Unknown Player'
  
  // Use short_name if available, otherwise construct from first/last name
  return player.short_name || `${player.first_name || ''} ${player.last_name || ''}`.trim() || 'Unknown Player'
}

/**
 * Format player name with team for detailed display
 */
export const formatPlayerNameWithTeam = (player) => {
  if (!player) return 'Unknown Player'
  
  const name = player.short_name || `${player.first_name || ''} ${player.last_name || ''}`.trim()
  const team = player.team_name ? ` (${player.team_name})` : ''
  
  return `${name}${team}`
}

/**
 * Format chemistry score for display
 */
export const formatChemistryScore = (score) => {
  if (typeof score !== 'number') return '0.0'
  return score.toFixed(1)
}

/**
 * Get chemistry description
 */
export const getChemistryDescription = (score) => {
  if (score >= 90) return 'Exceptional'
  if (score >= 80) return 'Excellent'
  if (score >= 70) return 'Very Good'
  if (score >= 60) return 'Good'
  if (score >= 50) return 'Average'
  if (score >= 40) return 'Below Average'
  if (score >= 30) return 'Poor'
  return 'Very Poor'
}

/**
 * Debounce function for search inputs
 */
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Calculate line thickness for chemistry visualization
 */
export const getLineThickness = (score, minThickness = 1, maxThickness = 5) => {
  const normalized = Math.max(0, Math.min(100, score)) / 100
  return minThickness + (normalized * (maxThickness - minThickness))
}

/**
 * Map formation string to position coordinates
 */
export const getFormationCoordinates = (formation) => {
  // Formation mapping (x, y coordinates on 100x100 grid)
  // Based on standard soccer formations with proper positioning
  const formations = {
    '4-3-3': [
      { x: 50, y: 10 }, // GK
      { x: 15, y: 25 }, // LB
      { x: 35, y: 25 }, // CB
      { x: 65, y: 25 }, // CB
      { x: 85, y: 25 }, // RB
      { x: 25, y: 50 }, // LCM
      { x: 50, y: 50 }, // CM
      { x: 75, y: 50 }, // RCM
      { x: 20, y: 80 }, // LW
      { x: 50, y: 80 }, // ST
      { x: 80, y: 80 }, // RW
    ],
    '4-4-2': [
      { x: 50, y: 10 }, // GK
      { x: 15, y: 25 }, // LB
      { x: 35, y: 25 }, // CB
      { x: 65, y: 25 }, // CB
      { x: 85, y: 25 }, // RB
      { x: 15, y: 50 }, // LM
      { x: 35, y: 50 }, // LCM
      { x: 65, y: 50 }, // RCM
      { x: 85, y: 50 }, // RM
      { x: 40, y: 80 }, // LST
      { x: 60, y: 80 }, // RST
    ],
    '4-2-3-1': [
      { x: 50, y: 10 }, // GK
      { x: 15, y: 25 }, // LB
      { x: 35, y: 25 }, // CB
      { x: 65, y: 25 }, // CB
      { x: 85, y: 25 }, // RB
      { x: 35, y: 40 }, // LCDM
      { x: 65, y: 40 }, // RCDM
      { x: 20, y: 60 }, // LAM
      { x: 50, y: 60 }, // CAM
      { x: 80, y: 60 }, // RAM
      { x: 50, y: 80 }, // ST
    ],
    '3-5-2': [
      { x: 50, y: 10 }, // GK
      { x: 25, y: 25 }, // LCB
      { x: 50, y: 25 }, // CB
      { x: 75, y: 25 }, // RCB
      { x: 10, y: 45 }, // LWB
      { x: 30, y: 50 }, // LCM
      { x: 50, y: 50 }, // CM
      { x: 70, y: 50 }, // RCM
      { x: 90, y: 45 }, // RWB
      { x: 40, y: 80 }, // LST
      { x: 60, y: 80 }, // RST
    ],
    '3-4-3': [
      { x: 50, y: 10 }, // GK
      { x: 25, y: 25 }, // LCB
      { x: 50, y: 25 }, // CB
      { x: 75, y: 25 }, // RCB
      { x: 15, y: 50 }, // LM
      { x: 35, y: 50 }, // LCM
      { x: 65, y: 50 }, // RCM
      { x: 85, y: 50 }, // RM
      { x: 20, y: 80 }, // LW
      { x: 50, y: 80 }, // ST
      { x: 80, y: 80 }, // RW
    ],
  }

  return formations[formation] || formations['4-3-3']
}

/**
 * Filter players by search term
 */
export const filterPlayersBySearch = (players, searchTerm) => {
  if (!searchTerm) return players
  
  const term = searchTerm.toLowerCase()
  return players.filter(player => 
    player.short_name?.toLowerCase().includes(term) ||
    player.first_name?.toLowerCase().includes(term) ||
    player.last_name?.toLowerCase().includes(term) ||
    player.team_name?.toLowerCase().includes(term)
  )
}

/**
 * Sort players by chemistry score
 */
export const sortPlayersByChemistry = (players, ascending = false) => {
  return [...players].sort((a, b) => {
    const scoreA = a.chemistry || 0
    const scoreB = b.chemistry || 0
    return ascending ? scoreA - scoreB : scoreB - scoreA
  })
}

/**
 * Calculate average chemistry for a team
 */
export const calculateAverageChemistry = (pairs) => {
  if (!pairs || pairs.length === 0) return 0
  
  const total = pairs.reduce((sum, pair) => sum + (pair.chemistry || 0), 0)
  return total / pairs.length
}

/**
 * Validate formation player count
 */
export const validateFormation = (players, expectedCount = 11) => {
  return players && players.length === expectedCount
}

/**
 * Generate unique ID for components
 */
export const generateId = () => {
  return Math.random().toString(36).substr(2, 9)
}