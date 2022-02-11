import { Column, Entity, Index } from 'typeorm';
import { Base } from './base.entity';
import {Gender} from './gender.enum';
import {Role} from './role.enum';

@Entity()
export class User extends Base {
  @Column({ nullable: true })
  firstName?: string;

  @Column({ nullable: true })
  lastName?: string;

  @Column()
  @Index({ unique: true })
  email!: string;

  @Column({ select: false })
  password!: string;

  @Column({ type: "enum", enum:Gender, nullable: true })
  gender?: Gender;

  @Column({ type: "enum", enum:Role, nullable: true })
  role?: Role;

  @Column({nullable: true})
  isVerified?: boolean;
}
