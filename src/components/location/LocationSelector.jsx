import { useEffect, useMemo, useState } from 'react';
import Select from 'react-select';

import { useLocationCascade } from '../../hooks/useLocationCascade.js';

const emptyValue = {
  divisionId: '',
  districtId: '',
  upazilaId: '',
  areaType: '',
  unionId: '',
  unionName: '',
  wardNumber: '',
};

const AUTO_DETECT_ATTEMPT_KEY = 'location-auto-detect-attempted';

const getAutoDetectAttempted = () => {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) {
      return false;
    }

    return Boolean(window.sessionStorage.getItem(AUTO_DETECT_ATTEMPT_KEY));
  } catch {
    return false;
  }
};

const setAutoDetectAttempted = () => {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem(AUTO_DETECT_ATTEMPT_KEY, '1');
    }
  } catch {
    // Ignore storage errors so registration flow never breaks.
  }
};

const getAreaType = (item) => {
  if (item?.areaType === 'union' || item?.areaType === 'pouroshava') {
    return item.areaType;
  }

  const content = `${item?.name || ''} ${item?.bnName || ''}`.toLowerCase();
  const isPouroshava = /pouroshava|pourashava|municipality|পৌরসভা/.test(content);
  return isPouroshava ? 'pouroshava' : 'union';
};

const isObjectId = (value) => /^[a-fA-F0-9]{24}$/.test(String(value || ''));

const normalizeLocationName = (value = '') => {
  return value
    .toLowerCase()
    .replace(/district|division|city corporation|zila|জেলা|বিভাগ|সিটি কর্পোরেশন/gi, '')
    .replace(/[.,()/-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const uniqueCandidates = (values = []) => {
  return [...new Set(values.filter(Boolean).map((value) => normalizeLocationName(value)).filter(Boolean))];
};

const findByCandidates = (items, candidates) => {
  if (!items.length || !candidates.length) {
    return null;
  }

  const withNormalized = items.map((item) => ({
    item,
    normalizedName: normalizeLocationName(item.name),
    normalizedBnName: normalizeLocationName(item.bnName),
  }));

  for (const candidate of candidates) {
    const exactMatch = withNormalized.find(
      ({ normalizedName, normalizedBnName }) =>
        normalizedName === candidate || normalizedBnName === candidate,
    );
    if (exactMatch) {
      return exactMatch.item;
    }
  }

  for (const candidate of candidates) {
    const partialMatch = withNormalized.find(
      ({ normalizedName, normalizedBnName }) =>
        normalizedName.includes(candidate) ||
        candidate.includes(normalizedName) ||
        normalizedBnName.includes(candidate) ||
        candidate.includes(normalizedBnName),
    );
    if (partialMatch) {
      return partialMatch.item;
    }
  }

  return null;
};

const reverseGeocode = async ({ latitude, longitude }) => {
  const url = new URL('https://nominatim.openstreetmap.org/reverse');
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('lat', String(latitude));
  url.searchParams.set('lon', String(longitude));
  url.searchParams.set('zoom', '10');
  url.searchParams.set('accept-language', 'en');

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error('Failed to reverse geocode current location');
  }

  return response.json();
};

const getLocationNames = ({ divisions, districts, upazilas, unions, pouroshavas, ids }) => {
  const division = divisions.find((item) => item.id === ids.divisionId) || null;
  const district = districts.find((item) => item.id === ids.districtId) || null;
  const upazila = upazilas.find((item) => item.id === ids.upazilaId) || null;
  const selectedAreas = ids.areaType === 'pouroshava' ? pouroshavas : unions;
  const union = selectedAreas.find((item) => item.id === ids.unionId) || null;

  return {
    division: division?.name || null,
    district: district?.name || null,
    upazila: upazila?.name || null,
    union: union?.name || ids.unionName || null,
    wardNumber: ids.areaType === 'pouroshava' ? ids.wardNumber || null : null,
  };
};

export const LocationSelector = ({
  onChange,
  required = false,
  mode = 'required',
  showUnionSearch = true,
  enableAutoDetect = true,
  idPrefix = 'location',
  resetKey,
}) => {
  const {
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
  } = useLocationCascade();

  const [unionSearch, setUnionSearch] = useState('');
  const [manualUnionName, setManualUnionName] = useState('');
  const [selectedWardNumber, setSelectedWardNumber] = useState('');
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);
  const [autoDetectMessage, setAutoDetectMessage] = useState('');
  const [pendingAutoDistrictCandidates, setPendingAutoDistrictCandidates] = useState([]);
  const [hasAttemptedAutoDetect, setHasAttemptedAutoDetect] = useState(() =>
    getAutoDetectAttempted(),
  );

  const isFilterMode = mode === 'filter';

  useEffect(() => {
    setUnionSearch('');
    setManualUnionName('');
    setSelectedWardNumber('');
    setPendingAutoDistrictCandidates([]);
    setSelectedAreaType('');
    setSelectedUnion('');
    emitChange({
      divisionId: selectedDivision,
      districtId: selectedDistrict,
      upazilaId: selectedUpazilaId,
      areaType: '',
      unionId: '',
      unionName: '',
      wardNumber: '',
    });
  }, [selectedUpazilaId]);

  useEffect(() => {
    if (typeof resetKey === 'undefined') {
      return;
    }

    setSelectedDivision('');
    setSelectedDistrict('');
    setSelectedUpazilaId('');
    setSelectedAreaType('');
    setSelectedUnion('');
    setManualUnionName('');
    setSelectedWardNumber('');
    setUnionSearch('');
    setAutoDetectMessage('');
    setPendingAutoDistrictCandidates([]);
  }, [resetKey]);

  const getCoordinates = async () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported in this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000,
      });
    });
  };

  const applyAutoDetectedLocation = async () => {
    if (!enableAutoDetect || isAutoDetecting) {
      return;
    }

    try {
      setIsAutoDetecting(true);
      setAutoDetectMessage('');

      const position = await getCoordinates();
      const geocode = await reverseGeocode({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      const address = geocode?.address || {};
      const divisionCandidates = uniqueCandidates([
        address.state,
        address.region,
        address.county,
      ]);
      const districtCandidates = uniqueCandidates([
        address.state_district,
        address.city,
        address.city_district,
        address.county,
        address.municipality,
        address.town,
      ]);

      const matchedDivision = findByCandidates(divisions, divisionCandidates);
      if (!matchedDivision) {
        setAutoDetectMessage('Current location found, but division could not be matched.');
        return;
      }

      setSelectedDivision(matchedDivision.id);
      emitChange({
        ...emptyValue,
        divisionId: matchedDivision.id,
      });

      setPendingAutoDistrictCandidates(districtCandidates);
      setAutoDetectMessage('Division preselected from current location.');
    } catch (detectError) {
      setAutoDetectMessage(detectError?.message || 'Location permission denied or unavailable.');
    } finally {
      setIsAutoDetecting(false);
      setAutoDetectAttempted();
      setHasAttemptedAutoDetect(true);
    }
  };

  useEffect(() => {
    if (!enableAutoDetect || hasAttemptedAutoDetect || selectedDivision || !divisions.length) {
      return;
    }

    applyAutoDetectedLocation();
  }, [enableAutoDetect, hasAttemptedAutoDetect, selectedDivision, divisions.length]);

  useEffect(() => {
    if (!pendingAutoDistrictCandidates.length || !selectedDivision || !districts.length || selectedDistrict) {
      return;
    }

    const matchedDistrict = findByCandidates(districts, pendingAutoDistrictCandidates);
    if (!matchedDistrict) {
      setPendingAutoDistrictCandidates([]);
      return;
    }

    setSelectedDistrict(matchedDistrict.id);
    emitChange({
      divisionId: selectedDivision,
      districtId: matchedDistrict.id,
      upazilaId: '',
      areaType: '',
      unionId: '',
      unionName: '',
      wardNumber: '',
    });
    setAutoDetectMessage('Division and district preselected from current location.');
    setPendingAutoDistrictCandidates([]);
  }, [pendingAutoDistrictCandidates, selectedDivision, districts, selectedDistrict]);

  const filteredUnions = useMemo(() => {
    const availableAreaType = selectedAreaType || 'union';
    const sourceAreas = availableAreaType === 'pouroshava' ? pouroshavas : unions;
    const term = unionSearch.trim().toLowerCase();

    if (!term) {
      return sourceAreas;
    }

    return sourceAreas
      .filter((item) => {
        const name = item?.name?.toLowerCase() || '';
        const bnName = item?.bnName?.toLowerCase() || '';
        return name.includes(term) || bnName.includes(term);
      });
  }, [selectedAreaType, unionSearch, unions, pouroshavas]);

  const unionOptions = useMemo(() => {
    return filteredUnions.map((item) => {
      const itemAreaType = getAreaType(item);
      const typeLabel = itemAreaType === 'pouroshava' ? 'Pouroshava' : 'Union';
      const nameLabel = item.bnName ? `${item.name} (${item.bnName})` : item.name;

      return {
        value: item.id,
        label: `${typeLabel}: ${nameLabel}`,
        name: item.name,
        areaType: itemAreaType,
      };
    });
  }, [filteredUnions]);

  const selectedUnionOption = useMemo(() => {
    return unionOptions.find((item) => item.value === selectedUnion) || null;
  }, [selectedUnion, unionOptions]);

  const hasUnionRecords = unions.length > 0;
  const hasPouroshavaRecords = pouroshavas.length > 0;
  const hasAnyAreaRecords = hasUnionRecords || hasPouroshavaRecords;
  const hasMatchingUnionRecords = unionOptions.length > 0;
  const hasValidUpazilaSelection = useMemo(
    () => Boolean(selectedUpazilaId && upazilas.some((item) => item.id === selectedUpazilaId)),
    [selectedUpazilaId, upazilas],
  );

  const areaTypeOptions = [
    hasUnionRecords
      ? {
          value: 'union',
          label: 'Union (Rural)',
        }
      : null,
    hasPouroshavaRecords
      ? {
          value: 'pouroshava',
          label: 'Pouroshava (Urban)',
        }
      : null,
  ].filter(Boolean);

  const shouldShowAreaTypeSelector = hasValidUpazilaSelection && areaTypeOptions.length > 1;

  useEffect(() => {
    if (!hasValidUpazilaSelection) {
      return;
    }

    if (isLoadingUnions || isLoadingPouroshavas) {
      return;
    }

    if (areaTypeOptions.length !== 1) {
      return;
    }

    const [singleOption] = areaTypeOptions;
    if (selectedAreaType === singleOption.value) {
      return;
    }

    setSelectedAreaType(singleOption.value);
  }, [
    areaTypeOptions,
    hasValidUpazilaSelection,
    isLoadingPouroshavas,
    isLoadingUnions,
    selectedAreaType,
    setSelectedAreaType,
  ]);

  const isLoadingSelectedAreaType =
    selectedAreaType === 'pouroshava' ? isLoadingPouroshavas : isLoadingUnions;

  const hasLoadedSelectedAreaType =
    selectedAreaType === 'pouroshava' ? hasLoadedPouroshavas : hasLoadedUnions;

  const isUnionDropdownDisabled =
    !hasValidUpazilaSelection ||
    !selectedAreaType ||
    isLoadingSelectedAreaType ||
    !hasMatchingUnionRecords;
  const shouldRenderUnionDropdown =
    hasValidUpazilaSelection &&
    selectedAreaType &&
    hasLoadedSelectedAreaType &&
    !isLoadingSelectedAreaType;
  const shouldRenderManualUnionInput =
    hasValidUpazilaSelection &&
    selectedAreaType &&
    hasLoadedSelectedAreaType &&
    !isLoadingSelectedAreaType &&
    mode !== 'filter';

  const unionEmptyMessage = !hasAnyAreaRecords
    ? 'No area records available for this upazila'
    : selectedAreaType === 'pouroshava'
      ? 'No pouroshava records found for this upazila'
      : 'No union records found for this upazila';

  const emitChange = (nextIds) => {
    const locationNames = getLocationNames({
      divisions,
      districts,
      upazilas,
      unions,
      pouroshavas,
      ids: nextIds,
    });

    onChange?.({
      ...nextIds,
      locationNames,
    });
  };

  const handleDivisionChange = (event) => {
    const value = event.target.value;
    setSelectedDivision(value);
    setSelectedAreaType('');
    setSelectedUnion('');
    setManualUnionName('');
    setSelectedWardNumber('');

    emitChange({
      ...emptyValue,
      divisionId: value,
    });
  };

  const handleDistrictChange = (event) => {
    const value = event.target.value;
    setSelectedDistrict(value);
    setSelectedAreaType('');
    setSelectedUnion('');
    setManualUnionName('');
    setSelectedWardNumber('');

    emitChange({
      divisionId: selectedDivision,
      districtId: value,
      upazilaId: '',
      areaType: '',
      unionId: '',
      unionName: '',
      wardNumber: '',
    });
  };

  const handleUpazilaChange = (event) => {
    const value = event.target.value;
    setSelectedUpazilaId(value);
    setSelectedAreaType('');
    setSelectedUnion('');
    setManualUnionName('');
    setSelectedWardNumber('');

    emitChange({
      divisionId: selectedDivision,
      districtId: selectedDistrict,
      upazilaId: value,
      areaType: '',
      unionId: '',
      unionName: '',
      wardNumber: '',
    });
  };

  const handleAreaTypeChange = (event) => {
    const value = event.target.value;
    setSelectedAreaType(value);
    setSelectedUnion('');
    setManualUnionName('');
    setSelectedWardNumber('');

    emitChange({
      divisionId: selectedDivision,
      districtId: selectedDistrict,
      upazilaId: selectedUpazilaId,
      areaType: value,
      unionId: '',
      unionName: '',
      wardNumber: '',
    });
  };

  const handleUnionChange = (selectedOption) => {
    const value = selectedOption?.value || '';
    setSelectedUnion(value);
    setManualUnionName('');

    const useUnionId = isObjectId(value);
    const resolvedUnionName = selectedOption?.name || '';

    emitChange({
      divisionId: selectedDivision,
      districtId: selectedDistrict,
      upazilaId: selectedUpazilaId,
      areaType: selectedAreaType,
      unionId: useUnionId ? value : '',
      unionName: useUnionId ? '' : resolvedUnionName,
      wardNumber: selectedAreaType === 'pouroshava' ? selectedWardNumber : '',
    });
  };

  const handleManualUnionChange = (event) => {
    const value = event.target.value;
    setManualUnionName(value);
    setSelectedUnion('');

    emitChange({
      divisionId: selectedDivision,
      districtId: selectedDistrict,
      upazilaId: selectedUpazilaId,
      areaType: selectedAreaType,
      unionId: '',
      unionName: value,
      wardNumber: selectedAreaType === 'pouroshava' ? selectedWardNumber : '',
    });
  };

  const handleWardNumberChange = (event) => {
    const value = event.target.value;
    setSelectedWardNumber(value);

    emitChange({
      divisionId: selectedDivision,
      districtId: selectedDistrict,
      upazilaId: selectedUpazilaId,
      areaType: selectedAreaType,
      unionId: selectedUnion,
      unionName: manualUnionName,
      wardNumber: value,
    });
  };

  return (
    <div className="location-cascade-container">
      {enableAutoDetect ? (
        <div className="location-autofill-row">
          <button
            type="button"
            className="retry-inline-btn"
            onClick={applyAutoDetectedLocation}
            disabled={isAutoDetecting}
          >
            {isAutoDetecting ? 'Detecting location...' : 'Use Current Location'}
          </button>
          {autoDetectMessage ? <span className="location-autofill-message">{autoDetectMessage}</span> : null}
        </div>
      ) : null}

      {error ? (
        <div className="error-message location-error-inline">
          <span>{error}</span>
          <button type="button" className="retry-inline-btn" onClick={retryCurrentLevel}>
            Retry
          </button>
        </div>
      ) : null}

      <div className="location-select-wrapper">
        <label htmlFor={`${idPrefix}DivisionSelect`}>Division</label>
        <select
          id={`${idPrefix}DivisionSelect`}
          value={selectedDivision}
          onChange={handleDivisionChange}
          disabled={isLoadingDivisions}
          required={required}
        >
          <option value="">
            {isLoadingDivisions
              ? 'Loading divisions...'
              : isFilterMode
                ? 'All Divisions'
                : 'Select Division First'}
          </option>
          {divisions.map((division) => (
            <option key={division.id} value={division.id}>
              {division.name}
            </option>
          ))}
        </select>
      </div>

      <div className="location-select-wrapper">
        <label htmlFor={`${idPrefix}DistrictSelect`}>
          District {isLoadingDistricts && <span className="loading-indicator">Loading...</span>}
        </label>
        <select
          id={`${idPrefix}DistrictSelect`}
          value={selectedDistrict}
          onChange={handleDistrictChange}
          disabled={!selectedDivision || isLoadingDistricts}
          required={required}
        >
          <option value="">
            {!selectedDivision
              ? 'Select Division First'
              : isFilterMode
                ? 'All Districts'
                : 'Select District'}
          </option>
          {districts.map((district) => (
            <option key={district.id} value={district.id}>
              {district.name}
            </option>
          ))}
        </select>
      </div>

      <div className="location-select-wrapper">
        <label htmlFor={`${idPrefix}UpazilaSelect`}>
          Upazila {isLoadingUpazilas && <span className="loading-indicator">Loading...</span>}
        </label>
        <select
          id={`${idPrefix}UpazilaSelect`}
          value={selectedUpazilaId}
          onChange={handleUpazilaChange}
          disabled={!selectedDistrict || isLoadingUpazilas}
          required={required}
        >
          <option value="">
            {!selectedDistrict
              ? 'Select District First'
              : isFilterMode
                ? 'All Upazilas'
                : 'Select Upazila'}
          </option>
          {upazilas.map((upazila) => (
            <option key={upazila.id} value={upazila.id}>
              {upazila.name}
            </option>
          ))}
        </select>
      </div>

      <div className="location-select-wrapper">
        <label htmlFor={`${idPrefix}AreaTypeSelect`}>
          Area Type{' '}
          {(isLoadingUnions || isLoadingPouroshavas) && (
            <span className="loading-indicator">Loading...</span>
          )}
        </label>
        <select
          id={`${idPrefix}AreaTypeSelect`}
          value={selectedAreaType}
          onChange={handleAreaTypeChange}
          disabled={
            !hasValidUpazilaSelection ||
            (isLoadingUnions || isLoadingPouroshavas) ||
            areaTypeOptions.length <= 1
          }
          required={required && shouldShowAreaTypeSelector}
        >
          <option value="">
            {!hasValidUpazilaSelection
              ? 'Select Upazila First'
              : isLoadingUnions || isLoadingPouroshavas
                ? 'Loading area types...'
                : areaTypeOptions.length > 1
                  ? 'Select Area Type'
                  : areaTypeOptions.length === 1
                    ? areaTypeOptions[0].label
                    : 'No area types found'}
          </option>
          {shouldShowAreaTypeSelector
            ? areaTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))
            : null}
        </select>

        {selectedAreaType === 'pouroshava' && mode !== 'filter' ? (
          <>
            <label htmlFor={`${idPrefix}WardNumberInput`}>Ward Number</label>
            <input
              id={`${idPrefix}WardNumberInput`}
              type="number"
              min="1"
              step="1"
              className="location-search-input"
              value={selectedWardNumber}
              onChange={handleWardNumberChange}
              placeholder="Enter ward number"
              required={required}
            />
          </>
        ) : null}
      </div>

      <div className="location-select-wrapper">
        <label htmlFor={`${idPrefix}UnionSelect`}>
          Area Name{' '}
          {isLoadingSelectedAreaType && <span className="loading-indicator">Loading...</span>}
        </label>

        {hasValidUpazilaSelection && isLoadingSelectedAreaType ? (
          <div className="location-union-loading">Loading selected area options...</div>
        ) : null}

        {shouldRenderUnionDropdown ? (
          <Select
            inputId={`${idPrefix}UnionSelect`}
            classNamePrefix="location-react-select"
            options={unionOptions}
            value={selectedUnionOption}
            onChange={handleUnionChange}
            inputValue={showUnionSearch ? unionSearch : undefined}
            onInputChange={
              showUnionSearch
                ? (value, actionMeta) => {
                    if (actionMeta.action === 'input-change') {
                      setUnionSearch(value);
                    }

                    if (actionMeta.action === 'menu-close' || actionMeta.action === 'set-value') {
                      setUnionSearch('');
                    }

                    return value;
                  }
                : undefined
            }
            placeholder={
              hasMatchingUnionRecords
                ? selectedAreaType === 'pouroshava'
                  ? 'Search or select Pouroshava'
                  : 'Search or select Union'
                : unionEmptyMessage
            }
            isDisabled={isUnionDropdownDisabled}
            isLoading={false}
            isClearable={isFilterMode || !required}
            isSearchable={showUnionSearch}
            filterOption={showUnionSearch ? null : undefined}
            noOptionsMessage={() =>
              showUnionSearch && unionSearch
                ? selectedAreaType === 'pouroshava'
                  ? 'No pouroshava matches your search'
                  : 'No union matches your search'
                : unionEmptyMessage
            }
          />
        ) : null}

        {shouldRenderManualUnionInput ? (
          <>
            <label htmlFor={`${idPrefix}ManualUnionInput`}>
              {selectedAreaType === 'pouroshava'
                ? 'Pouroshava Name (if not listed)'
                : 'Union Name (if not listed)'}
            </label>
            <input
              id={`${idPrefix}ManualUnionInput`}
              type="text"
              className="location-search-input"
              value={manualUnionName}
              onChange={handleManualUnionChange}
              placeholder={
                selectedAreaType === 'pouroshava'
                  ? 'Not listed? Type your pouroshava name'
                  : 'Not listed? Type your union $ pouroshava name'
              }
              required={required && !selectedUnion}
            />
          </>
        ) : null}
      </div>
    </div>
  );
};
