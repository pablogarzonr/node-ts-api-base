import { Service } from 'typedi';
import { compare, genSalt, hash } from 'bcrypt';
import { getRepository } from 'typeorm';
import { User } from '@entities/user.entity';

@Service()
export class UsersService {

  private readonly userRepository = getRepository<User>(User);

  async comparePassword(password: string, userPassword: string): Promise<boolean> {
    return compare(password, userPassword);
  }

  listUsers() {
    return this.userRepository.find();
  }

  showUser(id: number) {
    return this.userRepository.findOne(id);
  }

  async findUserByEmail(email: string) {
    return User.createQueryBuilder('user')
    .addSelect('user.password')
    .where({ email })
    .getOneOrFail()
  }

  async createUser(user: User) {
    //hash user password
    const salt = await genSalt(10);
    user.password = await hash(user.password, salt);
    return this.userRepository.save(user);
  }

  editUser(id: number, user: User) {
    return this.userRepository.update(id, user);
  }

  deleteUser(id: number) {
    return this.userRepository.delete(id);
  }
}
