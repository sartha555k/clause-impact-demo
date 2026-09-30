import type { Business, Clause } from "./types";

export const REGULATION = {
  code: "DSAO",
  name: "Digital Services Accountability Ordinance",
  note: "A fully fictional regulation invented for this demo. Not legal advice.",
};

export const CLAUSES: Clause[] = [
  {
    key: "3a",
    label: "§3(a)",
    title: "Scope threshold",
    current_text:
      "This Ordinance applies to every business with 50 or more employees or annual revenue exceeding €10 million.",
    amended_text:
      "This Ordinance applies to every business with 20 or more employees or annual revenue exceeding €5 million, provided the business processes personal data.",
  },
  {
    key: "5b",
    label: "§5(b)",
    title: "Cross-border transfers",
    current_text:
      "A business that transfers customer data outside the Union must register each transfer within 30 days.",
    amended_text:
      "A business that transfers customer data outside the Union, or engages a third-party processor that does so, must register each transfer within 30 days.",
  },
  {
    key: "9c",
    label: "§9(c)",
    title: "Reporting duty",
    current_text:
      "Every business within the scope of this Ordinance must file a compliance report each quarter.",
    amended_text:
      "Every business within the scope of this Ordinance must file a compliance report each quarter, except businesses incorporated within the last 3 years.",
  },
];

export const BUSINESSES: Business[] = [
  {
    id: "northwind",
    name: "Northwind Analytics",
    tagline: "B2B analytics platform",
    employees: 85,
    revenue_eur_m: 12,
    founded_year: 2015,
    processes_personal_data: true,
    cross_border_transfers: true,
    uses_third_party_processors: false,
  },
  {
    id: "fernleaf",
    name: "Fernleaf Groceries",
    tagline: "Online grocery with a loyalty app",
    employees: 30,
    revenue_eur_m: 4,
    founded_year: 2024,
    processes_personal_data: true,
    cross_border_transfers: false,
    uses_third_party_processors: true,
  },
  {
    id: "cobalt",
    name: "Cobalt Robotics",
    tagline: "Warehouse robotics hardware",
    employees: 45,
    revenue_eur_m: 8,
    founded_year: 2019,
    processes_personal_data: false,
    cross_border_transfers: false,
    uses_third_party_processors: true,
  },
  {
    id: "halloway",
    name: "Halloway Health",
    tagline: "Regional clinic network",
    employees: 120,
    revenue_eur_m: 20,
    founded_year: 2011,
    processes_personal_data: true,
    cross_border_transfers: true,
    uses_third_party_processors: true,
  },
  {
    id: "pinewood",
    name: "Pinewood Studios",
    tagline: "Independent game studio",
    employees: 15,
    revenue_eur_m: 2,
    founded_year: 2023,
    processes_personal_data: true,
    cross_border_transfers: false,
    uses_third_party_processors: false,
  },
  {
    id: "quarry",
    name: "Quarry & Finch",
    tagline: "Fast-growing logistics scale-up",
    employees: 60,
    revenue_eur_m: 9,
    founded_year: 2024,
    processes_personal_data: false,
    cross_border_transfers: true,
    uses_third_party_processors: false,
  },
];
