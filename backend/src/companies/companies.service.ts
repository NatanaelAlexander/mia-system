import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import {
  EmpresaNoEncontradaException,
  RepresentanteLegalNoEncontradoException,
  RepresentanteYaVinculadoException,
  RutEmpresaDuplicadoException,
  VinculoEmpresaRepresentanteNoEncontradoException,
} from './exceptions/companies.exceptions';
import { Company, CompanyStatus } from './entities/company.entity';
import { LegalRepresentative } from './entities/legal-representative.entity';
import { CompanyRepresentative } from './entities/company-representative.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CreateLegalRepresentativeDto } from './dto/create-legal-representative.dto';
import { UpdateLegalRepresentativeDto } from './dto/update-legal-representative.dto';
import { LinkRepresentativeDto } from './dto/link-representative.dto';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private readonly companiesRepo: Repository<Company>,
    @InjectRepository(LegalRepresentative)
    private readonly legalRepsRepo: Repository<LegalRepresentative>,
    @InjectRepository(CompanyRepresentative)
    private readonly companyRepsRepo: Repository<CompanyRepresentative>,
  ) {}

  async findAll(): Promise<Company[]> {
    return this.companiesRepo.find({
      where: { status: CompanyStatus.ACTIVE },
      order: { name: 'ASC' },
    });
  }

  async findById(id: string): Promise<Company> {
    const company = await this.companiesRepo.findOne({
      where: { id, status: CompanyStatus.ACTIVE },
      relations: { representativeLinks: { legalRepresentative: true } },
    });

    if (!company) {
      throw new EmpresaNoEncontradaException();
    }

    return company;
  }

  async create(dto: CreateCompanyDto): Promise<Company> {
    await this.ensureTaxIdAvailable(dto.taxId);

    const company = this.companiesRepo.create({
      name: dto.name,
      taxId: dto.taxId,
      address: dto.address ?? null,
      phoneNumber: dto.phoneNumber ?? null,
      email: dto.email ?? null,
      status: dto.status ?? CompanyStatus.ACTIVE,
    });

    return this.companiesRepo.save(company);
  }

  async update(id: string, dto: UpdateCompanyDto): Promise<Company> {
    const company = await this.findById(id);

    if (dto.taxId && dto.taxId !== company.taxId) {
      await this.ensureTaxIdAvailable(dto.taxId, id);
    }

    if (dto.name !== undefined) company.name = dto.name;
    if (dto.taxId !== undefined) company.taxId = dto.taxId;
    if (dto.address !== undefined) company.address = dto.address;
    if (dto.phoneNumber !== undefined) company.phoneNumber = dto.phoneNumber;
    if (dto.email !== undefined) company.email = dto.email;
    if (dto.status !== undefined) company.status = dto.status;

    return this.companiesRepo.save(company);
  }

  async deactivate(id: string): Promise<Company> {
    const company = await this.findById(id);
    company.status = CompanyStatus.INACTIVE;
    return this.companiesRepo.save(company);
  }

  async findAllActive(): Promise<Company[]> {
    return this.findAll();
  }

  async findAllLegalRepresentatives(): Promise<LegalRepresentative[]> {
    return this.legalRepsRepo.find({ order: { lastName: 'ASC' } });
  }

  async findLegalRepresentativeById(id: string): Promise<LegalRepresentative> {
    const rep = await this.legalRepsRepo.findOne({
      where: { id },
      relations: { companyLinks: { company: true } },
    });

    if (!rep) {
      throw new RepresentanteLegalNoEncontradoException();
    }

    return rep;
  }

  async createLegalRepresentative(
    dto: CreateLegalRepresentativeDto,
  ): Promise<LegalRepresentative> {
    const rep = this.legalRepsRepo.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      identificationNumber: dto.identificationNumber,
      email: dto.email ?? null,
      phoneNumber: dto.phoneNumber ?? null,
      userId: dto.userId ?? null,
    });

    return this.legalRepsRepo.save(rep);
  }

  async updateLegalRepresentative(
    id: string,
    dto: UpdateLegalRepresentativeDto,
  ): Promise<LegalRepresentative> {
    const rep = await this.findLegalRepresentativeById(id);

    if (dto.firstName !== undefined) rep.firstName = dto.firstName;
    if (dto.lastName !== undefined) rep.lastName = dto.lastName;
    if (dto.identificationNumber !== undefined) {
      rep.identificationNumber = dto.identificationNumber;
    }
    if (dto.email !== undefined) rep.email = dto.email;
    if (dto.phoneNumber !== undefined) rep.phoneNumber = dto.phoneNumber;
    if (dto.userId !== undefined) rep.userId = dto.userId;

    return this.legalRepsRepo.save(rep);
  }

  async getCompanyRepresentatives(companyId: string) {
    await this.findById(companyId);

    return this.companyRepsRepo.find({
      where: { companyId },
      relations: { legalRepresentative: true },
      order: { position: 'ASC' },
    });
  }

  async linkRepresentativeToCompany(
    companyId: string,
    dto: LinkRepresentativeDto,
  ): Promise<CompanyRepresentative> {
    await this.findById(companyId);
    await this.findLegalRepresentativeById(dto.legalRepresentativeId);

    const existing = await this.companyRepsRepo.findOne({
      where: {
        companyId,
        legalRepresentativeId: dto.legalRepresentativeId,
      },
    });

    if (existing) {
      throw new RepresentanteYaVinculadoException();
    }

    const link = this.companyRepsRepo.create({
      companyId,
      legalRepresentativeId: dto.legalRepresentativeId,
      position: dto.position ?? null,
    });

    return this.companyRepsRepo.save(link);
  }

  async unlinkRepresentativeFromCompany(
    companyId: string,
    legalRepresentativeId: string,
  ): Promise<void> {
    const link = await this.companyRepsRepo.findOne({
      where: { companyId, legalRepresentativeId },
    });

    if (!link) {
      throw new VinculoEmpresaRepresentanteNoEncontradoException();
    }

    await this.companyRepsRepo.remove(link);
  }

  private async ensureTaxIdAvailable(
    taxId: string,
    excludeId?: string,
  ): Promise<void> {
    const where = excludeId ? { taxId, id: Not(excludeId) } : { taxId };
    const exists = await this.companiesRepo.exists({ where });

    if (exists) {
      throw new RutEmpresaDuplicadoException();
    }
  }
}
