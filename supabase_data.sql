SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict dPTjFQKoHePqBbjoAcrbw7gNuRzas9lgdJ5WwNVqL2eTEecf3kQfTM5hXEAL4pf

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: __drizzle_migrations; Type: TABLE DATA; Schema: drizzle; Owner: postgres
--



--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."projects" ("id", "name", "key", "description", "created_at", "updated_at") VALUES
	('d460b872-a4ab-4e0b-9c7a-354fcf34a6a7', 'サンプルプロジェクト', 'Issue', '開発テスト用のサンプルプロジェクト', '2026-02-26 15:41:28.185436+00', '2026-02-26 15:41:28.185436+00');


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."categories" ("id", "project_id", "name", "color", "display_order") VALUES
	('64669b20-5957-4a6d-8c9f-ee94a18276de', 'd460b872-a4ab-4e0b-9c7a-354fcf34a6a7', '機能追加', '#3B82F6', 1),
	('0b3fe14b-77de-408d-a5e0-007e6fc36119', 'd460b872-a4ab-4e0b-9c7a-354fcf34a6a7', 'バグ修正', '#EF4444', 2),
	('73bf30ec-1d22-4d76-9d7f-089277d2a4a6', 'd460b872-a4ab-4e0b-9c7a-354fcf34a6a7', '改善', '#22C55E', 3);


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."users" ("id", "display_name", "email", "role", "created_at", "avatar_url") VALUES
	('f3f91f9a-9526-4860-bafa-4b40823d5852', 'じょ', 'admin@example.com', 'admin', '2026-02-26 15:41:28.179617+00', 'http://127.0.0.1:54321/storage/v1/object/public/user/f3f91f9a-9526-4860-bafa-4b40823d5852/avatar.jpg'),
	('f48076dd-40d3-4d7d-bf2b-a3c684614e77', '鳥', 'member@example.com', 'member', '2026-02-26 15:41:28.184083+00', NULL);


--
-- Data for Name: project_members; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."project_members" ("project_id", "user_id", "role", "joined_at") VALUES
	('d460b872-a4ab-4e0b-9c7a-354fcf34a6a7', 'f3f91f9a-9526-4860-bafa-4b40823d5852', 'admin', '2026-02-26 15:41:28.187228+00'),
	('d460b872-a4ab-4e0b-9c7a-354fcf34a6a7', 'f48076dd-40d3-4d7d-bf2b-a3c684614e77', 'member', '2026-02-26 15:41:28.187228+00');


--
-- Data for Name: task_statuses; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."task_statuses" ("id", "project_id", "key", "label", "color", "display_order", "created_at") VALUES
	('265aa31f-601b-43e8-aa7a-ec43e7fdd6a7', 'd460b872-a4ab-4e0b-9c7a-354fcf34a6a7', 'closed', '完了', '#22c55e', 4, '2026-02-26 17:33:26.85698+00'),
	('8585fedd-ee31-4c0f-aedf-70f92481d3db', 'd460b872-a4ab-4e0b-9c7a-354fcf34a6a7', 'resolved', '処理済み', '#f59e0b', 2, '2026-02-26 17:33:26.85698+00'),
	('01f55653-473b-43bc-b379-3e51da1ddd32', 'd460b872-a4ab-4e0b-9c7a-354fcf34a6a7', 'open', '未対応', '#a3a3a3', 0, '2026-02-26 17:33:26.85698+00'),
	('e28da690-a110-489a-9d52-923c9958860c', 'd460b872-a4ab-4e0b-9c7a-354fcf34a6a7', 'in_progress', '処理中', '#3b82f6', 1, '2026-02-26 17:33:26.85698+00'),
	('7f7e5330-4a76-42ed-aafa-111c4c4d2a4f', 'd460b872-a4ab-4e0b-9c7a-354fcf34a6a7', 'invalid', '無効', '#6B7280', 5, '2026-02-28 10:43:34.886637+00');


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."tasks" ("id", "project_id", "key_id", "summary", "description", "status", "priority", "assignee_id", "category_id", "parent_id", "start_date", "due_date", "created_by", "created_at", "updated_at") VALUES
	('96114bd9-e860-4686-8623-7add714fd3f9', 'd460b872-a4ab-4e0b-9c7a-354fcf34a6a7', 4, 'd', '', 'open', 'medium', NULL, NULL, NULL, NULL, NULL, 'f3f91f9a-9526-4860-bafa-4b40823d5852', '2026-02-26 17:47:36.365124+00', '2026-02-26 17:47:52.841+00'),
	('d9db7791-ab22-4f23-8e4c-b225b743a2f7', 'd460b872-a4ab-4e0b-9c7a-354fcf34a6a7', 3, 'SAMPLE003', NULL, 'in_progress', 'medium', 'f48076dd-40d3-4d7d-bf2b-a3c684614e77', NULL, NULL, '2026-06-11', '2026-07-23', 'f3f91f9a-9526-4860-bafa-4b40823d5852', '2026-02-26 16:14:09.632847+00', '2026-02-28 11:56:50.408+00'),
	('80f5122b-4992-4454-aa39-2f13273c9bf9', 'd460b872-a4ab-4e0b-9c7a-354fcf34a6a7', 1, 'Task-1', '<p><strong>これはテストの課題です</strong></p><p></p><p>これはテストの課題です</p><p></p><img class="max-w-full h-auto rounded-md" src="http://127.0.0.1:54321/storage/v1/object/public/user/content/1772272356166-gsktsg.png"><p></p><p></p>', 'in_progress', 'medium', 'f3f91f9a-9526-4860-bafa-4b40823d5852', '64669b20-5957-4a6d-8c9f-ee94a18276de', NULL, '2026-01-25', '2026-02-06', 'f3f91f9a-9526-4860-bafa-4b40823d5852', '2026-02-26 15:43:01.280383+00', '2026-02-28 11:57:11.743+00'),
	('0113710b-402d-4686-8486-01ea37019e6c', 'd460b872-a4ab-4e0b-9c7a-354fcf34a6a7', 2, 'SAMPLE002', '', 'open', 'medium', NULL, NULL, NULL, '2026-02-21', '2026-02-24', 'f3f91f9a-9526-4860-bafa-4b40823d5852', '2026-02-26 16:13:01.404994+00', '2026-02-26 16:13:37.072+00');


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: iceberg_namespaces; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: iceberg_tables; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: hooks; Type: TABLE DATA; Schema: supabase_functions; Owner: supabase_functions_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 1, false);


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE SET; Schema: drizzle; Owner: postgres
--

SELECT pg_catalog.setval('"drizzle"."__drizzle_migrations_id_seq"', 1, false);


--
-- Name: tasks_key_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."tasks_key_id_seq"', 4, true);


--
-- Name: hooks_id_seq; Type: SEQUENCE SET; Schema: supabase_functions; Owner: supabase_functions_admin
--

SELECT pg_catalog.setval('"supabase_functions"."hooks_id_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

-- \unrestrict dPTjFQKoHePqBbjoAcrbw7gNuRzas9lgdJ5WwNVqL2eTEecf3kQfTM5hXEAL4pf

RESET ALL;
