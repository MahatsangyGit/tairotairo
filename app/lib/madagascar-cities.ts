/**
 * Communes urbaines de Madagascar : les 76 du décret n°2015-592
 * du 1er avril 2015, reprises par l’INSTAT (RGPH-3) et la liste
 * des communes urbaines (population de référence 2018).
 * Le nom est l’identifiant unique utilisé pour la recherche par ville.
 */
export type MadagascarCity = {
  name: string;
  region: string;
};

export const MADAGASCAR_CITIES: readonly MadagascarCity[] = [
  { name: "Ambalavao", region: "Matsiatra Ambony" },
  { name: "Ambanja", region: "Diana" },
  { name: "Ambatofinandrahana", region: "Amoron'i Mania" },
  { name: "Ambatolampy", region: "Vakinankaratra" },
  { name: "Ambatoboeny", region: "Boeny" },
  { name: "Ambatondrazaka", region: "Alaotra-Mangoro" },
  { name: "Ambilobe", region: "Diana" },
  { name: "Amboasary", region: "Anôsy" },
  { name: "Ambohimahasoa", region: "Matsiatra Ambony" },
  { name: "Ambovombe", region: "Androy" },
  { name: "Ambohidratrimo", region: "Analamanga" },
  { name: "Amparafaravola", region: "Alaotra-Mangoro" },
  { name: "Ambositra", region: "Amoron'i Mania" },
  { name: "Ampanihy", region: "Atsimo-Andrefana" },
  { name: "Analalava", region: "Sofia" },
  { name: "Andapa", region: "Sava" },
  { name: "Andilamena", region: "Alaotra-Mangoro" },
  { name: "Anjozorobe", region: "Analamanga" },
  { name: "Ankazobe", region: "Analamanga" },
  { name: "Antalaha", region: "Sava" },
  { name: "Antananarivo", region: "Analamanga" },
  { name: "Antsirabe", region: "Vakinankaratra" },
  { name: "Antsiranana", region: "Diana" },
  { name: "Antsohihy", region: "Sofia" },
  { name: "Arivonimamo", region: "Itasy" },
  { name: "Bealanana", region: "Sofia" },
  { name: "Befandriana-Avaratra", region: "Sofia" },
  { name: "Besalampy", region: "Melaky" },
  { name: "Betafo", region: "Vakinankaratra" },
  { name: "Betioky", region: "Atsimo-Andrefana" },
  { name: "Betroka", region: "Anôsy" },
  { name: "Boriziny", region: "Sofia" },
  { name: "Fandriana", region: "Amoron'i Mania" },
  { name: "Farafangana", region: "Atsimo-Atsinanana" },
  { name: "Fenoarivo Atsinanana", region: "Analanjirofo" },
  { name: "Fianarantsoa", region: "Matsiatra Ambony" },
  { name: "Ifanadiana", region: "Vatovavy" },
  { name: "Ihosy", region: "Ihorombe" },
  { name: "Ikongo", region: "Fitovinany" },
  { name: "Imerintsiatosika", region: "Itasy" },
  { name: "Maevatanana", region: "Betsiboka" },
  { name: "Mahabo", region: "Menabe" },
  { name: "Mahajanga", region: "Boeny" },
  { name: "Mahanoro", region: "Atsinanana" },
  { name: "Maintirano", region: "Melaky" },
  { name: "Mampikony", region: "Sofia" },
  { name: "Manakara", region: "Fitovinany" },
  { name: "Mananara Avaratra", region: "Ambatosoa" },
  { name: "Mananjary", region: "Vatovavy" },
  { name: "Mandritsara", region: "Sofia" },
  { name: "Manja", region: "Menabe" },
  { name: "Manjakandriana", region: "Analamanga" },
  { name: "Maroantsetra", region: "Ambatosoa" },
  { name: "Marovoay", region: "Boeny" },
  { name: "Miandrivazo", region: "Menabe" },
  { name: "Miarinarivo", region: "Itasy" },
  { name: "Morafeno Bekily", region: "Androy" },
  { name: "Moramanga", region: "Alaotra-Mangoro" },
  { name: "Morombe", region: "Atsimo-Andrefana" },
  { name: "Morondava", region: "Menabe" },
  { name: "Nosy Be", region: "Diana" },
  { name: "Sainte-Marie", region: "Analanjirofo" },
  { name: "Sambava", region: "Sava" },
  { name: "Soalala", region: "Boeny" },
  { name: "Soavinandriana", region: "Itasy" },
  { name: "Taolanaro", region: "Anôsy" },
  { name: "Toamasina", region: "Atsinanana" },
  { name: "Toliara", region: "Atsimo-Andrefana" },
  { name: "Tsaratanana", region: "Betsiboka" },
  { name: "Tsiroanomandidy", region: "Bongolava" },
  { name: "Vangaindrano", region: "Atsimo-Atsinanana" },
  { name: "Vatomandry", region: "Atsinanana" },
  { name: "Vavatenina", region: "Analanjirofo" },
  { name: "Vohemar", region: "Sava" },
  { name: "Vohibinany", region: "Atsinanana" },
  { name: "Vohipeno", region: "Fitovinany" },
] as const;

const CITY_BY_NAME = new Map(
  MADAGASCAR_CITIES.map((city) => [city.name, city])
);

export function madagascarCityId(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function findMadagascarCity(value: string): MadagascarCity | null {
  return CITY_BY_NAME.get(value.trim()) ?? null;
}

export function madagascarCitiesByRegion(): { region: string; cities: MadagascarCity[] }[] {
  const groups = new Map<string, MadagascarCity[]>();
  for (const city of MADAGASCAR_CITIES) {
    const list = groups.get(city.region) ?? [];
    list.push(city);
    groups.set(city.region, list);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "fr"))
    .map(([region, cities]) => ({
      region,
      cities: [...cities].sort((a, b) => a.name.localeCompare(b.name, "fr")),
    }));
}
