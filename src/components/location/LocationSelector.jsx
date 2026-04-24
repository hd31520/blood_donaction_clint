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

const NORMALIZED_LOCATION_ALIASES = [
  [/\bchittagong\b/g, 'chattogram'],
  [/\bchattagram\b/g, 'chattogram'],
  [/চট্টগ্রাম/g, 'chattogram'],
  [/\bbarisal\b/g, 'barishal'],
  [/বরিশাল/g, 'barishal'],
  [/\bbarisal\b/g, 'barishal'],
  [/\bmymenshingh\b/g, 'mymensingh'],
  [/\bnoakhali\b/g, 'noakhali'],
  [/\bdhaka\b/g, 'dhaka'],
  [/\bkhulna\b/g, 'khulna'],
  [/\brajshahi\b/g, 'rajshahi'],
  [/\brangpur\b/g, 'rangpur'],
  [/\bsylhet\b/g, 'sylhet'],
];

const normalizeLocationName = (value = '') => {
  const normalized = value
    .toLowerCase()
    .replace(/district|division|city corporation|zila|জেলা|বিভাগ|সিটি কর্পোরেশন/gi, '')
    .replace(/[.,()/-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return NORMALIZED_LOCATION_ALIASES.reduce((currentValue, [pattern, replacement]) => {
    return currentValue.replace(pattern, replacement);
  }, normalized);
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
        setAutoDetectMessage(
          'বর্তমান লোকেশন পাওয়া গেছে, কিন্তু বিভাগ মিলেনি। অনুগ্রহ করে বিভাগ নির্বাচন করুন।',
        );
        return;
      }

      setSelectedDivision(matchedDivision.id);
      emitChange({
        ...emptyValue,
        divisionId: matchedDivision.id,
      });

      setPendingAutoDistrictCandidates(districtCandidates);
      setAutoDetectMessage('বর্তমান লোকেশন থেকে বিভাগ নির্বাচন করা হয়েছে।');
    } catch (detectError) {
      setAutoDetectMessage(detectError?.message || 'লোকেশন অনুমতি পাওয়া যায়নি বা লোকেশন চালু নেই।');
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
    setAutoDetectMessage('বর্তমান লোকেশন থেকে বিভাগ ও জেলা নির্বাচন করা হয়েছে।');
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
      const typeLabel = itemAreaType === 'pouroshava' ? 'পৌরসভা' : 'ইউনিয়ন';
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
          label: 'ইউনিয়ন',
        }
      : null,
    hasPouroshavaRecords
      ? {
          value: 'pouroshava',
          label: 'পৌরসভা',
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

  useEffect(() => {
    if (!hasValidUpazilaSelection) {
      return;
    }

    if (isLoadingUnions || isLoadingPouroshavas) {
      return;
    }

    // When no area records are available, default to union so manual entry remains possible.
    if (areaTypeOptions.length === 0 && !selectedAreaType) {
      setSelectedAreaType('union');
    }
  }, [
    areaTypeOptions.length,
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
    ? 'এই উপজেলার কোনো এলাকা পাওয়া যায়নি'
    : selectedAreaType === 'pouroshava'
      ? 'এই উপজেলার কোনো পৌরসভা পাওয়া যায়নি'
      : 'এই উপজেলার কোনো ইউনিয়ন পাওয়া যায়নি';

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
            {isAutoDetecting ? 'লোকেশন শনাক্ত হচ্ছে...' : 'বর্তমান লোকেশন ব্যবহার করুন'}
          </button>
          {autoDetectMessage ? <span className="location-autofill-message">{autoDetectMessage}</span> : null}
        </div>
      ) : null}

      {error ? (
        <div className="error-message location-error-inline">
          <span>{error}</span>
          <button type="button" className="retry-inline-btn" onClick={retryCurrentLevel}>
            আবার চেষ্টা করুন
          </button>
        </div>
      ) : null}

      <div className="location-select-wrapper">
        <label htmlFor={`${idPrefix}DivisionSelect`}>বিভাগ</label>
        <select
          id={`${idPrefix}DivisionSelect`}
          value={selectedDivision}
          onChange={handleDivisionChange}
          disabled={isLoadingDivisions}
          required={required}
        >
          <option value="">
            {isLoadingDivisions
              ? 'বিভাগ লোড হচ্ছে...'
              : isFilterMode
                ? 'সব বিভাগ'
                : 'আগে বিভাগ নির্বাচন করুন'}
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
          জেলা {isLoadingDistricts && <span className="loading-indicator">লোড হচ্ছে...</span>}
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
              ? 'আগে বিভাগ নির্বাচন করুন'
              : isFilterMode
                ? 'সব জেলা'
                : 'জেলা নির্বাচন করুন'}
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
          উপজেলা {isLoadingUpazilas && <span className="loading-indicator">লোড হচ্ছে...</span>}
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
              ? 'আগে জেলা নির্বাচন করুন'
              : isFilterMode
                ? 'সব উপজেলা'
                : 'উপজেলা নির্বাচন করুন'}
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
          এলাকার ধরন{' '}
          {(isLoadingUnions || isLoadingPouroshavas) && (
            <span className="loading-indicator">লোড হচ্ছে...</span>
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
              ? 'আগে উপজেলা নির্বাচন করুন'
              : isLoadingUnions || isLoadingPouroshavas
                ? 'এলাকার ধরন লোড হচ্ছে...'
                : areaTypeOptions.length > 1
                  ? 'এলাকার ধরন নির্বাচন করুন'
                  : areaTypeOptions.length === 1
                    ? areaTypeOptions[0].label
                    : 'এলাকার ধরন পাওয়া যায়নি'}
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
            <label htmlFor={`${idPrefix}WardNumberInput`}>ওয়ার্ড নম্বর</label>
            <input
              id={`${idPrefix}WardNumberInput`}
              type="number"
              min="1"
              step="1"
              className="location-search-input"
              value={selectedWardNumber}
              onChange={handleWardNumberChange}
              placeholder="ওয়ার্ড নম্বর লিখুন"
              required={required}
            />
          </>
        ) : null}
      </div>

      <div className="location-select-wrapper">
        <label htmlFor={`${idPrefix}UnionSelect`}>
          এলাকার নাম{' '}
          {isLoadingSelectedAreaType && <span className="loading-indicator">লোড হচ্ছে...</span>}
        </label>

        {hasValidUpazilaSelection && isLoadingSelectedAreaType ? (
          <div className="location-union-loading">নির্বাচিত এলাকার অপশন লোড হচ্ছে...</div>
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
                  ? 'পৌরসভা খুঁজুন বা নির্বাচন করুন'
                  : 'ইউনিয়ন খুঁজুন বা নির্বাচন করুন'
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
                  ? 'এই নামে কোনো পৌরসভা পাওয়া যায়নি'
                  : 'এই নামে কোনো ইউনিয়ন পাওয়া যায়নি'
                : unionEmptyMessage
            }
          />
        ) : null}

        {shouldRenderManualUnionInput ? (
          <>
            <label htmlFor={`${idPrefix}ManualUnionInput`}>
              {selectedAreaType === 'pouroshava'
                ? 'পৌরসভার নাম (তালিকায় না থাকলে)'
                : 'ইউনিয়নের নাম (তালিকায় না থাকলে)'}
            </label>
            <input
              id={`${idPrefix}ManualUnionInput`}
              type="text"
              className="location-search-input"
              value={manualUnionName}
              onChange={handleManualUnionChange}
              placeholder={
                selectedAreaType === 'pouroshava'
                  ? 'তালিকায় না থাকলে পৌরসভার নাম লিখুন'
                  : 'তালিকায় না থাকলে ইউনিয়নের নাম লিখুন'
              }
              required={required && !selectedUnion}
            />
          </>
        ) : null}
      </div>
    </div>
  );
};
