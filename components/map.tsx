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
        event.stop?.();

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
              // Create custom InfoWindow content
              const content = document.createElement("div");
              content.className = "custom-info-window";

              // Get the first photo if available
              const photoUrl = place.photos?.[0]?.getUrl({
                maxWidth: 400,
                maxHeight: 200,
              });

              content.innerHTML = `
                <div class="p-0 max-w-[300px]">
                  ${
                    photoUrl
                      ? `<div class="mb-4">
                          <img 
                            src="${photoUrl}" 
                            alt="${place.name || ""}"
                            class="w-60 h-48 object-cover rounded-lg"
                          />
                        </div>`
                      : ""
                  }
                  <div class="text-lg font-bold text-blue-500 mb-2">
                    ${place.name || ""}
                  </div>
                  
                  ${
                    place.rating
                      ? `<div class="mb-2">
                          <div class="text-yellow-500 text-sm">
                            ${"★".repeat(Math.floor(place.rating))}${
                          place.rating % 1 >= 0.5 ? "½" : ""
                        }${"☆".repeat(5 - Math.ceil(place.rating))}
                          </div>
                          <div class="text-gray-600 text-sm">
                            ${place.rating} (${
                          place.user_ratings_total
                        } reviews)
                          </div>
                        </div>`
                      : ""
                  }
                  
                  ${
                    place.opening_hours
                      ? `<div class="mb-3">
                          <div class="mb-1 text-sm">
                            ${
                              place.opening_hours.isOpen()
                                ? '<span class="text-green-600 font-medium">Open now</span>'
                                : '<span class="text-red-600 font-medium">Closed now</span>'
                            }
                          </div>
                          <div class="text-xs text-gray-600">
                            ${place.opening_hours.weekday_text
                              ?.map((day) => `<div>${day}</div>`)
                              .join("")}
                          </div>
                        </div>`
                      : ""
                  }

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

              // Add debug log
              console.log("Place details:", place);
              console.log("Has photos:", !!place.photos);
              if (place.photos) {
                console.log("Number of photos:", place.photos.length);
              }

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
    <div className="relative">
      <GoogleMap
        mapContainerStyle={containerStyle}
        zoom={14}
        center={defaultCenter}
        onLoad={handleMapLoad}
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          clickableIcons: true,
          disableDefaultUI: false,
        }}
        onClick={(e: google.maps.MapMouseEvent) => {
          // Prevent default InfoWindow
          e.stop?.();
        }}
      />
    </div>
  );
}
