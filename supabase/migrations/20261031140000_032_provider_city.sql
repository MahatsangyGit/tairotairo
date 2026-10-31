/*
# Villes prestataire

Référentiel unique des 76 communes urbaines (décret n°2015-592 du 1er avril 2015,
INSTAT RGPH-3). Le nom est la clé de recherche par ville.
*/

CREATE TABLE IF NOT EXISTS "MadagascarCity" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "region" TEXT NOT NULL,
  CONSTRAINT "MadagascarCity_name_key" UNIQUE ("name")
);

INSERT INTO "MadagascarCity" ("id", "name", "region")
VALUES
  ('ambalavao', 'Ambalavao', 'Matsiatra Ambony'),
  ('ambanja', 'Ambanja', 'Diana'),
  ('ambatofinandrahana', 'Ambatofinandrahana', 'Amoron''i Mania'),
  ('ambatolampy', 'Ambatolampy', 'Vakinankaratra'),
  ('ambatoboeny', 'Ambatoboeny', 'Boeny'),
  ('ambatondrazaka', 'Ambatondrazaka', 'Alaotra-Mangoro'),
  ('ambilobe', 'Ambilobe', 'Diana'),
  ('amboasary', 'Amboasary', 'Anôsy'),
  ('ambohimahasoa', 'Ambohimahasoa', 'Matsiatra Ambony'),
  ('ambovombe', 'Ambovombe', 'Androy'),
  ('ambohidratrimo', 'Ambohidratrimo', 'Analamanga'),
  ('amparafaravola', 'Amparafaravola', 'Alaotra-Mangoro'),
  ('ambositra', 'Ambositra', 'Amoron''i Mania'),
  ('ampanihy', 'Ampanihy', 'Atsimo-Andrefana'),
  ('analalava', 'Analalava', 'Sofia'),
  ('andapa', 'Andapa', 'Sava'),
  ('andilamena', 'Andilamena', 'Alaotra-Mangoro'),
  ('anjozorobe', 'Anjozorobe', 'Analamanga'),
  ('ankazobe', 'Ankazobe', 'Analamanga'),
  ('antalaha', 'Antalaha', 'Sava'),
  ('antananarivo', 'Antananarivo', 'Analamanga'),
  ('antsirabe', 'Antsirabe', 'Vakinankaratra'),
  ('antsiranana', 'Antsiranana', 'Diana'),
  ('antsohihy', 'Antsohihy', 'Sofia'),
  ('arivonimamo', 'Arivonimamo', 'Itasy'),
  ('bealanana', 'Bealanana', 'Sofia'),
  ('befandriana-avaratra', 'Befandriana-Avaratra', 'Sofia'),
  ('besalampy', 'Besalampy', 'Melaky'),
  ('betafo', 'Betafo', 'Vakinankaratra'),
  ('betioky', 'Betioky', 'Atsimo-Andrefana'),
  ('betroka', 'Betroka', 'Anôsy'),
  ('boriziny', 'Boriziny', 'Sofia'),
  ('fandriana', 'Fandriana', 'Amoron''i Mania'),
  ('farafangana', 'Farafangana', 'Atsimo-Atsinanana'),
  ('fenoarivo-atsinanana', 'Fenoarivo Atsinanana', 'Analanjirofo'),
  ('fianarantsoa', 'Fianarantsoa', 'Matsiatra Ambony'),
  ('ifanadiana', 'Ifanadiana', 'Vatovavy'),
  ('ihosy', 'Ihosy', 'Ihorombe'),
  ('ikongo', 'Ikongo', 'Fitovinany'),
  ('imerintsiatosika', 'Imerintsiatosika', 'Itasy'),
  ('maevatanana', 'Maevatanana', 'Betsiboka'),
  ('mahabo', 'Mahabo', 'Menabe'),
  ('mahajanga', 'Mahajanga', 'Boeny'),
  ('mahanoro', 'Mahanoro', 'Atsinanana'),
  ('maintirano', 'Maintirano', 'Melaky'),
  ('mampikony', 'Mampikony', 'Sofia'),
  ('manakara', 'Manakara', 'Fitovinany'),
  ('mananara-avaratra', 'Mananara Avaratra', 'Ambatosoa'),
  ('mananjary', 'Mananjary', 'Vatovavy'),
  ('mandritsara', 'Mandritsara', 'Sofia'),
  ('manja', 'Manja', 'Menabe'),
  ('manjakandriana', 'Manjakandriana', 'Analamanga'),
  ('maroantsetra', 'Maroantsetra', 'Ambatosoa'),
  ('marovoay', 'Marovoay', 'Boeny'),
  ('miandrivazo', 'Miandrivazo', 'Menabe'),
  ('miarinarivo', 'Miarinarivo', 'Itasy'),
  ('morafeno-bekily', 'Morafeno Bekily', 'Androy'),
  ('moramanga', 'Moramanga', 'Alaotra-Mangoro'),
  ('morombe', 'Morombe', 'Atsimo-Andrefana'),
  ('morondava', 'Morondava', 'Menabe'),
  ('nosy-be', 'Nosy Be', 'Diana'),
  ('sainte-marie', 'Sainte-Marie', 'Analanjirofo'),
  ('sambava', 'Sambava', 'Sava'),
  ('soalala', 'Soalala', 'Boeny'),
  ('soavinandriana', 'Soavinandriana', 'Itasy'),
  ('taolanaro', 'Taolanaro', 'Anôsy'),
  ('toamasina', 'Toamasina', 'Atsinanana'),
  ('toliara', 'Toliara', 'Atsimo-Andrefana'),
  ('tsaratanana', 'Tsaratanana', 'Betsiboka'),
  ('tsiroanomandidy', 'Tsiroanomandidy', 'Bongolava'),
  ('vangaindrano', 'Vangaindrano', 'Atsimo-Atsinanana'),
  ('vatomandry', 'Vatomandry', 'Atsinanana'),
  ('vavatenina', 'Vavatenina', 'Analanjirofo'),
  ('vohemar', 'Vohemar', 'Sava'),
  ('vohibinany', 'Vohibinany', 'Atsinanana'),
  ('vohipeno', 'Vohipeno', 'Fitovinany')
ON CONFLICT ("id") DO NOTHING;

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "providerCityId" TEXT;

DO $$ BEGIN
  ALTER TABLE "User"
    ADD CONSTRAINT "User_providerCityId_fkey"
    FOREIGN KEY ("providerCityId") REFERENCES "MadagascarCity"("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "User_providerCityId_idx" ON "User" ("providerCityId");

DO $$ BEGIN
  GRANT SELECT, INSERT, UPDATE, DELETE ON "MadagascarCity" TO tairo_app;
EXCEPTION WHEN undefined_object THEN NULL; END $$;

ALTER TABLE "MadagascarCity" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS madagascar_city_select ON "MadagascarCity";
CREATE POLICY madagascar_city_select ON "MadagascarCity"
  FOR SELECT USING (true);

DROP POLICY IF EXISTS madagascar_city_write ON "MadagascarCity";
CREATE POLICY madagascar_city_write ON "MadagascarCity"
  FOR ALL
  USING (app.bypass_rls() OR app.is_admin())
  WITH CHECK (app.bypass_rls() OR app.is_admin());
