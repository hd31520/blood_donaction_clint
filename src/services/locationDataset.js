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

export const getPublicUnionsByUpazilaId = async (upazilaId) => {
  const dataset = await loadPublicLocationDataset();

  for (const divisionNode of dataset?.hierarchical || []) {
    for (const districtNode of divisionNode.districts || []) {
      const upazilaNode = findUpazilaNode(districtNode, upazilaId);
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
