import { useEffect, useMemo, useState } from "react";
import {
  AttributionControl,
  CircleMarker,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import { divIcon } from "leaflet";
import { LocateFixed, MapPin, Search } from "lucide-react";
import "leaflet/dist/leaflet.css";
import "./LocationMap.css";

export type MapPoint = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  city?: string;
  district?: string;
  meta?: string;
};

type Props = {
  points: MapPoint[];
  selectedId: string;
  onSelect: (point: MapPoint) => void;
  title?: string;
};

const radians = (value: number) => (value * Math.PI) / 180;
const distanceKm = (from: [number, number], point: MapPoint) => {
  const earth = 6371;
  const lat = radians(point.lat - from[0]);
  const lng = radians(point.lng - from[1]);
  const a =
    Math.sin(lat / 2) ** 2 +
    Math.cos(radians(from[0])) *
      Math.cos(radians(point.lat)) *
      Math.sin(lng / 2) ** 2;
  return earth * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

function FocusPoint({ point }: { point?: MapPoint }) {
  const map = useMap();
  useEffect(() => {
    if (point)
      map.flyTo([point.lat, point.lng], Math.max(map.getZoom(), 14), {
        duration: 0.45,
      });
  }, [map, point]);
  return null;
}

const markerIcon = (active: boolean, index: number) =>
  divIcon({
    className: "eh-map-marker-wrap",
    html: `<span class="eh-map-marker ${active ? "active" : ""}"><i>${index + 1}</i></span>`,
    iconSize: [34, 42],
    iconAnchor: [17, 40],
  });

export function LocationMap({
  points,
  selectedId,
  onSelect,
  title = "Выберите точку",
}: Props) {
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [geoStatus, setGeoStatus] = useState("");
  const normalized = query.trim().toLocaleLowerCase("ru");

  const visible = useMemo(() => {
    const filtered = normalized
      ? points.filter((point) =>
          [point.name, point.address, point.city, point.district, point.meta]
            .filter(Boolean)
            .some((value) =>
              value!.toLocaleLowerCase("ru").includes(normalized),
            ),
        )
      : points;
    return position
      ? [...filtered].sort(
          (a, b) => distanceKm(position, a) - distanceKm(position, b),
        )
      : filtered;
  }, [normalized, points, position]);

  const selected = points.find((point) => point.id === selectedId) ?? points[0];
  const locate = () => {
    if (!navigator.geolocation) {
      setGeoStatus("Геолокация недоступна в этом браузере");
      return;
    }
    setGeoStatus("Определяем положение…");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setPosition([coords.latitude, coords.longitude]);
        setGeoStatus("Расстояния рассчитаны от вашего положения");
      },
      () => setGeoStatus("Не удалось получить геолокацию"),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    );
  };

  if (!points.length) return null;

  return (
    <section className="eh-location-picker" aria-label={title}>
      <div className="eh-location-heading">
        <div>
          <span>Точки на карте</span>
          <h2>{title}</h2>
        </div>
        <button type="button" className="eh-locate" onClick={locate}>
          <LocateFixed size={17} /> Рядом со мной
        </button>
      </div>
      <label className="eh-location-search">
        <Search size={18} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Адрес, район или название"
          aria-label="Поиск точки"
        />
      </label>
      {geoStatus && (
        <p className="eh-geo-status" role="status">
          {geoStatus}
        </p>
      )}
      <div className="eh-map-shell">
        <MapContainer
          center={[selected.lat, selected.lng]}
          zoom={13}
          scrollWheelZoom={false}
          attributionControl={false}
          className="eh-map"
        >
          <TileLayer
            attribution="© OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <AttributionControl prefix={false} />
          <FocusPoint point={selected} />
          {position && (
            <CircleMarker
              center={position}
              radius={8}
              pathOptions={{
                color: "#ffffff",
                fillColor: "#2563eb",
                fillOpacity: 1,
                weight: 3,
              }}
            >
              <Popup>Ваше положение</Popup>
            </CircleMarker>
          )}
          {visible.map((point, index) => (
            <Marker
              key={point.id}
              position={[point.lat, point.lng]}
              icon={markerIcon(point.id === selected.id, index)}
              eventHandlers={{ click: () => onSelect(point) }}
            >
              <Popup>
                <b>{point.name}</b>
                <br />
                {point.address}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      <div className="eh-location-list">
        {visible.length ? (
          visible.map((point) => {
            const distance = position ? distanceKm(position, point) : null;
            return (
              <button
                type="button"
                key={point.id}
                className={point.id === selected.id ? "active" : ""}
                onClick={() => onSelect(point)}
              >
                <span className="eh-location-index">
                  <MapPin size={16} />
                </span>
                <span>
                  <b>{point.name}</b>
                  <small>{point.address}</small>
                  {point.meta && <em>{point.meta}</em>}
                </span>
                {distance !== null && (
                  <strong>
                    {distance < 1
                      ? `${Math.round(distance * 1000)} м`
                      : `${distance.toFixed(1)} км`}
                  </strong>
                )}
              </button>
            );
          })
        ) : (
          <div className="eh-location-empty">
            <Search />
            <b>Ничего не найдено</b>
            <span>Измените адрес, район или название.</span>
          </div>
        )}
      </div>
      <p className="eh-location-note">
        Ближайшие точки и расстояния показываются только после разрешения
        геолокации.
      </p>
    </section>
  );
}
