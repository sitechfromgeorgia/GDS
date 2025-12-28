#!/bin/bash
curl -s -X POST "https://api.supabase.com/v1/projects/akxmacfsltzhbnunoepb/database/query" \
  -H "Authorization: Bearer sbp_e5043b9e80d4bd9d8a08c23798099cef576abfff" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT tablename, policyname, qual FROM pg_policies WHERE tablename != '"'"'profiles'"'"' ORDER BY tablename, policyname;"}'
