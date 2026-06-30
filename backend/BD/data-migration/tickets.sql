-- Data: catálogos de tickets

INSERT INTO ticket_statuses (name) VALUES
  ('Borrador'),
  ('Creado'),
  ('Tomado'),
  ('En desarrollo'),
  ('QA'),
  ('Esperando cliente'),
  ('Terminado'),
  ('Cancelado')
ON CONFLICT (name) DO NOTHING;

INSERT INTO ticket_priorities (name) VALUES
  ('Baja'),
  ('Media'),
  ('Alta'),
  ('Urgente')
ON CONFLICT (name) DO NOTHING;

INSERT INTO ticket_categories (name) VALUES
  ('Bug'),
  ('Nueva funcionalidad'),
  ('Soporte'),
  ('Consulta'),
  ('Mejora')
ON CONFLICT (name) DO NOTHING;

INSERT INTO payment_statuses (name) VALUES
  ('Pendiente de pago'),
  ('Pagado'),
  ('Canje')
ON CONFLICT (name) DO NOTHING;
