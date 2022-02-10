import { redisClient } from '@server';
import { AuthInterface } from '@interfaces';
import { Service } from 'typedi';

@Service()
export class RedisService {
  addTokenToBlacklist(
    input: AuthInterface.ITokenToBlacklistInput
  ): Promise<number> {
    return new Promise((res, rej) => {
      const { email, token } = input;
      return redisClient.sadd(email, token, (err, result) => {
        if (err) {
          rej(err);
        }
        res(result);
      });
    });
  }

  addTokenToVerificationList(input: AuthInterface.ITokenToBlacklistInput): Promise<number> {
    return new Promise((res, rej) => {
      return redisClient.set(input.email, input.token, 'EX', 24*60*60,  function(err, result) {
        if (err) {
          rej(err);
        }
        res(result);
      });
    });
  }

  get(email: string): Promise<string> {
    return new Promise((res, rej) => {
      return redisClient.get(email, function(err, result) {
        if (err) {
          rej(err);
        }
        res(result);
      }); 
    });
  }

  removeVerificationToken(email: string): Promise<string> {
    return new Promise((res, rej) => {
      return redisClient.del(email, function(err, result) {
        if (err) {
          rej(err);
        }
        res(result);
      }); 
    });
  }

  isMemberOfSet(input: AuthInterface.ITokenToBlacklistInput): Promise<number> {
    return new Promise((res, rej) => {
      const { email, token } = input;
      redisClient.sismember(email, token, (err, result) => {
        if (err) {
          rej(err);
        }
        res(result);
      });
    });
  }
}
