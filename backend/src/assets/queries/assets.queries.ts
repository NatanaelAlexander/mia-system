export const ASSET_COLUMNS = `
  id,
  file_name AS "fileName",
  file_path AS "filePath",
  mime_type AS "mimeType",
  file_size AS "fileSize",
  uploaded_by_id AS "uploadedById",
  created_at AS "createdAt"
`;

export const SQL_FIND_ALL_ASSETS = `
  SELECT ${ASSET_COLUMNS}
  FROM assets
  ORDER BY created_at DESC
`;

export const SQL_FIND_ASSET_BY_ID = `
  SELECT ${ASSET_COLUMNS}
  FROM assets
  WHERE id = $1
`;

export const SQL_INSERT_ASSET = `
  INSERT INTO assets (file_name, file_path, mime_type, file_size, uploaded_by_id)
  VALUES ($1, $2, $3, $4, $5)
  RETURNING ${ASSET_COLUMNS}
`;

export const SQL_DELETE_ASSET = `
  DELETE FROM assets
  WHERE id = $1
  RETURNING ${ASSET_COLUMNS}
`;
