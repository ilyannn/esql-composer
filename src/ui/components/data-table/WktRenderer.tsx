import React, { useEffect, useRef } from "react";
import Map from "ol/Map";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import WKT from "ol/format/WKT";
import { Circle, Fill, Stroke, Style } from "ol/style";
import "ol/ol.css";

interface WktRendererProps {
  wkt: string;
  height?: string;
  width?: string;
}

export const WktRenderer: React.FC<WktRendererProps> = ({
  wkt,
  height = "100px",
  width = "100px",
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);

  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      // Create vector source and parse WKT
      const wktFormat = new WKT();
      const feature = wktFormat.readFeature(wkt);

      // Create vector layer
      const vectorSource = new VectorSource({
        features: [feature],
      });

      // Style for the geometry
      const vectorLayer = new VectorLayer({
        source: vectorSource,
        style: new Style({
          fill: new Fill({
            color: "rgba(0, 0, 240, 0.15)",
          }),
          stroke: new Stroke({
            color: "#0000f0",
            width: 2,
          }),
          image: new Circle({
            radius: 3,
            fill: new Fill({ color: "rgba(64, 64, 64, 0.50)" }),
            stroke: new Stroke({
              color: "blue",
              width: 2,
            }),
          }),
        }),
      });

      // Create map
      const map = new Map({
        target: mapRef.current,
        layers: [vectorLayer],
        controls: [],
      });

      // Fit view to feature extent
      const extent = vectorSource.getExtent();
      map.getView().fit(extent, {
        padding: [5, 5, 5, 5],
      });

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setTarget(undefined);
        mapInstanceRef.current = null;
      }
    };
  }, [wkt]);

  return <div ref={mapRef} style={{ height, width }} />;
};
