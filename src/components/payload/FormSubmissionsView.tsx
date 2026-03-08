
'use client'

import React, { useEffect, useState } from 'react'
import { useConfig } from '@payloadcms/ui'
import { Gutter } from '@payloadcms/ui'
import { useParams } from 'next/navigation'

type Submission = {
  id: string
  submissionData: { field: string; value: unknown }[]
  createdAt: string
  user?: { email: string } | string
}

export const FormSubmissionsView: React.FC = () => {
  const { id } = useParams()
  const { config } = useConfig()
  const { routes } = config
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    const fetchSubmissions = async () => {
      try {
        const res = await fetch(`${routes.api}/form-submissions?where[form][equals]=${id}&limit=100`)
        const data = await res.json()

        if (data.docs) {
            setSubmissions(data.docs)

            // Extract all unique field names for columns
            const fieldNames = new Set<string>()
            data.docs.forEach((sub: Submission) => {
                sub.submissionData.forEach(item => fieldNames.add(item.field))
            })
            setColumns(Array.from(fieldNames))
        }
      } catch (e) {
        console.error('Failed to fetch submissions', e)
      } finally {
        setLoading(false)
      }
    }



    fetchSubmissions()
  }, [id, routes.api])

  const exportCSV = () => {
    if (submissions.length === 0) return

    const header = ['User', 'Date', ...columns].join(',')
    const rows = submissions.map(sub => {
        const userData = typeof sub.user === 'object' ? (sub.user as any)?.email : (sub.user || 'Anonymous')
        const date = new Date(sub.createdAt).toISOString()
        const fieldValues = columns.map(col => {
            const fieldData = sub.submissionData.find(d => d.field === col)
            let val = fieldData?.value
            if (typeof val === 'object') val = JSON.stringify(val)
            return `"${String(val || '').replace(/"/g, '""')}"`
        })
        return [`"${userData}"`, `"${date}"`, ...fieldValues].join(',')
    })

    const csvContent = [header, ...rows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `submissions-${id}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) return <div>Loading...</div>

  return (
    <Gutter>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1>Form Submissions</h1>
          <button
            onClick={exportCSV}
            style={{
                padding: '10px 15px',
                background: '#333',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
            }}
          >
            Export CSV
          </button>
      </div>
      <div style={{ overflowX: 'auto', marginTop: '20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', background: '#333', color: '#fff' }}>
              <th style={{ padding: '10px' }}>User</th>
              <th style={{ padding: '10px' }}>Date</th>
              {columns.map(col => (
                <th key={col} style={{ padding: '10px' }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {submissions.map(sub => (
              <tr key={sub.id} style={{ borderBottom: '1px solid #ccc' }}>
                 <td style={{ padding: '10px' }}>
                    {typeof sub.user === 'object' ? sub.user?.email : (sub.user || 'Anonymous')}
                 </td>
                 <td style={{ padding: '10px' }}>{new Date(sub.createdAt).toLocaleDateString()}</td>
                 {columns.map(col => {
                    const fieldData = sub.submissionData.find(d => d.field === col)
                    return (
                        <td key={col} style={{ padding: '10px' }}>
                            {String(fieldData?.value || '-')}
                        </td>
                    )
                 })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Gutter>
  )
}
