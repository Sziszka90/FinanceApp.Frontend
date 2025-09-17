import { TokenType } from "../Enums/token-type.enum";

export interface ValidateTokenRequest {
  token: string;
  tokenType: TokenType;
}

