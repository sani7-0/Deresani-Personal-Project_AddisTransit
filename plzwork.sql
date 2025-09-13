--
-- PostgreSQL database dump
--

\restrict S8FNXlimlCe7ankwHp8Vzv6QQNlRD5ybCFVEqVG1dXIXebzRelpftJYfuNan19f

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

-- Started on 2025-09-13 21:40:02

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
-- TOC entry 2 (class 3079 OID 17309)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- TOC entry 5102 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- TOC entry 277 (class 1255 OID 17405)
-- Name: add_ticket(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.add_ticket(p_plate_number text) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_bus_id TEXT;
    v_route_id TEXT;
    v_current_passengers INTEGER;
    v_max_capacity INTEGER;
    v_status TEXT;
    v_status_emoji TEXT;
    v_ticket_time TIMESTAMPTZ;
BEGIN
    -- Get bus info
    SELECT id, route_id, current_passenger_count, max_capacity
    INTO v_bus_id, v_route_id, v_current_passengers, v_max_capacity
    FROM public.buses
    WHERE plate_number = p_plate_number;
    
    IF v_bus_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Bus not found');
    END IF;
    
    -- Check if bus is full
    IF v_current_passengers >= v_max_capacity THEN
        RETURN jsonb_build_object('success', false, 'error', 'Bus is full');
    END IF;
    
    -- Update passenger count
    UPDATE public.buses 
    SET current_passenger_count = current_passenger_count + 1,
        last_updated = NOW()
    WHERE id = v_bus_id;
    
    -- Update ticket count
    INSERT INTO public.ticket_count (bus_id, route_id, plate_number, ticket_count, last_ticket_time)
    VALUES (v_bus_id, v_route_id, p_plate_number, 1, NOW())
    ON CONFLICT (bus_id) 
    DO UPDATE SET 
        ticket_count = ticket_count + 1,
        last_ticket_time = NOW(),
        updated_at = NOW();
    
    -- Get updated values
    SELECT current_passenger_count, max_capacity
    INTO v_current_passengers, v_max_capacity
    FROM public.buses
    WHERE id = v_bus_id;
    
    -- Determine status
    IF v_current_passengers < (v_max_capacity * 0.5) THEN
        v_status := 'green';
        v_status_emoji := '🟢';
    ELSIF v_current_passengers < (v_max_capacity * 0.8) THEN
        v_status := 'yellow';
        v_status_emoji := '��';
    ELSE
        v_status := 'red';
        v_status_emoji := '🔴';
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'bus_id', v_bus_id,
        'route_id', v_route_id,
        'plate_number', p_plate_number,
        'current_passengers', v_current_passengers,
        'max_capacity', v_max_capacity,
        'status', v_status,
        'status_emoji', v_status_emoji,
        'ticket_time', NOW()
    );
END;
$$;


ALTER FUNCTION public.add_ticket(p_plate_number text) OWNER TO postgres;

--
-- TOC entry 276 (class 1255 OID 17347)
-- Name: hash_admin_password(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.hash_admin_password() RETURNS trigger
    LANGUAGE plpgsql
    AS $_$
BEGIN
	IF NEW.password_hash IS NULL OR NEW.password_hash = '' THEN
		RAISE EXCEPTION 'password_hash cannot be null or empty';
	END IF;

	IF position('$2' in NEW.password_hash) <> 1 THEN
		NEW.password_hash := crypt(NEW.password_hash, gen_salt('bf', 10));
	END IF;
	RETURN NEW;
END;
$_$;


ALTER FUNCTION public.hash_admin_password() OWNER TO postgres;

--
-- TOC entry 289 (class 1255 OID 17409)
-- Name: reset_bus_count(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.reset_bus_count(p_plate_number text) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_bus_id TEXT;
    v_route_id TEXT;
    v_previous_count INTEGER;
BEGIN
    -- Get bus info
    SELECT id, route_id, current_passenger_count
    INTO v_bus_id, v_route_id, v_previous_count
    FROM public.buses
    WHERE plate_number = p_plate_number;
    
    IF v_bus_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Bus not found');
    END IF;
    
    -- Reset passenger count
    UPDATE public.buses 
    SET current_passenger_count = 0,
        last_updated = NOW()
    WHERE id = v_bus_id;
    
    -- Reset ticket count
    UPDATE public.ticket_count 
    SET ticket_count = 0,
        last_ticket_time = NOW(),
        updated_at = NOW()
    WHERE bus_id = v_bus_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'bus_id', v_bus_id,
        'route_id', v_route_id,
        'plate_number', p_plate_number,
        'previous_count', v_previous_count,
        'reset_time', NOW()
    );
END;
$$;


ALTER FUNCTION public.reset_bus_count(p_plate_number text) OWNER TO postgres;

--
-- TOC entry 275 (class 1255 OID 17287)
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
	NEW.updated_at = NOW();
	RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_updated_at() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 232 (class 1259 OID 17292)
-- Name: admins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admins (
    id integer NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    role text DEFAULT 'admin'::text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.admins OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 17291)
-- Name: admins_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.admins_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admins_id_seq OWNER TO postgres;

--
-- TOC entry 5103 (class 0 OID 0)
-- Dependencies: 231
-- Name: admins_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.admins_id_seq OWNED BY public.admins.id;


--
-- TOC entry 219 (class 1259 OID 17094)
-- Name: alerts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alerts (
    id integer NOT NULL,
    type character varying(20) NOT NULL,
    severity character varying(10) NOT NULL,
    title character varying(255) NOT NULL,
    description text NOT NULL,
    affected_routes jsonb,
    affected_stops jsonb,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone,
    is_active boolean DEFAULT true,
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT alerts_severity_check CHECK (((severity)::text = ANY ((ARRAY['high'::character varying, 'medium'::character varying, 'low'::character varying])::text[]))),
    CONSTRAINT alerts_type_check CHECK (((type)::text = ANY ((ARRAY['disruption'::character varying, 'delay'::character varying, 'maintenance'::character varying, 'weather'::character varying, 'info'::character varying])::text[])))
);


ALTER TABLE public.alerts OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 17093)
-- Name: alerts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.alerts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.alerts_id_seq OWNER TO postgres;

--
-- TOC entry 5104 (class 0 OID 0)
-- Dependencies: 218
-- Name: alerts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.alerts_id_seq OWNED BY public.alerts.id;


--
-- TOC entry 238 (class 1259 OID 17468)
-- Name: anomaly_detection; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.anomaly_detection (
    id integer NOT NULL,
    bus_id integer NOT NULL,
    anomaly_type character varying(50) NOT NULL,
    severity character varying(10) NOT NULL,
    confidence_score numeric(5,2) DEFAULT 0.00,
    detected_value numeric(10,2),
    threshold_value numeric(10,2),
    description text,
    location_lat double precision,
    location_lng double precision,
    detected_at timestamp with time zone DEFAULT now(),
    status character varying(20) DEFAULT 'active'::character varying,
    CONSTRAINT anomaly_detection_anomaly_type_check CHECK (((anomaly_type)::text = ANY ((ARRAY['overcrowding'::character varying, 'speed_anomaly'::character varying, 'route_deviation'::character varying, 'delay_pattern'::character varying, 'passenger_spike'::character varying])::text[]))),
    CONSTRAINT anomaly_detection_severity_check CHECK (((severity)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'critical'::character varying])::text[]))),
    CONSTRAINT anomaly_detection_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'investigated'::character varying, 'resolved'::character varying, 'false_positive'::character varying])::text[])))
);


ALTER TABLE public.anomaly_detection OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 17467)
-- Name: anomaly_detection_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.anomaly_detection_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.anomaly_detection_id_seq OWNER TO postgres;

--
-- TOC entry 5105 (class 0 OID 0)
-- Dependencies: 237
-- Name: anomaly_detection_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.anomaly_detection_id_seq OWNED BY public.anomaly_detection.id;


--
-- TOC entry 230 (class 1259 OID 17256)
-- Name: bus_feedback; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bus_feedback (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    route text NOT NULL,
    bus_number text NOT NULL,
    plate_number text NOT NULL,
    feedback text NOT NULL,
    submitter_ip inet,
    user_agent text,
    locale text,
    CONSTRAINT chk_bus_number_len CHECK ((char_length(bus_number) >= 1)),
    CONSTRAINT chk_feedback_len CHECK ((char_length(feedback) >= 4)),
    CONSTRAINT chk_plate_number_len CHECK ((char_length(plate_number) >= 1)),
    CONSTRAINT chk_route_len CHECK ((char_length(route) >= 1))
);


ALTER TABLE public.bus_feedback OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 17255)
-- Name: bus_feedback_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bus_feedback_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bus_feedback_id_seq OWNER TO postgres;

--
-- TOC entry 5106 (class 0 OID 0)
-- Dependencies: 229
-- Name: bus_feedback_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bus_feedback_id_seq OWNED BY public.bus_feedback.id;


--
-- TOC entry 225 (class 1259 OID 17164)
-- Name: bus_number_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bus_number_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bus_number_seq OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 17237)
-- Name: buses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.buses (
    id text NOT NULL,
    route_id text NOT NULL,
    route_number integer NOT NULL,
    bus_number integer NOT NULL,
    vehicle_code text NOT NULL,
    operator text,
    bus_type text,
    menged_compatible boolean DEFAULT true,
    last_lat double precision,
    last_lng double precision,
    last_heading integer,
    last_speed integer,
    last_updated timestamp with time zone DEFAULT now(),
    plate_number text,
    current_passenger_count integer DEFAULT 0 NOT NULL,
    max_capacity integer DEFAULT 50 NOT NULL,
    CONSTRAINT chk_capacity CHECK (((current_passenger_count >= 0) AND (current_passenger_count <= max_capacity)))
);


ALTER TABLE public.buses OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 17119)
-- Name: favorites; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.favorites (
    id integer NOT NULL,
    user_id integer NOT NULL,
    kind character varying(10) NOT NULL,
    ref_id integer NOT NULL,
    nickname character varying(255),
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT favorites_kind_check CHECK (((kind)::text = ANY ((ARRAY['stop'::character varying, 'route'::character varying])::text[])))
);


ALTER TABLE public.favorites OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 17118)
-- Name: favorites_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.favorites_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.favorites_id_seq OWNER TO postgres;

--
-- TOC entry 5107 (class 0 OID 0)
-- Dependencies: 222
-- Name: favorites_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.favorites_id_seq OWNED BY public.favorites.id;


--
-- TOC entry 236 (class 1259 OID 17453)
-- Name: reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reports (
    id integer NOT NULL,
    user_id integer,
    report_type character varying(50) NOT NULL,
    severity character varying(10) NOT NULL,
    bus_id integer,
    route_id integer,
    plate_number character varying(64),
    location_lat double precision,
    location_lng double precision,
    location_name character varying(255),
    description text,
    status character varying(20) DEFAULT 'pending'::character varying,
    admin_notes text,
    reported_by_ip inet,
    user_agent text,
    locale text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT reports_report_type_check CHECK (((report_type)::text = ANY ((ARRAY['overcrowded'::character varying, 'delay'::character varying, 'unsafe_driving'::character varying, 'mechanical_issue'::character varying, 'route_deviation'::character varying, 'other'::character varying])::text[]))),
    CONSTRAINT reports_severity_check CHECK (((severity)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'critical'::character varying])::text[]))),
    CONSTRAINT reports_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'investigating'::character varying, 'resolved'::character varying, 'dismissed'::character varying])::text[])))
);


ALTER TABLE public.reports OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 17452)
-- Name: reports_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reports_id_seq OWNER TO postgres;

--
-- TOC entry 5108 (class 0 OID 0)
-- Dependencies: 235
-- Name: reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reports_id_seq OWNED BY public.reports.id;


--
-- TOC entry 224 (class 1259 OID 17163)
-- Name: route_number_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.route_number_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.route_number_seq OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 17216)
-- Name: routes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.routes (
    id text NOT NULL,
    route_number integer NOT NULL,
    name text NOT NULL,
    short_name text NOT NULL,
    color text NOT NULL,
    type text NOT NULL,
    description text
);


ALTER TABLE public.routes OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 17225)
-- Name: stops; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stops (
    id text NOT NULL,
    route_id text NOT NULL,
    name text NOT NULL,
    lat double precision NOT NULL,
    lng double precision NOT NULL,
    sequence integer NOT NULL
);


ALTER TABLE public.stops OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 17371)
-- Name: ticket_count; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ticket_count (
    id bigint NOT NULL,
    bus_id text NOT NULL,
    route_id text NOT NULL,
    plate_number text NOT NULL,
    ticket_count integer DEFAULT 0 NOT NULL,
    last_ticket_time timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.ticket_count OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 17370)
-- Name: ticket_count_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ticket_count_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ticket_count_id_seq OWNER TO postgres;

--
-- TOC entry 5109 (class 0 OID 0)
-- Dependencies: 233
-- Name: ticket_count_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ticket_count_id_seq OWNED BY public.ticket_count.id;


--
-- TOC entry 221 (class 1259 OID 17107)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 17106)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 5110 (class 0 OID 0)
-- Dependencies: 220
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 4845 (class 2604 OID 17295)
-- Name: admins id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins ALTER COLUMN id SET DEFAULT nextval('public.admins_id_seq'::regclass);


--
-- TOC entry 4832 (class 2604 OID 17097)
-- Name: alerts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alerts ALTER COLUMN id SET DEFAULT nextval('public.alerts_id_seq'::regclass);


--
-- TOC entry 4859 (class 2604 OID 17471)
-- Name: anomaly_detection id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.anomaly_detection ALTER COLUMN id SET DEFAULT nextval('public.anomaly_detection_id_seq'::regclass);


--
-- TOC entry 4843 (class 2604 OID 17259)
-- Name: bus_feedback id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bus_feedback ALTER COLUMN id SET DEFAULT nextval('public.bus_feedback_id_seq'::regclass);


--
-- TOC entry 4837 (class 2604 OID 17122)
-- Name: favorites id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites ALTER COLUMN id SET DEFAULT nextval('public.favorites_id_seq'::regclass);


--
-- TOC entry 4855 (class 2604 OID 17456)
-- Name: reports id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports ALTER COLUMN id SET DEFAULT nextval('public.reports_id_seq'::regclass);


--
-- TOC entry 4850 (class 2604 OID 17374)
-- Name: ticket_count id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_count ALTER COLUMN id SET DEFAULT nextval('public.ticket_count_id_seq'::regclass);


--
-- TOC entry 4835 (class 2604 OID 17110)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 5090 (class 0 OID 17292)
-- Dependencies: 232
-- Data for Name: admins; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admins (id, email, password_hash, role, is_active, created_at, updated_at) FROM stdin;
1	admin@example.com	$2y$10$ynRjlMUo1PiUUVyrYUKmUesoNV2cjB78D8LhocKDxclqkkzniqLTO	superadmin	t	2025-09-08 17:16:36.53287+03	2025-09-08 18:05:43.326719+03
\.


--
-- TOC entry 5077 (class 0 OID 17094)
-- Dependencies: 219
-- Data for Name: alerts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alerts (id, type, severity, title, description, affected_routes, affected_stops, start_time, end_time, is_active, updated_at) FROM stdin;
1	disruption	high	Route 3 Service Delayed	Heavy traffic around Merkato causing delays on Route 3	["3"]	["Merkato"]	2025-09-07 20:05:16.601181+03	2025-09-07 22:05:16.601181+03	t	2025-09-07 20:05:16.601181+03
2	delay	medium	Route 1 Minor Delays	Construction near Meskel Square causing 10-15 minute delays	["1"]	["Meskel Square"]	2025-09-07 20:05:16.601181+03	2025-09-08 00:05:16.601181+03	t	2025-09-07 20:05:16.601181+03
3	maintenance	low	Route 4 Weekend Service	Route 4 will have reduced frequency this weekend	["4"]	[]	2025-09-08 20:05:16.601181+03	2025-09-10 20:05:16.601181+03	f	2025-09-07 20:05:16.601181+03
4	info	low	New Route 6 Coming Soon	New route connecting Bole to CMC will start next month	[]	[]	2025-09-07 20:05:16.601181+03	\N	t	2025-09-07 20:05:16.601181+03
\.


--
-- TOC entry 5096 (class 0 OID 17468)
-- Dependencies: 238
-- Data for Name: anomaly_detection; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.anomaly_detection (id, bus_id, anomaly_type, severity, confidence_score, detected_value, threshold_value, description, location_lat, location_lng, detected_at, status) FROM stdin;
\.


--
-- TOC entry 5088 (class 0 OID 17256)
-- Dependencies: 230
-- Data for Name: bus_feedback; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bus_feedback (id, created_at, route, bus_number, plate_number, feedback, submitter_ip, user_agent, locale) FROM stdin;
1	2025-09-08 19:21:21.942107+03	Bole to Airport	24	A12345	It was very good	196.188.252.247	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	en-US
\.


--
-- TOC entry 5086 (class 0 OID 17237)
-- Dependencies: 228
-- Data for Name: buses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.buses (id, route_id, route_number, bus_number, vehicle_code, operator, bus_type, menged_compatible, last_lat, last_lng, last_heading, last_speed, last_updated, plate_number, current_passenger_count, max_capacity) FROM stdin;
bus-12-1	route-12	12	1	VEH-12-1	sheger	sheger bus	t	9.0189	38.7367	120	20	2025-09-12 20:09:18.486526+03	AA-1234-5678	15	40
bus-12-2	route-12	12	2	VEH-12-2	sheger	sheger bus	t	9.0189	38.7367	300	25	2025-09-12 20:09:18.486526+03	AA-2345-6789	32	40
bus-24-1	route-24	24	1	VEH-24-1	anbessa	anbessa city bus	t	9.0205	38.771	90	25	2025-09-12 20:09:18.486526+03	AA-3456-7890	8	35
bus-36-1	route-36	36	1	VEH-36-1	velocity	velocity bus	t	9.0006	38.7432	45	28	2025-09-12 20:09:18.486526+03	AA-4567-8901	28	40
bus-45-1	route-45	45	1	VEH-45-1	anbessa	anbessa city bus	t	8.9909	38.7659	180	22	2025-09-12 20:09:18.486526+03	AA-5678-9012	12	40
bus-91-1	route-91	91	1	VEH-91-1	velocity	velocity bus	t	9.0089	38.7526	75	30	2025-09-12 20:09:18.486526+03	AA-6789-0123	0	40
\.


--
-- TOC entry 5081 (class 0 OID 17119)
-- Dependencies: 223
-- Data for Name: favorites; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.favorites (id, user_id, kind, ref_id, nickname, created_at) FROM stdin;
\.


--
-- TOC entry 5094 (class 0 OID 17453)
-- Dependencies: 236
-- Data for Name: reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reports (id, user_id, report_type, severity, bus_id, route_id, plate_number, location_lat, location_lng, location_name, description, status, admin_notes, reported_by_ip, user_agent, locale, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5084 (class 0 OID 17216)
-- Dependencies: 226
-- Data for Name: routes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.routes (id, route_number, name, short_name, color, type, description) FROM stdin;
route-12	12	Ayertena - Minilik Square	R12	#FF0000	sheger bus	Route 12 from Ayertena to Minilik Square
route-24	24	Megenagna - Kara	R24	#00BFFF	anbessa city bus	Route 24 from Megenagna to Kara
route-36	36	Kore Mekanisa - Lideta	R36	#0000FF	velocity bus	Route 36 from Kore Mekanisa to Lideta
route-45	45	Kaliti - Merkato	R45	#00FF00	anbessa city bus	Route 45 from Kaliti to Merkato
route-91	91	Kore Mekanisa - Minilik Square	R91	#FFD700	velocity bus	Route 91 from Kore Mekanisa to Minilik Square
\.


--
-- TOC entry 5085 (class 0 OID 17225)
-- Dependencies: 227
-- Data for Name: stops; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stops (id, route_id, name, lat, lng, sequence) FROM stdin;
stop-12-1	route-12	Ayertena	9.0008	38.7105	1
stop-12-2	route-12	Minilik Square	9.037	38.7628	2
stop-24-1	route-24	Megenagna	9.005401	38.78921	1
stop-24-2	route-24	Kara	9.0356	38.7528	2
stop-36-1	route-36	Kore Mekanisa	8.9807	38.7423	1
stop-36-2	route-36	Lideta	9.0205	38.744	2
stop-45-1	route-45	Kaliti	8.9441	38.7882	1
stop-45-2	route-45	Merkato	9.0377	38.7435	2
stop-91-1	route-91	Kore Mekanisa	8.9807	38.7423	1
stop-91-2	route-91	Minilik Square	9.037	38.7628	2
\.


--
-- TOC entry 5092 (class 0 OID 17371)
-- Dependencies: 234
-- Data for Name: ticket_count; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ticket_count (id, bus_id, route_id, plate_number, ticket_count, last_ticket_time, created_at, updated_at) FROM stdin;
38	bus-12-1	route-12	AA-1234-5678	15	2025-09-12 20:09:18.486526+03	2025-09-12 20:09:18.486526+03	2025-09-12 20:09:18.486526+03
39	bus-12-2	route-12	AA-2345-6789	32	2025-09-12 20:09:18.486526+03	2025-09-12 20:09:18.486526+03	2025-09-12 20:09:18.486526+03
40	bus-24-1	route-24	AA-3456-7890	8	2025-09-12 20:09:18.486526+03	2025-09-12 20:09:18.486526+03	2025-09-12 20:09:18.486526+03
41	bus-36-1	route-36	AA-4567-8901	28	2025-09-12 20:09:18.486526+03	2025-09-12 20:09:18.486526+03	2025-09-12 20:09:18.486526+03
42	bus-45-1	route-45	AA-5678-9012	12	2025-09-12 20:09:18.486526+03	2025-09-12 20:09:18.486526+03	2025-09-12 20:09:18.486526+03
43	bus-91-1	route-91	AA-6789-0123	0	2025-09-12 20:09:18.486526+03	2025-09-12 20:09:18.486526+03	2025-09-12 20:09:18.486526+03
\.


--
-- TOC entry 5079 (class 0 OID 17107)
-- Dependencies: 221
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password_hash, created_at) FROM stdin;
\.


--
-- TOC entry 5111 (class 0 OID 0)
-- Dependencies: 231
-- Name: admins_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.admins_id_seq', 1, true);


--
-- TOC entry 5112 (class 0 OID 0)
-- Dependencies: 218
-- Name: alerts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.alerts_id_seq', 4, true);


--
-- TOC entry 5113 (class 0 OID 0)
-- Dependencies: 237
-- Name: anomaly_detection_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.anomaly_detection_id_seq', 1, false);


--
-- TOC entry 5114 (class 0 OID 0)
-- Dependencies: 229
-- Name: bus_feedback_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bus_feedback_id_seq', 1, true);


--
-- TOC entry 5115 (class 0 OID 0)
-- Dependencies: 225
-- Name: bus_number_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bus_number_seq', 1, false);


--
-- TOC entry 5116 (class 0 OID 0)
-- Dependencies: 222
-- Name: favorites_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.favorites_id_seq', 1, false);


--
-- TOC entry 5117 (class 0 OID 0)
-- Dependencies: 235
-- Name: reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reports_id_seq', 1, false);


--
-- TOC entry 5118 (class 0 OID 0)
-- Dependencies: 224
-- Name: route_number_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.route_number_seq', 1, false);


--
-- TOC entry 5119 (class 0 OID 0)
-- Dependencies: 233
-- Name: ticket_count_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ticket_count_id_seq', 43, true);


--
-- TOC entry 5120 (class 0 OID 0)
-- Dependencies: 220
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 1, false);


--
-- TOC entry 4905 (class 2606 OID 17305)
-- Name: admins admins_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_email_key UNIQUE (email);


--
-- TOC entry 4907 (class 2606 OID 17303)
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (id);


--
-- TOC entry 4878 (class 2606 OID 17105)
-- Name: alerts alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_pkey PRIMARY KEY (id);


--
-- TOC entry 4922 (class 2606 OID 17481)
-- Name: anomaly_detection anomaly_detection_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.anomaly_detection
    ADD CONSTRAINT anomaly_detection_pkey PRIMARY KEY (id);


--
-- TOC entry 4900 (class 2606 OID 17268)
-- Name: bus_feedback bus_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bus_feedback
    ADD CONSTRAINT bus_feedback_pkey PRIMARY KEY (id);


--
-- TOC entry 4892 (class 2606 OID 17245)
-- Name: buses buses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buses
    ADD CONSTRAINT buses_pkey PRIMARY KEY (id);


--
-- TOC entry 4894 (class 2606 OID 17369)
-- Name: buses buses_plate_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buses
    ADD CONSTRAINT buses_plate_number_key UNIQUE (plate_number);


--
-- TOC entry 4896 (class 2606 OID 17249)
-- Name: buses buses_route_number_bus_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buses
    ADD CONSTRAINT buses_route_number_bus_number_key UNIQUE (route_number, bus_number);


--
-- TOC entry 4898 (class 2606 OID 17247)
-- Name: buses buses_vehicle_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buses
    ADD CONSTRAINT buses_vehicle_code_key UNIQUE (vehicle_code);


--
-- TOC entry 4884 (class 2606 OID 17126)
-- Name: favorites favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_pkey PRIMARY KEY (id);


--
-- TOC entry 4920 (class 2606 OID 17466)
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (id);


--
-- TOC entry 4886 (class 2606 OID 17222)
-- Name: routes routes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.routes
    ADD CONSTRAINT routes_pkey PRIMARY KEY (id);


--
-- TOC entry 4888 (class 2606 OID 17224)
-- Name: routes routes_route_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.routes
    ADD CONSTRAINT routes_route_number_key UNIQUE (route_number);


--
-- TOC entry 4890 (class 2606 OID 17231)
-- Name: stops stops_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stops
    ADD CONSTRAINT stops_pkey PRIMARY KEY (id);


--
-- TOC entry 4916 (class 2606 OID 17382)
-- Name: ticket_count ticket_count_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_count
    ADD CONSTRAINT ticket_count_pkey PRIMARY KEY (id);


--
-- TOC entry 4918 (class 2606 OID 17384)
-- Name: ticket_count uk_ticket_count_bus; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_count
    ADD CONSTRAINT uk_ticket_count_bus UNIQUE (bus_id);


--
-- TOC entry 4880 (class 2606 OID 17117)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4882 (class 2606 OID 17115)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4908 (class 1259 OID 17307)
-- Name: idx_admins_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_admins_email ON public.admins USING btree (email);


--
-- TOC entry 4909 (class 1259 OID 17308)
-- Name: idx_admins_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_admins_is_active ON public.admins USING btree (is_active);


--
-- TOC entry 4901 (class 1259 OID 17269)
-- Name: idx_bus_feedback_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bus_feedback_created_at ON public.bus_feedback USING btree (created_at DESC);


--
-- TOC entry 4902 (class 1259 OID 17270)
-- Name: idx_bus_feedback_ip; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bus_feedback_ip ON public.bus_feedback USING btree (submitter_ip);


--
-- TOC entry 4903 (class 1259 OID 17271)
-- Name: idx_bus_feedback_route; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bus_feedback_route ON public.bus_feedback USING btree (route);


--
-- TOC entry 4910 (class 1259 OID 17400)
-- Name: idx_ticket_count_bus_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ticket_count_bus_id ON public.ticket_count USING btree (bus_id);


--
-- TOC entry 4911 (class 1259 OID 17404)
-- Name: idx_ticket_count_bus_plate; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ticket_count_bus_plate ON public.ticket_count USING btree (bus_id, plate_number);


--
-- TOC entry 4912 (class 1259 OID 17402)
-- Name: idx_ticket_count_plate; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ticket_count_plate ON public.ticket_count USING btree (plate_number);


--
-- TOC entry 4913 (class 1259 OID 17401)
-- Name: idx_ticket_count_route_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ticket_count_route_id ON public.ticket_count USING btree (route_id);


--
-- TOC entry 4914 (class 1259 OID 17403)
-- Name: idx_ticket_count_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ticket_count_time ON public.ticket_count USING btree (last_ticket_time DESC);


--
-- TOC entry 4929 (class 2620 OID 17348)
-- Name: admins trg_admins_hash_password; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_admins_hash_password BEFORE INSERT OR UPDATE OF password_hash ON public.admins FOR EACH ROW EXECUTE FUNCTION public.hash_admin_password();


--
-- TOC entry 4930 (class 2620 OID 17346)
-- Name: admins trg_admins_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_admins_updated_at BEFORE UPDATE ON public.admins FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 4925 (class 2606 OID 17250)
-- Name: buses buses_route_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buses
    ADD CONSTRAINT buses_route_id_fkey FOREIGN KEY (route_id) REFERENCES public.routes(id) ON DELETE CASCADE;


--
-- TOC entry 4923 (class 2606 OID 17127)
-- Name: favorites fk_fav_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT fk_fav_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4926 (class 2606 OID 17385)
-- Name: ticket_count fk_ticket_count_bus; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_count
    ADD CONSTRAINT fk_ticket_count_bus FOREIGN KEY (bus_id) REFERENCES public.buses(id) ON DELETE CASCADE;


--
-- TOC entry 4927 (class 2606 OID 17395)
-- Name: ticket_count fk_ticket_count_plate; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_count
    ADD CONSTRAINT fk_ticket_count_plate FOREIGN KEY (plate_number) REFERENCES public.buses(plate_number) ON DELETE CASCADE;


--
-- TOC entry 4928 (class 2606 OID 17390)
-- Name: ticket_count fk_ticket_count_route; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_count
    ADD CONSTRAINT fk_ticket_count_route FOREIGN KEY (route_id) REFERENCES public.routes(id) ON DELETE CASCADE;


--
-- TOC entry 4924 (class 2606 OID 17232)
-- Name: stops stops_route_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stops
    ADD CONSTRAINT stops_route_id_fkey FOREIGN KEY (route_id) REFERENCES public.routes(id) ON DELETE CASCADE;


-- Completed on 2025-09-13 21:40:02

--
-- PostgreSQL database dump complete
--

\unrestrict S8FNXlimlCe7ankwHp8Vzv6QQNlRD5ybCFVEqVG1dXIXebzRelpftJYfuNan19f

