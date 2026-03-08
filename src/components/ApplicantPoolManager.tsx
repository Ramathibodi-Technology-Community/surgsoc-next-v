'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Applicant {
  id: string
  user: any
  status: string
  createdAt: string
  submission?: any
}

interface ApplicantPoolManagerProps {
  eventId: string
  applicants: Applicant[]
  participantLimit: number
}

export default function ApplicantPoolManager({
  eventId,
  applicants,
  participantLimit
}: ApplicantPoolManagerProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<'all' | 'applicant' | 'accepted' | 'rejected'>('all')
  const router = useRouter()

  const filteredApplicants = applicants.filter(a =>
    filter === 'all' || a.status === filter
  )

  const acceptedCount = applicants.filter(a => a.status === 'accepted').length

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selected)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelected(newSelected)
  }

  const selectAll = () => {
    setSelected(new Set(filteredApplicants.map(a => a.id)))
  }

  const deselectAll = () => {
    setSelected(new Set())
  }

  const batchAccept = async () => {
    // Check participant limit
    if (participantLimit > 0 && acceptedCount + selected.size > participantLimit) {
      alert(`Cannot accept: would exceed participant limit of ${participantLimit}`)
      return
    }

    if (!confirm(`Are you sure you want to accept ${selected.size} applicants?`)) return

    try {
      const res = await fetch(`/api/events/${eventId}/applicants/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'accept',
          registrationIds: Array.from(selected),
        }),
      })

      if (!res.ok) throw new Error('Batch operation failed')

      router.refresh()
    } catch (err) {
      alert('Failed to update applicants. Please try again.')
    }
  }

  const batchReject = async () => {
    if (!confirm(`Are you sure you want to REJECT ${selected.size} applicants?`)) return

    try {
      const res = await fetch(`/api/events/${eventId}/applicants/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          registrationIds: Array.from(selected),
        }),
      })

      if (!res.ok) throw new Error('Batch operation failed')

      router.refresh()
    } catch (err) {
      alert('Failed to update applicants. Please try again.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-base-2 p-4 rounded-lg border border-base-3">
          <p className="text-sm text-base-6">Total Applicants</p>
          <p className="text-2xl font-bold text-base-9">
            {applicants.filter(a => a.status === 'applicant').length}
          </p>
        </div>
        <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/30">
          <p className="text-sm text-green-600">Accepted</p>
          <p className="text-2xl font-bold text-green-700">
            {acceptedCount}
            {participantLimit > 0 && ` / ${participantLimit}`}
          </p>
        </div>
        <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/30">
          <p className="text-sm text-red-600">Rejected</p>
          <p className="text-2xl font-bold text-red-700">
            {applicants.filter(a => a.status === 'rejected').length}
          </p>
        </div>
        <div className="bg-primary-1/10 p-4 rounded-lg border border-primary-1/30">
          <p className="text-sm text-primary-1">Selected</p>
          <p className="text-2xl font-bold text-primary-1">{selected.size}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {(['all', 'applicant', 'accepted', 'rejected'] as const).map((f) => (
             <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg transition-colors capitalize whitespace-nowrap ${
                  filter === f
                    ? 'bg-primary-1 text-white'
                    : 'bg-base-2 text-base-7 hover:bg-base-3'
                }`}
              >
                {f}
              </button>
          ))}
        </div>

        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <button
            onClick={selectAll}
            className="px-4 py-2 bg-base-2 text-base-9 rounded-lg hover:bg-base-3 transition-colors whitespace-nowrap"
          >
            Select All
          </button>
          <button
            onClick={deselectAll}
            className="px-4 py-2 bg-base-2 text-base-9 rounded-lg hover:bg-base-3 transition-colors whitespace-nowrap"
          >
            Deselect All
          </button>
          <button
            onClick={batchAccept}
            disabled={selected.size === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            Accept ({selected.size})
          </button>
          <button
            onClick={batchReject}
            disabled={selected.size === 0}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            Reject ({selected.size})
          </button>
        </div>
      </div>

      {/* Applicant List */}
      <div className="bg-base-1 border border-base-2 rounded-lg overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="bg-base-2 border-b border-base-3">
            <tr>
              <th className="p-4 text-left w-12">
                <input
                    type="checkbox"
                    className="rounded w-4 h-4"
                    checked={filteredApplicants.length > 0 && selected.size === filteredApplicants.length}
                    onChange={(e) => e.target.checked ? selectAll() : deselectAll()}
                />
              </th>
              <th className="p-4 text-left text-base-9 font-semibold">Name</th>
              <th className="p-4 text-left text-base-9 font-semibold">Email</th>
              <th className="p-4 text-left text-base-9 font-semibold">Student ID</th>
              <th className="p-4 text-left text-base-9 font-semibold">Applied At</th>
              <th className="p-4 text-left text-base-9 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredApplicants.length === 0 ? (
                <tr>
                    <td colSpan={6} className="p-8 text-center text-base-5 italic">
                        No applicants found in this category.
                    </td>
                </tr>
            ) : (
                filteredApplicants.map((applicant) => (
                  <tr
                    key={applicant.id}
                    className="border-b border-base-2 hover:bg-base-2/50 transition-colors"
                  >
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selected.has(applicant.id)}
                        onChange={() => toggleSelect(applicant.id)}
                        className="rounded w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="p-4 text-base-9">
                      <div className="font-medium">
                          {applicant.user?.name_english?.first_name} {applicant.user?.name_english?.last_name}
                      </div>
                      <div className="text-xs text-base-5 md:hidden">
                          {applicant.user?.nickname && `(${applicant.user.nickname})`}
                      </div>
                    </td>
                    <td className="p-4 text-base-7">{applicant.user?.email}</td>
                    <td className="p-4 text-base-7 font-mono">{applicant.user?.academic?.student_id || '-'}</td>
                    <td className="p-4 text-base-7">
                      {new Date(applicant.createdAt).toLocaleDateString('en-GB', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                      })}
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                        applicant.status === 'accepted'
                          ? 'bg-green-500/20 text-green-600'
                          : applicant.status === 'rejected'
                          ? 'bg-red-500/20 text-red-600'
                          : 'bg-yellow-500/20 text-yellow-600'
                      }`}>
                        {applicant.status}
                      </span>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
