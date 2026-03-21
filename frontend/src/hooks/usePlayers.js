import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '../api/client'
import { debounce } from '../utils/helpers'

export const usePlayers = () => {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const searchPlayers = useCallback(
    debounce(async (searchTerm, filters = {}) => {
      if (searchTerm.length < 2 && !filters.team_id && !filters.role_code) {
        setPlayers([])
        return
      }

      setLoading(true)
      setError(null)

      try {
        const response = await apiClient.getPlayers({
          search: searchTerm,
          ...filters,
          limit: 50,
          min_minutes: 0
        })
        const raw = response.data.players
        const playersArray = Array.isArray(raw) ? raw : Object.values(raw || {})
        setPlayers(playersArray)
      } catch (err) {
        console.error('Error searching players:', err)
        setError('Failed to search players')
        setPlayers([])
      } finally {
        setLoading(false)
      }
    }, 300),
    []
  )

  const getPlayer = useCallback(async (playerId) => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiClient.getPlayer(playerId)
      return response.data
    } catch (err) {
      console.error('Error getting player:', err)
      setError('Failed to get player details')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const loadInitialPlayers = useCallback(async (filters = {}) => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiClient.getPlayers({
        ...filters,
        limit: 20,
        min_minutes: 0
      })
      const raw = response.data.players
      const playersArray = Array.isArray(raw) ? raw : Object.values(raw || {})
      setPlayers(playersArray)
    } catch (err) {
      console.error('Error loading initial players:', err)
      setError('Failed to load players')
    } finally {
      setLoading(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    players,
    loading,
    error,
    searchPlayers,
    getPlayer,
    loadInitialPlayers,
    clearError
  }
}