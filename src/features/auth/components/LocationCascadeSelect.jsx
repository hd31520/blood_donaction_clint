import { LocationSelector } from '../../../components/location/LocationSelector.jsx';

export const LocationCascadeSelect = ({ onLocationChange }) => {
  return (
    <LocationSelector
      mode="required"
      required
      idPrefix="register"
      onChange={(value) => {
        onLocationChange?.({
          divisionId: value.divisionId,
          districtId: value.districtId,
          upazilaId: value.upazilaId,
          areaType: value.areaType,
          unionId: value.unionId,
          wardNumber: value.wardNumber,
          locationNames: value.locationNames,
        });
      }}
    />
  );
};
