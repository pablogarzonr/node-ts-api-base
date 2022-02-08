import { ErrorsMessages } from '@constants/errorMessages';
import { Service } from 'typedi';
import { User } from '@entities/user.entity';
import { UsersService } from '@services/users.service';
import { RedisService } from '@services/redis.service';
import { JWTService } from '@services/jwt.service';
import { AuthInterface } from '@interfaces';
import { DatabaseError } from '@exception/database.error';
import { RedisError } from '@exception/redis.error';
import { HttpError } from 'routing-controllers';
import { HttpStatusCode } from '@constants/httpStatusCode';
import { BaseUserDTO } from '@dto/baseUserDTO';

@Service()
export class SessionService {
  constructor(
    private readonly userService: UsersService,
    private readonly redisService: RedisService,
    private readonly jwtService: JWTService
  ) {}

  async signUp(user: User) {
    try {
      return this.userService.createUser(user);
    } catch (error) {
      throw new DatabaseError(ErrorsMessages.USER_ALREADY_EXISTS);
    }
  }

  async signIn(signInDTO: BaseUserDTO) {
    let user: User;
    try {
      user = await this.userService.findUserByEmail(signInDTO.email);
      if (
        !this.userService.comparePassword(signInDTO.password, user.password)
      ) {
        throw 'invalid credentials';
      }
    } catch (error) {
      throw new HttpError(
        HttpStatusCode.UNAUTHORIZED,
        ErrorsMessages.INVALID_CREDENTIALS
      );
    }
    return this.jwtService.createJWT(user);
  }

  logOut(input: AuthInterface.ITokenToBlacklistInput): Promise<number> {
    const tokenAddedToBlacklist = this.redisService.addTokenToBlacklist(input);
    if (!tokenAddedToBlacklist) {
      throw new RedisError(ErrorsMessages.REDIS_ERROR_SET_TOKEN);
    }
    return tokenAddedToBlacklist;
  }
}
