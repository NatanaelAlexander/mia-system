import { ASSET_COLUMNS } from '../../assets/queries/assets.queries';

export const SQL_FIND_PROJECT_ASSETS = `
  SELECT ${ASSET_COLUMNS}
  FROM assets a
  INNER JOIN projects_assets pa ON pa.asset_id = a.id
  WHERE pa.project_id = $1
  ORDER BY a.created_at DESC
`;

export const SQL_EXISTS_PROJECT_ASSET_LINK = `
  SELECT 1
  FROM projects_assets
  WHERE project_id = $1 AND asset_id = $2
  LIMIT 1
`;

export const SQL_INSERT_PROJECT_ASSET = `
  INSERT INTO projects_assets (project_id, asset_id)
  VALUES ($1, $2)
  RETURNING project_id AS "projectId", asset_id AS "assetId"
`;

export const SQL_DELETE_PROJECT_ASSET = `
  DELETE FROM projects_assets
  WHERE project_id = $1 AND asset_id = $2
`;
