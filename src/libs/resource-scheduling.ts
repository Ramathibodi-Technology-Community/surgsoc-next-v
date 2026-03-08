type SchedulableResource = {
  opens_at?: string | Date | null
  closes_at?: string | Date | null
  status_override?: 'auto' | 'open' | 'closed' | null
}

export const ResourceScheduling = {
  /**
   * schema:
   * - status_override: 'auto' | 'open' | 'closed'
   * - opens_at: Date
   * - closes_at: Date
   *
   * Logic:
   * 1. Force Closed -> Closed
   * 2. Force Open -> Open
   * 3. Auto -> Check dates
   */
  isOpen(resource: SchedulableResource): { isOpen: boolean; reason?: 'closed' | 'not_open_yet' | 'force_closed' } {
    const { opens_at, closes_at, status_override } = resource

    // 1. Force Override
    if (status_override === 'closed') return { isOpen: false, reason: 'force_closed' }
    if (status_override === 'open') return { isOpen: true }

    // 2. Time-based Logic
    const now = new Date()
    const start = opens_at ? new Date(opens_at) : null
    const end = closes_at ? new Date(closes_at) : null

    if (start && now < start) {
      return { isOpen: false, reason: 'not_open_yet' }
    }

    if (end && now > end) {
      return { isOpen: false, reason: 'closed' }
    }

    return { isOpen: true }
  },

  getStatusMessage(resource: SchedulableResource): string | null {
      const status = this.isOpen(resource)
      if (status.isOpen) return null

      if (resource.status_override === 'closed') return 'Closed'

      if (status.reason === 'not_open_yet' && resource.opens_at) {
          return `Opens at ${new Date(resource.opens_at).toLocaleString()}`
      }

      if (status.reason === 'closed' && resource.closes_at) {
          return `Closed at ${new Date(resource.closes_at).toLocaleString()}`
      }

      return 'Closed'
  }
}
