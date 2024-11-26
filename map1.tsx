"use client";
import React, { useEffect } from "react";
import { Loader } from "@googlemaps/js-api-loader";
export default function Map() {
  const mapRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initMap = async () => {
      const loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
        version: "weekly",
      });
      const { Map } = await loader.importLibrary("maps");
      //init a marker
      const { Marker } = (await loader.importLibrary(
        "marker"
      )) as google.maps.MarkerLibrary;
      const position = { lat: 23.683, lng: 120.266 };
      const mapOptions: google.maps.MapOptions = {
        center: position,
        zoom: 15,
        mapId: "123123",
      };
      // set the map
      const map = new Map(mapRef.current as HTMLElement, mapOptions);

      // add a marker
      const marker = new Marker({
        map: map,
        position: position,
      });
    };

    initMap();
  }, []);
  return <div className="h-[600px] w-full" ref={mapRef}></div>;
}
