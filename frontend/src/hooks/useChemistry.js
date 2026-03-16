import { useState, useCallback } from 'react'
import { apiClient } from '../api/client'

export const useChemistry = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const calculatePairChemistry = useCallback(async (player1Id, player2Id) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await apiClient.calculatePairChemistry(player1Id, player2Id)
      return response.data
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Failed to calculate chemistry'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const calculateTeamChemistry = useCallback(async (playerIds, formation, chemistryType = 'average') => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await apiClient.calculateTeamChemistry(playerIds, formation, chemistryType)
      return response.data
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Failed to calculate team chemistry'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const optimizeSquad = useCallback(async (squadPool, formation, maximize = true, weight = 0.5) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await apiClient.optimizeSquad(squadPool, formation, maximize, weight)
      return response.data
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Failed to optimize squad'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    loading,
    error,
    calculatePairChemistry,
    calculateTeamChemistry,
    optimizeSquad,
    clearError
  }
}