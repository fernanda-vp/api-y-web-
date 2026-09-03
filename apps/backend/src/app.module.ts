import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './core/auth/auth.module';
import { CompaniesModule } from './core/companies/companies.module';
import { DepartmentsModule } from './core/departments/departments.module';
import { EmployeesModule } from './core/employees/employees.module';
import { JobTitlesModule } from './core/job-titles/job-titles.module';
import { PositionsModule } from './core/positions/positions.module';
import { PrismaModule } from './core/prisma/prisma.module';
import { RolesModule } from './core/roles/roles.module';
import { StatusesModule } from './core/statuses/statuses.module';
import { UsersModule } from './core/users/users.module';
import { ZonesModule } from './core/zones/zones.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    StatusesModule,
    UsersModule,
    AuthModule,
    RolesModule,
    CompaniesModule,
    ZonesModule,
    DepartmentsModule,
    JobTitlesModule,
    EmployeesModule,
    PositionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
