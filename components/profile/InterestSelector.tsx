'use client'

import { useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { ProfileSetupData } from '@/lib/validations/profile'
import {
  MUSIC_GENRES,
  FOOD_PREFERENCES,
  ACTIVITIES,
} from '@/lib/validations/profile'

interface InterestSelectorProps {
  form: UseFormReturn<ProfileSetupData>
  category: 'music_genres' | 'food_preferences' | 'activities'
  label: string
  maxSelections: number
}

const categoryOptions = {
  music_genres: MUSIC_GENRES,
  food_preferences: FOOD_PREFERENCES,
  activities: ACTIVITIES,
} as const

const formatLabel = (value: string) => {
  return value
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function InterestSelector({
  form,
  category,
  label,
  maxSelections,
}: InterestSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const options = categoryOptions[category]
  const selectedInterests = form.watch(`interests.${category}`) || []

  const filteredOptions = options.filter(option =>
    formatLabel(option).toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleInterest = (interest: string) => {
    const current = selectedInterests
    const isSelected = current.includes(interest as never)

    if (isSelected) {
      form.setValue(
        `interests.${category}`,
        current.filter(item => item !== interest) as never
      )
    } else if (current.length < maxSelections) {
      form.setValue(`interests.${category}`, [...current, interest] as never)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-lg font-medium text-gray-900">{label}</label>
        <span className="text-sm text-gray-500">
          {selectedInterests.length}/{maxSelections}
        </span>
      </div>

      <input
        type="text"
        placeholder={`Search ${label.toLowerCase()}...`}
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="grid max-h-48 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
        {filteredOptions.map(option => {
          const isSelected = selectedInterests.includes(option as never)
          const isDisabled =
            !isSelected && selectedInterests.length >= maxSelections

          return (
            <button
              key={option}
              type="button"
              onClick={() => toggleInterest(option)}
              disabled={isDisabled}
              className={`
                flex min-h-[44px] items-center justify-center rounded-lg border px-3
                py-2 text-left text-sm transition-colors
                ${
                  isSelected
                    ? 'border-blue-500 bg-blue-500 text-white'
                    : isDisabled
                      ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                }
              `}
            >
              {formatLabel(option)}
            </button>
          )
        })}
      </div>

      {form.formState.errors.interests?.[category] && (
        <p className="text-sm text-red-600">
          {form.formState.errors.interests[category]?.message}
        </p>
      )}
    </div>
  )
}
