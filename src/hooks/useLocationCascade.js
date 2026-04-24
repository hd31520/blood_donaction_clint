import { useCallback, useEffect, useRef, useState } from 'react';

import { cachedGet } from '../services/apiClient.js';
import {
  getPublicDistrictsByDivisionId,
  getPublicDivisions,
  getPublicPouroshavasByCriteria,
  getPublicUnionsByUpazilaId,
  getPublicUpazilasByDistrictId,
} from '../services/locationDataset.js';

const cache = {
  divisions: null,
  districtsByDivision: new Map(),
  upazilasByDistrict: new Map(),
  unionsByUpazila: new Map(),
  pouroshavasByUpazila: new Map(),
};

const apiGet = async (url) => {
  const response = await cachedGet(url, { ttlMs: 5 * 60 * 1000 });
  return response?.data?.data || [];
};

const preferPublicDataset = async (publicLoader, apiLoader) => {
  try {
    const publicData = await publicLoader();
    if (Array.isArray(publicData) && publicData.length > 0) {
      return publicData;
    }
  } catch (error) {
    console.warn('[LocationCascade] public dataset unavailable, trying API', error);
  }

  try {
    return await apiLoader();
  } catch (error) {
    console.warn('[LocationCascade] API location fallback failed', error);
    return [];
  }
};

export const useLocationCascade = () => {
  const [divisions, setDivisions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [upazilas, setUpazilas] = useState([]);
  const [unions, setUnions] = useState([]);
  const [pouroshavas, setPouroshavas] = useState([]);

  const [selectedDivision, setSelectedDivision] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedUpazilaId, setSelectedUpazilaId] = useState('');
  const [selectedAreaType, setSelectedAreaType] = useState('');
  const [selectedUnion, setSelectedUnion] = useState('');

  const [isLoadingDivisions, setIsLoadingDivisions] = useState(true);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingUpazilas, setIsLoadingUpazilas] = useState(false);
  const [isLoadingUnions, setIsLoadingUnions] = useState(false);
  const [isLoadingPouroshavas, setIsLoadingPouroshavas] = useState(false);
  const [hasLoadedUnions, setHasLoadedUnions] = useState(false);
  const [hasLoadedPouroshavas, setHasLoadedPouroshavas] = useState(false);
  const [error, setError] = useState('');

  const requestSeq = useRef({ division: 0, district: 0, upazila: 0, union: 0, pouroshava: 0 });

  const loadDivisions = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && cache.divisions) {
      setDivisions(cache.divisions);
      setIsLoadingDivisions(false);
      return;
    }

    setIsLoadingDivisions(true);
    setError('');

    const data = await preferPublicDataset(
      getPublicDivisions,
      () => apiGet('/locations/divisions'),
    );

    cache.divisions = data;
    setDivisions(data);
    setIsLoadingDivisions(false);
  }, []);

  const loadDistricts = useCallback(async (divisionId, forceRefresh = false) => {
    if (!divisionId) return;
    const seq = requestSeq.current.district + 1;
    requestSeq.current.district = seq;

    if (!forceRefresh && cache.districtsByDivision.has(divisionId)) {
      setDistricts(cache.districtsByDivision.get(divisionId));
      setIsLoadingDistricts(false);
      return;
    }

    setIsLoadingDistricts(true);
    setError('');

    const data = await preferPublicDataset(
      () => getPublicDistrictsByDivisionId(divisionId),
      () => apiGet(`/locations/divisions/${divisionId}/districts`),
    );

    if (seq !== requestSeq.current.district) return;
    cache.districtsByDivision.set(divisionId, data);
    setDistricts(data);
    setIsLoadingDistricts(false);
  }, []);

  const loadUpazilas = useCallback(async (districtId, forceRefresh = false) => {
    if (!districtId) return;
    const seq = requestSeq.current.upazila + 1;
    requestSeq.current.upazila = seq;

    if (!forceRefresh && cache.upazilasByDistrict.has(districtId)) {
      setUpazilas(cache.upazilasByDistrict.get(districtId));
      setIsLoadingUpazilas(false);
      return;
    }

    setIsLoadingUpazilas(true);
    setError('');

    const data = await preferPublicDataset(
      () => getPublicUpazilasByDistrictId(districtId),
      () => apiGet(`/locations/districts/${districtId}/upazilas`),
    );

    if (seq !== requestSeq.current.upazila) return;
    cache.upazilasByDistrict.set(districtId, data);
    setUpazilas(data);
    setIsLoadingUpazilas(false);
  }, []);

  const loadAreas = useCallback(async (upazilaId, forceRefresh = false) => {
    if (!upazilaId) return;
    const unionSeq = requestSeq.current.union + 1;
    const pouroSeq = requestSeq.current.pouroshava + 1;
    requestSeq.current.union = unionSeq;
    requestSeq.current.pouroshava = pouroSeq;

    const upazilaNode = upazilas.find((item) => item.id === upazilaId) || null;
    const districtNode = districts.find((item) => item.id === selectedDistrict) || null;
    const divisionNode = divisions.find((item) => item.id === selectedDivision) || null;
    const criteria = {
      upazilaId,
      upazilaName: upazilaNode?.name,
      upazilaBnName: upazilaNode?.bnName,
      districtName: districtNode?.name,
      districtBnName: districtNode?.bnName,
      divisionName: divisionNode?.name,
      divisionBnName: divisionNode?.bnName,
    };

    setIsLoadingUnions(true);
    setIsLoadingPouroshavas(true);
    setHasLoadedUnions(false);
    setHasLoadedPouroshavas(false);
    setError('');

    const unionPromise = !forceRefresh && cache.unionsByUpazila.has(upazilaId)
      ? Promise.resolve(cache.unionsByUpazila.get(upazilaId))
      : preferPublicDataset(
          () => getPublicUnionsByUpazilaId(criteria),
          () => apiGet(`/locations/upazilas/${upazilaId}/unions`),
        );

    const pouroPromise = !forceRefresh && cache.pouroshavasByUpazila.has(upazilaId)
      ? Promise.resolve(cache.pouroshavasByUpazila.get(upazilaId))
      : preferPublicDataset(
          () => getPublicPouroshavasByCriteria(criteria),
          () => apiGet(`/locations/upazilas/${upazilaId}/pouroshavas`),
        );

    const [unionData, pouroData] = await Promise.all([unionPromise, pouroPromise]);

    if (unionSeq === requestSeq.current.union) {
      cache.unionsByUpazila.set(upazilaId, unionData);
      setUnions(unionData);
      setIsLoadingUnions(false);
      setHasLoadedUnions(true);
    }

    if (pouroSeq === requestSeq.current.pouroshava) {
      cache.pouroshavasByUpazila.set(upazilaId, pouroData);
      setPouroshavas(pouroData);
      setIsLoadingPouroshavas(false);
      setHasLoadedPouroshavas(true);
    }
  }, [districts, divisions, selectedDistrict, selectedDivision, upazilas]);

  useEffect(() => {
    loadDivisions().catch(() => {
      setError('বিভাগ লোড করা যায়নি');
      setIsLoadingDivisions(false);
    });
  }, [loadDivisions]);

  useEffect(() => {
    setSelectedDistrict('');
    setSelectedUpazilaId('');
    setSelectedAreaType('');
    setSelectedUnion('');
    setDistricts([]);
    setUpazilas([]);
    setUnions([]);
    setPouroshavas([]);
    setHasLoadedUnions(false);
    setHasLoadedPouroshavas(false);

    if (selectedDivision) {
      loadDistricts(selectedDivision).catch(() => {
        setError('জেলা লোড করা যায়নি');
        setIsLoadingDistricts(false);
      });
    }
  }, [loadDistricts, selectedDivision]);

  useEffect(() => {
    setSelectedUpazilaId('');
    setSelectedAreaType('');
    setSelectedUnion('');
    setUpazilas([]);
    setUnions([]);
    setPouroshavas([]);
    setHasLoadedUnions(false);
    setHasLoadedPouroshavas(false);

    if (selectedDistrict) {
      loadUpazilas(selectedDistrict).catch(() => {
        setError('উপজেলা লোড করা যায়নি');
        setIsLoadingUpazilas(false);
      });
    }
  }, [loadUpazilas, selectedDistrict]);

  useEffect(() => {
    setSelectedAreaType('');
    setSelectedUnion('');
    setUnions([]);
    setPouroshavas([]);
    setHasLoadedUnions(false);
    setHasLoadedPouroshavas(false);

    if (selectedUpazilaId) {
      loadAreas(selectedUpazilaId).catch(() => {
        setError('ইউনিয়ন/পৌরসভা লোড করা যায়নি');
        setIsLoadingUnions(false);
        setIsLoadingPouroshavas(false);
        setHasLoadedUnions(true);
        setHasLoadedPouroshavas(true);
      });
    }
  }, [loadAreas, selectedUpazilaId]);

  const retryCurrentLevel = async () => {
    if (selectedUpazilaId) return loadAreas(selectedUpazilaId, true);
    if (selectedDistrict) return loadUpazilas(selectedDistrict, true);
    if (selectedDivision) return loadDistricts(selectedDivision, true);
    return loadDivisions(true);
  };

  return {
    divisions,
    districts,
    upazilas,
    unions,
    pouroshavas,
    selectedDivision,
    selectedDistrict,
    selectedUpazilaId,
    selectedAreaType,
    selectedUnion,
    setSelectedDivision,
    setSelectedDistrict,
    setSelectedUpazilaId,
    setSelectedAreaType,
    setSelectedUnion,
    isLoadingDivisions,
    isLoadingDistricts,
    isLoadingUpazilas,
    isLoadingUnions,
    isLoadingPouroshavas,
    hasLoadedUnions,
    hasLoadedPouroshavas,
    error,
    retryCurrentLevel,
  };
};
