'use client'

import { useState } from 'react'

interface RatingFieldProps {
  label: string
  scale: number // 1-5, 1-10, etc.
  value?: number
  onChange: (value: number) => void
  required?: boolean
}

export default function RatingField({ label, scale, value, onChange, required }: RatingFieldProps) {
  return (
    <div className="space-y-2">
      <label className="block text-base-9 font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: scale }, (_, i) => i + 1).map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg border-2 transition-all flex items-center justify-center font-bold text-lg ${
              value === rating
                ? 'bg-primary-1 border-primary-1 text-white shadow-md transform scale-105'
                : 'bg-base-2 border-base-3 text-base-7 hover:border-primary-1 hover:text-primary-1'
            }`}
          >
            {rating}
          </button>
        ))}
      </div>
    </div>
  )
}
