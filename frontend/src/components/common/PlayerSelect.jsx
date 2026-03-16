import React, { useState, useEffect } from 'react'
import Select from 'react-select'
import { apiClient } from '../../api/client'
import { formatPlayerName, debounce } from '../../utils/helpers'

const PlayerSelect = ({ 
  value, 
  onChange, 
  placeholder = "Search for a player...",
  excludeIds = [],
  isMulti = false,
  maxSelections = null,
  className = ""
}) => {
  const [options, setOptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Debounced search function
  const debouncedSearch = debounce(async (term) => {
    if (term.length < 2) {
      setOptions([])
      return
    }

    setLoading(true)
    try {
      const response = await apiClient.getPlayers({
        search: term,
        limit: 50,
        min_minutes: 0  // Temporarily set to 0 to get any players
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
      console.error('Error searching players:', error)
      setOptions([])
    } finally {
      setLoading(false)
    }
  }, 300)

  // Load initial popular players
  useEffect(() => {
    const loadInitialPlayers = async () => {
      setLoading(true)
      try {
        const response = await apiClient.getPlayers({
          limit: 20,
          min_minutes: 0
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
  }, [excludeIds])

  const handleInputChange = (inputValue) => {
    setSearchTerm(inputValue)
    debouncedSearch(inputValue)
  }

  const handleChange = (selectedOption) => {
    // Check max selections for multi-select
    if (isMulti && maxSelections && selectedOption && selectedOption.length > maxSelections) {
      return // Don't allow more than max selections
    }

    onChange(selectedOption)
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
        </div>
      </div>
    </div>
  )

  return (
    <div className={className}>
      <Select
        value={value}
        onChange={handleChange}
        onInputChange={handleInputChange}
        options={options}
        isLoading={loading}
        isMulti={isMulti}
        placeholder={placeholder}
        noOptionsMessage={({ inputValue }) => 
          inputValue.length < 2 
            ? "Type at least 2 characters to search..." 
            : "No players found"
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
      {isMulti && maxSelections && value && (
        <div className="mt-1 text-xs text-gray-500">
          {value.length}/{maxSelections} players selected
        </div>
      )}
    </div>
  )
}

export default PlayerSelect