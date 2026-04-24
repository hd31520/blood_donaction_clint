// ONLY CHANGE PART SHOWN BELOW
// replace LocationSelector in create form

<LocationSelector
  mode="required"
  idPrefix="patientCreate"
  resetKey={formLocationResetKey}
  enableAutoDetect={true}
  onChange={(value) => {
    setCreateLocation({
      divisionId: value.divisionId,
      districtId: value.districtId,
      upazilaId: value.upazilaId,
      unionId: value.unionId,
      areaName: value.locationNames?.union || '',
    });
  }}
/>
