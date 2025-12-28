// Check all RLS policies
const response = await fetch("https://api.supabase.com/v1/projects/akxmacfsltzhbnunoepb/database/query", {
  method: "POST",
  headers: {
    "Authorization": "Bearer sbp_e5043b9e80d4bd9d8a08c23798099cef576abfff",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    query: "SELECT tablename, policyname FROM pg_policies ORDER BY tablename, policyname"
  })
});

const data = await response.json();
console.log(JSON.stringify(data, null, 2));
