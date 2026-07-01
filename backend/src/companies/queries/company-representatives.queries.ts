import { LEGAL_REP_COLUMNS } from './legal-representatives.queries';

export const SQL_FIND_COMPANY_REPRESENTATIVES = `
  SELECT
    cr.company_id AS "companyId",
    cr.legal_representative_id AS "legalRepresentativeId",
    cr.position,
    lr.id AS "lr_id",
    lr.first_name AS "lr_firstName",
    lr.last_name AS "lr_lastName",
    lr.identification_number AS "lr_identificationNumber",
    lr.email AS "lr_email",
    lr.phone_number AS "lr_phoneNumber",
    lr.user_id AS "lr_userId",
    lr.created_at AS "lr_createdAt",
    lr.updated_at AS "lr_updatedAt"
  FROM company_representatives cr
  INNER JOIN legal_representatives lr ON lr.id = cr.legal_representative_id
  WHERE cr.company_id = $1
  ORDER BY cr.position ASC NULLS LAST, lr.last_name ASC
`;

export const SQL_EXISTS_COMPANY_REPRESENTATIVE_LINK = `
  SELECT 1
  FROM company_representatives
  WHERE company_id = $1 AND legal_representative_id = $2
  LIMIT 1
`;

export const SQL_INSERT_COMPANY_REPRESENTATIVE = `
  INSERT INTO company_representatives (company_id, legal_representative_id, position)
  VALUES ($1, $2, $3)
  RETURNING company_id AS "companyId", legal_representative_id AS "legalRepresentativeId", position
`;

export const SQL_UPDATE_COMPANY_REPRESENTATIVE = `
  UPDATE company_representatives
  SET position = $3
  WHERE company_id = $1 AND legal_representative_id = $2
  RETURNING company_id AS "companyId", legal_representative_id AS "legalRepresentativeId", position
`;

export const SQL_DELETE_COMPANY_REPRESENTATIVE = `
  DELETE FROM company_representatives
  WHERE company_id = $1 AND legal_representative_id = $2
`;
