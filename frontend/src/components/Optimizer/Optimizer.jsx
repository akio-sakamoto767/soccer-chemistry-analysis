import React, { useState } from 'react'
import PlayerSelect from '../common/PlayerSelect'
import OptimizedLineup from './OptimizedLineup'
import OptimizationControls from './OptimizationControls'
import { apiClient } from '../../api/client'
import { LoadingIcon, AlertIcon, LightningIcon, CheckIcon } from '../common/Icons'

const Optimizer = () => {
  const [squadPool, setSquadPool] = useState([])
  const [formation, setFormation] = useState('4-3-3')
  const [maximize, setMaximize] = useState(true)
  const [weight, setWeight] = useState(0.5) // 0.5 = balanced, 1 = offensive, 0 = defensive
  const [optimizedResult, setOptimizedResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastOptimizationParams, setLastOptimizationParams] = useState(null)

  // Check if parameters have changed since last optimization
  const parametersChanged = optimizedResult && lastOptimizationParams && (
    formation !== lastOptimizationParams.formation ||
    maximize !== lastOptimizationParams.maximize ||
    Math.abs(weight - lastOptimizationParams.weight) > 0.05 ||
    squadPool.length !== lastOptimizationParams.squadPoolSize
  )

  const handleOptimize = async () => {
    if (squadPool.length < 11) {
      setError('Please select at least 11 players for the squad pool')
      return
    }

    if (squadPool.length > 25) {
      setError('Squad pool cannot exceed 25 players')
      return
    }

    // Log optimization parameters for debugging
    console.log('=== SQUAD OPTIMIZATION PARAMETERS ===')
    console.log('Formation:', formation)
    console.log('Maximize:', maximize)
    console.log('Weight:', weight)
    console.log('Chemistry Type:', weight > 0.6 ? 'Offensive' : weight < 0.4 ? 'Defensive' : 'Balanced')
    console.log('Squad Pool Size:', squadPool.length)

    setLoading(true)
    setError(null)

    try {
      const squadIds = squadPool.map(p => p.value)
      const response = await apiClient.optimizeSquad(
        squadIds,
        formation,
        maximize,
        weight
      )
      
      console.log('=== OPTIMIZATION RESULT ===')
      console.log('Total Chemistry:', response.data.total_chemistry)
      console.log('Average Chemistry:', response.data.average_chemistry)
      console.log('Top Partnership Score:', response.data.top_partnerships[0]?.chemistry)
      console.log('Optimization Params:', response.data.optimization_params)
      
      // Store current parameters for change detection
      setLastOptimizationParams({
        formation,
        maximize,
        weight,
        squadPoolSize: squadPool.length
      })
      
      setOptimizedResult(response.data)
    } catch (err) {
      console.error('Error optimizing squad:', err)
      setError(err.response?.data?.detail || 'Failed to optimize squad')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setSquadPool([])
    setOptimizedResult(null)
    setError(null)
  }

  return (
    <div className="max-w-8xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold gradient-text mb-6">
          Squad Optimizer
        </h1>
        <p className="text-xl text-slate-300 max-w-5xl mx-auto leading-relaxed">
          Select a squad pool and let our AI-powered algorithm find the optimal starting XI 
          that maximizes or minimizes team chemistry. Configure the balance between 
          offensive and defensive chemistry to match your tactical preferences.
        </p>
      </div>

      {/* Configuration Panel */}
      <div className="card-gradient mb-12">
        <h2 className="text-3xl font-bold gradient-text mb-8 text-center">
          Squad Configuration
        </h2>

        {/* Squad Pool Selection */}
        <div className="mb-8">
          <label className="block text-lg font-semibold text-white mb-4">
            Squad Pool (11-25 players)
          </label>
          <PlayerSelect
            value={squadPool}
            onChange={setSquadPool}
            placeholder="Search and select players for your squad pool..."
            isMulti={true}
            maxSelections={25}
            excludeIds={[]}
          />
          <div className="mt-3 text-base text-slate-300 bg-slate-800/50 p-3 rounded-lg border border-slate-600/30">
            Select 11-25 players. The optimizer will choose the best 11 from this pool.
          </div>
        </div>

        {/* Optimization Controls */}
        <OptimizationControls
          formation={formation}
          setFormation={setFormation}
          maximize={maximize}
          setMaximize={setMaximize}
          weight={weight}
          setWeight={setWeight}
        />

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
          <button
            onClick={handleOptimize}
            disabled={squadPool.length < 11 || loading}
            className={`btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-lg px-10 py-4 ${
              parametersChanged ? 'animate-pulse bg-orange-500 hover:bg-orange-600' : ''
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <LoadingIcon className="w-6 h-6 mr-3" />
                Optimizing Squad...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <LightningIcon className="w-6 h-6 mr-3" />
                {parametersChanged ? 'Re-optimize' : maximize ? 'Maximize' : 'Minimize'} Chemistry
              </span>
            )}
          </button>
          
          <button
            onClick={handleReset}
            className="btn-secondary text-lg px-10 py-4"
          >
            Reset Configuration
          </button>
        </div>

        {/* Parameter Change Warning */}
        {parametersChanged && (
          <div className="mt-4 p-4 bg-orange-500/20 backdrop-blur-md border-2 border-orange-400/50 rounded-2xl">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <LightningIcon className="h-6 w-6 text-orange-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-semibold text-orange-300">
                  Parameters Changed
                </p>
                <p className="text-xs text-orange-200 mt-1">
                  Your optimization settings have changed. Click "Re-optimize Chemistry" to see updated results and partnerships.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Squad Pool Status */}
        <div className="mt-6 flex items-center justify-between text-lg p-4 bg-slate-800/50 rounded-xl border border-slate-600/30">
          <span className="text-white font-medium">
            Squad Pool: {squadPool.length}/25 players
          </span>
          {squadPool.length >= 11 && (
            <span className="text-green-400 font-semibold flex items-center">
              <CheckIcon className="w-5 h-5 mr-2" />
              Ready to optimize ({squadPool.length} players available)
            </span>
          )}
          {squadPool.length < 11 && squadPool.length > 0 && (
            <span className="text-orange-400 font-semibold">
              Need {11 - squadPool.length} more players (minimum 11)
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

      {/* Results */}
      {optimizedResult && (
        <OptimizedLineup
          result={optimizedResult}
          squadPool={squadPool}
          formation={formation}
          maximize={maximize}
          weight={weight}
        />
      )}
    </div>
  )
}

export default Optimizer