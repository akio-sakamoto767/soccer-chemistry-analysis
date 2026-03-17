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
 * Get chemistry color for visualizations with better differentiation
 */
export const getChemistryColorHex = (score) => {
  // Ensure score is a number
  const numScore = parseFloat(score) || 0
  
  // More granular color mapping for better visual differentiation
  if (numScore >= 80) return '#10b981' // emerald-500 - Excellent
  if (numScore >= 70) return '#22c55e' // green-500 - Very Good  
  if (numScore >= 60) return '#84cc16' // lime-500 - Good
  if (numScore >= 50) return '#eab308' // yellow-500 - Average
  if (numScore >= 40) return '#f59e0b' // amber-500 - Below Average
  if (numScore >= 30) return '#f97316' // orange-500 - Poor
  return '#ef4444' // red-500 - Very Poor
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
 * Calculate line thickness for chemistry visualization with better scaling
 */
export const getLineThickness = (score, minThickness = 1, maxThickness = 6) => {
  const numScore = parseFloat(score) || 0
  const normalized = Math.max(0, Math.min(100, numScore)) / 100
  
  // Use exponential scaling for better visual differentiation
  const exponential = Math.pow(normalized, 0.7)
  return minThickness + (exponential * (maxThickness - minThickness))
}

/**
 * Map formation string to position coordinates
 */
export const getFormationCoordinates = (formation) => {
  // Formation mapping (x, y coordinates on 100x100 grid)
  // X-axis: Defense (left) to Attack (right)
  // Y-axis: Left side to Right side of field
  const formations = {
    '4-3-3': [
      { x: 10, y: 50 }, // GK (left side, center)
      { x: 25, y: 15 }, // LB (defense, left)
      { x: 25, y: 35 }, // CB (defense, center-left)
      { x: 25, y: 65 }, // CB (defense, center-right)
      { x: 25, y: 85 }, // RB (defense, right)
      { x: 50, y: 25 }, // LCM (midfield, left)
      { x: 50, y: 50 }, // CM (midfield, center)
      { x: 50, y: 75 }, // RCM (midfield, right)
      { x: 80, y: 20 }, // LW (attack, left)
      { x: 80, y: 50 }, // ST (attack, center)
      { x: 80, y: 80 }, // RW (attack, right)
    ],
    '4-4-2': [
      { x: 10, y: 50 }, // GK
      { x: 25, y: 15 }, // LB
      { x: 25, y: 35 }, // CB
      { x: 25, y: 65 }, // CB
      { x: 25, y: 85 }, // RB
      { x: 50, y: 15 }, // LM
      { x: 50, y: 35 }, // LCM
      { x: 50, y: 65 }, // RCM
      { x: 50, y: 85 }, // RM
      { x: 80, y: 40 }, // LST
      { x: 80, y: 60 }, // RST
    ],
    '4-2-3-1': [
      { x: 10, y: 50 }, // GK
      { x: 25, y: 15 }, // LB
      { x: 25, y: 35 }, // CB
      { x: 25, y: 65 }, // CB
      { x: 25, y: 85 }, // RB
      { x: 40, y: 35 }, // LCDM
      { x: 40, y: 65 }, // RCDM
      { x: 60, y: 20 }, // LAM
      { x: 60, y: 50 }, // CAM
      { x: 60, y: 80 }, // RAM
      { x: 80, y: 50 }, // ST
    ],
    '3-5-2': [
      { x: 10, y: 50 }, // GK
      { x: 25, y: 25 }, // LCB
      { x: 25, y: 50 }, // CB
      { x: 25, y: 75 }, // RCB
      { x: 45, y: 10 }, // LWB
      { x: 50, y: 30 }, // LCM
      { x: 50, y: 50 }, // CM
      { x: 50, y: 70 }, // RCM
      { x: 45, y: 90 }, // RWB
      { x: 80, y: 40 }, // LST
      { x: 80, y: 60 }, // RST
    ],
    '3-4-3': [
      { x: 10, y: 50 }, // GK
      { x: 25, y: 25 }, // LCB
      { x: 25, y: 50 }, // CB
      { x: 25, y: 75 }, // RCB
      { x: 50, y: 15 }, // LM
      { x: 50, y: 35 }, // LCM
      { x: 50, y: 65 }, // RCM
      { x: 50, y: 85 }, // RM
      { x: 80, y: 20 }, // LW
      { x: 80, y: 50 }, // ST
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