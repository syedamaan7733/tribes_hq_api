import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../schemas/user.schema';
import { TokenLog, TokenLogDocument } from '../../schemas/token-log.schema';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(TokenLog.name) private tokenLogModel: Model<TokenLogDocument>,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request) => {
          return request?.cookies?.tribe_access_token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const { sub, token } = payload;

    // Check if token is logged out
    const tokenLog = await this.tokenLogModel.findOne({
      token,
      user: sub,
      isLoggedOut: false,
    });

    console.log(token);

    if (!tokenLog) {
      throw new UnauthorizedException('Invalid or logged out token');
    }

    const user = await this.userModel.findById(sub).select('-passwordHash');
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // return user;
  }
}
