import axios from 'axios'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`)
    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    console.error('Response error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

// API functions
export const apiClient = {
  // Health check
  health: () => api.get('/health'),

  // Players
  getPlayers: (params = {}) => api.get('/players', { params }),
  getPlayer: (playerId) => api.get(`/players/${playerId}`),
  getFormations: () => api.get('/players/formations/all'),

  // Chemistry
  calculatePairChemistry: (player1Id, player2Id) =>
    api.post('/chemistry/pair', {
      player1_id: player1Id,
      player2_id: player2Id,
    }),

  calculateTeamChemistry: (playerIds, formation, chemistryType = 'average') =>
    api.post('/chemistry/team', {
      player_ids: playerIds,
      formation,
      chemistry_type: chemistryType,
    }),

  // Optimizer
  optimizeSquad: (squadPool, formation, maximize = true, weight = 0.5) =>
    api.post('/optimize', {
      squad_pool: squadPool,
      formation,
      maximize,
      weight,
    }),
}

export default api