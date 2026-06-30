import { Controller, Get } from '@nestjs/common';
import { CompaniesService } from '../companies.service';

@Controller('portal/companies')
export class PortalCompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  /** Pendiente auth: filtrar por users_companies del usuario logueado */
  @Get()
  findAll() {
    return this.companiesService.findAllActive();
  }
}
