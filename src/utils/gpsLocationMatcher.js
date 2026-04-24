import {
  getPublicDistrictsByDivisionId,
  getPublicDivisions,
  getPublicPouroshavasByCriteria,
  getPublicUnionsByUpazilaId,
  getPublicUpazilasByDistrictId,
} from '../services/locationDataset.js';

const LOCATION_ALIASES = [
  [/\bchittagong\b/g, 'chattogram'],
  [/\bchattagram\b/g, 'chattogram'],
  [/চট্টগ্রাম/g, 'chattogram'],
  [/\bbarisal\b/g, 'barishal'],
  [/বরিশাল/g, 'barishal'],
  [/\bmymenshingh\b/g, 'mymensingh'],
  [/\bfaridpur sadar\b/g, 'faridpur'],
  [/\bsadar\b/g, ''],
  [/\bunion\b/g, ''],
  [/\bupazila\b/g, ''],
  [/\bpouroshava\b/g, ''],
  [/\bpourashava\b/g, ''],
  [/\bmunicipality\b/g, ''],
  [/ইউনিয়ন/g, ''],
  [/উপজেলা/g, ''],
  [/পৌরসভা/g, ''],
  [/সদর/g, ''],
];

export const normalizeLocationText = (value = '') => {
  const cleaned = String(value || '')
    .toLowerCase()
    .replace(/district|division|city corporation|zila|জেলা|বিভাগ|সিটি কর্পোরেশন/gi, '')
    .replace(/[.,()/_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return LOCATION_ALIASES.reduce((current, [pattern, replacement]) => current.replace(pattern, replacement), cleaned)
    .replace(/\s+/g, ' ')
    .trim();
};

const uniqueCandidates = (values = []) => [...new Set(values.map(normalizeLocationText).filter(Boolean))];

const scoreItem = (item, candidates) => {
  const names = uniqueCandidates([item?.name, item?.bnName]);
  let score = 0;

  for (const candidate of candidates) {
    for (const name of names) {
      if (!candidate || !name) continue;
      if (candidate === name) score = Math.max(score, 100);
      else if (candidate.includes(name) || name.includes(candidate)) score = Math.max(score, 70);
      else if (candidate.split(' ').some((part) => part.length > 3 && name.includes(part))) score = Math.max(score, 35);
    }
  }

  return score;
};

const findBestMatch = (items, candidates, minScore = 60) => {
  let best = null;
  let bestScore = 0;

  for (const item of items || []) {
    const score = scoreItem(item, candidates);
    if (score > bestScore) {
      best = item;
      bestScore = score;
    }
  }

  return bestScore >= minScore ? best : null;
};

export const buildReverseGeocodeCandidates = (address = {}) => ({
  division: uniqueCandidates([address.state, address.region]),
  district: uniqueCandidates([
    address.state_district,
    address.county,
    address.city,
    address.city_district,
    address.municipality,
    address.town,
  ]),
  upazila: uniqueCandidates([
    address.county,
    address.city,
    address.city_district,
    address.municipality,
    address.town,
    address.suburb,
  ]),
  union: uniqueCandidates([
    address.village,
    address.hamlet,
    address.suburb,
    address.neighbourhood,
    address.quarter,
    address.municipality,
    address.town,
    address.city,
    address.road,
  ]),
});

export const matchGpsAddressToBangladeshLocation = async (address = {}) => {
  const candidates = buildReverseGeocodeCandidates(address);
  const divisions = await getPublicDivisions();
  const division = findBestMatch(divisions, candidates.division, 50);

  if (!division) return { matched: false, reason: 'division_not_found', candidates };

  const districts = await getPublicDistrictsByDivisionId(division.id);
  const district = findBestMatch(districts, candidates.district, 50);

  if (!district) return { matched: false, reason: 'district_not_found', division, candidates };

  const upazilas = await getPublicUpazilasByDistrictId(district.id);
  const upazila = findBestMatch(upazilas, candidates.upazila, 45) || findBestMatch(upazilas, candidates.district, 45);

  if (!upazila) return { matched: false, reason: 'upazila_not_found', division, district, candidates };

  const [unions, pouroshavas] = await Promise.all([
    getPublicUnionsByUpazilaId({
      upazilaId: upazila.id,
      upazilaName: upazila.name,
      upazilaBnName: upazila.bnName,
      districtName: district.name,
      districtBnName: district.bnName,
      divisionName: division.name,
      divisionBnName: division.bnName,
    }),
    getPublicPouroshavasByCriteria({
      upazilaId: upazila.id,
      upazilaName: upazila.name,
      upazilaBnName: upazila.bnName,
      districtName: district.name,
      districtBnName: district.bnName,
      divisionName: division.name,
      divisionBnName: division.bnName,
    }),
  ]);

  const union = findBestMatch(unions, candidates.union, 45);
  const pouroshava = findBestMatch(pouroshavas, candidates.union, 45);
  const area = union || pouroshava || null;

  return {
    matched: true,
    division,
    district,
    upazila,
    area,
    areaType: area?.areaType || (pouroshava ? 'pouroshava' : union ? 'union' : ''),
    unionId: area?.id || '',
    unionName: area?.name || candidates.union[0] || '',
    confidence: area ? 'high' : 'upazila_only',
    candidates,
  };
};
