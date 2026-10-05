-- Remove every user EXCEPT the Super Admin 'kms' (staff, old admins and customer logins),
-- keeping branch, tables, prices, bookings, customers and bills. References to removed
-- users are cleared. Then give 'kms' its email address.
BEGIN;

DO $$
DECLARE
  fk record;
  keep uuid := (SELECT id FROM public.users WHERE username = 'kms');
BEGIN
  IF keep IS NULL THEN
    RAISE EXCEPTION 'User kms not found - create it first with app.create_admin';
  END IF;
  FOR fk IN
    SELECT c.conrelid::regclass AS tbl, a.attname AS col, a.attnotnull AS not_null
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
    WHERE c.contype = 'f' AND c.confrelid = 'public.users'::regclass
  LOOP
    IF fk.not_null THEN
      EXECUTE format('DELETE FROM %s WHERE %I <> $1', fk.tbl, fk.col) USING keep;   -- rows that cannot exist without their user
    ELSE
      EXECUTE format('UPDATE %s SET %I = NULL WHERE %I <> $1', fk.tbl, fk.col, fk.col) USING keep;
    END IF;
  END LOOP;
  DELETE FROM public.users WHERE id <> keep;
  UPDATE public.users SET email = 'skmullasha6359@gmail.com' WHERE id = keep;
END $$;

COMMIT;

SELECT username, email, full_name, is_active FROM public.users;
