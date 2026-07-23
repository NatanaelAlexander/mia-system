export const SQL_COMPANY_EXISTS = `
  SELECT id
  FROM companies
  WHERE id = $1
  LIMIT 1
`;

export const SQL_FIND_FOLDER_BY_ID = `
  SELECT
    id,
    company_id AS "companyId",
    parent_id AS "parentId",
    name,
    created_by_id AS "createdById",
    created_at AS "createdAt"
  FROM company_folders
  WHERE id = $1
  LIMIT 1
`;

export const SQL_LIST_CHILD_FOLDERS = `
  SELECT
    id,
    company_id AS "companyId",
    parent_id AS "parentId",
    name,
    created_by_id AS "createdById",
    created_at AS "createdAt"
  FROM company_folders
  WHERE company_id = $1
    AND parent_id IS NOT DISTINCT FROM $2::uuid
  ORDER BY LOWER(name) ASC
`;

export const SQL_LIST_FOLDER_ASSETS = `
  SELECT
    a.id,
    a.file_name AS "fileName",
    a.mime_type AS "mimeType",
    a.file_size AS "fileSize",
    a.uploaded_by_id AS "uploadedById",
    a.created_at AS "createdAt",
    cfa.folder_id AS "folderId"
  FROM company_folder_assets cfa
  INNER JOIN assets a ON a.id = cfa.asset_id
  WHERE cfa.company_id = $1
    AND cfa.folder_id IS NOT DISTINCT FROM $2::uuid
  ORDER BY LOWER(a.file_name) ASC
`;

export const SQL_INSERT_FOLDER = `
  INSERT INTO company_folders (company_id, parent_id, name, created_by_id)
  VALUES ($1, $2, $3, $4)
  RETURNING
    id,
    company_id AS "companyId",
    parent_id AS "parentId",
    name,
    created_by_id AS "createdById",
    created_at AS "createdAt"
`;

export const SQL_RENAME_FOLDER = `
  UPDATE company_folders
  SET name = $2
  WHERE id = $1
  RETURNING
    id,
    company_id AS "companyId",
    parent_id AS "parentId",
    name,
    created_by_id AS "createdById",
    created_at AS "createdAt"
`;

export const SQL_DELETE_FOLDER = `
  DELETE FROM company_folders
  WHERE id = $1
`;

export const SQL_DESCENDANT_FOLDER_IDS = `
  WITH RECURSIVE tree AS (
    SELECT id
    FROM company_folders
    WHERE id = $1
    UNION ALL
    SELECT f.id
    FROM company_folders f
    INNER JOIN tree t ON f.parent_id = t.id
  )
  SELECT id FROM tree
`;

export const SQL_ASSETS_IN_FOLDERS = `
  SELECT asset_id AS "assetId"
  FROM company_folder_assets
  WHERE company_id = $1
    AND folder_id = ANY($2::uuid[])
`;

export const SQL_ASSETS_IN_FOLDER_OR_ROOT = `
  SELECT asset_id AS "assetId"
  FROM company_folder_assets
  WHERE company_id = $1
    AND folder_id IS NOT DISTINCT FROM $2::uuid
`;

export const SQL_LINK_ASSET = `
  INSERT INTO company_folder_assets (company_id, folder_id, asset_id)
  VALUES ($1, $2, $3)
`;

export const SQL_FIND_COMPANY_ASSET = `
  SELECT
    a.id,
    a.file_name AS "fileName",
    a.file_path AS "filePath",
    a.mime_type AS "mimeType",
    a.file_size AS "fileSize",
    a.uploaded_by_id AS "uploadedById",
    a.created_at AS "createdAt",
    cfa.company_id AS "companyId",
    cfa.folder_id AS "folderId"
  FROM company_folder_assets cfa
  INNER JOIN assets a ON a.id = cfa.asset_id
  WHERE cfa.asset_id = $1
  LIMIT 1
`;

export const SQL_UNLINK_ASSET = `
  DELETE FROM company_folder_assets
  WHERE asset_id = $1
`;

export const SQL_FOLDER_ANCESTORS = `
  WITH RECURSIVE chain AS (
    SELECT
      id,
      company_id,
      parent_id,
      name,
      0 AS depth
    FROM company_folders
    WHERE id = $1
    UNION ALL
    SELECT
      f.id,
      f.company_id,
      f.parent_id,
      f.name,
      c.depth + 1
    FROM company_folders f
    INNER JOIN chain c ON f.id = c.parent_id
  )
  SELECT
    id,
    name,
    depth
  FROM chain
  ORDER BY depth DESC
`;
