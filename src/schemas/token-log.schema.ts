import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from './user.schema';

export type TokenLogDocument = TokenLog & Document;

@Schema()
export class TokenLog {
  @Prop({ required: true })
  token: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: User;

  @Prop({ default: false })
  isLoggedOut: boolean;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: null })
  loggedOutAt: Date;
}

export const TokenLogSchema = SchemaFactory.createForClass(TokenLog);