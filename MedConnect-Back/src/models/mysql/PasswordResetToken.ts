export interface IPasswordResetToken {
  token_id: number;
  user_id: number;
  token: string;
  expires_at: Date;
  used: boolean;
  created_at: Date;
}

export interface ICreatePasswordResetToken {
  user_id: number;
  token: string;
  expires_at: Date;
}