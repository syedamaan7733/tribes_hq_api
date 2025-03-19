import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Response, Request } from 'express';

interface AuthenticatedRequest extends Request {
  user?: any; // You can define a more specific type if needed
}

@Controller('api/auth/')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.register(registerDto);

    // Set JWT as HttpOnly cookie
    this.setAuthCookie(response, result.access_token);

    // Return the response without the token in the body
    const { access_token, ...responseData } = result;
    return responseData;
  }

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(loginDto);

    // Set JWT as HttpOnly cookie
    this.setAuthCookie(response, result.access_token);

    // Return the response without the token in the body
    const { access_token, ...responseData } = result;
    return responseData;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(200)
  async logout(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const token = request.cookies.tribe_access_token;
    const userId = request.user['_id'];

    const result = await this.authService.logout(token, userId);

    // Clear the auth cookie
    this.clearAuthCookie(response);

    return result;
  }

  private setAuthCookie(response: Response, token: string) {
    response.cookie('tribe_access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });
  }

  private clearAuthCookie(response: Response) {
    response.cookie('tribe_access_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
    });
  }
}
