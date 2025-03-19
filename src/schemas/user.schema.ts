import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true, unique: true })
  username: string;

  @Prop()
  profileImage: string;

  @Prop()
  bio: string;

  @Prop({ default: Date.now })
  joinDate: Date;

  @Prop({ default: Date.now })
  lastActive: Date;

  @Prop({ type: Object, default: {} })
  preferences: Record<string, any>;

  @Prop({ type: [String], default: [] })
  interests: string[];

  @Prop({ enum: ['user', 'admin'], default: 'user' })
  role: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
