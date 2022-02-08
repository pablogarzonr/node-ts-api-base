import { Service } from 'typedi';
import { compareSync, genSaltSync, hashSync } from 'bcrypt';
import { getRepository } from 'typeorm';
import { User } from '@entities/user.entity';

@Service()
export class UsersService {

  private readonly userRepository = getRepository<User>(User);

  comparePassword(password: string, userPassword: string): boolean {
    return compareSync(password, userPassword);
  }

  listUsers() {
    return this.userRepository.find();
  }

  showUser(id: number) {
    return this.userRepository.findOne(id);
  }

  async findUserByEmail(email: string) {
    return await User.createQueryBuilder('user')
    .addSelect('user.password')
    .where({ email })
    .getOneOrFail()
  }

  createUser(user: User) {
    //hash user password
    user.password = hashSync(user.password, genSaltSync());
    return this.userRepository.save(user);
  }

  editUser(id: number, user: User) {
    return this.userRepository.update(id, user);
  }

  deleteUser(id: number) {
    return this.userRepository.delete(id);
  }
}
