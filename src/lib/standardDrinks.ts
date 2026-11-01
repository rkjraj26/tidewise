import type { Region } from './types';

/** Grams of pure alcohol in one standard drink / unit, by region. */
export const GRAMS_PER_STANDARD: Record<Region, number> = {
  US: 14,
  UK: 8,
  IE: 10,
  CA: 13.45,
  AU: 10,
  NZ: 10,
  IN: 10, // no national definition; WHO reference value
  OTHER: 10,
};

export const STANDARD_LABEL: Record<Region, string> = {
  US: 'standard drink (14 g alcohol)',
  UK: 'unit (8 g alcohol)',
  IE: 'standard drink (10 g alcohol)',
  CA: 'standard drink (13.45 g alcohol)',
  AU: 'standard drink (10 g alcohol)',
  NZ: 'standard drink (10 g alcohol)',
  IN: 'standard drink (10 g alcohol)',
  OTHER: 'standard drink (10 g alcohol)',
};

export const DRINK_WORD: Record<Region, { one: string; many: string }> = {
  US: { one: 'drink', many: 'drinks' },
  UK: { one: 'unit', many: 'units' },
  IE: { one: 'drink', many: 'drinks' },
  CA: { one: 'drink', many: 'drinks' },
  AU: { one: 'drink', many: 'drinks' },
  NZ: { one: 'drink', many: 'drinks' },
  IN: { one: 'drink', many: 'drinks' },
  OTHER: { one: 'drink', many: 'drinks' },
};

const ETHANOL_DENSITY = 0.789; // g per ml

export function gramsOfAlcohol(volumeMl: number, abvPercent: number): number {
  if (!(volumeMl > 0) || !(abvPercent > 0)) return 0;
  return volumeMl * (abvPercent / 100) * ETHANOL_DENSITY;
}

export function standardDrinks(volumeMl: number, abvPercent: number, region: Region): number {
  return gramsOfAlcohol(volumeMl, abvPercent) / GRAMS_PER_STANDARD[region];
}

export function roundHalf(n: number): number {
  return Math.round(n * 2) / 2;
}

export interface DrinkPreset {
  id: string;
  label: string;
  volumeMl: number;
  abv: number;
}

const SPIRIT_ML: Record<Region, number> = { US: 44, CA: 43, UK: 25, IE: 35.5, AU: 30, NZ: 30, IN: 30, OTHER: 30 };

export function presetsFor(region: Region): DrinkPreset[] {
  const shot = SPIRIT_ML[region];
  const list: DrinkPreset[] = [
    { id: 'beer-can', label: 'Can / bottle of beer (330–355 ml, 5%)', volumeMl: 355, abv: 5 },
    { id: 'beer-pint', label: 'Pint of beer (568 ml, 5%)', volumeMl: 568, abv: 5 },
    { id: 'strong-beer', label: 'Strong beer (500 ml, 8%)', volumeMl: 500, abv: 8 },
    { id: 'wine-glass', label: 'Glass of wine (150 ml, 12.5%)', volumeMl: 150, abv: 12.5 },
    { id: 'wine-large', label: 'Large glass of wine (250 ml, 13%)', volumeMl: 250, abv: 13 },
    { id: 'wine-bottle', label: 'Bottle of wine (750 ml, 13%)', volumeMl: 750, abv: 13 },
    { id: 'spirit-shot', label: `Single measure of spirits (${shot} ml, 40%)`, volumeMl: shot, abv: 40 },
    { id: 'spirit-double', label: `Double / large peg (${shot * 2} ml, 40%)`, volumeMl: shot * 2, abv: 40 },
    { id: 'spirit-half', label: 'Half bottle of spirits (375 ml, 40%)', volumeMl: 375, abv: 40 },
    { id: 'spirit-bottle', label: 'Bottle of spirits (750 ml, 40%)', volumeMl: 750, abv: 40 },
    { id: 'cider', label: 'Cider (500 ml, 4.5%)', volumeMl: 500, abv: 4.5 },
    { id: 'seltzer', label: 'Hard seltzer / RTD (355 ml, 5%)', volumeMl: 355, abv: 5 },
  ];
  return list;
}
