import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "../../style/LiveLocation.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const FitMapToMarkers = ({ locations }) => {
  const map = useMap();

  useEffect(() => {
    if (!locations || locations.length === 0) return;

    const bounds = locations.map((loc) => [
      Number(loc.latitude),
      Number(loc.longitude),
    ]);

    map.fitBounds(bounds, { padding: [40, 40] });
  }, [locations, map]);

  return null;
};

const LiveLocation = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");

  const fetchLocations = async () => {
    try {
      const res = await axios.get(
        "http://https://employee-analysis-system-1.onrender.com//api/admin/live-locations",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Live locations API response:", res.data);

      setLocations(Array.isArray(res.data) ? res.data : []);
      setError("");
    } catch (err) {
      console.error("Error fetching live locations:", err);
      setError(
        err?.response?.data?.message || "Failed to load live locations"
      );
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();

    const interval = setInterval(() => {
      fetchLocations();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="">
      <div className="">
        <h2 >WFH Live Location Tracking</h2>
        {/* <p>Active work from home employees ni live location ahi show thase.</p>
        <p><strong>Total Locations:</strong> {locations.length}</p>
        {error && <p className="live-location-error">{error}</p>} */}
      </div>

      {loading && (
        <div className="live-location-empty">
          <p>Loading map...</p>
        </div>
      )}

      {!loading && locations.length === 0 && (
        <div className="live-location-empty">
          <p>No active WFH employee found.</p>
        </div>
      )}

      {!loading && locations.length > 0 && (
        <>
          <div className="live-location-map-wrapper">
            <MapContainer
              center={[20.5937, 78.9629]}
              zoom={5}
              className="live-location-map"
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <FitMapToMarkers locations={locations} />

              {locations.map((loc) => (
                <Marker
                  key={loc._id}
                  position={[Number(loc.latitude), Number(loc.longitude)]}
                >
                  <Popup>
  <div>
    <strong>
      {loc.employeeId?.firstName} {loc.employeeId?.lastName}
    </strong>
    <br />
    {loc.employeeId?.email}
    <br />
    Work Type: {loc.workType}
    <br />
    Location: {loc.locationName || "Location not available"}
    <br />
    Last Updated:{" "}
    {loc.lastUpdated
      ? new Date(loc.lastUpdated).toLocaleString()
      : "N/A"}
    <br />
    Lat: {loc.latitude}
    <br />
    Lng: {loc.longitude}
  </div>
</Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          <div className="live-location-list">
            <h3>Active Employees</h3>
            <div className="live-location-cards">
              {locations.map((loc) => (
                <div className="live-location-card" key={loc._id}>
                  <h4>
                    {loc.employeeId?.firstName} {loc.employeeId?.lastName}
                  </h4>
                  <p>{loc.employeeId?.email}</p>
                  <p><strong>Work Type:</strong> {loc.workType}</p>
                  <p><strong>Location:</strong> {loc.locationName || "Location not available"}</p>
                  <p><strong>Latitude:</strong> {loc.latitude}</p>
                  <p><strong>Longitude:</strong> {loc.longitude}</p>
                  <p>
                    <strong>Last Updated:</strong>{" "}
                    {loc.lastUpdated
                      ? new Date(loc.lastUpdated).toLocaleString()
                      : "N/A"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LiveLocation;