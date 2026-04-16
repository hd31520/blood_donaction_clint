const PUBLIC_DATASET_URL = '/data/location-dataset.json';

const datasetCache = {
  promise: null,
  data: null,
};

const FARIDPUR_SADAR_UNION_NAMES = [
  'Aliabad',
  'Ambikapur',
  'Char Madhabdia',
  'Decreer Char',
  'Greda',
  'Ishan Gopalpur',
  'Kaijuri',
  'Kanaipur',
  'Krishnanagar',
  'Maj Char',
  'Uttar Channel',
];

const FARIDPUR_SADAR_WARDS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

const toLocationItem = (item, extra = {}) => ({
  id: String(item.id),
  name: item.name,
  bnName: item.bnName || '',
  code: item.code || '',
  ...extra,
});

const loadPublicLocationDataset = async () => {
  if (datasetCache.data) {
    return datasetCache.data;
  }

  if (!datasetCache.promise) {
    datasetCache.promise = fetch(PUBLIC_DATASET_URL)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load public location dataset (${response.status})`);
        }

        return response.json();
      })
      .then((data) => {
        datasetCache.data = data;
        return data;
      })
      .catch((error) => {
        datasetCache.promise = null;
        throw error;
      });
  }

  return datasetCache.promise;
};

const findDivisionNode = (dataset, divisionId) => {
  return dataset?.hierarchical?.find((division) => String(division.id) === String(divisionId)) || null;
};

const findDistrictNode = (divisionNode, districtId) => {
  return divisionNode?.districts?.find((district) => String(district.id) === String(districtId)) || null;
};

const findUpazilaNode = (districtNode, upazilaId) => {
  return districtNode?.upazilas?.find((upazila) => String(upazila.id) === String(upazilaId)) || null;
};

const normalizeName = (value = '') => {
  return String(value)
    .toLowerCase()
    .replace(/district|division|city corporation|zila|জেলা|বিভাগ|সিটি কর্পোরেশন/gi, '')
    .replace(/[.,()/-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const isFaridpurSadarContext = ({ upazilaName, upazilaBnName, districtName, districtBnName }) => {
  const normalizedUpazila = normalizeName(upazilaName || upazilaBnName || '');
  const normalizedDistrict = normalizeName(districtName || districtBnName || '');

  return normalizedUpazila === 'faridpur sadar' && normalizedDistrict === 'faridpur';
};

const buildFaridpurSadarUnionFallback = () => {
  return FARIDPUR_SADAR_UNION_NAMES.map((name, index) =>
    toLocationItem(
      {
        id: `faridpur-sadar-union-${index + 1}`,
        name,
        bnName: '',
        code: `FARIDPUR-SADAR-UNION-${String(index + 1).padStart(2, '0')}`,
      },
      {
        areaType: 'union',
      },
    ),
  );
};

const buildFaridpurSadarPouroshavaFallback = () => {
  return FARIDPUR_SADAR_WARDS.map((ward) =>
    toLocationItem(
      {
        id: `faridpur-sadar-ward-${ward}`,
        name: `Ward ${ward}`,
        bnName: '',
        code: `FARIDPUR-SADAR-WARD-${ward}`,
      },
      {
        areaType: 'pouroshava',
      },
    ),
  );
};

const isNumericLike = (value) => /^\d+$/.test(String(value || '').trim());

const resolveUpazilaByCriteria = (dataset, criteria = {}) => {
  const hierarchy = dataset?.hierarchical || [];
  const idCandidate = String(criteria.upazilaId || '').trim();
  const normalizedName = normalizeName(criteria.upazilaName || criteria.upazilaBnName || '');
  const normalizedDistrictName = normalizeName(criteria.districtName || criteria.districtBnName || '');
  const normalizedDivisionName = normalizeName(criteria.divisionName || criteria.divisionBnName || '');

  if (idCandidate && isNumericLike(idCandidate)) {
    for (const divisionNode of hierarchy) {
      for (const districtNode of divisionNode.districts || []) {
        const matchedUpazila = findUpazilaNode(districtNode, idCandidate);
        if (matchedUpazila) {
          return { divisionNode, districtNode, upazilaNode: matchedUpazila };
        }
      }
    }
  }

  if (!normalizedName) {
    return null;
  }

  for (const divisionNode of hierarchy) {
    const divisionName = normalizeName(divisionNode.name);
    const divisionBnName = normalizeName(divisionNode.bnName);
    const matchesDivision =
      !normalizedDivisionName ||
      normalizedDivisionName === divisionName ||
      normalizedDivisionName === divisionBnName;

    if (!matchesDivision) {
      continue;
    }

    for (const districtNode of divisionNode.districts || []) {
      const districtName = normalizeName(districtNode.name);
      const districtBnName = normalizeName(districtNode.bnName);
      const matchesDistrict =
        !normalizedDistrictName ||
        normalizedDistrictName === districtName ||
        normalizedDistrictName === districtBnName;

      if (!matchesDistrict) {
        continue;
      }

      const matchedUpazila = (districtNode.upazilas || []).find((upazila) => {
        const upazilaName = normalizeName(upazila.name);
        const upazilaBnName = normalizeName(upazila.bnName);
        return normalizedName === upazilaName || normalizedName === upazilaBnName;
      });

      if (matchedUpazila) {
        return { divisionNode, districtNode, upazilaNode: matchedUpazila };
      }
    }
  }

  return null;
};

export const getPublicDivisions = async () => {
  const dataset = await loadPublicLocationDataset();
  return (dataset?.hierarchical || []).map((division) => toLocationItem(division));
};

export const getPublicDistrictsByDivisionId = async (divisionId) => {
  const dataset = await loadPublicLocationDataset();
  const divisionNode = findDivisionNode(dataset, divisionId);
  return (divisionNode?.districts || []).map((district) =>
    toLocationItem(district, { divisionId: String(district.divisionId) }),
  );
};

export const getPublicUpazilasByDistrictId = async (districtId) => {
  const dataset = await loadPublicLocationDataset();
  for (const divisionNode of dataset?.hierarchical || []) {
    const districtNode = findDistrictNode(divisionNode, districtId);
    if (!districtNode) {
      continue;
    }

    return (districtNode.upazilas || []).map((upazila) =>
      toLocationItem(upazila, {
        divisionId: String(upazila.divisionId),
        districtId: String(upazila.districtId),
      }),
    );
  }

  return [];
};

export const getPublicUnionsByUpazilaId = async (criteriaOrUpazilaId) => {
  const dataset = await loadPublicLocationDataset();
  const criteria =
    typeof criteriaOrUpazilaId === 'object' && criteriaOrUpazilaId !== null
      ? criteriaOrUpazilaId
      : { upazilaId: criteriaOrUpazilaId };

  const resolved = resolveUpazilaByCriteria(dataset, criteria);

  if (isFaridpurSadarContext(criteria)) {
    return buildFaridpurSadarUnionFallback();
  }

  if (
    resolved?.upazilaNode &&
    isFaridpurSadarContext({
      upazilaName: resolved.upazilaNode.name,
      upazilaBnName: resolved.upazilaNode.bnName,
      districtName: resolved.districtNode?.name,
      districtBnName: resolved.districtNode?.bnName,
    })
  ) {
    return buildFaridpurSadarUnionFallback();
  }

  if (resolved?.upazilaNode) {
    return (resolved.upazilaNode.unions || []).map((union) =>
      toLocationItem(union, {
        divisionId: String(union.divisionId),
        districtId: String(union.districtId),
        upazilaId: String(union.upazilaId),
        areaType: 'union',
      }),
    );
  }

  for (const divisionNode of dataset?.hierarchical || []) {
    for (const districtNode of divisionNode.districts || []) {
      const upazilaNode = findUpazilaNode(districtNode, criteria.upazilaId);
      if (!upazilaNode) {
        continue;
      }

      return (upazilaNode.unions || []).map((union) =>
        toLocationItem(union, {
          divisionId: String(union.divisionId),
          districtId: String(union.districtId),
          upazilaId: String(union.upazilaId),
          areaType: 'union',
        }),
      );
    }
  }

  return [];
};

export const getPublicPouroshavasByUpazilaId = async () => {
  return [];
};

export const getPublicPouroshavasByCriteria = async (criteria = {}) => {
  const dataset = await loadPublicLocationDataset();
  const resolved = resolveUpazilaByCriteria(dataset, criteria);

  if (isFaridpurSadarContext(criteria)) {
    return buildFaridpurSadarPouroshavaFallback();
  }

  if (
    resolved?.upazilaNode &&
    isFaridpurSadarContext({
      upazilaName: resolved.upazilaNode.name,
      upazilaBnName: resolved.upazilaNode.bnName,
      districtName: resolved.districtNode?.name,
      districtBnName: resolved.districtNode?.bnName,
    })
  ) {
    return buildFaridpurSadarPouroshavaFallback();
  }

  return [];
};
