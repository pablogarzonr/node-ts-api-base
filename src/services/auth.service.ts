import Container from 'typedi';
import { JWTService } from '@services/jwt.service';
import { RedisService } from '@services/redis.service';
import { Action } from 'routing-controllers';
import { UsersService } from './users.service';
import { Role } from '@entities/role.enum';

export class AuthorizationService {
  private static instance: AuthorizationService;

  public static getInstance(): AuthorizationService {
    if (!this.instance) {
      this.instance = new AuthorizationService();
    }

    return this.instance;
  }

  async authorizationChecker(
    action: Action,
    _roles: string[]
  ): Promise<boolean> {
    const jwt = Container.get(JWTService);
    const redis = Container.get(RedisService);
    const userService = Container.get(UsersService);
    try {
      let token = action.request.headers['authorization'];
      if (!token) {
        return false;
      }
      if (token.startsWith('Bearer ')) {
        // Remove Bearer from authentication scheme header
        token = token.replace('Bearer ', '');
      }
      const payload = await jwt.verifyJWT(token);
      const tokenIsBlacklisted: number = await redis.isMemberOfSet({
        email: payload.data.email,
        token
      });
      
      if (!!tokenIsBlacklisted) return false;
      
      // if there is no role restriction on the endpoint allow access
      if (!_roles.length) return true;
      // if not, continue checking if the user's role is in the list
      const user = await userService.findUserByEmail(payload.data.email);
      const roleAuthorized = _roles.find(role =>
        !!user.role ? user.role === role : role === Role.USER
      );
      
      return !!roleAuthorized;
    } catch (error) {
      // Here we should do something with the error like loggin
      return false;
    }
  }
}
