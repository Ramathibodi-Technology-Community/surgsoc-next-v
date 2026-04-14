import { beforeEach, describe, expect, it, vi } from 'vitest'

const payloadMock = {
  auth: vi.fn(),
  find: vi.fn(),
  findByID: vi.fn(),
  update: vi.fn(),
  logger: { error: vi.fn() },
}

vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('payload', () => ({
  getPayload: vi.fn(async () => payloadMock),
}))
vi.mock('next/headers', () => ({
  headers: vi.fn(async () => ({ mocked: true })),
}))

describe('POST /api/admin/bulk-assign', () => {
  beforeEach(() => {
    payloadMock.auth.mockReset()
    payloadMock.find.mockReset()
    payloadMock.findByID.mockReset()
    payloadMock.update.mockReset()
    payloadMock.logger.error.mockReset()
  })

  it('returns 403 when user is unauthorized', async () => {
    payloadMock.auth.mockResolvedValue({ user: null })
    const { POST } = await import('@/app/api/admin/bulk-assign/route')

    const req = new Request('http://localhost/api/admin/bulk-assign', {
      method: 'POST',
      body: JSON.stringify({ mode: 'all', groupId: 'g1' }),
      headers: { 'content-type': 'application/json' },
    })

    const res = await POST(req as any)
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: 'Unauthorized' })
  })

  it('returns 400 when groupId is missing', async () => {
    payloadMock.auth.mockResolvedValue({ user: { id: 1, roles: ['admin'] } })
    const { POST } = await import('@/app/api/admin/bulk-assign/route')

    const req = new Request('http://localhost/api/admin/bulk-assign', {
      method: 'POST',
      body: JSON.stringify({ mode: 'all' }),
      headers: { 'content-type': 'application/json' },
    })

    const res = await POST(req as any)
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Missing Group ID' })
  })

  it('assigns group only to users missing it', async () => {
    payloadMock.auth.mockResolvedValue({ user: { id: 1, roles: ['admin'] } })
    // Single batched find call returns both users at once (no more N+1)
    payloadMock.find.mockResolvedValue({
      docs: [
        { id: 'u1', groups: ['g1'] },
        { id: 'u2', groups: ['g0'] },
      ],
    })
    payloadMock.update.mockResolvedValue({})

    const { POST } = await import('@/app/api/admin/bulk-assign/route')

    const req = new Request('http://localhost/api/admin/bulk-assign', {
      method: 'POST',
      body: JSON.stringify({
        mode: 'selected',
        groupId: 'g1',
        userIds: ['u1', 'u2'],
      }),
      headers: { 'content-type': 'application/json' },
    })

    const res = await POST(req as any)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(payloadMock.find).toHaveBeenCalledTimes(1)
    expect(payloadMock.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'users',
        where: { id: { in: ['u1', 'u2'] } },
      }),
    )
    expect(payloadMock.update).toHaveBeenCalledTimes(1)
    expect(payloadMock.update).toHaveBeenCalledWith({
      collection: 'users',
      id: 'u2',
      data: { groups: ['g0', 'g1'] },
      context: { skipGroupSync: true },
    })
    expect(body).toMatchObject({
      success: true,
      count: 1,
      skipped: 1,
      failedIds: [],
    })
  })
})
