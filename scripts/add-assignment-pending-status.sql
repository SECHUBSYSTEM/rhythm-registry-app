-- Add ASSIGNMENT_PENDING to order_status enum (for DBs that already have the enum without it).
-- Run in Supabase SQL Editor if you see errors about invalid status 'ASSIGNMENT_PENDING'.
-- PostgreSQL 15+: IF NOT EXISTS is supported. On older PG, remove "IF NOT EXISTS" and ignore error if value already exists.
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'ASSIGNMENT_PENDING' BEFORE 'ASSIGNED';
