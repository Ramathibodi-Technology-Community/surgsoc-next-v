import React from 'react'

import { SerializeLexical } from './SerializeLexical'

export const RichText: React.FC<{ className?: string; content: any }> = ({ className, content }) => {
  if (!content) {
    return null
  }

  return (
    <div className={['rich-text', className].filter(Boolean).join(' ')}>
      {content && !Array.isArray(content) && typeof content === 'object' && 'root' in content && SerializeLexical({ nodes: content.root.children })}
    </div>
  )
}
