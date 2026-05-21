DELETE FROM sessions WHERE user_id = 'u_admin_platform_001';
DELETE FROM users WHERE id = 'u_admin_platform_001';
INSERT INTO users (id, email, password_hash, name, role, created_at, updated_at)
VALUES ('u_admin_platform_001', 'admin@menu.org.tr', 'pbkdf2:sha512:100000:02d090e777afe140a799bc3b26984666:b89685d660b430e0469c69e318390e56f77f8e98d41c3630e5072cb6af304b5ae1c10bf488775a24b0a5d776ddad9c428d6f294692e4c21018853e543cc42e85', 'Admin', 'platform_admin', 1779315331495, 1779315331495);