import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { getChemistryColor, getChemistryDescription, formatChemistryScore } from '../../utils/helpers'

const ChemistryScore = ({ chemistry }) => {
  if (!chemistry) return null

  const scores = [
    {
      name: 'Offensive Chemistry',
      value: chemistry.offensive_chemistry,
      color: '#16a34a',
      icon: ''
    },
    {
      name: 'Defensive Chemistry',
      value: chemistry.defensive_chemistry,
      color: '#dc2626',
      icon: ''
    },
    {
      name: 'Average Chemistry',
      value: chemistry.average_chemistry,
      color: '#7c3aed',
      icon: ''
    }
  ]

  const CircularProgress = ({ value, color, size = 120 }) => {
    const radius = (size - 20) / 2
    const circumference = 2 * Math.PI * radius
    const strokeDasharray = circumference
    const strokeDashoffset = circumference - (value / 100) * circumference

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth="8"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">
              {formatChemistryScore(value)}
            </div>
            <div className="text-xs text-gray-300">
              out of 100
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card">
      <h2 className="text-2xl font-semibold text-white mb-6 text-center">
        Chemistry Scores
      </h2>

      <div className="grid md:grid-cols-3 gap-8">
        {scores.map((score, index) => (
          <div key={index} className="text-center">
            <div className="flex justify-center mb-4">
              <CircularProgress
                value={score.value}
                color={score.color}
                size={140}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-center space-x-2">
                <span className="text-2xl">{score.icon}</span>
                <h3 className="text-lg font-semibold text-white">
                  {score.name}
                </h3>
              </div>
              
              <div className={`text-lg font-bold ${getChemistryColor(score.value)}`}>
                {formatChemistryScore(score.value)}/100
              </div>
              
              <div className="text-sm text-gray-300">
                {getChemistryDescription(score.value)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-8 p-4 glass-panel rounded-lg">
        <div className="text-center">
          <h4 className="text-lg font-semibold text-white mb-2">
            Overall Assessment
          </h4>
          <p className="text-gray-300">
            This partnership shows{' '}
            <span className={`font-semibold ${getChemistryColor(chemistry.average_chemistry)}`}>
              {getChemistryDescription(chemistry.average_chemistry).toLowerCase()}
            </span>
            {' '}chemistry with a{' '}
            {chemistry.offensive_chemistry > chemistry.defensive_chemistry 
              ? 'stronger offensive' 
              : chemistry.defensive_chemistry > chemistry.offensive_chemistry
              ? 'stronger defensive'
              : 'balanced offensive and defensive'
            } connection.
          </p>
        </div>
      </div>
    </div>
  )
}

export default ChemistryScore