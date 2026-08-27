import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../infrastructure/users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  findByUsername(username: string) {
    return this.usersRepository.findByUsername(username);
  }

  findById(id: number) {
    return this.usersRepository.findById(id);
  }
}
