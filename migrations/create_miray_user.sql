DELETE FROM sessions WHERE user_id = 'u_miray_owner_001';
DELETE FROM restaurant_members WHERE user_id = 'u_miray_owner_001';
DELETE FROM users WHERE id = 'u_miray_owner_001';
INSERT INTO users (id, email, password_hash, name, role, created_at, updated_at)
VALUES ('u_miray_owner_001', 'owner@cafemiray.com', 'pbkdf2:sha512:100000:eea7c3cf7c498c0b7d2066edcbc57bd1:54d6ef24af2f2354015a6931aa9b815157f76a94066401c7f5f6244cc9ecfc5892f1e353181dac170ab89ecbebec44d8c0a55bbcaa2235d83151b12c991607a8', 'Café Miray Owner', 'user', 1779315356100, 1779315356100);
INSERT INTO restaurant_members (id, restaurant_id, user_id, role, created_at)
VALUES ('m_miray_001', 'rest_seed_demo_001', 'u_miray_owner_001', 'owner', 1779315356100);