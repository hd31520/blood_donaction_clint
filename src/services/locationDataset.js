const PUBLIC_DATASET_URL = '/data/location-dataset.json';

const datasetCache = {
  promise: null,
  data: null,
};

const toLocationItem = (item, extra = {}) => ({
  id: String(item.id),
  name: item.name,
  bnName: item.bnName || '',
  code: item.code || '',
  externalId: item.externalId || item.id,
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
    .replace(/district|division|city corporation|zila|জেলা|বিভাগ|সিটি কর্পোরেশন|upazila|উপজেলা/gi, '')
    .replace(/[.,()/-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const isNumericLike = (value) => /^\d+$/.test(String(value || '').trim());

const getAreaType = (item = {}) => {
  if (item.areaType === 'pouroshava' || item.areaType === 'union') {
    return item.areaType;
  }

  const content = `${item.name || ''} ${item.bnName || ''} ${item.code || ''}`.toLowerCase();
  return /pouroshava|pourashava|municipality|পৌরসভা/.test(content) ? 'pouroshava' : 'union';
};

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

const mapAreasByType = (upazilaNode, areaType) => {
  return (upazilaNode?.unions || [])
    .filter((area) => getAreaType(area) === areaType)
    .map((area) =>
      toLocationItem(area, {
        divisionId: String(area.divisionId || upazilaNode.divisionId || ''),
        districtId: String(area.districtId || upazilaNode.districtId || ''),
        upazilaId: String(area.upazilaId || upazilaNode.id || ''),
        areaType,
      }),
    );
};

export const getPublicDivisions = async () => {
  const dataset = await loadPublicLocationDataset();
  return (dataset?.hierarchical || []).map((division) => toLocationItem(division));
};

export const getPublicDistrictsByDivisionId = async (divisionId) => {
  const dataset = await loadPublicLocationDataset();
  const divisionNode = findDivisionNode(dataset, divisionId);
  return (divisionNode?.districts || []).map((district) =>
    toLocationItem(district, { divisionId: String(district.divisionId || divisionNode.id) }),
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
        divisionId: String(upazila.divisionId || divisionNode.id),
        districtId: String(upazila.districtId || districtNode.id),
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
  return mapAreasByType(resolved?.upazilaNode, 'union');
};

export const getPublicPouroshavasByUpazilaId = async (upazilaId) => {
  const dataset = await loadPublicLocationDataset();
  const resolved = resolveUpazilaByCriteria(dataset, { upazilaId });
  return mapAreasByType(resolved?.upazilaNode, 'pouroshava');
};

export const getPublicPouroshavasByCriteria = async (criteria = {}) => {
  const dataset = await loadPublicLocationDataset();
  const resolved = resolveUpazilaByCriteria(dataset, criteria);
  return mapAreasByType(resolved?.upazilaNode, 'pouroshava');
};
