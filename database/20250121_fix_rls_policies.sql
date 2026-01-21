-- Helper functions for Auth Roles
create or replace function public.auth_get_role()
returns text
language plpgsql
security definer
as $$
begin
  return (current_setting('request.jwt.claims', true)::jsonb ->> 'role')::text;
end;
$$;

create or replace function public.auth_is_restaurant()
returns boolean
language plpgsql
security definer
as $$
begin
  return (select (raw_user_meta_data->>'role') = 'RESTAURANT' from auth.users where id = auth.uid());
end;
$$;

create or replace function public.auth_is_driver()
returns boolean
language plpgsql
security definer
as $$
begin
  return (select (raw_user_meta_data->>'role') = 'DRIVER' from auth.users where id = auth.uid());
end;
$$;

create or replace function public.auth_is_admin()
returns boolean
language plpgsql
security definer
as $$
begin
  return (select (raw_user_meta_data->>'role') = 'ADMIN' from auth.users where id = auth.uid());
end;
$$;

-- Enable RLS on tables
alter table public.orders enable row level security;
alter table public.products enable row level security;
alter table public.categories enable row level security;
alter table public.units enable row level security;
alter table public.profiles enable row level security;
alter table public.stores enable row level security;
alter table public.store_products enable row level security;
alter table public.price_history enable row level security;

-- Drop existing policies to avoid conflicts
drop policy if exists "Restaurants can view their own orders" on public.orders;
drop policy if exists "Restaurants can create their own orders" on public.orders;
drop policy if exists "Drivers can view assigned orders" on public.orders;
drop policy if exists "Admins can do everything on orders" on public.orders;

drop policy if exists "Admins can manage products" on public.products;
drop policy if exists "Everyone can view products" on public.products;

drop policy if exists "Admins can manage categories" on public.categories;
drop policy if exists "Everyone can view categories" on public.categories;

drop policy if exists "Admins can manage units" on public.units;
drop policy if exists "Everyone can view units" on public.units;

drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Admins can view all profiles" on public.profiles;

drop policy if exists "Admins can manage stores" on public.stores;
drop policy if exists "Admins can manage store_products" on public.store_products;
drop policy if exists "Admins can manage price_history" on public.price_history;


-- Orders Policies
create policy "Restaurants can view their own orders"
on public.orders for select
to authenticated
using ( auth.uid() = user_id );

create policy "Restaurants can create their own orders"
on public.orders for insert
to authenticated
with check ( auth.uid() = user_id );

create policy "Drivers can view assigned orders"
on public.orders for select
to authenticated
using ( driver_id = auth.uid() );

create policy "Admins can do everything on orders"
on public.orders for all
to authenticated
using ( auth_is_admin() );

-- Products/Categories/Units Policies
create policy "Admins can manage products"
on public.products for all
to authenticated
using ( auth_is_admin() );

create policy "Everyone can view products"
on public.products for select
to authenticated
using ( true );

create policy "Admins can manage categories"
on public.categories for all
to authenticated
using ( auth_is_admin() );

create policy "Everyone can view categories"
on public.categories for select
to authenticated
using ( true );

create policy "Admins can manage units"
on public.units for all
to authenticated
using ( auth_is_admin() );

create policy "Everyone can view units"
on public.units for select
to authenticated
using ( true );

-- Profiles Policies
create policy "Users can view own profile"
on public.profiles for select
to authenticated
using ( auth.uid() = id );

create policy "Admins can view all profiles"
on public.profiles for select
to authenticated
using ( auth_is_admin() );

-- Stores/Store Products/Price History Policies
create policy "Admins can manage stores"
on public.stores for all
to authenticated
using ( auth_is_admin() );

create policy "Admins can manage store_products"
on public.store_products for all
to authenticated
using ( auth_is_admin() );

create policy "Admins can manage price_history"
on public.price_history for all
to authenticated
using ( auth_is_admin() );
