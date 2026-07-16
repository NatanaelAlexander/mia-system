const CLOSED_STATUSES = `('Terminado', 'Cancelado')`;

/**
 * Buckets y conteos se calculan en UTC (timestamp sin tz) para que el JOIN
 * coincida. El filtro superior usa NOW() para no excluir tickets de hoy
 * por desfase de zona horaria.
 *
 * Params: $1 trunc unit, $2 start timestamptz, $3 interval
 */
export const SQL_TICKET_TIMELINE = `
  WITH buckets AS (
    SELECT gs AS bucket
    FROM generate_series(
      date_trunc($1, ($2::timestamptz AT TIME ZONE 'UTC')),
      date_trunc($1, (NOW() AT TIME ZONE 'UTC')),
      $3::interval
    ) AS gs
  ),
  counts AS (
    SELECT
      date_trunc($1, (t.created_at AT TIME ZONE 'UTC')) AS bucket,
      COUNT(*)::int AS total,
      COUNT(*) FILTER (
        WHERE ts.name NOT IN ${CLOSED_STATUSES}
      )::int AS open,
      COUNT(*) FILTER (
        WHERE ts.name IN ${CLOSED_STATUSES}
      )::int AS closed
    FROM tickets t
    INNER JOIN ticket_statuses ts ON ts.id = t.status_id
    WHERE t.created_at >= $2::timestamptz
      AND t.created_at <= NOW()
      AND ts.name <> 'Borrador'
    GROUP BY 1
  )
  SELECT
    (b.bucket AT TIME ZONE 'UTC') AS "date",
    COALESCE(c.total, 0) AS total,
    COALESCE(c.open, 0) AS open,
    COALESCE(c.closed, 0) AS closed
  FROM buckets b
  LEFT JOIN counts c ON c.bucket = b.bucket
  ORDER BY b.bucket ASC
`;
