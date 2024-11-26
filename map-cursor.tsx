// "use client";
// import React, { useEffect, useRef, useState } from "react";
// import { CustomInfoWindow } from "./custom-info-window";

// interface LocationInfo {
//   id: string;
//   name: string;
//   address: string;
//   lat: number;
//   lng: number;
//   photoUrl?: string;
// }

// interface SearchResult {
//   place_id: string;
//   description: string;
// }

// export default function Map() {
//   const mapRef = useRef<HTMLDivElement>(null);
//   const [map, setMap] = useState<google.maps.Map | null>(null);
//   const [selectedLocation, setSelectedLocation] = useState<LocationInfo | null>(
//     null
//   );
//   const [savedLocations, setSavedLocations] = useState<LocationInfo[]>([]);
//   const [searchValue, setSearchValue] = useState("");
//   const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

//   const getPlaceDetails = async (placeId: string, map: google.maps.Map) => {
//     const placesService = new google.maps.places.PlacesService(map);

//     return new Promise((resolve, reject) => {
//       placesService.getDetails(
//         {
//           placeId: placeId,
//           fields: [
//             "name",
//             "formatted_address",
//             "photos",
//             "geometry",
//             "rating",
//             "user_ratings_total",
//             "formatted_phone_number",
//             "international_phone_number",
//             "website",
//             "url",
//             "types",
//             "opening_hours",
//             "reviews",
//             "price_level",
//             "business_status",
//             "address_components",
//           ],
//         },
//         (place, status) => {
//           if (status === google.maps.places.PlacesServiceStatus.OK && place) {
//             console.log("Selected Place Details:", {
//               name: place.name,
//               address: place.formatted_address,
//               location: {
//                 lat: place.geometry?.location?.lat(),
//                 lng: place.geometry?.location?.lng(),
//               },
//               photos: place.photos?.map((photo) => ({
//                 url: photo.getUrl({ maxWidth: 800, maxHeight: 600 }),
//                 height: photo.height,
//                 width: photo.width,
//               })),
//               rating: place.rating,
//               totalRatings: place.user_ratings_total,
//               phone: {
//                 local: place.formatted_phone_number,
//                 international: place.international_phone_number,
//               },
//               website: place.website,
//               googleMapsUrl: place.url,
//               types: place.types,
//               openingHours: place.opening_hours?.weekday_text,
//               isOpen: place.opening_hours?.isOpen(),
//               reviews: place.reviews?.map((review) => ({
//                 author: review.author_name,
//                 rating: review.rating,
//                 text: review.text,
//                 time: new Date(review.time * 1000).toLocaleString(),
//               })),
//               priceLevel: place.price_level,
//               businessStatus: place.business_status,
//               addressComponents: place.address_components?.map((component) => ({
//                 long: component.long_name,
//                 short: component.short_name,
//                 types: component.types,
//               })),
//             });

//             const photoUrl = place.photos?.[0]?.getUrl({
//               maxWidth: 800,
//               maxHeight: 600,
//             });

//             const locationInfo: LocationInfo = {
//               id: placeId,
//               name: place.name || "",
//               address: place.formatted_address || "",
//               lat: place.geometry?.location?.lat() || 0,
//               lng: place.geometry?.location?.lng() || 0,
//               photoUrl,
//             };
//             resolve(locationInfo);
//           } else {
//             reject(new Error("Failed to fetch place details"));
//           }
//         }
//       );
//     });
//   };

//   useEffect(() => {
//     const loadMap = async () => {
//       if (!mapRef.current) return;

//       try {
//         const map = new google.maps.Map(mapRef.current, {
//           center: { lat: 25.0374, lng: 121.5388 },
//           zoom: 15,
//           mapTypeControl: false,
//           streetViewControl: true,
//           zoomControl: true,
//           mapTypeId: "roadmap",
//           clickableIcons: false,
//         });

//         map.addListener("click", async (event: google.maps.MapMouseEvent) => {
//           const clickedLocation = event.latLng;
//           if (!clickedLocation) return;

//           try {
//             const geocoder = new google.maps.Geocoder();
//             const geoResponse = await geocoder.geocode({
//               location: clickedLocation,
//             });

//             if (geoResponse.results[0]) {
//               const locationInfo = await getPlaceDetails(
//                 geoResponse.results[0].place_id,
//                 map
//               );
//               setSelectedLocation(locationInfo as LocationInfo);
//             }
//           } catch (error) {
//             console.error("Error fetching place details:", error);
//           }
//         });

//         setMap(map);
//       } catch (error) {
//         console.error("Map initialization error:", error);
//       }
//     };

//     const script = document.createElement("script");
//     script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
//     script.async = true;
//     script.onload = loadMap;
//     document.head.appendChild(script);

//     return () => {
//       if (script.parentNode) {
//         script.parentNode.removeChild(script);
//       }
//     };
//   }, []);

//   // Add location to saved list
//   const handleSaveLocation = (location: LocationInfo) => {
//     setSavedLocations((prev) => {
//       // Check if location is already saved
//       if (prev.some((loc) => loc.id === location.id)) {
//         return prev;
//       }
//       return [...prev, location];
//     });
//   };

//   // Remove location from saved list
//   const handleRemoveLocation = (locationId: string) => {
//     setSavedLocations((prev) => prev.filter((loc) => loc.id !== locationId));
//   };

//   // Check if location is saved
//   const isLocationSaved = (locationId: string) => {
//     return savedLocations.some((loc) => loc.id === locationId);
//   };

//   // Handle search input
//   useEffect(() => {
//     if (!map || !searchValue || searchValue.length < 2) {
//       setSearchResults([]);
//       return;
//     }

//     const searchPlaces = async () => {
//       try {
//         const service = new google.maps.places.AutocompleteService();
//         const response = await service.getPlacePredictions({
//           input: searchValue,
//           componentRestrictions: { country: "tw" },
//           types: ["establishment", "geocode"],
//         });
//         setSearchResults(response?.predictions || []);
//       } catch (error) {
//         console.error("Search error:", error);
//         setSearchResults([]);
//       }
//     };

//     const timeoutId = setTimeout(searchPlaces, 300);
//     return () => clearTimeout(timeoutId);
//   }, [searchValue, map]);

//   // Handle search result selection
//   const handleSearchSelect = async (placeId: string) => {
//     if (!map) return;

//     try {
//       const locationInfo = (await getPlaceDetails(
//         placeId,
//         map
//       )) as LocationInfo;
//       setSelectedLocation(locationInfo);
//       setSearchResults([]); // Clear search results
//       setSearchValue(""); // Clear search input

//       // Center map on selected location
//       map.setCenter({
//         lat: locationInfo.lat,
//         lng: locationInfo.lng,
//       });
//       map.setZoom(17);
//     } catch (error) {
//       console.error("Error selecting place:", error);
//     }
//   };

//   return (
//     <div className="relative">
//       {/* Search Bar */}
//       <div className="absolute top-4 left-4 z-50 w-[350px]">
//         <div className="relative">
//           <input
//             type="text"
//             value={searchValue}
//             onChange={(e) => setSearchValue(e.target.value)}
//             placeholder="Search locations in Taiwan..."
//             className="w-full p-3 pl-10 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//           />
//           <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
//             🔍
//           </span>

//           {/* Search Results Dropdown */}
//           {searchResults.length > 0 && (
//             <div className="absolute w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-[300px] overflow-y-auto">
//               {searchResults.map((result: SearchResult) => (
//                 <button
//                   key={result.place_id}
//                   onClick={() => handleSearchSelect(result.place_id)}
//                   className="w-full p-3 text-left hover:bg-gray-100 border-b border-gray-200 last:border-b-0"
//                 >
//                   <p className="text-sm">{result.description}</p>
//                 </button>
//               ))}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Saved Locations List */}
//       {savedLocations.length > 0 && (
//         <div className="absolute top-4 right-4 z-50 bg-white rounded-lg shadow-xl border border-gray-200 w-[300px] max-h-[500px] overflow-y-auto">
//           <div className="p-4 border-b border-gray-200">
//             <h3 className="font-semibold">
//               Saved Locations ({savedLocations.length})
//             </h3>
//           </div>
//           <div className="p-2">
//             {savedLocations.map((location) => (
//               <div
//                 key={location.id}
//                 className="p-2 hover:bg-gray-50 rounded-md"
//               >
//                 <div className="flex justify-between items-start">
//                   <div>
//                     <p className="font-medium text-sm">{location.name}</p>
//                     <p className="text-xs text-gray-500">{location.address}</p>
//                   </div>
//                   <button
//                     onClick={() => handleRemoveLocation(location.id)}
//                     className="text-red-500 hover:text-red-600 text-xs"
//                   >
//                     Remove
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}

//       {/* Map Container */}
//       <div className="relative h-[600px] w-full">
//         {/* Map */}
//         <div ref={mapRef} className="h-full w-full rounded-lg shadow-lg" />

//         {/* Info Window - Positioned at bottom left of map */}
//         {selectedLocation && (
//           <div className="absolute bottom-8 left-8 z-50">
//             <CustomInfoWindow
//               location={selectedLocation}
//               onClose={() => setSelectedLocation(null)}
//               onSave={handleSaveLocation}
//               onRemove={handleRemoveLocation}
//               isSaved={isLocationSaved(selectedLocation.id)}
//             />
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
