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
    if (term.length < 2 && !Object.values(currentFilters).some(v => v)) {
      setOptions([])
      return
    }

    setLoading(true)
    try {
      const searchParams = {
        search: term,
        limit: 50,
        min_minutes: currentFilters.minMinutes || 0
      }

      // Add filters to search params
      if (currentFilters.position) {
        searchParams.role_code = currentFilters.position
      }

      const response = await apiClient.getPlayers(searchParams)

      let playerOptions = response.data.players
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

      const formattedOptions = playerOptions.map(player => ({
        value: player.id,
        label: formatPlayerName(player),
        player: player
      }))

      setOptions(formattedOptions)
    } catch (error) {
      console.error('Error searching players:', error)
      setOptions([])
    } finally {
      setLoading(false)
    }
  }, 300)
  // Load initial players
  useEffect(() => {
    const loadInitialPlayers = async () => {
      setLoading(true)
      try {
        const response = await apiClient.getPlayers({
          limit: 20,
          min_minutes: filters.minMinutes || 0
        })

        const playerOptions = response.data.players
          .filter(player => !excludeIds.includes(player.id))
          .map(player => ({
            value: player.id,
            label: formatPlayerName(player),
            player: player
          }))

        setOptions(playerOptions)
      } catch (error) {
        console.error('Error loading initial players:', error)
      } finally {
        setLoading(false)
      }
    }

    loadInitialPlayers()
  }, [excludeIds, filters.minMinutes])

  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    const newFilters = { ...filters, [filterName]: value }
    setFilters(newFilters)
    debouncedSearch(searchTerm, newFilters)
  }

  const handleInputChange = (inputValue) => {
    setSearchTerm(inputValue)
    debouncedSearch(inputValue, filters)
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
      borderColor: state.isFocused ? '#475569' : '#374151',
      backgroundColor: '#1e293b',
      boxShadow: state.isFocused ? '0 0 0 1px #475569' : 'none',
      '&:hover': {
        borderColor: '#475569'
      }
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected 
        ? '#475569' 
        : state.isFocused 
        ? '#334155' 
        : '#1e293b',
      color: 'white',
      '&:hover': {
        backgroundColor: state.isSelected ? '#475569' : '#334155'
      }
    }),
    singleValue: (provided) => ({
      ...provided,
      color: 'white',
    }),
    input: (provided) => ({
      ...provided,
      color: 'white',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#94a3b8',
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: '#1e293b',
      border: '1px solid #374151',
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: '#374151',
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: 'white',
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: 'white',
      '&:hover': {
        backgroundColor: '#475569',
        color: 'white',
      },
    }),
  }
  const formatOptionLabel = ({ label, player }) => (
    <div className="flex items-center space-x-3">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
          <span className="text-xs font-medium text-white">
            {player.role_code || '?'}
          </span>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white truncate">
          {player.short_name}
        </div>
        <div className="text-xs text-slate-400 truncate">
          {player.team_name} • {player.role_name}
          {player.overall_rating && ` • ${player.overall_rating}`}
          {player.age_years && ` • ${Math.floor(player.age_years)}y`}
        </div>
      </div>
    </div>
  )

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
        noOptionsMessage={({ inputValue }) => 
          inputValue.length < 2 && !Object.values(filters).some(v => v)
            ? "Type at least 2 characters to search or use filters..." 
            : "No players found matching criteria"
        }
        formatOptionLabel={formatOptionLabel}
        styles={customStyles}
        className="react-select-container"
        classNamePrefix="react-select"
        isClearable
        isSearchable
        menuPortalTarget={document.body}
        menuPosition="fixed"
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