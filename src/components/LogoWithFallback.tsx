'use client'

import Image from 'next/image'
import { useState } from 'react'

export default function LogoWithFallback() {
  const [imageError, setImageError] = useState(false)

  if (imageError) {
    return (
      <div className="w-10 h-10 bg-primary-1 rounded-full flex items-center justify-center text-white font-bold text-xs">
        RASS
      </div>
    )
  }

  return (
    <div className="w-10 h-10 bg-primary-1 rounded-full flex items-center justify-center overflow-hidden">
      <Image
        src="/assets/logo_surgsoc.jpg"
        alt="RASS Logo"
        width={40}
        height={40}
        className="object-cover"
        onError={() => setImageError(true)}
      />
    </div>
  )
}
