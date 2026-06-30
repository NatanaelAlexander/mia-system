# Migraciones SQL

Aquí irán los archivos `.sql` del esquema (MER) y el script para ejecutarlos.

## Qué va en Git

- Archivos `*.sql` (CREATE TABLE, índices, seeds de catálogos)
- Script `run-migrations.sh`
- Este README

## Qué NO va en Git

- Datos de la base (filas insertadas en desarrollo)
- Volumen Docker `mia_pg_data` (persistencia local automática)
- Credenciales reales (archivo `.env` en la raíz del repo)

## Servicio PostgreSQL

| Concepto | Valor por defecto |
|----------|-------------------|
| Servicio Docker | `bd_main` |
| Base de datos | `mia_system` |
| Puerto en tu PC | `5432` |
| Volumen de datos | `mia_pg_data` |

## Próximo paso

Cuando existan los `.sql`, se documentará aquí cómo lanzar las migraciones con Docker.
