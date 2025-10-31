import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import PropTypes from 'prop-types'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch'
import 'leaflet/dist/leaflet.css'
import 'leaflet-geosearch/dist/geosearch.css'
import './MapPicker.css'

// Fix for default marker icon in React-Leaflet
// This is a known issue with Webpack/Vite bundling
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

/**
 * SearchControl - Adds geocoding search to the map
 * Allows users to search for locations by name (e.g., "Helsinki", "New York")
 */
function SearchControl({ onLocationChange }) {
  const map = useMap()

  useEffect(() => {
    const provider = new OpenStreetMapProvider()
    
    const searchControl = new GeoSearchControl({
      provider,
      style: 'bar',
      showMarker: false, // We'll use our own marker
      showPopup: false,
      autoClose: true,
      retainZoomLevel: false,
      animateZoom: true,
      keepResult: false,
      searchLabel: 'Search for a location...',
    })

    map.addControl(searchControl)

    // Listen for search results
    map.on('geosearch/showlocation', (result) => {
      const { x, y } = result.location
      onLocationChange(y, x) // Note: OpenStreetMap returns [lon, lat]
    })

    return () => {
      map.removeControl(searchControl)
    }
  }, [map, onLocationChange])

  return null
}

/**
 * MapClickHandler - Handles click events on the map
 * Updates the marker position when user clicks on the map
 */
function MapClickHandler({ onLocationChange }) {
  const map = useMap()
  
  useEffect(() => {
    const handleClick = (e) => {
      onLocationChange(e.latlng.lat, e.latlng.lng)
    }

    map.on('click', handleClick)
    return () => {
      map.off('click', handleClick)
    }
  }, [map, onLocationChange])

  return null
}

/**
 * MapPicker Component
 * 
 * A reusable map component for selecting geographic locations.
 * 
 * Features:
 * - Search for locations by name (e.g., "Helsinki", "Tokyo")
 * - Click anywhere on the map to set location
 * - Draggable marker for fine-tuning
 * - Syncs with external lat/lon inputs
 * - Expandable to full-screen mode
 * - Uses free OpenStreetMap tiles (no API key required)
 * 
 * Props:
 * @param {number} latitude - Current latitude value
 * @param {number} longitude - Current longitude value
 * @param {function} onChange - Callback when location changes: (lat, lon) => void
 * @param {boolean} isExpanded - Whether map is in full-screen mode
 * @param {function} onToggleExpand - Callback to toggle full-screen mode
 * 
 * Usage:
 * <MapPicker 
 *   latitude={60.1699} 
 *   longitude={24.9384}
 *   onChange={(lat, lon) => setLocation({ lat, lon })}
 *   isExpanded={false}
 *   onToggleExpand={() => setExpanded(!expanded)}
 * />
 * 
 * Customization:
 * - To use different map tiles (Google, Mapbox, etc.), replace the TileLayer component
 * - To change search provider, modify the OpenStreetMapProvider in SearchControl
 */
function MapPicker({ latitude, longitude, onChange, isExpanded = false, onToggleExpand }) {
  const mapRef = useRef(null)

  // Prevent body scroll when map is expanded
  useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }
    
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [isExpanded])

  // Center map on location when coordinates change externally
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView([latitude, longitude], mapRef.current.getZoom())
    }
  }, [latitude, longitude])

  const handleLocationChange = (lat, lon) => {
    // Round to 4 decimal places (~11m precision, good for satellite tasking)
    const roundedLat = Math.round(lat * 10000) / 10000
    const roundedLon = Math.round(lon * 10000) / 10000
    onChange(roundedLat, roundedLon)
  }

  const handleMarkerDrag = (e) => {
    const { lat, lng } = e.target.getLatLng()
    handleLocationChange(lat, lng)
  }

  // Shared map content (used in both normal and expanded views)
  const mapContent = (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <SearchControl onLocationChange={handleLocationChange} />
      <Marker
        position={[latitude, longitude]}
        draggable={true}
        eventHandlers={{
          dragend: handleMarkerDrag,
        }}
      />
      <MapClickHandler onLocationChange={handleLocationChange} />
    </>
  )

  // Info bar with coordinates (used in both views)
  const infoBar = (
    <div className="map-info">
      <span className="map-coordinates">
        Selected: {latitude.toFixed(4)}°, {longitude.toFixed(4)}°
      </span>
      {isExpanded && onToggleExpand && (
        <button 
          className="btn-collapse-map" 
          onClick={onToggleExpand}
          type="button"
        >
          ⛶ Exit Full Screen
        </button>
      )}
    </div>
  )

  // Render normal map view
  if (!isExpanded) {
    return (
      <div className="map-picker">
        <div className="map-instructions">
          <span><strong>Tip:</strong> Search for a location or click on the map</span>
          {onToggleExpand && (
            <button 
              className="btn-expand-map" 
              onClick={onToggleExpand}
              type="button"
            >
              ⛶ Expand Map
            </button>
          )}
        </div>
        
        <MapContainer
          center={[latitude, longitude]}
          zoom={10}
          className="map-container"
          ref={mapRef}
          zoomControl={true}
        >
          {mapContent}
        </MapContainer>

        {infoBar}
      </div>
    )
  }

  // Render expanded map view using portal (renders outside normal DOM hierarchy)
  return createPortal(
    <div className="map-picker-expanded">
      <MapContainer
        center={[latitude, longitude]}
        zoom={12}
        className="map-container map-container-expanded"
        ref={mapRef}
        zoomControl={true}
      >
        {mapContent}
      </MapContainer>
      {infoBar}
    </div>,
    document.body
  )
}

// PropTypes for type checking and documentation
MapPicker.propTypes = {
  latitude: PropTypes.number.isRequired,
  longitude: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  isExpanded: PropTypes.bool,
  onToggleExpand: PropTypes.func,
}

export default MapPicker
