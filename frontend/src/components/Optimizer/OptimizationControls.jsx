import React from 'react'

const OptimizationControls = ({ 
  formation, 
  setFormation, 
  maximize, 
  setMaximize, 
  weight, 
  setWeight 
}) => {
  const formations = [
    { value: '4-3-3', label: '4-3-3', description: 'Balanced attacking formation' },
    { value: '4-4-2', label: '4-4-2', description: 'Classic balanced formation' },
    { value: '4-2-3-1', label: '4-2-3-1', description: 'Defensive stability with creativity' },
    { value: '3-5-2', label: '3-5-2', description: 'Wing-back focused system' },
    { value: '3-4-3', label: '3-4-3', description: 'Attacking with wing-backs' },
  ]

  const getWeightDescription = (weight) => {
    if (weight >= 0.8) return 'Heavily Offensive'
    if (weight >= 0.6) return 'Offensive Focus'
    if (weight >= 0.4) return 'Balanced'
    if (weight >= 0.2) return 'Defensive Focus'
    return 'Heavily Defensive'
  }

  const getWeightColor = (weight) => {
    if (weight >= 0.6) return 'text-red-400'
    if (weight >= 0.4) return 'text-purple-400'
    return 'text-blue-400'
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {/* Formation Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Formation
        </label>
        <select
          value={formation}
          onChange={(e) => setFormation(e.target.value)}
          className="glass-input w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
        >
          {formations.map(f => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-400">
          {formations.find(f => f.value === formation)?.description}
        </p>
      </div>

      {/* Optimization Goal */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Optimization Goal
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="optimize"
              checked={maximize}
              onChange={() => setMaximize(true)}
              className="h-4 w-4 text-primary-400 focus:ring-primary-400 border-gray-500 bg-transparent"
            />
            <span className="ml-2 text-sm text-gray-300">
              Maximize Chemistry
            </span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="optimize"
              checked={!maximize}
              onChange={() => setMaximize(false)}
              className="h-4 w-4 text-primary-400 focus:ring-primary-400 border-gray-500 bg-transparent"
            />
            <span className="ml-2 text-sm text-gray-300">
              Minimize Chemistry
            </span>
          </label>
        </div>
        <p className="mt-1 text-xs text-gray-400">
          {maximize ? 'Find the best possible chemistry' : 'Find the worst chemistry (for analysis)'}
        </p>
      </div>

      {/* Chemistry Weight */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Chemistry Balance
        </label>
        <div className="space-y-3">
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(parseFloat(e.target.value))}
            className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
          />
          
          {/* Weight Labels */}
          <div className="flex justify-between text-xs text-gray-400">
            <span>Defensive</span>
            <span>Balanced</span>
            <span>Offensive</span>
          </div>
          
          {/* Current Weight Display */}
          <div className="text-center">
            <span className={`text-sm font-medium ${getWeightColor(weight)}`}>
              {getWeightDescription(weight)}
            </span>
            <div className="text-xs text-gray-400 mt-1">
              {Math.round((1 - weight) * 100)}% Defensive • {Math.round(weight * 100)}% Offensive
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OptimizationControls