/**
 * Auth integration tests — exercises the full HTTP pipeline:
 * ValidationPipe, ThrottlerGuard bypass, JwtAuthGuard, AuthService
 */
import request = require('supertest')
import { Test } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { sign } from 'jsonwebtoken'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { JwtStrategy } from './jwt.strategy'
import { OtpService } from './otp.service'
import { DB } from '../database/database.module'
import { NotificationService } from '../notification/notification.service'

const JWT_SECRET = 'test-jwt-secret'

const mockConfigService = {
  getOrThrow: (key: string) => {
    const cfg: Record<string, string> = {
      JWT_SECRET,
      JWT_REFRESH_SECRET: 'test-refresh-secret',
    }
    if (!cfg[key]) throw new Error(`Config key "${key}" not found`)
    return cfg[key]
  },
  get: (key: string, def?: any) => ({ JWT_SECRET }[key] ?? def),
}

const mockDb = {
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockResolvedValue([]),
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  returning: jest.fn().mockResolvedValue([]),
}

const mockOtp = {
  send: jest.fn().mockResolvedValue(undefined),
  verify: jest.fn().mockResolvedValue(true),
}

const mockNotification = { saveFcmToken: jest.fn().mockResolvedValue(undefined) }

// Helper: sign a JWT with the test secret
function signToken(payload: object) {
  return sign(payload, JWT_SECRET, { expiresIn: '1h' })
}

describe('Auth (integration)', () => {
  let app: INestApplication

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        PassportModule,
        JwtModule.register({ secret: JWT_SECRET, signOptions: { expiresIn: '15m' } }),
      ],
      controllers: [AuthController],
      providers: [
        AuthService,
        JwtStrategy,
        { provide: DB, useValue: mockDb },
        { provide: OtpService, useValue: mockOtp },
        { provide: NotificationService, useValue: mockNotification },
        { provide: 'ConfigService', useValue: mockConfigService },
        // Provide under class token so JwtStrategy and AuthService can inject it
        { provide: require('@nestjs/config').ConfigService, useValue: mockConfigService },
      ],
    })
      // Disable throttler so tests aren't rate-limited
      .overrideGuard(require('@nestjs/throttler').ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile()

    app = module.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }))
    await app.init()
  })

  afterAll(() => app.close())

  beforeEach(() => {
    jest.resetAllMocks()
    mockDb.select.mockReturnThis()
    mockDb.from.mockReturnThis()
    mockDb.where.mockResolvedValue([])
    mockDb.insert.mockReturnThis()
    mockDb.values.mockReturnThis()
    mockDb.returning.mockResolvedValue([])
    mockOtp.send.mockResolvedValue(undefined)
    mockOtp.verify.mockResolvedValue(true)
  })

  // ── POST /auth/otp/send ────────────────────────────────────────────────

  describe('POST /auth/otp/send', () => {
    it('returns 201 and success message for a valid phone number', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/otp/send')
        .send({ phone: '9876543210' })
        .expect(201)

      expect(res.body.message).toBe('OTP sent successfully')
      expect(mockOtp.send).toHaveBeenCalledWith('9876543210')
    })

    it('returns 400 when phone number is invalid', async () => {
      await request(app.getHttpServer())
        .post('/auth/otp/send')
        .send({ phone: '123' })         // fails Matches regex
        .expect(400)
    })

    it('returns 400 when phone number is missing', async () => {
      await request(app.getHttpServer())
        .post('/auth/otp/send')
        .send({})
        .expect(400)
    })
  })

  // ── POST /auth/otp/verify ──────────────────────────────────────────────

  describe('POST /auth/otp/verify', () => {
    it('returns 401 when OTP is invalid', async () => {
      mockOtp.verify.mockResolvedValueOnce(false)

      await request(app.getHttpServer())
        .post('/auth/otp/verify')
        .send({ phone: '9876543210', otp: '000000' })
        .expect(401)
    })

    it('returns 400 when OTP is not 6 digits', async () => {
      await request(app.getHttpServer())
        .post('/auth/otp/verify')
        .send({ phone: '9876543210', otp: '123' })
        .expect(400)
    })

    it('returns 201 with tokens and user for a new user', async () => {
      const newUser = { id: 'user-1', phone: '9876543210', isActive: true }
      mockDb.where.mockResolvedValueOnce([])  // no existing user
      mockDb.returning.mockResolvedValueOnce([newUser])

      const res = await request(app.getHttpServer())
        .post('/auth/otp/verify')
        .send({ phone: '9876543210', otp: '123456' })
        .expect(201)

      expect(res.body.isNewUser).toBe(true)
      expect(res.body.tokens).toHaveProperty('accessToken')
      expect(res.body.tokens).toHaveProperty('refreshToken')
    })

    it('returns 201 with tokens for an existing user', async () => {
      const existingUser = { id: 'user-1', phone: '9876543210', isActive: true }
      mockDb.where.mockResolvedValueOnce([existingUser])

      const res = await request(app.getHttpServer())
        .post('/auth/otp/verify')
        .send({ phone: '9876543210', otp: '123456' })
        .expect(201)

      expect(res.body.isNewUser).toBe(false)
      expect(res.body.user.id).toBe('user-1')
    })
  })

  // ── POST /auth/refresh ─────────────────────────────────────────────────

  describe('POST /auth/refresh', () => {
    it('returns 400 when refreshToken is missing', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({})
        .expect(400)
    })

    it('returns 401 for an invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'not-a-real-token' })
        .expect(401)
    })
  })

  // ── GET /auth/me ───────────────────────────────────────────────────────

  describe('GET /auth/me', () => {
    it('returns 401 without Authorization header', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .expect(401)
    })

    it('returns the decoded user payload for a valid JWT', async () => {
      const token = signToken({ sub: 'user-1', phone: '9876543210' })

      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(res.body.id).toBe('user-1')
      expect(res.body.phone).toBe('9876543210')
    })

    it('returns 401 for a tampered JWT', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer tampered.token.here')
        .expect(401)
    })
  })
})
