import {
  JsonController,
  Body,
  Get,
  Post,
  Req,
  Param,
  Authorized,
  Res,
  HttpError
} from 'routing-controllers';
import omit from 'lodash/omit';
import { Service } from 'typedi';
import { User } from '@entities/user.entity';
import { SessionService } from '@services/session.service';
import { Request, Response } from 'express';
import { EntityMapper } from '@clients/mapper/entityMapper.service';
import { BaseUserDTO } from '@dto/baseUserDTO';
import { SignUpDTO } from '@dto/signUpDTO';
import { LogoutDTO } from '@dto/logoutDTO';
import { HttpStatusCode } from '@constants/httpStatusCode';

@JsonController('/auth')
@Service()
export class AuthController {
  constructor(private readonly sessionService: SessionService) {}

  @Post('/signup')
  async signUp(
    @Body({ validate: true }) user: SignUpDTO,
    @Res() response: Response
  ) {
    const newUser = await this.sessionService.signUp(
      EntityMapper.mapTo(User, user)
    );
    return response.send(omit(newUser, ['password']));
  }

  @Get('/verifyUser/:confirmationCode')
  async verifyUser(
    @Param("confirmationCode") token: string,
    @Res() response: Response
  ) {
    
    const result: number | undefined = await this.sessionService.verifyUser(token);
    
    if (!result) {      
      response.send(new HttpError(
        HttpStatusCode.UNAUTHORIZED, 
        'Email Verification Link Expired'
      ));
    }
    return response.status(HttpStatusCode.OK).send({message: 'User account confirmed'});
  }

  @Post('/signin')
  async signIn(@Body({ validate: true }) signInDTO: BaseUserDTO) {
    const token = await this.sessionService.signIn(signInDTO);
    return { token };
  }

  @Authorized()
  @Post('/logout')
  async logOut(
    @Body({ validate: true }) logOutDTO: LogoutDTO,
    @Req() request: Request
  ) {
    const token = request.headers['authorization'] as string;
    const email = logOutDTO.email;
    const tokenAddToBlacklist: number = await this.sessionService.logOut({
      email,
      token
    });
    return {
      logout: !!tokenAddToBlacklist
    };
  }
}
