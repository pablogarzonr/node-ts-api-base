export interface ITokenToBlacklistInput {
  email: string;
  token: string;
}

export interface ITokenPayload {
  data: TokenPayloadData;
  iat: number;
  exp: number;
}

type TokenPayloadData = {
  userId: number;
  email: string;
};
