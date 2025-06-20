// import { Injectable, UnauthorizedException } from '@nestjs/common';
// import { PassportStrategy } from '@nestjs/passport';
// import { ExtractJwt, Strategy } from 'passport-jwt';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { User, UserDocument } from '../../schemas/user.schema';
// import { TokenLog, TokenLogDocument } from '../../schemas/token-log.schema';
// import { ConfigService } from '@nestjs/config';

// @Injectable()
// export class JwtStrategy extends PassportStrategy(Strategy) {
//   constructor(
//     @InjectModel(User.name) private userModel: Model<UserDocument>,
//     @InjectModel(TokenLog.name) private tokenLogModel: Model<TokenLogDocument>,
//     private configService: ConfigService,
//   ) {
//     super({
//       jwtFromRequest: ExtractJwt.fromExtractors([
//         (request) => request?.cookies?.tribe_access_token,
//       ]),
//       ignoreExpiration: false,
//       secretOrKey: configService.get<string>('JWT_SECRET'),
//     });
//   }

//   async validate(payload: any, request: any) {
//     const { sub } = payload;
//     const token = request.cookies?.tribe_access_token;

//     if (!token) {
//       throw new UnauthorizedException('Token not provided');
//     }

//     // Check if token is logged out
//     const tokenLog = await this.tokenLogModel.findOne({
//       token,
//       user: sub,
//       isLoggedOut: false,
//     });

//     if (!tokenLog) {
//       throw new UnauthorizedException('Invalid or logged out token');
//     }

//     const user = await this.userModel.findById(sub).select('-passwordHash');
//     if (!user) {
//       throw new UnauthorizedException('User not found');
//     }

//     return user;
//   }
// }

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { Model } from 'mongoose';
import { Request } from 'express';

import { User, UserDocument } from 'src/schemas/user.schema';
import { TokenLog, TokenLogDocument } from 'src/schemas/token-log.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(TokenLog.name) private tokenModel: Model<TokenLogDocument>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        JwtStrategy.extractJwtFromCookie,
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
      passReqToCallback: true,
    });
  }

  private static extractJwtFromCookie(req: Request): string | null {
    return req.cookies?.tribe_access_token || null;
  }

  async isTokenvalid(token: string): Promise<boolean> {
    const tokenLog = await this.tokenModel.findOne({ token });

    if (!tokenLog || tokenLog.isLoggedOut) return false;

    return true;
  }

  async validate(
    req: Request,
    payload: { sub: string; username: string; role: string },
  ) {
    const token = req.cookies?.tribe_access_token;
    console.log('Token being validated:', token);

    if (!token || !(await this.isTokenvalid(token))) {
      throw new UnauthorizedException('Invalid or expired Token');
    }

    const user = await this.userModel
      .findById(payload.sub)
      .select('-passwordHash');

    if (!user) throw new UnauthorizedException('Unauthorized Token');
    console.log(user);

    return user;
  }
}
