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
  })

  it('returns 404 outside development', async () => {
    const mutableEnv = process.env as Record<string, string | undefined>
    mutableEnv.NODE_ENV = 'production'
    const { GET } = await import('@/app/api/debug/auth/route')

    const res = await GET()
    expect(res.status).toBe(404)
  })

  it('returns auth and cookie debug info in development', async () => {
    const mutableEnv = process.env as Record<string, string | undefined>
    mutableEnv.NODE_ENV = 'development'

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
