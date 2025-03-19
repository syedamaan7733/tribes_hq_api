import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../schemas/user.schema';
import { TokenLog, TokenLogDocument } from '../schemas/token-log.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(TokenLog.name) private tokenLogModel: Model<TokenLogDocument>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { username, email, password } = registerDto;

    // Check if username or email already exists
    const existingUser = await this.userModel.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      if (existingUser.username === username) {
        throw new ConflictException('Username already exists');
      }
      throw new ConflictException('Email already exists');
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create and save the new user
    const newUser = new this.userModel({
      username,
      email,
      passwordHash,
    });

    const savedUser = await newUser.save();
    
    // Generate JWT token
    const token = this.generateToken(savedUser);
    
    // Log the token
    await this.logToken(token, savedUser._id);
    
    // Return user data without password
    const userResponse = this.sanitizeUser(savedUser);
    
    return {
      message: 'User registered successfully',
      user: userResponse,
      access_token: token,
    };
  }

  async login(loginDto: LoginDto) {
    const { usernameOrEmail, password } = loginDto;

    // Find user by username or email
    const user = await this.userModel.findOne({
      $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last active
    user.lastActive = new Date();
    await user.save();

    // Generate JWT token
    const token = this.generateToken(user);
    
    // Log the token
    await this.logToken(token, user._id);
    
    // Return user data without password
    const userResponse = this.sanitizeUser(user);
    
    return {
      message: 'Login successful',
      user: userResponse,
      access_token: token,
    };
  }

  async logout(token: string, userId: string) {
    // Find and update token log
    const tokenLog = await this.tokenLogModel.findOne({
      token,
      user: userId,
      isLoggedOut: false,
    });

    if (!tokenLog) {
      throw new BadRequestException('Invalid token or already logged out');
    }

    // Update token log
    tokenLog.isLoggedOut = true;
    tokenLog.loggedOutAt = new Date();
    await tokenLog.save();

    return { message: 'Logged out successfully' };
  }

  private generateToken(user: UserDocument): string {
    const payload = { 
      username: user.username, 
      sub: user._id,
      role: user.role
    };
    
    const token = this.jwtService.sign(payload);
    
    // Include the token itself in the payload for validation
    const finalPayload = { 
      ...payload, 
      token 
    };
    
    return this.jwtService.sign(finalPayload);
  }

  private async logToken(token: string, userId: any): Promise<void> {
    const newTokenLog = new this.tokenLogModel({
      token,
      user: userId,
    });
    
    await newTokenLog.save();
  }

  private sanitizeUser(user: UserDocument) {
    const userObject = user.toObject();
    delete userObject.passwordHash;
    return userObject;
  }
}