export const REGIONS_PROVINCES: Record<string, string[]> = {
  "Tanger-Tétouan-Al Hoceïma": [
    "Tanger-Assilah",
    "Fahs-Anjra",
    "Larache",
    "Al Hoceïma",
    "Chefchaouen",
    "Tétouan",
    "Ouezzane",
    "M'diq-Fnideq",
  ],
  "L'Oriental": [
    "Oujda-Angad",
    "Nador",
    "Driouch",
    "Jerada",
    "Berkane",
    "Taourirt",
    "Guercif",
    "Figuig",
  ],
  "Fès-Meknès": [
    "Fès",
    "Meknès",
    "El Hajeb",
    "Ifrane",
    "Moulay Yacoub",
    "Sefrou",
    "Boulemane",
    "Taounate",
    "Taza",
  ],
  "Rabat-Salé-Kénitra": [
    "Rabat",
    "Salé",
    "Skhirate-Témara",
    "Kénitra",
    "Khémisset",
    "Sidi Kacem",
    "Sidi Slimane",
  ],
  "Béni Mellal-Khénifra": [
    "Béni Mellal",
    "Azilal",
    "Fquih Ben Salah",
    "Khénifra",
    "Khouribga",
  ],
  "Casablanca-Settat": [
    "Casablanca",
    "Mohammadia",
    "El Jadida",
    "Benslimane",
    "Berrechid",
    "Médiouna",
    "Nouaceur",
    "Settat",
    "Sidi Bennour",
  ],
  "Marrakech-Safi": [
    "Marrakech",
    "Al Haouz",
    "Chichaoua",
    "El Kelâa des Sraghna",
    "Essaouira",
    "Rehamna",
    "Safi",
    "Youssoufia",
  ],
  "Drâa-Tafilalet": [
    "Errachidia",
    "Ouarzazate",
    "Midelt",
    "Tinghir",
    "Zagora",
  ],
  "Souss-Massa": [
    "Agadir-Ida-Ou-Tanane",
    "Inezgane-Aït Melloul",
    "Chtouka-Aït Baha",
    "Taroudannt",
    "Tiznit",
    "Tata",
  ],
  "Guelmim-Oued Noun": [
    "Guelmim",
    "Assa-Zag",
    "Tan-Tan",
    "Sidi Ifni",
  ],
  "Laâyoune-Sakia El Hamra": [
    "Laâyoune",
    "Boujdour",
    "Tarfaya",
    "Es-Semara",
  ],
  "Dakhla-Oued Ed-Dahab": [
    "Oued Ed-Dahab",
    "Aousserd",
  ],
};

export const REGIONS = Object.keys(REGIONS_PROVINCES);

export const PROVINCES = Object.values(REGIONS_PROVINCES).flat();

export const getProvincesByRegion = (region: string): string[] => {
  return REGIONS_PROVINCES[region] || [];
};

export const getRegionByProvince = (province: string): string | undefined => {
  return REGIONS.find((r) => REGIONS_PROVINCES[r].includes(province));
};
