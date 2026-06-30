import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CompaniesService } from '../companies.service';
import { CreateCompanyDto } from '../dto/create-company.dto';
import { UpdateCompanyDto } from '../dto/update-company.dto';
import { CreateLegalRepresentativeDto } from '../dto/create-legal-representative.dto';
import { UpdateLegalRepresentativeDto } from '../dto/update-legal-representative.dto';
import { LinkRepresentativeDto } from '../dto/link-representative.dto';

@Controller('internal/companies')
export class InternalCompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  findAll() {
    return this.companiesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.companiesService.findById(id);
  }

  @Post()
  create(@Body() dto: CreateCompanyDto) {
    return this.companiesService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.companiesService.update(id, dto);
  }

  @Delete(':id')
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.companiesService.deactivate(id);
  }

  @Get(':id/representatives')
  getRepresentatives(@Param('id', ParseUUIDPipe) id: string) {
    return this.companiesService.getCompanyRepresentatives(id);
  }

  @Post(':id/representatives')
  linkRepresentative(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: LinkRepresentativeDto,
  ) {
    return this.companiesService.linkRepresentativeToCompany(id, dto);
  }

  @Delete(':id/representatives/:legalRepresentativeId')
  unlinkRepresentative(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('legalRepresentativeId', ParseUUIDPipe) legalRepresentativeId: string,
  ) {
    return this.companiesService.unlinkRepresentativeFromCompany(
      id,
      legalRepresentativeId,
    );
  }
}

@Controller('internal/legal-representatives')
export class InternalLegalRepresentativesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  findAll() {
    return this.companiesService.findAllLegalRepresentatives();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.companiesService.findLegalRepresentativeById(id);
  }

  @Post()
  create(@Body() dto: CreateLegalRepresentativeDto) {
    return this.companiesService.createLegalRepresentative(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLegalRepresentativeDto,
  ) {
    return this.companiesService.updateLegalRepresentative(id, dto);
  }
}
