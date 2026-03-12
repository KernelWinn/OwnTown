import { Test } from '@nestjs/testing'
import { UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { AuthService } from './auth.service'
import { OtpService } from './otp.service'
import { DB } from '../database/database.module'

const mockDb = {
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockResolvedValue([]),
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  returning: jest.fn().mockResolvedValue([]),
}

const mockJwt = {
  signAsync: jest.fn().mockResolvedValue('token'),
  verify: jest.fn(),
}

const mockConfig = {
  getOrThrow: jest.fn((key: string) => {
    const map: Record<string, string> = {
      JWT_REFRESH_SECRET: 'refresh-secret',
    }
    return map[key] ?? 'mock-value'
  }),
}

const mockOtp = {
  send: jest.fn().mockResolvedValue(undefined),
  verify: jest.fn().mockResolvedValue(true),
}

describe('AuthService', () => {
  let service: AuthService

  beforeEach(async () => {
    jest.clearAllMocks()
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: DB, useValue: mockDb },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
        { provide: OtpService, useValue: mockOtp },
      ],
    }).compile()
    service = module.get(AuthService)
  })

  describe('sendOtp', () => {
    it('delegates to OtpService and returns success message', async () => {
      const result = await service.sendOtp('+919999999999')
      expect(mockOtp.send).toHaveBeenCalledWith('+919999999999')
      expect(result.message).toBe('OTP sent successfully')
    })
  })

  describe('verifyOtp', () => {
    it('throws UnauthorizedException when OTP is invalid', async () => {
      mockOtp.verify.mockResolvedValueOnce(false)
      await expect(service.verifyOtp('+919999999999', '000000')).rejects.toThrow(UnauthorizedException)
    })

    it('returns existing user when phone already registered', async () => {
      const existingUser = { id: 'user-1', phone: '+919999999999', isActive: true }
      mockDb.where.mockResolvedValueOnce([existingUser])
      mockJwt.signAsync.mockResolvedValue('signed-token')

      const result = await service.verifyOtp('+919999999999', '123456')

      expect(mockDb.insert).not.toHaveBeenCalled()
      expect(result.user).toEqual(existingUser)
      expect(result.isNewUser).toBe(false)
      expect(result.tokens.accessToken).toBe('signed-token')
    })

    it('creates new user when phone not registered', async () => {
      const newUser = { id: 'user-2', phone: '+919999999998', isActive: true }
      // first select returns [] (user not found), returning() creates new user
      mockDb.where.mockResolvedValueOnce([])
      mockDb.returning.mockResolvedValueOnce([newUser])

      const result = await service.verifyOtp('+919999999998', '123456')

      expect(mockDb.insert).toHaveBeenCalled()
      expect(result.user).toEqual(newUser)
      expect(result.isNewUser).toBe(true)
    })
  })

  describe('refreshTokens', () => {
    it('throws UnauthorizedException for invalid refresh token', async () => {
      mockJwt.verify.mockImplementationOnce(() => { throw new Error('expired') })
      await expect(service.refreshTokens('bad-token')).rejects.toThrow(UnauthorizedException)
    })

    it('throws UnauthorizedException when user is inactive', async () => {
      mockJwt.verify.mockReturnValueOnce({ sub: 'user-1', phone: '+919999999999' })
      mockDb.where.mockResolvedValueOnce([{ id: 'user-1', phone: '+919999999999', isActive: false }])
      await expect(service.refreshTokens('valid-token')).rejects.toThrow(UnauthorizedException)
    })

    it('returns new tokens for valid refresh token', async () => {
      const user = { id: 'user-1', phone: '+919999999999', isActive: true }
      mockJwt.verify.mockReturnValueOnce({ sub: 'user-1', phone: '+919999999999' })
      mockDb.where.mockResolvedValueOnce([user])
      mockJwt.signAsync.mockResolvedValue('new-token')

      const result = await service.refreshTokens('valid-refresh-token')
      expect(result.accessToken).toBe('new-token')
      expect(result.refreshToken).toBe('new-token')
    })
  })
})
