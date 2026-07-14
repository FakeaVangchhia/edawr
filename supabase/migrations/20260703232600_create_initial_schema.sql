-- Enable RLS and setup initial schema for eDawr

-- 1. Users Table
create table if not exists users (
  id bigint primary key generated always as identity,
  name text not null,
  role text not null check (role in ('manager', 'delivery')),
  phone text not null unique,
  base_latitude double precision not null default 23.7272,
  base_longitude double precision not null default 92.7178,
  service_radius_km double precision not null default 10.0,
  created_at timestamp with time zone not null default now()
);

alter table users enable row level security;
create policy "Allow public read users" on users for select to anon, authenticated using (true);
create policy "Allow public write users" on users for all to anon, authenticated using (true) with check (true);

-- 2. Categories Table
create table if not exists categories (
  id bigint primary key generated always as identity,
  name text not null,
  description text,
  parent_id bigint references categories(id) on delete set null,
  status text not null default 'active',
  created_at timestamp with time zone not null default now()
);

alter table categories enable row level security;
create policy "Allow public read categories" on categories for select to anon, authenticated using (true);
create policy "Allow public write categories" on categories for all to anon, authenticated using (true) with check (true);

-- 3. Products Table
create table if not exists products (
  id bigint primary key generated always as identity,
  name text not null,
  sku text,
  barcode text,
  category text,
  brand text,
  unit text,
  price numeric(10, 2) not null default 0.00,
  cost_price numeric(10, 2) not null default 0.00,
  mrp numeric(10, 2) not null default 0.00,
  stock integer not null default 0,
  reorder_level integer not null default 0,
  status text not null default 'active',
  location text,
  supplier_name text,
  supplier_phone text,
  description text,
  image_url text,
  created_at timestamp with time zone not null default now()
);

alter table products enable row level security;
create policy "Allow public read products" on products for select to anon, authenticated using (true);
create policy "Allow public write products" on products for all to anon, authenticated using (true) with check (true);

-- 4. Orders Table
create table if not exists orders (
  id bigint primary key generated always as identity,
  customer_phone text not null,
  customer_name text not null default 'WhatsApp Customer',
  customer_address text not null default 'Bazar Bawn, Aizawl',
  customer_latitude double precision not null default 23.7272,
  customer_longitude double precision not null default 92.7178,
  status text not null default 'Pending' check (status in ('Pending', 'Assigned', 'Delivered')),
  delivery_boy_id bigint references users(id) on delete set null,
  offered_to_delivery_boy_id bigint references users(id) on delete set null,
  offered_distance_km double precision,
  created_at timestamp with time zone not null default now()
);

alter table orders enable row level security;
create policy "Allow public read orders" on orders for select to anon, authenticated using (true);
create policy "Allow public write orders" on orders for all to anon, authenticated using (true) with check (true);

-- 5. Order Items Table
create table if not exists order_items (
  id bigint primary key generated always as identity,
  order_id bigint not null references orders(id) on delete cascade,
  product_id bigint not null references products(id) on delete cascade,
  quantity integer not null default 1,
  name text not null,
  price numeric(10, 2) not null default 0.00,
  created_at timestamp with time zone not null default now()
);

alter table order_items enable row level security;
create policy "Allow public read order_items" on order_items for select to anon, authenticated using (true);
create policy "Allow public write order_items" on order_items for all to anon, authenticated using (true) with check (true);

-- 6. Messages Table
create table if not exists messages (
  id bigint primary key generated always as identity,
  phone text not null,
  direction text not null check (direction in ('inbound', 'outbound')),
  content text not null,
  created_at timestamp with time zone not null default now()
);

alter table messages enable row level security;
create policy "Allow public read messages" on messages for select to anon, authenticated using (true);
create policy "Allow public write messages" on messages for all to anon, authenticated using (true) with check (true);

-- 7. Todos Table (for testing purposes)
create table if not exists todos (
  id bigint primary key generated always as identity,
  name text not null,
  is_completed boolean not null default false,
  created_at timestamp with time zone not null default now()
);

alter table todos enable row level security;
create policy "Allow public read todos" on todos for select to anon, authenticated using (true);
create policy "Allow public write todos" on todos for all to anon, authenticated using (true) with check (true);
