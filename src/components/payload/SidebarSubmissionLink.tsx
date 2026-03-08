
'use client'

import React from 'react'
import { useDocumentInfo } from '@payloadcms/ui'
import Link from 'next/link'

export const SidebarSubmissionLink: React.FC = () => {
  const { id } = useDocumentInfo()

  if (!id) return null

  return (
    <div style={{ marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#9a9a9a' }}>Submissions</h4>
      <Link href={`/admin/forms/${id}/submissions`} target="_blank" style={{ textDecoration: 'none' }}>
        <button
          type="button"
          style={{
            padding: '10px 15px',
            background: '#333',
            color: '#fff',
            borderRadius: '4px',
            cursor: 'pointer',
            width: '100%',
            border: 'none',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          View Submissions Table
        </button>
      </Link>
    </div>
  )
}
