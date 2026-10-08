-- ==============================================================================
-- S2DIO Seed Script: scripts/seed-data.sql
-- Realistic developer & testing data (no real people)
-- ==============================================================================

-- 1. Insert Mock Profiles (using deterministic mock UUIDs)
insert into profiles (id, email, display_name, plan_tier, boost_balance, storage_used_bytes)
values 
  ('00000000-0000-0000-0000-000000000001', 'producer@s2dio.local', 'Marcus Vance (Producer)', 'pro_flex', 5, 48234496),
  ('00000000-0000-0000-0000-000000000002', 'vocalist@s2dio.local', 'Elena Frost (Vocalist)', 'starter', 2, 18454932)
on conflict (id) do nothing;

-- 2. Insert Active Sessions
insert into sessions (id, host_id, title, slug, status, max_collaborators, audio_quality, sample_rate, is_permanent, storage_limit_bytes, storage_used_bytes, vst3_session_token)
values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'Neon Midnight Mixdown', 'neon-midnight', 'active', 4, 'pcm_lossless', 48000, true, 1073741824, 66689428, 's2dio_vst3_token_77a94f83b12c'),
  ('11111111-1111-1111-1111-111111111112', '00000000-0000-0000-0000-000000000001', 'Vocal Tracking Pass #2', 'vocal-pass', 'active', 2, 'pcm_lossless', 48000, false, 524288000, 18454932, 's2dio_vst3_token_99b11e22c33d')
on conflict (slug) do nothing;

-- 3. Insert Participants
insert into session_participants (id, session_id, user_id, guest_name, role, screen_control, is_talkback_muted, has_vst3_connected)
values
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'Marcus Vance', 'host', 'none', false, true),
  ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000002', 'Elena Frost', 'collaborator', 'none', false, false)
on conflict do nothing;

-- 4. Insert Messages
insert into session_messages (id, session_id, participant_id, sender_name, message, is_system, created_at)
values
  ('33333333-3333-3333-3333-333333333301', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222201', 'System', 'Session connected. Master bus stream locked at 48kHz Float32.', true, now() - interval '10 minutes'),
  ('33333333-3333-3333-3333-333333333302', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222202', 'Elena Frost', 'Audio is coming through pristine and wide. Monitoring latency is under 3ms.', false, now() - interval '8 minutes'),
  ('33333333-3333-3333-3333-333333333303', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222201', 'Marcus Vance', 'Great, just pushed the vocal compressor in the verse. Drag the stem if you want to record a double.', false, now() - interval '5 minutes')
on conflict do nothing;

-- 5. Insert Files (Stems, WAVs)
insert into session_files (id, session_id, uploader_participant_id, file_name, file_size_bytes, mime_type, storage_path, uploader_name, is_stem, created_at)
values
  ('44444444-4444-4444-4444-444444444401', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222202', 'Lead_Vocal_Take1_24bit.wav', 18454932, 'audio/wav', 'neon-midnight/Lead_Vocal_Take1_24bit.wav', 'Elena Frost', true, now() - interval '7 minutes'),
  ('44444444-4444-4444-4444-444444444402', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222201', 'Kick_Snare_Stem_48k.wav', 29779564, 'audio/wav', 'neon-midnight/Kick_Snare_Stem_48k.wav', 'Marcus Vance', true, now() - interval '4 minutes'),
  ('44444444-4444-4444-4444-444444444403', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222201', 'Arp_Synth_Midi.mid', 14200, 'audio/midi', 'neon-midnight/Arp_Synth_Midi.mid', 'Marcus Vance', false, now() - interval '2 minutes')
on conflict do nothing;

-- 6. Insert Mock Subscription
insert into subscriptions (id, user_id, stripe_customer_id, stripe_subscription_id, plan_tier, status, current_period_end)
values
  ('55555555-5555-5555-5555-555555555501', '00000000-0000-0000-0000-000000000001', 'cus_mock_test_123', 'sub_mock_test_456', 'pro_flex', 'active', now() + interval '30 days')
on conflict (user_id) do nothing;
