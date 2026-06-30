import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
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

  // ——— Companies (internal) ———

  async findAll(): Promise<Company[]> {
    return this.companiesRepo.find({
      where: { status: CompanyStatus.ACTIVE },
      order: { name: 'ASC' },
    });
  }

  async findById(id: string): Promise<Company> {
    const company = await this.companiesRepo.findOne({
      where: { id, status: CompanyStatus.ACTIVE },
      relations: {
        representativeLinks: { legalRepresentative: true },
      },
    });

    if (!company) {
      throw new NotFoundException('Empresa no encontrada');
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

    Object.assign(company, {
      name: dto.name ?? company.name,
      taxId: dto.taxId ?? company.taxId,
      address: dto.address !== undefined ? dto.address : company.address,
      phoneNumber:
        dto.phoneNumber !== undefined ? dto.phoneNumber : company.phoneNumber,
      email: dto.email !== undefined ? dto.email : company.email,
      status: dto.status ?? company.status,
    });

    return this.companiesRepo.save(company);
  }

  async deactivate(id: string): Promise<Company> {
    const company = await this.findById(id);
    company.status = CompanyStatus.INACTIVE;
    return this.companiesRepo.save(company);
  }

  // ——— Portal (pendiente auth: por ahora lista activas) ———

  async findAllActive(): Promise<Company[]> {
    return this.findAll();
  }

  // ——— Legal representatives ———

  async findAllLegalRepresentatives(): Promise<LegalRepresentative[]> {
    return this.legalRepsRepo.find({ order: { lastName: 'ASC' } });
  }

  async findLegalRepresentativeById(id: string): Promise<LegalRepresentative> {
    const rep = await this.legalRepsRepo.findOne({
      where: { id },
      relations: { companyLinks: { company: true } },
    });

    if (!rep) {
      throw new NotFoundException('Representante legal no encontrado');
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

    Object.assign(rep, {
      firstName: dto.firstName ?? rep.firstName,
      lastName: dto.lastName ?? rep.lastName,
      identificationNumber:
        dto.identificationNumber ?? rep.identificationNumber,
      email: dto.email !== undefined ? dto.email : rep.email,
      phoneNumber:
        dto.phoneNumber !== undefined ? dto.phoneNumber : rep.phoneNumber,
      userId: dto.userId !== undefined ? dto.userId : rep.userId,
    });

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
      throw new ConflictException(
        'El representante ya está vinculado a esta empresa',
      );
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
      throw new NotFoundException('Vínculo empresa-representante no encontrado');
    }

    await this.companyRepsRepo.remove(link);
  }

  private async ensureTaxIdAvailable(
    taxId: string,
    excludeId?: string,
  ): Promise<void> {
    const where = excludeId
      ? { taxId, id: Not(excludeId) }
      : { taxId };

    const exists = await this.companiesRepo.exists({ where });

    if (exists) {
      throw new ConflictException('Ya existe una empresa con ese RUT');
    }
  }
}
