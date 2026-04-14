import { beforeEach, describe, expect, it, vi } from 'vitest'

const payloadMock = {
  auth: vi.fn(),
}
const cookieStore = {
  getAll: vi.fn(),
  get: vi.fn(),
}

vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('payload', () => ({
  getPayload: vi.fn(async () => payloadMock),
}))
vi.mock('next/headers', () => ({
  headers: vi.fn(async () => ({ mocked: true })),
  cookies: vi.fn(async () => cookieStore),
}))

describe('GET /api/debug/auth', () => {
  beforeEach(() => {
    payloadMock.auth.mockReset()
    cookieStore.getAll.mockReset()
    cookieStore.get.mockReset()
    delete (process.env as Record<string, string | undefined>).ALLOW_DEBUG_ENDPOINTS
  })

  it('returns 404 in production even if ALLOW_DEBUG_ENDPOINTS is set', async () => {
    const mutableEnv = process.env as Record<string, string | undefined>
    mutableEnv.NODE_ENV = 'production'
    mutableEnv.ALLOW_DEBUG_ENDPOINTS = 'true'
    const { GET } = await import('@/app/api/debug/auth/route')

    const res = await GET()
    expect(res.status).toBe(404)
  })

  it('returns 404 in development when ALLOW_DEBUG_ENDPOINTS is not set', async () => {
    const mutableEnv = process.env as Record<string, string | undefined>
    mutableEnv.NODE_ENV = 'development'
    delete mutableEnv.ALLOW_DEBUG_ENDPOINTS
    const { GET } = await import('@/app/api/debug/auth/route')

    const res = await GET()
    expect(res.status).toBe(404)
  })

  it('returns auth and cookie debug info when explicitly enabled', async () => {
    const mutableEnv = process.env as Record<string, string | undefined>
    mutableEnv.NODE_ENV = 'development'
    mutableEnv.ALLOW_DEBUG_ENDPOINTS = 'true'

    payloadMock.auth.mockResolvedValue({ user: { id: 9, email: 'dev@mahidol.edu' } })
    cookieStore.getAll.mockReturnValue([{ name: 'payload-token', value: 'abc' }, { name: 'other', value: '1' }])
    cookieStore.get.mockImplementation((name: string) =>
      name === 'payload-token' ? { name: 'payload-token', value: 'abc' } : undefined,
    )

    const { GET } = await import('@/app/api/debug/auth/route')
    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.authenticated).toBe(true)
    expect(body.user).toEqual({ id: 9, email: 'dev@mahidol.edu' })
    expect(body.payloadTokenExists).toBe(true)
    expect(body.cookies).toEqual([
      { name: 'payload-token', hasValue: true },
      { name: 'other', hasValue: true },
    ])
  })
})
