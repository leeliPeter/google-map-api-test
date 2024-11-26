"use client";

import React, { useState, useRef, useEffect } from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import { Library } from "@googlemaps/js-api-loader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
interface MapProps {
  LatLng: [number, number];
}
const libs: Library[] = ["core", "places", "maps", "marker"];

const buildInfoCardContent = (name: string) => {
  return `<div>${name}</div>`;
};

export default function Map({ LatLng }: MapProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [autocomplete, setAutocomplete] =
    useState<google.maps.places.Autocomplete | null>(null);
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries: libs,
  });
  const mapRef = useRef<HTMLDivElement>(null);
  const autocompleteRef = useRef<HTMLInputElement | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<string | null>(null);
  useEffect(() => {
    if (isLoaded) {
      const mapOptions = {
        center: {
          lat: LatLng[0],
          lng: LatLng[1],
        },
        zoom: 17,
        mapId: "123",
      };
      const gMap = new google.maps.Map(
        mapRef.current as HTMLDivElement,
        mapOptions
      );
      // limit zoom
      const ontarioBounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(43.18, -79.8),
        new google.maps.LatLng(44.75, -81.25)
      );
      gMap.fitBounds(ontarioBounds);

      // setup autocomplete
      const gAutocomplete = new google.maps.places.Autocomplete(
        autocompleteRef.current as HTMLInputElement,
        {
          bounds: ontarioBounds,
          fields: ["address_components", "geometry", "icon", "name"],
          componentRestrictions: {
            country: "CA",
          },
        }
      );
      setAutocomplete(gAutocomplete);
      setMap(gMap);
    }
  }, [isLoaded]);

  useEffect(() => {
    if (autocomplete) {
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        setSelectedPlace(place.name || null);

        const position = place.geometry?.location;
        if (position) {
          //palce a marker
          setMarker(position, place.name || "");
        }
      });
    }
  }, [autocomplete]);

  function setMarker(position: google.maps.LatLng, name: string) {
    if (!map) return;
    map.setCenter(position);
    const marker = new google.maps.Marker({
      position,
      map,
      title: name,
    });

    const infoCard = new google.maps.InfoWindow({
      content: buildInfoCardContent(name),
    });
    infoCard.open(map, marker);
  }
  return (
    <div className="flex flex-col space-y-4">
      <Input ref={autocompleteRef} />
      <Label>Selected Place: {selectedPlace}</Label>
      {isLoaded ? (
        <div ref={mapRef} className=" h-[600px]"></div>
      ) : (
        <div>loading...</div>
      )}
    </div>
  );
}
