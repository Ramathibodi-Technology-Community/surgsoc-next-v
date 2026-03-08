import { beforeEach, describe, expect, it, vi } from 'vitest'

const payloadMock = {
  auth: vi.fn(),
  findByID: vi.fn(),
  update: vi.fn(),
}

const hasPermissionMock = vi.fn()

vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('payload', () => ({
  getPayload: vi.fn(async () => payloadMock),
}))
vi.mock('next/headers', () => ({
  headers: vi.fn(async () => ({ mocked: true })),
}))
vi.mock('@/libs/permissions', () => ({
  hasPermission: hasPermissionMock,
}))

describe('POST /api/events/[id]/applicants/batch', () => {
  beforeEach(() => {
    payloadMock.auth.mockReset()
    payloadMock.findByID.mockReset()
    payloadMock.update.mockReset()
    hasPermissionMock.mockReset()
  })

  it('returns 401 when user is not authenticated', async () => {
    payloadMock.auth.mockResolvedValue({ user: null })
    const { POST } = await import('@/app/api/events/[id]/applicants/batch/route')

    const req = new Request('http://localhost/api/events/1/applicants/batch', {
      method: 'POST',
      body: JSON.stringify({ action: 'accept', registrationIds: [1] }),
      headers: { 'content-type': 'application/json' },
    })

    const res = await POST(req, { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorized' })
  })

  it('returns 403 when user is not owner and lacks permission', async () => {
    payloadMock.auth.mockResolvedValue({ user: { id: 9 } })
    payloadMock.findByID.mockResolvedValue({ id: 'evt_1', owner: 1 })
    hasPermissionMock.mockReturnValue(false)

    const { POST } = await import('@/app/api/events/[id]/applicants/batch/route')

    const req = new Request('http://localhost/api/events/evt_1/applicants/batch', {
      method: 'POST',
      body: JSON.stringify({ action: 'accept', registrationIds: [1] }),
      headers: { 'content-type': 'application/json' },
    })

    const res = await POST(req, { params: Promise.resolve({ id: 'evt_1' }) })
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: 'Forbidden' })
  })

  it('updates registrations and returns count on success', async () => {
    payloadMock.auth.mockResolvedValue({ user: { id: 5 } })
    payloadMock.findByID.mockResolvedValue({ id: 'evt_2', owner: 5 })
    hasPermissionMock.mockReturnValue(false)
    payloadMock.update.mockResolvedValue({})

    const { POST } = await import('@/app/api/events/[id]/applicants/batch/route')

    const req = new Request('http://localhost/api/events/evt_2/applicants/batch', {
      method: 'POST',
      body: JSON.stringify({ action: 'accept', registrationIds: [101, 102] }),
      headers: { 'content-type': 'application/json' },
    })

    const res = await POST(req, { params: Promise.resolve({ id: 'evt_2' }) })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(payloadMock.update).toHaveBeenCalledTimes(2)
    expect(payloadMock.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'registrations',
        id: 101,
        data: expect.objectContaining({
          status: 'accepted',
          selected_by: 5,
        }),
      }),
    )
    expect(body).toEqual({ success: true, updated: 2 })
  })

  it('uses rejected status when action is not accept', async () => {
    payloadMock.auth.mockResolvedValue({ user: { id: 6 } })
    payloadMock.findByID.mockResolvedValue({ id: 'evt_3', owner: 6 })
    payloadMock.update.mockResolvedValue({})

    const { POST } = await import('@/app/api/events/[id]/applicants/batch/route')

    const req = new Request('http://localhost/api/events/evt_3/applicants/batch', {
      method: 'POST',
      body: JSON.stringify({ action: 'reject', registrationIds: [201] }),
      headers: { 'content-type': 'application/json' },
    })

    const res = await POST(req, { params: Promise.resolve({ id: 'evt_3' }) })
    expect(res.status).toBe(200)
    expect(payloadMock.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'rejected' }),
      }),
    )
  })
})
