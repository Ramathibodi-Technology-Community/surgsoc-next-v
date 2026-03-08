'use client'

import React, { useEffect, useState } from 'react'
import mermaid from 'mermaid'

const DIAGRAM_DEF = `
stateDiagram-v2
    direction LR
    [*] --> applicant : User registers
    applicant --> accepted : Organizer selects
    applicant --> rejected : Organizer rejects
    accepted --> confirmed : User confirms (CTA)
    accepted --> declined : User submits LOA form (CTA)
    confirmed --> participant : Event ends
    confirmed --> declined : User submits LOA
    applicant --> subscribed : Capacity full
    subscribed --> accepted : Slot opens (auto-promote)
    declined --> [*] : Withdrawn
    rejected --> [*]
    participant --> [*] : Submit reflection
`

export default function RegistrationFlowDiagram() {
  const [svg, setSvg] = useState<string>('')

  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, theme: 'default' });
    (async () => {
      try {
        // Unique ID for each render to avoid conflicts
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`
        const { svg } = await mermaid.render(id, DIAGRAM_DEF)
        setSvg(svg)
      } catch (e) {
        console.error('Mermaid render error:', e)
      }
    })()
  }, [])

  return (
    <div className="field-type ui-field">
      <label className="field-label">Registration Lifecycle</label>
      <div
        className="mermaid-container p-4 bg-white/50 rounded-lg border border-border/50 overflow-x-auto"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <div className="text-xs text-muted-foreground mt-2">
        This diagram shows how user statuses transition. Organize users in the "Registrations" collection.
      </div>
    </div>
  )
}
