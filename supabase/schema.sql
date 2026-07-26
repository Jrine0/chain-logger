-- ─── Organizations ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.organizations (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by  UUID NOT NULL REFERENCES auth.users(id)
);

CREATE INDEX idx_organizations_slug ON public.organizations(slug);

-- ─── Members ──────────────────────────────────────────────────────

CREATE TYPE public.member_role AS ENUM ('admin', 'finance', 'vendor', 'viewer');

CREATE TABLE IF NOT EXISTS public.members (
  id           BIGSERIAL PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id       BIGINT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role         public.member_role NOT NULL DEFAULT 'viewer',
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, org_id)
);

CREATE INDEX idx_members_org_id ON public.members(org_id);
CREATE INDEX idx_members_user_id ON public.members(user_id);

-- ─── Profiles (extends auth.users) ────────────────────────────────

CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT DEFAULT '',
  website       TEXT DEFAULT '',
  country       TEXT DEFAULT '',
  wallet_address TEXT DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── RLS Policies ─────────────────────────────────────────────────

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Organizations: admins can read/write, members can read
CREATE POLICY "Admins manage orgs"
  ON public.organizations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.members
      WHERE members.org_id = organizations.id
        AND members.user_id = auth.uid()
        AND members.role = 'admin'
    )
  );

CREATE POLICY "Members read orgs"
  ON public.organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.members
      WHERE members.org_id = organizations.id
        AND members.user_id = auth.uid()
    )
  );

-- Members: admins manage, members read their org
CREATE POLICY "Admins manage members"
  ON public.members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.members m2
      WHERE m2.org_id = members.org_id
        AND m2.user_id = auth.uid()
        AND m2.role = 'admin'
    )
  );

CREATE POLICY "Members read own org"
  ON public.members FOR SELECT
  USING (
    members.user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.members m2
      WHERE m2.org_id = members.org_id
        AND m2.user_id = auth.uid()
    )
  );

-- Profiles: users manage their own
CREATE POLICY "Users manage own profile"
  ON public.profiles FOR ALL
  USING (auth.uid() = id);

-- ─── Auto-create profile on signup ────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── Storage (for org logos) ─────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('org-logos', 'org-logos', true, 5242880)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public org logos are viewable by everyone"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'org-logos');

CREATE POLICY "Authenticated users can upload org logos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'org-logos'
    AND auth.uid() IS NOT NULL
  );
