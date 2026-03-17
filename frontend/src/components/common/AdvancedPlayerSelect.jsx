import React, { useState, useEffect } from 'react'
import Select from 'react-select'
import { apiClient } from '../../api/client'
import { formatPlayerName, debounce } from '../../utils/helpers'

const AdvancedPlayerSelect = ({ 
  value, 
  onChange, 
  placeholder = "Search for a player...",
  excludeIds = [],
  isMulti = false,
  maxSelections = null,
  className = "",
  showFilters = true
}) => {
  const [options, setOptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  
  // Debug options state
  useEffect(() => {
    console.log('Options state changed:', options.length, options.slice(0, 2))
  }, [options])
  
  // Filter states
  const [filters, setFilters] = useState({
    position: '',
    minRating: '',
    maxRating: '',
    ageRange: '',
    league: '',
    minMinutes: 0
  })

  // Available filter options
  const positionOptions = [
    { value: '', label: 'All Positions' },
    { value: 'GK', label: 'Goalkeeper' },
    { value: 'DEF', label: 'Defender' },
    { value: 'MID', label: 'Midfielder' },
    { value: 'FWD', label: 'Forward' }
  ]

  const ageRangeOptions = [
    { value: '', label: 'All Ages' },
    { value: '16-20', label: '16-20 years' },
    { value: '21-25', label: '21-25 years' },
    { value: '26-30', label: '26-30 years' },
    { value: '31-35', label: '31-35 years' },
    { value: '36+', label: '36+ years' }
  ]
  // Debounced search function with filters
  const debouncedSearch = debounce(async (term, currentFilters = filters) => {
    console.log('Debounced search called with term:', term, 'filters:', currentFilters)
    
    setLoading(true)
    try {
      const searchParams = {
        limit: 50,
        min_minutes: currentFilters.minMinutes || 0
      }
      
      // Add search term if provided (allow single character searches)
      if (term && term.length >= 1) {
        searchParams.search = term
      }

      // Add filters to search params
      if (currentFilters.position) {
        searchParams.role_code = currentFilters.position
      }

      console.log('Making search API call with params:', searchParams)
      const response = await apiClient.getPlayers(searchParams)
      
      console.log('Search API Response:', response)
      console.log('Search Response data type:', typeof response.data)
      console.log('Search Response data:', response.data)
      
      if (!response.data) {
        console.error('Invalid search response structure:', response)
        setOptions([])
        return
      }
      
      // Parse JSON if response.data is a string
      let responseData = response.data
      if (typeof response.data === 'string') {
        console.log('Search response data is string, parsing JSON...')
        try {
          responseData = JSON.parse(response.data)
          console.log('Parsed search response data:', responseData)
        } catch (parseError) {
          console.error('Failed to parse search JSON response:', parseError)
          setOptions([])
          return
        }
      }

      if (!responseData.players) {
        console.error('No players in search response data:', responseData)
        setOptions([])
        return
      }

      console.log('Search players array length:', responseData.players.length)

      let playerOptions = responseData.players
        .filter(player => !excludeIds.includes(player.id))

      // Apply client-side filters
      if (currentFilters.minRating) {
        playerOptions = playerOptions.filter(p => 
          p.overall_rating && p.overall_rating >= parseInt(currentFilters.minRating)
        )
      }

      if (currentFilters.maxRating) {
        playerOptions = playerOptions.filter(p => 
          p.overall_rating && p.overall_rating <= parseInt(currentFilters.maxRating)
        )
      }

      if (currentFilters.ageRange) {
        playerOptions = playerOptions.filter(p => {
          if (!p.age_years) return true
          const age = parseInt(p.age_years)
          switch (currentFilters.ageRange) {
            case '16-20': return age >= 16 && age <= 20
            case '21-25': return age >= 21 && age <= 25
            case '26-30': return age >= 26 && age <= 30
            case '31-35': return age >= 31 && age <= 35
            case '36+': return age >= 36
            default: return true
          }
        })
      }

      const formattedOptions = playerOptions.map(player => {
        const formattedName = formatPlayerName(player)
        return {
          value: player.id,
          label: formattedName,
          player: player
        }
      })

      console.log('Setting search options:', formattedOptions.length)
      setOptions(formattedOptions)
    } catch (error) {
      console.error('Error searching players:', error)
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data
      })
      setOptions([])
    } finally {
      setLoading(false)
    }
  }, 300)
  // Load initial players
  useEffect(() => {
    console.log('useEffect triggered for initial load')
    const loadInitialPlayers = async () => {
      console.log('Loading initial players...')
      setLoading(true)
      try {
        console.log('Starting API call...')
        console.log('API Base URL:', import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api')
        
        const response = await apiClient.getPlayers({
          limit: 20,
          min_minutes: filters.minMinutes || 0
        })

        console.log('Initial players response:', response)
        console.log('Response status:', response.status)
        console.log('Response headers:', response.headers)
        console.log('Initial players data type:', typeof response.data)
        console.log('Initial players data:', response.data)
        
        if (!response || !response.data) {
          console.error('No response or response.data:', response)
          setOptions([])
          return
        }
        
        // Parse JSON if response.data is a string
        let responseData = response.data
        if (typeof response.data === 'string') {
          console.log('Response data is string, parsing JSON...')
          try {
            responseData = JSON.parse(response.data)
            console.log('Parsed response data:', responseData)
          } catch (parseError) {
            console.error('Failed to parse JSON response:', parseError)
            setOptions([])
            return
          }
        }
        
        if (!responseData.players) {
          console.error('No players in response data:', responseData)
          setOptions([])
          return
        }
        
        console.log('Players array length:', responseData.players.length)

        const playerOptions = responseData.players
          .filter(player => !excludeIds.includes(player.id))
          .map(player => {
            const formattedName = formatPlayerName(player)
            return {
              value: player.id,
              label: formattedName,
              player: player
            }
          })

        setOptions(playerOptions)
      } catch (error) {
        console.error('Error loading initial players:', error)
        console.error('Error details:', {
          message: error.message,
          response: error.response,
          status: error.response?.status,
          data: error.response?.data,
          stack: error.stack
        })
        setOptions([])
      } finally {
        console.log('Finished loading, setting loading to false')
        setLoading(false)
      }
    }

    loadInitialPlayers()
  }, []) // Remove dependencies to ensure it only runs once on mount

  // Handle filter changes
  useEffect(() => {
    if (searchTerm) {
      debouncedSearch(searchTerm, filters)
    } else {
      // Reload initial players with new filters
      debouncedSearch('', filters)
    }
  }, [filters.minMinutes, filters.position]) // Only watch specific filter changes

  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    const newFilters = { ...filters, [filterName]: value }
    setFilters(newFilters)
    debouncedSearch(searchTerm, newFilters)
  }

  const handleInputChange = (inputValue) => {
    console.log('Input changed to:', inputValue)
    setSearchTerm(inputValue)
    
    // If input is cleared, load initial players
    if (!inputValue || inputValue.length === 0) {
      // Load initial players without search term
      debouncedSearch('', filters)
    } else {
      debouncedSearch(inputValue, filters)
    }
  }

  const handleChange = (selectedOption) => {
    if (isMulti && maxSelections && selectedOption && selectedOption.length > maxSelections) {
      return
    }
    onChange(selectedOption)
  }

  const clearFilters = () => {
    const clearedFilters = {
      position: '',
      minRating: '',
      maxRating: '',
      ageRange: '',
      league: '',
      minMinutes: 0
    }
    setFilters(clearedFilters)
    debouncedSearch(searchTerm, clearedFilters)
  }
  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      minHeight: '42px',
      borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
      backgroundColor: 'white',
      boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected 
        ? '#3b82f6' 
        : state.isFocused 
        ? '#e5e7eb' 
        : 'white',
      color: state.isSelected ? 'white' : 'black',
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: 'white',
      border: '1px solid #d1d5db',
      zIndex: 9999,
    }),
  }
  const formatOptionLabel = ({ label, player }) => {
    if (!player) {
      return <div>{label}</div>
    }
    
    return (
      <div>
        <div>{player.short_name || player.first_name || 'Unknown'}</div>
        <div style={{ fontSize: '12px', color: '#666' }}>
          {player.team_name || 'No Team'} • {player.role_name || 'Unknown'}
        </div>
      </div>
    )
  }

  const activeFiltersCount = Object.values(filters).filter(v => v && v !== 0).length

  return (
    <div className={className}>
      {/* Advanced Filters Toggle */}
      {showFilters && (
        <div className="mb-3">
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center space-x-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <span>🔍</span>
            <span>Advanced Filters</span>
            {activeFiltersCount > 0 && (
              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                {activeFiltersCount}
              </span>
            )}
            <span className={`transform transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>
        </div>
      )}

      {/* Advanced Filters Panel */}
      {showFilters && showAdvancedFilters && (
        <div className="mb-4 p-4 glass-panel rounded-lg space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-semibold text-white">Filter Players</h4>
            <button
              onClick={clearFilters}
              className="text-xs text-slate-400 hover:text-white"
            >
              Clear All
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {/* Position Filter */}
            <div>
              <label className="block text-xs text-slate-300 mb-1">Position</label>
              <select
                value={filters.position}
                onChange={(e) => handleFilterChange('position', e.target.value)}
                className="w-full px-2 py-1 text-sm bg-slate-700 border border-slate-600 rounded text-white"
              >
                {positionOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Age Range Filter */}
            <div>
              <label className="block text-xs text-slate-300 mb-1">Age Range</label>
              <select
                value={filters.ageRange}
                onChange={(e) => handleFilterChange('ageRange', e.target.value)}
                className="w-full px-2 py-1 text-sm bg-slate-700 border border-slate-600 rounded text-white"
              >
                {ageRangeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Min Rating Filter */}
            <div>
              <label className="block text-xs text-slate-300 mb-1">Min Rating</label>
              <input
                type="number"
                min="40"
                max="99"
                value={filters.minRating}
                onChange={(e) => handleFilterChange('minRating', e.target.value)}
                placeholder="e.g. 75"
                className="w-full px-2 py-1 text-sm bg-slate-700 border border-slate-600 rounded text-white"
              />
            </div>

            {/* Max Rating Filter */}
            <div>
              <label className="block text-xs text-slate-300 mb-1">Max Rating</label>
              <input
                type="number"
                min="40"
                max="99"
                value={filters.maxRating}
                onChange={(e) => handleFilterChange('maxRating', e.target.value)}
                placeholder="e.g. 90"
                className="w-full px-2 py-1 text-sm bg-slate-700 border border-slate-600 rounded text-white"
              />
            </div>

            {/* Min Minutes Filter */}
            <div>
              <label className="block text-xs text-slate-300 mb-1">Min Minutes</label>
              <input
                type="number"
                min="0"
                value={filters.minMinutes}
                onChange={(e) => handleFilterChange('minMinutes', parseInt(e.target.value) || 0)}
                placeholder="e.g. 500"
                className="w-full px-2 py-1 text-sm bg-slate-700 border border-slate-600 rounded text-white"
              />
            </div>
          </div>
        </div>
      )}
      {/* Main Select Component */}
      <Select
        value={value}
        onChange={handleChange}
        onInputChange={handleInputChange}
        options={options}
        isLoading={loading}
        isMulti={isMulti}
        placeholder={placeholder}
        noOptionsMessage={({ inputValue }) => {
          if (loading) {
            return "Loading players..."
          }
          if (!inputValue || inputValue.length === 0) {
            return "No players available"
          }
          return "No players found matching criteria"
        }}
        formatOptionLabel={formatOptionLabel}
        styles={customStyles}
        className="react-select-container"
        classNamePrefix="react-select"
        isClearable
        isSearchable
      />
      
      {/* Selection Counter */}
      {isMulti && maxSelections && value && (
        <div className="mt-1 text-xs text-slate-500">
          {value.length}/{maxSelections} players selected
        </div>
      )}

      {/* Results Summary */}
      {options.length > 0 && (
        <div className="mt-1 text-xs text-slate-400">
          {options.length} player{options.length !== 1 ? 's' : ''} found
          {activeFiltersCount > 0 && ` (${activeFiltersCount} filter${activeFiltersCount !== 1 ? 's' : ''} active)`}
        </div>
      )}
    </div>
  )
}

export default AdvancedPlayerSelect