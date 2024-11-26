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

  useEffect(() => {
    setIsBrowser(true);
  }, []);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries,
  });

  const handleMapLoad = (map: google.maps.Map) => {
    setMap(map);

    if (map) {
      map.addListener("click", (event: MapClickEvent) => {
        const placeId = event.placeId;
        if (!placeId) {
          if (infoWindowRef.current) {
            infoWindowRef.current.close();
          }
          setSelectedPlace(null);
          return;
        }

        const service = new google.maps.places.PlacesService(map);
        service.getDetails(
          {
            placeId: placeId,
            fields: ["name", "formatted_address", "geometry", "place_id"],
          },
          (place, status) => {
            if (
              status === google.maps.places.PlacesServiceStatus.OK &&
              place &&
              place.geometry &&
              place.geometry.location
            ) {
              // Create custom InfoWindow content
              const content = document.createElement("div");
              content.className = "custom-info-window";
              content.innerHTML = `
                <div class="p-4">
                  <div class="text-4xl font-bold text-blue-500 mb-2">
                    ${place.name || ""}
                  </div>
                  <div class="text-pink-600 mb-3">
                    ${place.formatted_address || ""}
                  </div>
                  <div>
                    <a
                      href="https://maps.google.com/maps?ll=${place.geometry.location.lat()},${place.geometry.location.lng()}&z=21&t=m&hl=en-US&gl=US&mapclient=apiv3${
                place.place_id ? `&cid=${place.place_id}` : ""
              }"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-blue-500 hover:text-blue-700"
                    >
                      View on Google Maps
                    </a>
                  </div>
                </div>
              `;

              // Close existing InfoWindow if any
              if (infoWindowRef.current) {
                infoWindowRef.current.close();
              }

              // Create and open new InfoWindow
              const infoWindow = new google.maps.InfoWindow({
                content,
                position: {
                  lat: place.geometry.location.lat(),
                  lng: place.geometry.location.lng(),
                },
              });

              // Store the reference to the new InfoWindow
              infoWindowRef.current = infoWindow;

              // Open the InfoWindow
              infoWindow.open(map);
            }
          }
        );
      });
    }
  };

  if (!isBrowser) return null;
  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading...</div>;

  return (
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
  );
}
