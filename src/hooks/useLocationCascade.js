import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { cachedGet } from '../services/apiClient.js';
import {
  getPublicDistrictsByDivisionId,
  getPublicDivisions,
  getPublicPouroshavasByCriteria,
  getPublicUnionsByUpazilaId,
  getPublicUpazilasByDistrictId,
} from '../services/locationDataset.js';

const logUnionDebug = (label, payload) => {
  if (!import.meta.env.DEV) {
    return;
  }

  console.log(`[LocationCascade] ${label}`, payload);
};

const locationStateCache = {
  divisions: null,
  districtsByDivision: new Map(),
  upazilasByDistrict: new Map(),
  unionsByUpazila: new Map(),
  pouroshavasByUpazila: new Map(),
};

const pendingRequests = {
  divisions: null,
  districtsByDivision: new Map(),
  upazilasByDistrict: new Map(),
  unionsByUpazila: new Map(),
  pouroshavasByUpazila: new Map(),
};

const withPublicDatasetFallback = async ({ apiLoader, publicLoader, fallbackMessage, requestSeq, currentSeqRef, onFallback }) => {
  try {
    const apiData = await apiLoader();

    if (Array.isArray(apiData) && apiData.length === 0) {
      const publicData = await publicLoader();
      if (Array.isArray(publicData) && publicData.length > 0) {
        onFallback?.(publicData);
        console.warn(fallbackMessage, 'API returned an empty list.');
        return publicData;
      }
    }

    return apiData;
  } catch (apiError) {
    try {
      const publicData = await publicLoader();
      onFallback?.(publicData);
      console.warn(fallbackMessage, apiError);
      return publicData;
    } catch (publicError) {
      if (requestSeq !== currentSeqRef.current) {
        return [];
      }

      throw apiError ?? publicError;
    }
  }
};

const getOrCreatePendingRequest = (map, key, fetcher) => {
  const existingRequest = map.get(key);
  if (existingRequest) {
    return existingRequest;
  }

  const request = (async () => {
    try {
      return await fetcher();
    } finally {
      map.delete(key);
    }
  })();

  map.set(key, request);
  return request;
};

const useDebouncedValue = (value, delayMs = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [value, delayMs]);

  return debouncedValue;
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

  const debouncedDivision = useDebouncedValue(selectedDivision, 320);
  const debouncedDistrict = useDebouncedValue(selectedDistrict, 320);

  const [isLoadingDivisions, setIsLoadingDivisions] = useState(true);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingUpazilas, setIsLoadingUpazilas] = useState(false);
  const [isLoadingUnions, setIsLoadingUnions] = useState(false);
  const [isLoadingPouroshavas, setIsLoadingPouroshavas] = useState(false);
  const [hasLoadedUnions, setHasLoadedUnions] = useState(false);
  const [hasLoadedPouroshavas, setHasLoadedPouroshavas] = useState(false);

  const [error, setError] = useState('');

  const districtRequestSeqRef = useRef(0);
  const upazilaRequestSeqRef = useRef(0);
  const unionRequestSeqRef = useRef(0);
  const pouroshavaRequestSeqRef = useRef(0);

  const getErrorMessage = (fallback, err) => {
    return err?.response?.data?.message || fallback;
  };

  const loadDivisions = async (forceRefresh = false) => {
    if (!forceRefresh && locationStateCache.divisions) {
      setDivisions(locationStateCache.divisions);
      setIsLoadingDivisions(false);
      return;
    }

    try {
      setIsLoadingDivisions(true);
      setError('');

      const loadRequest =
        !forceRefresh && pendingRequests.divisions
          ? pendingRequests.divisions
          : (async () => {
              try {
                const response = await cachedGet('/locations/divisions', { ttlMs: 5 * 60 * 1000 });
                return response?.data?.data || [];
              } finally {
                pendingRequests.divisions = null;
              }
            })();

      if (!forceRefresh && !pendingRequests.divisions) {
        pendingRequests.divisions = loadRequest;
      }

      const data = await withPublicDatasetFallback({
        apiLoader: () => loadRequest,
        publicLoader: getPublicDivisions,
        fallbackMessage: 'Falling back to public location dataset for divisions.',
        requestSeq: 0,
        currentSeqRef: districtRequestSeqRef,
      });
      locationStateCache.divisions = data;
      setDivisions(data);
    } catch (err) {
      setError(getErrorMessage('Failed to load divisions', err));
      console.error('Error loading divisions:', err);
    } finally {
      setIsLoadingDivisions(false);
    }
  };

  const loadDistrictsByDivision = async (
    divisionId,
    { forceRefresh = false, requestSeq = districtRequestSeqRef.current } = {},
  ) => {
    const cached = locationStateCache.districtsByDivision.get(divisionId);
    if (!forceRefresh && cached) {
      if (requestSeq === districtRequestSeqRef.current) {
        setDistricts(cached);
        setIsLoadingDistricts(false);
      }
      return;
    }

    try {
      setIsLoadingDistricts(true);
      setError('');

      const loadRequest = forceRefresh
        ? cachedGet(`/locations/divisions/${divisionId}/districts`, {
            ttlMs: 5 * 60 * 1000,
          }).then((response) => response?.data?.data || [])
        : getOrCreatePendingRequest(pendingRequests.districtsByDivision, divisionId, async () => {
            const response = await cachedGet(`/locations/divisions/${divisionId}/districts`, {
              ttlMs: 5 * 60 * 1000,
            });
            return response?.data?.data || [];
          });

      const data = await withPublicDatasetFallback({
        apiLoader: () => loadRequest,
        publicLoader: () => getPublicDistrictsByDivisionId(divisionId),
        fallbackMessage: 'Falling back to public location dataset for districts.',
        requestSeq,
        currentSeqRef: districtRequestSeqRef,
      });

      if (requestSeq !== districtRequestSeqRef.current) {
        return;
      }

      locationStateCache.districtsByDivision.set(divisionId, data);
      setDistricts(data);
    } catch (err) {
      if (requestSeq !== districtRequestSeqRef.current) {
        return;
      }

      setError(getErrorMessage('Failed to load districts', err));
      console.error('Error loading districts:', err);
    } finally {
      if (requestSeq === districtRequestSeqRef.current) {
        setIsLoadingDistricts(false);
      }
    }
  };

  const loadUpazilasByDistrictId = async (
    districtId,
    { forceRefresh = false, requestSeq = upazilaRequestSeqRef.current } = {},
  ) => {
    const cached = locationStateCache.upazilasByDistrict.get(districtId);
    if (!forceRefresh && cached) {
      if (requestSeq === upazilaRequestSeqRef.current) {
        setUpazilas(cached);
        setIsLoadingUpazilas(false);
      }
      return;
    }

    try {
      setIsLoadingUpazilas(true);
      setError('');

      const loadRequest = forceRefresh
        ? cachedGet(`/locations/districts/${districtId}/upazilas`, {
            ttlMs: 5 * 60 * 1000,
          }).then((response) => response?.data?.data || [])
        : getOrCreatePendingRequest(pendingRequests.upazilasByDistrict, districtId, async () => {
            const response = await cachedGet(`/locations/districts/${districtId}/upazilas`, {
              ttlMs: 5 * 60 * 1000,
            });
            return response?.data?.data || [];
          });

      const data = await withPublicDatasetFallback({
        apiLoader: () => loadRequest,
        publicLoader: () => getPublicUpazilasByDistrictId(districtId),
        fallbackMessage: 'Falling back to public location dataset for upazilas.',
        requestSeq,
        currentSeqRef: upazilaRequestSeqRef,
      });

      if (requestSeq !== upazilaRequestSeqRef.current) {
        return;
      }

      locationStateCache.upazilasByDistrict.set(districtId, data);
      setUpazilas(data);
    } catch (err) {
      if (requestSeq !== upazilaRequestSeqRef.current) {
        return;
      }

      setError(getErrorMessage('Failed to load upazilas', err));
      console.error('Error loading upazilas:', err);
    } finally {
      if (requestSeq === upazilaRequestSeqRef.current) {
        setIsLoadingUpazilas(false);
      }
    }
  };

  const loadUnionsByUpazilaId = async (
    upazilaId,
    { forceRefresh = false, requestSeq = unionRequestSeqRef.current } = {},
  ) => {
    logUnionDebug('Preparing unions fetch', {
      upazilaId,
      forceRefresh,
      requestSeq,
    });

    const cached = locationStateCache.unionsByUpazila.get(upazilaId);
    const hasCached = Array.isArray(cached);

    if (!forceRefresh && hasCached) {
      if (requestSeq === unionRequestSeqRef.current) {
        logUnionDebug('Unions API response data (cached)', {
          upazilaId,
          count: cached.length,
          data: cached,
        });
        setUnions(cached);
        setIsLoadingUnions(false);
        setHasLoadedUnions(true);
      }
      return;
    }

    try {
      setIsLoadingUnions(true);
      setError('');

      const selectedUpazilaNode = upazilas.find((item) => item.id === upazilaId) || null;
      const selectedDistrictNode = districts.find((item) => item.id === selectedDistrict) || null;
      const selectedDivisionNode = divisions.find((item) => item.id === selectedDivision) || null;

      logUnionDebug('Unions API request params', {
        endpoint: `/locations/upazilas/${upazilaId}/unions`,
        upazilaId,
        forceRefresh,
      });

      const loadRequest = forceRefresh
        ? cachedGet(`/locations/upazilas/${upazilaId}/unions`, {
            ttlMs: 5 * 60 * 1000,
          }).then((response) => response?.data?.data || [])
        : getOrCreatePendingRequest(pendingRequests.unionsByUpazila, upazilaId, async () => {
            const response = await cachedGet(`/locations/upazilas/${upazilaId}/unions`, {
              ttlMs: 5 * 60 * 1000,
            });
            return response?.data?.data || [];
          });

      const data = await withPublicDatasetFallback({
        apiLoader: () => loadRequest,
        publicLoader: () =>
          getPublicUnionsByUpazilaId({
            upazilaId,
            upazilaName: selectedUpazilaNode?.name,
            upazilaBnName: selectedUpazilaNode?.bnName,
            districtName: selectedDistrictNode?.name,
            districtBnName: selectedDistrictNode?.bnName,
            divisionName: selectedDivisionNode?.name,
            divisionBnName: selectedDivisionNode?.bnName,
          }),
        fallbackMessage: 'Falling back to public location dataset for unions.',
        requestSeq,
        currentSeqRef: unionRequestSeqRef,
      });

      if (requestSeq !== unionRequestSeqRef.current) {
        return;
      }

      logUnionDebug('Unions API response data', {
        upazilaId,
        count: data.length,
        data,
      });

      locationStateCache.unionsByUpazila.set(upazilaId, data);
      setUnions(data);
    } catch (err) {
      if (requestSeq !== unionRequestSeqRef.current) {
        return;
      }

      setError(getErrorMessage('Failed to load unions/pouroshava', err));
      console.error('Error loading unions:', err);
    } finally {
      if (requestSeq === unionRequestSeqRef.current) {
        setIsLoadingUnions(false);
        setHasLoadedUnions(true);
      }
    }
  };

  const loadPouroshavasByUpazilaId = async (
    upazilaId,
    { forceRefresh = false, requestSeq = pouroshavaRequestSeqRef.current } = {},
  ) => {
    const cached = locationStateCache.pouroshavasByUpazila.get(upazilaId);
    const hasCached = Array.isArray(cached);

    if (!forceRefresh && hasCached) {
      if (requestSeq === pouroshavaRequestSeqRef.current) {
        setPouroshavas(cached);
        setIsLoadingPouroshavas(false);
        setHasLoadedPouroshavas(true);
      }
      return;
    }

    try {
      setIsLoadingPouroshavas(true);
      setError('');

      const selectedUpazilaNode = upazilas.find((item) => item.id === upazilaId) || null;
      const selectedDistrictNode = districts.find((item) => item.id === selectedDistrict) || null;
      const selectedDivisionNode = divisions.find((item) => item.id === selectedDivision) || null;

      const loadRequest = forceRefresh
        ? cachedGet(`/locations/upazilas/${upazilaId}/pouroshavas`, {
            ttlMs: 5 * 60 * 1000,
          }).then((response) => response?.data?.data || [])
        : getOrCreatePendingRequest(
            pendingRequests.pouroshavasByUpazila,
            upazilaId,
            async () => {
              const response = await cachedGet(`/locations/upazilas/${upazilaId}/pouroshavas`, {
                ttlMs: 5 * 60 * 1000,
              });
              return response?.data?.data || [];
            },
          );

      const data = await withPublicDatasetFallback({
        apiLoader: () => loadRequest,
        publicLoader: () =>
          getPublicPouroshavasByCriteria({
            upazilaId,
            upazilaName: selectedUpazilaNode?.name,
            upazilaBnName: selectedUpazilaNode?.bnName,
            districtName: selectedDistrictNode?.name,
            districtBnName: selectedDistrictNode?.bnName,
            divisionName: selectedDivisionNode?.name,
            divisionBnName: selectedDivisionNode?.bnName,
          }),
        fallbackMessage: 'Falling back to public location dataset for pouroshavas.',
        requestSeq,
        currentSeqRef: pouroshavaRequestSeqRef,
      });

      if (requestSeq !== pouroshavaRequestSeqRef.current) {
        return;
      }

      locationStateCache.pouroshavasByUpazila.set(upazilaId, data);
      setPouroshavas(data);
    } catch (err) {
      if (requestSeq !== pouroshavaRequestSeqRef.current) {
        return;
      }

      setError(getErrorMessage('Failed to load pouroshavas', err));
      console.error('Error loading pouroshavas:', err);
    } finally {
      if (requestSeq === pouroshavaRequestSeqRef.current) {
        setIsLoadingPouroshavas(false);
        setHasLoadedPouroshavas(true);
      }
    }
  };

  useEffect(() => {
    loadDivisions();
  }, []);

  useEffect(() => {
    if (!selectedDivision) {
      setDistricts([]);
      setSelectedDistrict('');
      setUpazilas([]);
      setSelectedUpazilaId('');
      setUnions([]);
      setPouroshavas([]);
      setSelectedAreaType('');
      setSelectedUnion('');
      setHasLoadedPouroshavas(false);
      setError('');
      return;
    }

    setSelectedDistrict('');
    setUpazilas([]);
    setSelectedUpazilaId('');
    setUnions([]);
    setPouroshavas([]);
    setSelectedAreaType('');
    setSelectedUnion('');
    setHasLoadedPouroshavas(false);
  }, [selectedDivision]);

  useEffect(() => {
    if (!debouncedDivision) {
      return;
    }

    const requestSeq = districtRequestSeqRef.current + 1;
    districtRequestSeqRef.current = requestSeq;
    loadDistrictsByDivision(debouncedDivision, { requestSeq });
  }, [debouncedDivision]);

  useEffect(() => {
    if (!selectedDistrict) {
      setUpazilas([]);
      setSelectedUpazilaId('');
      setUnions([]);
      setPouroshavas([]);
      setSelectedAreaType('');
      setSelectedUnion('');
      setHasLoadedUnions(false);
      setHasLoadedPouroshavas(false);
      setError('');
      return;
    }

    setSelectedUpazilaId('');
    setUnions([]);
    setPouroshavas([]);
    setSelectedAreaType('');
    setSelectedUnion('');
    setHasLoadedUnions(false);
    setHasLoadedPouroshavas(false);
  }, [selectedDistrict]);

  useEffect(() => {
    if (!debouncedDistrict) {
      return;
    }

    const requestSeq = upazilaRequestSeqRef.current + 1;
    upazilaRequestSeqRef.current = requestSeq;
    loadUpazilasByDistrictId(debouncedDistrict, { requestSeq });
  }, [debouncedDistrict]);

  useLayoutEffect(() => {
    if (!selectedUpazilaId) {
      setUnions([]);
      setPouroshavas([]);
      setSelectedAreaType('');
      setSelectedUnion('');
      setIsLoadingUnions(false);
      setIsLoadingPouroshavas(false);
      setHasLoadedUnions(false);
      setHasLoadedPouroshavas(false);
      setError('');
      return;
    }

    logUnionDebug('Selected upazilaId', { upazilaId: selectedUpazilaId });

    setUnions([]);
    setPouroshavas([]);
    setSelectedAreaType('');
    setSelectedUnion('');
    setHasLoadedUnions(false);
    setHasLoadedPouroshavas(false);

    const unionRequestSeq = unionRequestSeqRef.current + 1;
    unionRequestSeqRef.current = unionRequestSeq;
    loadUnionsByUpazilaId(selectedUpazilaId, { requestSeq: unionRequestSeq });

    const pouroshavaRequestSeq = pouroshavaRequestSeqRef.current + 1;
    pouroshavaRequestSeqRef.current = pouroshavaRequestSeq;
    loadPouroshavasByUpazilaId(selectedUpazilaId, { requestSeq: pouroshavaRequestSeq });
  }, [selectedUpazilaId]);

  const retryCurrentLevel = async () => {
    if (selectedUpazilaId) {
      const unionRequestSeq = unionRequestSeqRef.current + 1;
      unionRequestSeqRef.current = unionRequestSeq;
      const pouroshavaRequestSeq = pouroshavaRequestSeqRef.current + 1;
      pouroshavaRequestSeqRef.current = pouroshavaRequestSeq;

      await Promise.all([
        loadUnionsByUpazilaId(selectedUpazilaId, {
          forceRefresh: true,
          requestSeq: unionRequestSeq,
        }),
        loadPouroshavasByUpazilaId(selectedUpazilaId, {
          forceRefresh: true,
          requestSeq: pouroshavaRequestSeq,
        }),
      ]);
      return;
    }

    if (selectedDistrict) {
      const requestSeq = upazilaRequestSeqRef.current + 1;
      upazilaRequestSeqRef.current = requestSeq;
      await loadUpazilasByDistrictId(selectedDistrict, { forceRefresh: true, requestSeq });
      return;
    }

    if (selectedDivision) {
      const requestSeq = districtRequestSeqRef.current + 1;
      districtRequestSeqRef.current = requestSeq;
      await loadDistrictsByDivision(selectedDivision, { forceRefresh: true, requestSeq });
      return;
    }

    await loadDivisions(true);
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
