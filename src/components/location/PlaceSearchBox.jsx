import { useEffect, useRef } from 'react';

export const PlaceSearchBox = ({ onSelect }) => {
  const inputRef = useRef(null);

  useEffect(() => {
    if (!window.google || !window.google.maps || !window.google.maps.places) {
      return;
    }

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['geocode'],
      componentRestrictions: { country: 'bd' },
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();

      const lat = place.geometry?.location?.lat();
      const lng = place.geometry?.location?.lng();

      if (lat && lng) {
        onSelect?.({ lat, lng, place });
      }
    });
  }, [onSelect]);

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder="লোকেশন খুঁজুন (Google Map)"
      className="location-search-input"
    />
  );
};
