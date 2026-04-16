import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';

import { donorSearchService } from '../../donors/services/donorSearchService.js';
import { DonorGridSection } from '../components/DonorGridSection.jsx';
import { FilterPanel } from '../components/FilterPanel.jsx';
import { HeroSection } from '../components/HeroSection.jsx';
import { HomeCtaSection } from '../components/HomeCtaSection.jsx';
import { HomeFooter } from '../components/HomeFooter.jsx';
import { PriorityDonorsSection } from '../components/PriorityDonorsSection.jsx';

const URGENT_BLOOD_GROUPS = new Set(['O-', 'AB-', 'B-']);

export const HomePage = () => {
  const [filters, setFilters] = useState({
    bloodGroup: '',
    availabilityStatus: '',
    divisionId: '',
    districtId: '',
    upazilaId: '',
    unionId: '',
  });
  const [locationResetKey, setLocationResetKey] = useState(0);
  const [donors, setDonors] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 0, total: 0, limit: 9 });
  const [isLoading, setIsLoading] = useState(true);
  const [locationCaptureMessage, setLocationCaptureMessage] = useState('');

  const onFilterChange = (key, value) => {
    setFilters((previous) => ({ ...previous, [key]: value }));
    setMeta((previous) => ({ ...previous, page: 1 }));
  };

  const onLocationChange = (value) => {
    setFilters((previous) => ({
      ...previous,
      divisionId: value.divisionId,
      districtId: value.districtId,
      upazilaId: value.upazilaId,
      unionId: value.unionId,
    }));
    setMeta((previous) => ({ ...previous, page: 1 }));
  };

  const resetFilters = () => {
    setFilters({
      bloodGroup: '',
      availabilityStatus: '',
      divisionId: '',
      districtId: '',
      upazilaId: '',
      unionId: '',
    });
    setLocationResetKey((previous) => previous + 1);
    setMeta((previous) => ({ ...previous, page: 1 }));
  };

  const captureLocationForNearest = () => {
    if (!navigator.geolocation) {
      setLocationCaptureMessage('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationCaptureMessage(
          `Location captured (${position.coords.latitude.toFixed(3)}, ${position.coords.longitude.toFixed(3)}). Nearest donor ranking will be enabled soon.`,
        );
      },
      () => {
        setLocationCaptureMessage('Unable to capture your location. Please allow permission.');
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
      },
    );
  };

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      setIsLoading(true);

      try {
        const response = await donorSearchService.search({
          ...filters,
          page: meta.page,
          limit: meta.limit,
        });

        setDonors(response.data);
        setMeta((previous) => ({
          ...previous,
          page: response.meta?.page || previous.page,
          totalPages: response.meta?.totalPages || 0,
          total: response.meta?.total || 0,
          limit: response.meta?.limit || previous.limit,
        }));
      } catch (requestError) {
        toast.error(requestError?.response?.data?.message || 'Failed to load donors.');
        setDonors([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [filters, meta.page, meta.limit]);

  const priorityDonors = useMemo(() => {
    const urgent = donors.filter(
      (donorProfile) =>
        URGENT_BLOOD_GROUPS.has(donorProfile.bloodGroup) &&
        donorProfile.availabilityStatus === 'available',
    );

    if (urgent.length) {
      return urgent.slice(0, 4);
    }

    return [...donors]
      .sort((a, b) => {
        const aDate = a.lastDonationDate ? new Date(a.lastDonationDate).getTime() : 0;
        const bDate = b.lastDonationDate ? new Date(b.lastDonationDate).getTime() : 0;
        return bDate - aDate;
      })
      .slice(0, 4);
  }, [donors]);

  return (
    <section className="feature-page reveal home-page-stack">
      <HeroSection />

      <FilterPanel
        filters={filters}
        onFilterChange={onFilterChange}
        onLocationChange={onLocationChange}
        onReset={resetFilters}
        locationResetKey={locationResetKey}
        onCaptureLocation={captureLocationForNearest}
        locationCaptureMessage={locationCaptureMessage}
      />

      <PriorityDonorsSection donors={priorityDonors} />

      <DonorGridSection
        title="Available Donors"
        donors={donors}
        isLoading={isLoading}
        emptyMessage="No donors matched your filters. Try adjusting blood group, district, upazila, or availability."
        currentPage={meta.page}
        totalPages={meta.totalPages}
        onPageChange={(nextPage) =>
          setMeta((previous) => ({
            ...previous,
            page: Math.max(1, Math.min(previous.totalPages || 1, nextPage)),
          }))
        }
      />

      <HomeCtaSection />
      <HomeFooter />
    </section>
  );
};

export default HomePage;
