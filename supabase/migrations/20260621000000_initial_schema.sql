-- ============================================================
-- profiles
-- ============================================================
CREATE TABLE profiles (
  id             UUID        REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name   TEXT,
  calorie_goal   INTEGER     NOT NULL DEFAULT 2000,
  protein_goal   INTEGER     NOT NULL DEFAULT 150,
  carbs_goal     INTEGER     NOT NULL DEFAULT 250,
  fat_goal       INTEGER     NOT NULL DEFAULT 65,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own profile"
  ON profiles FOR ALL USING (auth.uid() = id);

-- ============================================================
-- food_entries
-- ============================================================
CREATE TABLE food_entries (
  id               UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID         REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  logged_date      DATE         NOT NULL DEFAULT CURRENT_DATE,
  meal_type        TEXT         CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  food_name        TEXT         NOT NULL,
  calories         NUMERIC(8,2) NOT NULL,
  protein          NUMERIC(8,2) NOT NULL DEFAULT 0,
  carbs            NUMERIC(8,2) NOT NULL DEFAULT 0,
  fat              NUMERIC(8,2) NOT NULL DEFAULT 0,
  serving_size     TEXT,
  serving_qty      NUMERIC(8,2) NOT NULL DEFAULT 1,
  source           TEXT         NOT NULL CHECK (source IN ('api', 'custom')),
  external_food_id TEXT,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX food_entries_user_date_idx ON food_entries (user_id, logged_date);

ALTER TABLE food_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own entries"
  ON food_entries FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- custom_foods
-- ============================================================
CREATE TABLE custom_foods (
  id                   UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id              UUID         REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name                 TEXT         NOT NULL,
  calories_per_serving NUMERIC(8,2) NOT NULL,
  protein_per_serving  NUMERIC(8,2) NOT NULL DEFAULT 0,
  carbs_per_serving    NUMERIC(8,2) NOT NULL DEFAULT 0,
  fat_per_serving      NUMERIC(8,2) NOT NULL DEFAULT 0,
  serving_size         TEXT,
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE custom_foods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own custom foods"
  ON custom_foods FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- Trigger: auto-create profile row on new user signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
