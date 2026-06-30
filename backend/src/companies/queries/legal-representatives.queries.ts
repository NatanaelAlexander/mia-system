export const LEGAL_REP_COLUMNS = `
  id,
  first_name AS "firstName",
  last_name AS "lastName",
  identification_number AS "identificationNumber",
  email,
  phone_number AS "phoneNumber",
  user_id AS "userId",
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;

export const SQL_FIND_ALL_LEGAL_REPRESENTATIVES = `
  SELECT ${LEGAL_REP_COLUMNS}
  FROM legal_representatives
  ORDER BY last_name ASC, first_name ASC
`;

export const SQL_FIND_LEGAL_REPRESENTATIVE_BY_ID = `
  SELECT ${LEGAL_REP_COLUMNS}
  FROM legal_representatives
  WHERE id = $1
`;

export const SQL_INSERT_LEGAL_REPRESENTATIVE = `
  INSERT INTO legal_representatives (
    first_name,
    last_name,
    identification_number,
    email,
    phone_number,
    user_id
  )
  VALUES ($1, $2, $3, $4, $5, $6)
  RETURNING ${LEGAL_REP_COLUMNS}
`;
