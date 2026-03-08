import { beforeEach, describe, expect, it, vi } from 'vitest'

const exchangeCodeForUserMock = vi.fn()
const validateEmailDomainMock = vi.fn()
const getPayloadMock = vi.fn()
const jwtSignMock = vi.fn()
const isProfileCompleteMock = vi.fn()

const cookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
}

function redirectError(url: string) {
  const err = new Error('NEXT_REDIRECT') as Error & { digest?: string; url?: string }
  err.digest = `NEXT_REDIRECT;${url}`
  err.url = url
  return err
}

vi.mock('@/libs/auth/google', () => ({
  exchangeCodeForUser: exchangeCodeForUserMock,
  validateEmailDomain: validateEmailDomainMock,
}))
vi.mock('payload', () => ({
  getPayload: getPayloadMock,
}))
vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => cookieStore),
}))
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw redirectError(url)
  }),
}))
vi.mock('jsonwebtoken', () => ({
  default: { sign: jwtSignMock },
}))
vi.mock('@/libs/profile-completion', () => ({
  isProfileComplete: isProfileCompleteMock,
}))

describe('GET /api/auth/google/callback', () => {
  beforeEach(() => {
    exchangeCodeForUserMock.mockReset()
    validateEmailDomainMock.mockReset()
    getPayloadMock.mockReset()
    jwtSignMock.mockReset()
    isProfileCompleteMock.mockReset()
    cookieStore.get.mockReset()
    cookieStore.set.mockReset()
    cookieStore.delete.mockReset()
  })

  it('redirects with missing_params when code/state are absent', async () => {
    const { GET } = await import('@/app/api/auth/google/callback/route')

    await expect(GET(new Request('http://localhost/api/auth/google/callback'))).rejects.toMatchObject({
      url: '/login?error=missing_params',
    })
  })

  it('redirects with invalid_domain when email domain is rejected', async () => {
    cookieStore.get.mockImplementation((name: string) => {
      if (name === 'code_verifier') return { value: 'cv' }
      if (name === 'state') return { value: 'st' }
      return undefined
    })

    exchangeCodeForUserMock.mockResolvedValue({
      email: 'user@example.com',
      sub: 'google-sub',
    })
    validateEmailDomainMock.mockReturnValue(false)

    const { GET } = await import('@/app/api/auth/google/callback/route')

    await expect(
      GET(new Request('http://localhost/api/auth/google/callback?code=abc&state=st')),
    ).rejects.toMatchObject({ url: '/login?error=invalid_domain' })
  })

  it('sets auth cookie and redirects to profile completion for incomplete profile', async () => {
    cookieStore.get.mockImplementation((name: string) => {
      if (name === 'code_verifier') return { value: 'cv' }
      if (name === 'state') return { value: 'st' }
      return undefined
    })

    exchangeCodeForUserMock.mockResolvedValue({
      email: 'member@mahidol.edu',
      sub: 'google-sub',
      picture: 'https://example.com/avatar.png',
      given_name: 'Mina',
      family_name: 'Lee',
    })
    validateEmailDomainMock.mockReturnValue(true)

    const payloadMock = {
      secret: 'secret',
      collections: {
        users: { config: { auth: { tokenExpiration: 3600 } } },
      },
      find: vi
        .fn()
        .mockResolvedValueOnce({ docs: [] })
        .mockResolvedValueOnce({ docs: [{ id: 7, email: 'member@mahidol.edu' }] }),
      update: vi.fn().mockResolvedValue({}),
      create: vi.fn(),
    }
    getPayloadMock.mockResolvedValue(payloadMock)

    jwtSignMock.mockReturnValue('signed-token')
    isProfileCompleteMock.mockReturnValue(false)

    const { GET } = await import('@/app/api/auth/google/callback/route')

    await expect(
      GET(new Request('http://localhost/api/auth/google/callback?code=abc&state=st')),
    ).rejects.toMatchObject({ url: '/account?complete=true' })

    expect(cookieStore.set).toHaveBeenCalledWith(
      'payload-token',
      'signed-token',
      expect.objectContaining({ httpOnly: true, path: '/' }),
    )
    expect(cookieStore.delete).toHaveBeenCalledWith('code_verifier')
    expect(cookieStore.delete).toHaveBeenCalledWith('state')
  })
})
