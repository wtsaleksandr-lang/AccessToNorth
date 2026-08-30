/**
 * Conservative tariff-treatment eligibility used by the estimator.
 *
 * Only agreements that can be mapped confidently are included here. Developing-
 * country programs change more often and have additional eligibility conditions,
 * so countries not listed for a preferential treatment safely fall back to MFN.
 * The calculator still requires the importer to confirm rules-of-origin eligibility
 * before any preferential rate is used.
 */
export const TARIFF_TREATMENTS: Record<string, string> = {
  MFN: "Most Favoured Nation",
  AUT: "Australia Tariff",
  NZT: "New Zealand Tariff",
  CCCT: "Commonwealth Caribbean Countries Tariff",
  LDCT: "Least Developed Country Tariff",
  GPT: "General Preferential Tariff",
  UST: "United States Tariff (CUSMA)",
  MXT: "Mexico Tariff (CUSMA)",
  CIAT: "Canada-Israel Agreement Tariff",
  CT: "Chile Tariff",
  CRT: "Costa Rica Tariff",
  IT: "Iceland Tariff",
  NT: "Norway Tariff",
  SLT: "Switzerland-Liechtenstein Tariff",
  PT: "Peru Tariff",
  COLT: "Colombia Tariff",
  JT: "Jordan Tariff",
  PAT: "Panama Tariff",
  HNT: "Honduras Tariff",
  KRT: "Korea Tariff",
  CEUT: "Canada-European Union Tariff (CETA)",
  CPTPT: "Comprehensive and Progressive Trans-Pacific Partnership Tariff",
  UKT: "Canada-United Kingdom Tariff (CUKTCA)",
  UAT: "Canada-Ukraine Tariff",
  "General Tariff": "General Tariff",
};

const EU = [
  "Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czech Republic",
  "Denmark", "Estonia", "Finland", "France", "Germany", "Greece", "Hungary",
  "Ireland", "Italy", "Latvia", "Lithuania", "Luxembourg", "Malta",
  "Netherlands", "Poland", "Portugal", "Romania", "Slovakia", "Slovenia",
  "Spain", "Sweden",
] as const;

const CCCT = [
  "Anguilla", "Antigua and Barbuda", "Bahamas", "Barbados", "Belize",
  "Bermuda", "British Virgin Islands", "Cayman Islands", "Dominica", "Grenada",
  "Guyana", "Jamaica", "Montserrat", "Saint Kitts and Nevis", "Saint Lucia",
  "Saint Vincent and the Grenadines", "Trinidad and Tobago", "Turks and Caicos Islands",
] as const;

const BASE_COUNTRIES = [
  "Argentina", "Bangladesh", "Brazil", "Cambodia", "China", "Egypt", "Ethiopia",
  "Ghana", "Haiti", "India", "Indonesia", "Kenya", "Morocco", "Myanmar",
  "Nigeria", "Pakistan", "Philippines", "Russia", "Saudi Arabia", "South Africa",
  "Sri Lanka", "Taiwan", "Tanzania", "Thailand", "Turkey", "United Arab Emirates",
] as const;

export const COUNTRY_TREATMENTS: Record<string, string[]> = Object.fromEntries(
  [...EU, ...CCCT, ...BASE_COUNTRIES].map((country) => [country, ["MFN"]]),
);

for (const country of EU) COUNTRY_TREATMENTS[country] = ["MFN", "CEUT"];
for (const country of CCCT) COUNTRY_TREATMENTS[country] = ["MFN", "CCCT"];

for (const country of ["Egypt", "Ghana", "Kenya", "Morocco", "Nigeria", "Pakistan", "Philippines", "Sri Lanka"] as const) {
  COUNTRY_TREATMENTS[country] = ["MFN", "GPT"];
}
for (const country of ["Bangladesh", "Cambodia", "Ethiopia", "Haiti", "Myanmar", "Tanzania"] as const) {
  COUNTRY_TREATMENTS[country] = ["MFN", "GPT", "LDCT"];
}

Object.assign(COUNTRY_TREATMENTS, {
  "United States": ["MFN", "UST"],
  Mexico: ["MFN", "MXT", "CPTPT"],
  Japan: ["MFN", "CPTPT"],
  Australia: ["MFN", "AUT", "CPTPT"],
  "New Zealand": ["MFN", "NZT", "CPTPT"],
  "South Korea": ["MFN", "KRT"],
  Vietnam: ["MFN", "CPTPT"],
  Malaysia: ["MFN", "CPTPT"],
  Singapore: ["MFN", "CPTPT"],
  Brunei: ["MFN", "CPTPT"],
  Peru: ["MFN", "PT", "CPTPT"],
  Chile: ["MFN", "CT", "CPTPT"],
  "United Kingdom": ["MFN", "UKT", "CPTPT"],
  Israel: ["MFN", "CIAT"],
  Colombia: ["MFN", "COLT"],
  "Costa Rica": ["MFN", "CRT"],
  Panama: ["MFN", "PAT"],
  Honduras: ["MFN", "HNT"],
  Jordan: ["MFN", "JT"],
  Iceland: ["MFN", "IT"],
  Norway: ["MFN", "NT"],
  Switzerland: ["MFN", "SLT"],
  Liechtenstein: ["MFN", "SLT"],
  Ukraine: ["MFN", "UAT"],
  Russia: ["General Tariff"],
  Belarus: ["General Tariff"],
  "Other / Unknown": ["MFN"],
});

export const TREATMENT_COLUMNS = Object.keys(TARIFF_TREATMENTS);

export const TARIFF_DATA_MINIMUMS = {
  classifications: 18_000,
  countries: 90,
} as const;
