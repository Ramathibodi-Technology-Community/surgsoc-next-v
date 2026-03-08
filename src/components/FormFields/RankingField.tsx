'use client'

import { useState, useEffect } from 'react'

interface RankingFieldProps {
  label: string
  options: string[]
  value?: string[]
  onChange: (value: string[]) => void
  required?: boolean
}

export default function RankingField({ label, options, value = [], onChange, required }: RankingFieldProps) {
  const [items, setItems] = useState<string[]>(value.length > 0 ? value : options)

  // Ensure items are updated if options change or initial value is set late
  useEffect(() => {
    if (value.length > 0) {
      setItems(value)
    } else {
      setItems(options)
    }
  }, [JSON.stringify(options), JSON.stringify(value)])

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= items.length) return

    const newItems = [...items]
    const [movedItem] = newItems.splice(fromIndex, 1)
    newItems.splice(toIndex, 0, movedItem)
    setItems(newItems)
    onChange(newItems)
  }

  return (
    <div className="space-y-2">
      <label className="block text-base-9 font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <p className="text-sm text-base-6">Drag to reorder by preference (Standard click-to-move implemented for reliability)</p>
      <div className="space-y-2 mt-2">
        {items.map((item, index) => (
          <div
            key={item}
            className="flex items-center gap-3 p-3 bg-base-2 border border-base-3 rounded-lg hover:border-primary-1/50 transition-colors group"
          >
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => moveItem(index, index - 1)}
                disabled={index === 0}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-base-3 text-base-6 hover:text-primary-1 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Move up"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => moveItem(index, index + 1)}
                disabled={index === items.length - 1}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-base-3 text-base-6 hover:text-primary-1 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Move down"
              >
                ▼
              </button>
            </div>
            <div className="w-8 h-8 flex items-center justify-center bg-base-3 rounded-full font-bold text-primary-1 text-sm shrink-0">
              {index + 1}
            </div>
            <span className="text-base-9 font-medium">{item}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
