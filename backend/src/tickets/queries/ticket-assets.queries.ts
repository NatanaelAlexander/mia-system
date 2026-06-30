import { ASSET_COLUMNS } from '../../assets/queries/assets.queries';

export const SQL_FIND_TICKET_ASSETS = `
  SELECT ${ASSET_COLUMNS}
  FROM assets a
  INNER JOIN ticket_assets ta ON ta.asset_id = a.id
  WHERE ta.ticket_id = $1
  ORDER BY a.created_at DESC
`;

export const SQL_EXISTS_TICKET_ASSET_LINK = `
  SELECT 1
  FROM ticket_assets
  WHERE ticket_id = $1 AND asset_id = $2
  LIMIT 1
`;

export const SQL_INSERT_TICKET_ASSET = `
  INSERT INTO ticket_assets (ticket_id, asset_id)
  VALUES ($1, $2)
  RETURNING ticket_id AS "ticketId", asset_id AS "assetId"
`;

export const SQL_DELETE_TICKET_ASSET = `
  DELETE FROM ticket_assets
  WHERE ticket_id = $1 AND asset_id = $2
`;

export const SQL_FIND_COMMENT_ASSETS = `
  SELECT ${ASSET_COLUMNS}
  FROM assets a
  INNER JOIN ticket_comment_assets tca ON tca.asset_id = a.id
  WHERE tca.ticket_comment_id = $1
  ORDER BY a.created_at DESC
`;

export const SQL_EXISTS_COMMENT_ASSET_LINK = `
  SELECT 1
  FROM ticket_comment_assets
  WHERE ticket_comment_id = $1 AND asset_id = $2
  LIMIT 1
`;

export const SQL_INSERT_COMMENT_ASSET = `
  INSERT INTO ticket_comment_assets (ticket_comment_id, asset_id)
  VALUES ($1, $2)
  RETURNING ticket_comment_id AS "ticketCommentId", asset_id AS "assetId"
`;

export const SQL_DELETE_COMMENT_ASSET = `
  DELETE FROM ticket_comment_assets
  WHERE ticket_comment_id = $1 AND asset_id = $2
`;
