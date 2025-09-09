-- Create database (run once)
-- create database transit charset utf8mb4 collate utf8mb4_unicode_ci;
-- use transit;

create table if not exists routes (
  id serial primary key,
  short_name varchar(32) not null,
  name varchar(255) not null,
  color varchar(16) not null,
  description text
);

create table if not exists stops (
  id serial primary key,
  route_id int not null,
  name varchar(255) not null,
  lat double precision not null,
  lng double precision not null,
  sequence int not null,
  constraint fk_stops_route foreign key (route_id) references routes(id) on delete cascade
);
create index if not exists idx_stops_route on stops(route_id);

create table if not exists buses (
  id serial primary key,
  route_id int not null,
  lat double precision not null,
  lng double precision not null,
  heading double precision default 0,
  speed double precision default 0,
  occupancy int default 0,
  vehicle_number varchar(64),
  next_stop varchar(255),
  eta varchar(64),
  updated_at timestamptz default now()
);
create index if not exists idx_buses_route on buses(route_id);

create table if not exists alerts (
  id serial primary key,
  type varchar(20) not null check (type in ('disruption','delay','maintenance','weather','info')),
  severity varchar(10) not null check (severity in ('high','medium','low')),
  title varchar(255) not null,
  description text not null,
  affected_routes jsonb,
  affected_stops jsonb,
  start_time timestamptz not null,
  end_time timestamptz,
  is_active boolean default true,
  updated_at timestamptz default now()
);

create table if not exists users (
  id serial primary key,
  email varchar(255) unique not null,
  password_hash varchar(255) not null,
  created_at timestamptz default now()
);

create table if not exists favorites (
  id serial primary key,
  user_id int not null,
  kind varchar(10) not null check (kind in ('stop','route')),
  ref_id int not null,
  nickname varchar(255),
  created_at timestamptz default now(),
  constraint fk_fav_user foreign key (user_id) references users(id) on delete cascade
);


