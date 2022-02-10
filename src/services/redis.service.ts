import { redisClient } from '@server';
import { AuthInterface } from '@interfaces';
import { Service } from 'typedi';

@Service()
export class RedisService {
  
  async addTokenToBlacklist(
    input: AuthInterface.ITokenToBlacklistInput
  ) {
    const { email, token } = input;
    return redisClient.sadd(email, token);
  }

  async addTokenToVerificationList(input: AuthInterface.ITokenToBlacklistInput) {
    return redisClient.set(input.email, input.token, 'EX', 24*60*60);
  }

  async get(email: String) {
    return redisClient.get(email);
  }
  
  async del(email: string) {
    return redisClient.del(email);
  }

  async isMemberOfSet(input: AuthInterface.ITokenToBlacklistInput) {
    return redisClient.sismember(input.email, input.token);
  }
}
