"use client";

import { useLoadScript, GoogleMap } from "@react-google-maps/api";
import { useState, useEffect, useRef } from "react";

const containerStyle = {
  width: "100%",
  height: "600px",
};

const defaultCenter = {
  lat: 25.033,
  lng: 121.5654,
};

const libraries: "places"[] = ["places"];

interface PlaceInfo {
  name: string;
  address: string;
  position: google.maps.LatLngLiteral;
  placeId?: string;
}

interface MapClickEvent extends google.maps.MapMouseEvent {
  placeId?: string;
}

export default function Map() {
  const [isBrowser, setIsBrowser] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceInfo | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchBoxRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    setIsBrowser(true);
  }, []);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries,
  });

  const handleMapClick = (event: MapClickEvent) => {
    const placeId = event.placeId;
    if (!placeId || !map) {
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
      setSelectedPlace(null);
      return;
    }

    showPlaceDetails(placeId, map);
  };

  const showPlaceDetails = (placeId: string, map: google.maps.Map) => {
    const service = new google.maps.places.PlacesService(map);
    service.getDetails(
      {
        placeId: placeId,
        fields: [
          "name",
          "formatted_address",
          "geometry",
          "place_id",
          "photos",
          "rating",
          "user_ratings_total",
          "opening_hours",
        ],
      },
      (place, status) => {
        if (
          status === google.maps.places.PlacesServiceStatus.OK &&
          place &&
          place.geometry &&
          place.geometry.location
        ) {
          const content = document.createElement("div");
          content.className = "custom-info-window";

          const photoUrl = place.photos?.[0]?.getUrl({
            maxWidth: 400,
            maxHeight: 200,
          });

          const rating = place.rating || 0;
          const fullStars = Math.floor(rating);
          const hasHalfStar = rating % 1 >= 0.5;
          const stars =
            "★".repeat(fullStars) +
            (hasHalfStar ? "½" : "") +
            "☆".repeat(5 - fullStars - (hasHalfStar ? 1 : 0));

          let openingHoursHtml = "";
          if (place.opening_hours) {
            const isOpen = place.opening_hours.isOpen()
              ? '<span class="text-green-600 font-medium">Open now</span>'
              : '<span class="text-red-600 font-medium">Closed now</span>';

            openingHoursHtml = `
              <div class="mb-3">
                <div class="mb-1">${isOpen}</div>
                <div class="text-xs text-gray-600">
                  ${place.opening_hours.weekday_text
                    ?.map((day) => `<div>${day}</div>`)
                    .join("")}
                </div>
              </div>
            `;
          }

          content.innerHTML = `
            <div class="max-w-[300px]">
              ${
                photoUrl
                  ? `<div class="mb-4">
                      <img 
                        src="${photoUrl}" 
                        alt="${place.name || ""}"
                        class="w-full h-48 object-cover rounded-lg"
                      />
                    </div>`
                  : ""
              }
              <div class="text-sm font-bold text-black mb-2">
                ${place.name || ""}
              </div>
              
              ${
                place.rating
                  ? `
                <div class="mb-2">
                  <span class="text-yellow-500">${stars}</span>
                  <span class="text-sm text-gray-600 ml-1">
                    ${place.rating} (${place.user_ratings_total} reviews)
                  </span>
                </div>
              `
                  : ""
              }
              
              ${openingHoursHtml}
              
              <div class="text-gray-600 mb-3">
                ${place.formatted_address || ""}
              </div>
              <div>
                <a
                  href="https://maps.google.com/maps?ll=${place.geometry.location.lat()},${place.geometry.location.lng()}&z=21&t=m&hl=en-US&gl=US&mapclient=apiv3${
            place.place_id ? `&cid=${place.place_id}` : ""
          }"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-blue-500 hover:text-blue-700 text-sm"
                >
                  View on Google Maps
                </a>
              </div>
            </div>
          `;

          if (infoWindowRef.current) {
            infoWindowRef.current.close();
          }

          const infoWindow = new google.maps.InfoWindow({
            content,
            position: {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
            },
          });

          infoWindowRef.current = infoWindow;
          infoWindow.open(map);
        }
      }
    );
  };

  // Initialize search box
  useEffect(() => {
    if (isLoaded && searchInputRef.current && map) {
      const autocomplete = new google.maps.places.Autocomplete(
        searchInputRef.current
      );
      autocomplete.bindTo("bounds", map);

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();

        if (!place.geometry || !place.geometry.location || !place.place_id) {
          return;
        }

        // Center map on the selected place
        map.setCenter(place.geometry.location);
        map.setZoom(17);

        // Show place details in InfoWindow
        showPlaceDetails(place.place_id, map);

        // Clear the search input
        if (searchInputRef.current) {
          searchInputRef.current.value = "";
        }
      });

      searchBoxRef.current = autocomplete;
    }
  }, [isLoaded, map]);

  const handleMapLoad = (map: google.maps.Map) => {
    setMap(map);

    if (map) {
      map.addListener("click", handleMapClick);
    }
  };

  const handleSearch = () => {
    if (searchBoxRef.current && searchInputRef.current) {
      const place = searchBoxRef.current.getPlace();
      if (
        place &&
        place.geometry &&
        place.geometry.location &&
        place.place_id
      ) {
        // Center map on the selected place
        map?.setCenter(place.geometry.location);
        map?.setZoom(17);

        // Show place details in InfoWindow
        showPlaceDetails(place.place_id, map!);

        // Clear the search input
        searchInputRef.current.value = "";
      }
    }
  };

  if (!isBrowser) return null;
  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading...</div>;

  return (
    <div className="relative">
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 w-96 max-w-[90%]">
        <div className="flex gap-2">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search places..."
            className="w-full px-4 py-2 rounded-lg shadow-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
          />
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
          </button>
        </div>
      </div>
      <GoogleMap
        mapContainerStyle={containerStyle}
        zoom={14}
        center={defaultCenter}
        onLoad={handleMapLoad}
        options={{
          zoomControl: true,
          streetViewControl: true,
          mapTypeControl: true,
          fullscreenControl: true,
          clickableIcons: true,
        }}
      />
    </div>
  );
}
