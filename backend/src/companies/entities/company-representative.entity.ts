import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Company } from './company.entity';
import { LegalRepresentative } from './legal-representative.entity';

@Entity('company_representatives')
export class CompanyRepresentative {
  @PrimaryColumn({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @PrimaryColumn({ name: 'legal_representative_id', type: 'uuid' })
  legalRepresentativeId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  position: string | null;

  @ManyToOne(() => Company, (company) => company.representativeLinks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ManyToOne(() => LegalRepresentative, (rep) => rep.companyLinks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'legal_representative_id' })
  legalRepresentative: LegalRepresentative;
}
