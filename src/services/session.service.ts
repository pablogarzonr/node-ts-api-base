import { ErrorsMessages } from '@constants/errorMessages';
import { HttpStatusCode } from '@constants/httpStatusCode';
import { Service } from 'typedi';
import { User } from '@entities/user.entity';
import { UsersService } from '@services/users.service';
import { RedisService } from '@services/redis.service';
import { EmailService } from '@services/email.service';
import { JWTService } from '@services/jwt.service';
import { AuthInterface } from '@interfaces';
import { DatabaseError } from '@exception/database.error';
import { RedisError } from '@exception/redis.error';
import { HttpError, useExpressServer } from 'routing-controllers';
import { BaseUserDTO } from '@dto/baseUserDTO';
import { APPLICATION_EMAIL } from '@config';

@Service()
export class SessionService {
  constructor(
    private readonly userService: UsersService,
    private readonly redisService: RedisService,
    private readonly jwtService: JWTService
  ) {}

  async signUp(user: User) {
    try {
      user.isVerified = false;
      const registeredUser  = await this.userService.createUser(user);

      this.sendVerificationToken({userId: registeredUser.id, email: registeredUser.email});

      return registeredUser;
    } catch (error) {
      throw new DatabaseError(ErrorsMessages.USER_ALREADY_EXISTS);
    }
  }

  async sendVerificationToken(tokenData: AuthInterface.ITokenDataInput) {
      const token = await this.jwtService.createJWT(tokenData);
      this.redisService.addTokenToVerificationList({
        email: tokenData.email,
        token
      });
      
      EmailService.sendEmail({
        from: APPLICATION_EMAIL as string,
        to: tokenData.email,
        subject: 'Verify your MVD account',
        text: token
      });
  }

  async verifyUser(token: string) {
      //decode token and get email
      const tokenDecoded = await this.jwtService.decodeJWT(token);
      if (!tokenDecoded) {
        throw new HttpError(
          HttpStatusCode.UNAUTHORIZED,
          'Invalid Token'
        );
      };
      const email: string = (tokenDecoded as AuthInterface.ITokenPayload).data.email;
      const id: number = (tokenDecoded as AuthInterface.ITokenPayload).data.userId;

      //check if email is in list
      const isValidEmailToVerify = await this.redisService.get(email);
      if (!isValidEmailToVerify) {
        this.sendVerificationToken({userId: id, email});
        throw new HttpError(
          HttpStatusCode.UNAUTHORIZED,
          'A new link has been sent to your email'
        );
      }

      //check if user with email exists on database
      const user = await this.userService.findUserByEmail(email);
      if (!user && !!(user as User).isVerified) {
        throw new HttpError(
          HttpStatusCode.UNAUTHORIZED,
          'Invalid Token'
        );
      }
      
      try {
        await this.redisService.del(user.email);
      } catch(e) {
        throw new HttpError(
          HttpStatusCode.UNAUTHORIZED,
          'Invalid Token'
        );
      }
      
      //update user as verified
      try {
        user.isVerified = true;
        this.userService.editUser(user.id, user);
      } catch(e) {
        throw new HttpError(
          HttpStatusCode.UNAUTHORIZED,
          'Error verifying email'
        );
      }

      return true;
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

    return this.jwtService.createJWT({ userId: user.id, email: user.email});
  }

  logOut(input: AuthInterface.ITokenToBlacklistInput): Promise<number> {
    const tokenAddedToBlacklist = this.redisService.addTokenToBlacklist(input);
    if (!tokenAddedToBlacklist) {
      throw new RedisError(ErrorsMessages.REDIS_ERROR_SET_TOKEN);
    }
    return tokenAddedToBlacklist;
  }
}
