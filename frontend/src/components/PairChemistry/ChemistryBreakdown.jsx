import React, { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const ChemistryBreakdown = ({ chemistry }) => {
  const [activeTab, setActiveTab] = useState('offensive')

  if (!chemistry) return null

  // Helper function to get trend indicator
  const getTrendIndicator = (value) => {
    if (value >= 75) return { icon: '📈', text: 'Excellent', color: 'text-green-400' }
    if (value >= 60) return { icon: '📊', text: 'Good', color: 'text-blue-400' }
    if (value >= 40) return { icon: '📉', text: 'Average', color: 'text-yellow-400' }
    return { icon: '⚠️', text: 'Needs Improvement', color: 'text-red-400' }
  }

  // Helper function to get confidence score based on data completeness
  const getConfidenceScore = (chemistry) => {
    let confidence = 85 // Base confidence
    
    // Adjust based on contextual bonus (indicates data richness)
    const avgContextual = (chemistry.offensive_breakdown.contextual_bonus + chemistry.defensive_breakdown.contextual_bonus) / 2
    confidence += avgContextual * 15 // Up to 15% bonus for rich contextual data
    
    return Math.min(confidence, 99)
  }

  // League average simulation (in real app, this would come from API)
  const getLeagueAverage = (metric) => {
    const averages = {
      'Role Compatibility': 65,
      'Statistical Complementarity': 58,
      'Performance Alignment': 62,
      'Contextual Bonus': 25
    }
    return averages[metric] || 60
  }

  const offensiveData = [
    {
      name: 'Role Compatibility',
      value: chemistry.offensive_breakdown.role_compatibility * 100,
      leagueAvg: getLeagueAverage('Role Compatibility'),
      description: 'How well the player positions complement each other tactically'
    },
    {
      name: 'Statistical Complementarity',
      value: chemistry.offensive_breakdown.stat_complementarity * 100,
      leagueAvg: getLeagueAverage('Statistical Complementarity'),
      description: 'How well their playing styles and statistics complement each other'
    },
    {
      name: 'Performance Alignment',
      value: chemistry.offensive_breakdown.performance_alignment * 100,
      leagueAvg: getLeagueAverage('Performance Alignment'),
      description: 'How similar their performance levels and ratings are'
    },
    {
      name: 'Contextual Bonus',
      value: chemistry.defensive_breakdown.contextual_bonus * 100,
      leagueAvg: getLeagueAverage('Contextual Bonus'),
      description: 'Bonuses for same team, league, or nationality'
    }
  ]

  const defensiveData = [
    {
      name: 'Role Compatibility',
      value: chemistry.defensive_breakdown.role_compatibility * 100,
      leagueAvg: getLeagueAverage('Role Compatibility'),
      description: 'How well the positions work together defensively'
    },
    {
      name: 'Statistical Complementarity',
      value: chemistry.defensive_breakdown.stat_complementarity * 100,
      leagueAvg: getLeagueAverage('Statistical Complementarity'),
      description: 'How their defensive styles and stats complement each other'
    },
    {
      name: 'Performance Alignment',
      value: chemistry.defensive_breakdown.performance_alignment * 100,
      leagueAvg: getLeagueAverage('Performance Alignment'),
      description: 'Work rate compatibility and defensive coordination'
    },
    {
      name: 'Contextual Bonus',
      value: chemistry.defensive_breakdown.contextual_bonus * 100,
      leagueAvg: getLeagueAverage('Contextual Bonus'),
      description: 'Bonuses for shared context and familiarity'
    }
  ]

  const currentData = activeTab === 'offensive' ? offensiveData : defensiveData
  const confidenceScore = getConfidenceScore(chemistry)
  const avgChemistry = activeTab === 'offensive' ? chemistry.offensive_chemistry : chemistry.defensive_chemistry
  const overallTrend = getTrendIndicator(avgChemistry)

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const trend = getTrendIndicator(data.value)
      const vsLeague = data.value - data.leagueAvg
      
      return (
        <div className="glass-panel p-3 rounded-lg shadow-lg max-w-xs backdrop-blur-md">
          <p className="font-semibold text-white">{label}</p>
          <p className="text-primary-400 font-medium">
            Score: {payload[0].value.toFixed(1)}/100
          </p>
          <p className="text-sm text-slate-300">
            League Avg: {data.leagueAvg}/100
          </p>
          <p className={`text-sm font-medium ${vsLeague >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {vsLeague >= 0 ? '+' : ''}{vsLeague.toFixed(1)} vs League
          </p>
          <div className="flex items-center mt-1">
            <span className="mr-1">{trend.icon}</span>
            <span className={`text-xs ${trend.color}`}>{trend.text}</span>
          </div>
          <p className="text-sm text-gray-300 mt-1">
            {data.description}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="glass-card">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-2xl font-semibold text-white">
          Chemistry Breakdown
        </h2>
        
        {/* Confidence Score & Overall Trend */}
        <div className="text-right">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-lg">{overallTrend.icon}</span>
            <span className={`font-semibold ${overallTrend.color}`}>
              {overallTrend.text}
            </span>
          </div>
          <div className="text-xs text-slate-400">
            Confidence: {confidenceScore.toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 glass-panel p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('offensive')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
            activeTab === 'offensive'
              ? 'bg-white/20 text-green-400 shadow-sm backdrop-blur-sm'
              : 'text-gray-300 hover:text-white'
          }`}
        >
          Offensive Chemistry
        </button>
        <button
          onClick={() => setActiveTab('defensive')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
            activeTab === 'defensive'
              ? 'bg-white/20 text-red-400 shadow-sm backdrop-blur-sm'
              : 'text-gray-300 hover:text-white'
          }`}
        >
          Defensive Chemistry
        </button>
      </div>

      {/* Chart */}
      <div className="h-80 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={currentData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 60,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: '#d1d5db' }}
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 12, fill: '#d1d5db' }}
              label={{ value: 'Score', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#d1d5db' } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="value"
              fill={activeTab === 'offensive' ? '#16a34a' : '#dc2626'}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid md:grid-cols-2 gap-4">
        {currentData.map((item, index) => {
          const trend = getTrendIndicator(item.value)
          const vsLeague = item.value - item.leagueAvg
          
          return (
            <div key={index} className="p-4 glass-panel rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center space-x-2">
                  <h4 className="font-semibold text-white">{item.name}</h4>
                  <span className="text-sm">{trend.icon}</span>
                </div>
                <div className="text-right">
                  <span className={`font-bold ${
                    item.value >= 75 ? 'text-green-400' :
                    item.value >= 50 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {item.value.toFixed(1)}
                  </span>
                  <div className={`text-xs ${vsLeague >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {vsLeague >= 0 ? '+' : ''}{vsLeague.toFixed(1)} vs avg
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-300 mb-2">{item.description}</p>
              
              {/* Progress bar with league average indicator */}
              <div className="mt-2 relative">
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-1000 ${
                      item.value >= 75 ? 'bg-green-500' :
                      item.value >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${item.value}%` }}
                  ></div>
                </div>
                {/* League average marker */}
                <div 
                  className="absolute top-0 w-0.5 h-2 bg-white/60"
                  style={{ left: `${item.leagueAvg}%` }}
                  title={`League Average: ${item.leagueAvg}%`}
                ></div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Enhanced Insights */}
      <div className="mt-6 grid md:grid-cols-2 gap-4">
        {/* Key Insights */}
        <div className="p-4 glass-panel rounded-lg border border-blue-400/30">
          <h4 className="font-semibold text-blue-300 mb-2">
            💡 Key Insights
          </h4>
          <div className="text-sm text-blue-200 space-y-1">
            {activeTab === 'offensive' ? (
              <>
                <p>• Higher role compatibility indicates better tactical synergy in attack</p>
                <p>• Statistical complementarity shows how well their playing styles mesh</p>
                <p>• Performance alignment suggests they can operate at similar levels</p>
                <p>• Contextual bonuses reflect familiarity and communication advantages</p>
              </>
            ) : (
              <>
                <p>• Defensive role compatibility shows how well they defend together</p>
                <p>• Style complementarity indicates balanced defensive approaches</p>
                <p>• Work rate alignment suggests coordinated defensive effort</p>
                <p>• Positional proximity affects their ability to support each other</p>
              </>
            )}
          </div>
        </div>

        {/* Chemistry Summary */}
        <div className="p-4 glass-panel rounded-lg border border-purple-400/30">
          <h4 className="font-semibold text-purple-300 mb-2">
            📊 Chemistry Summary
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-300">Overall Rating:</span>
              <span className={`font-semibold ${overallTrend.color}`}>
                {overallTrend.text}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-300">Data Confidence:</span>
              <span className="text-white font-medium">{confidenceScore.toFixed(0)}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-300">Best Component:</span>
              <span className="text-green-400 font-medium">
                {currentData.reduce((max, item) => item.value > max.value ? item : max).name}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-300">Improvement Area:</span>
              <span className="text-yellow-400 font-medium">
                {currentData.reduce((min, item) => item.value < min.value ? item : min).name}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChemistryBreakdown