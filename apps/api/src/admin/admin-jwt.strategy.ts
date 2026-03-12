import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'jwt-admin') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow('JWT_SECRET'),
    })
  }

  validate(payload: { sub: string; email: string; role: string }) {
    if (payload.role !== 'admin') throw new UnauthorizedException('Admin access required')
    return { id: payload.sub, email: payload.email, role: payload.role }
  }
}
