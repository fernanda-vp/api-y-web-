import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PermissionsService } from '../../roles/application/permissions.service';
import { UsersService } from '../../users/application/users.service';
import { PasswordPolicy } from '../../users/domain/password.policy';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly permissionsService: PermissionsService,
  ) {}

  async login(username: string, password: string) {
    const user = await this.usersService.findByUsername(username);
    if (!user || !user.credential) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.status.isActive) {
      throw new UnauthorizedException('User is not active');
    }

    const passwordMatches = await PasswordPolicy.verify(
      password,
      user.credential.passwordHash,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, username: user.username };
    return {
      accessToken: await this.jwtService.signAsync(payload),
    };
  }

  async getProfile(userId: number) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }

    const permissions =
      await this.permissionsService.getEffectivePermissions(userId);

    const { id, username, name, lastName, photoUrl, employee } = user;
    return { id, username, name, lastName, photoUrl, employee, permissions };
  }
}
