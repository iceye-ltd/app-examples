import { useEffect, useRef, useState, useCallback } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './MapView.css'

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

const BBOX_STYLE_BOLD = {
  color: '#3b82f6',
  weight: 2,
  fillOpacity: 0.08,
  dashArray: '6 3',
  opacity: 0.9,
}

const BBOX_STYLE_SUBTLE = {
  color: '#94a3b8',
  weight: 1.5,
  fillOpacity: 0.03,
  dashArray: '6 4',
  opacity: 0.5,
}

function DrawBbox({ onBboxSelect, bbox, hasResults }) {
  const map = useMap()
  const rectRef = useRef(null)
  const startRef = useRef(null)
  const drawingRef = useRef(false)
  const [isDrawing, setIsDrawing] = useState(false)
  // Tracks whether the bbox was just drawn/redrawn and hasn't been searched yet
  const freshBboxRef = useRef(false)

  // Fade to subtle only when results arrive for the current bbox
  useEffect(() => {
    if (hasResults && rectRef.current) {
      freshBboxRef.current = false
      rectRef.current.setStyle(BBOX_STYLE_SUBTLE)
    }
  }, [hasResults])

  // Sync bbox position; new bbox always starts bold
  useEffect(() => {
    if (bbox && bbox.length === 4) {
      const style = freshBboxRef.current ? BBOX_STYLE_BOLD
        : hasResults ? BBOX_STYLE_SUBTLE : BBOX_STYLE_BOLD
      const bounds = [[bbox[1], bbox[0]], [bbox[3], bbox[2]]]
      if (rectRef.current) {
        rectRef.current.setBounds(bounds)
        rectRef.current.setStyle(style)
      } else {
        rectRef.current = L.rectangle(bounds, style).addTo(map)
      }
    }
  }, [bbox, map, hasResults])

  useEffect(() => {
    function onMouseDown(e) {
      if (!e.originalEvent.shiftKey) return
      e.originalEvent.preventDefault()
      map.dragging.disable()
      startRef.current = e.latlng
      drawingRef.current = true
      setIsDrawing(true)

      if (rectRef.current) {
        map.removeLayer(rectRef.current)
        rectRef.current = null
      }
    }

    function onMouseMove(e) {
      if (!drawingRef.current || !startRef.current) return
      const bounds = L.latLngBounds(startRef.current, e.latlng)
      if (rectRef.current) {
        rectRef.current.setBounds(bounds)
      } else {
        rectRef.current = L.rectangle(bounds, BBOX_STYLE_BOLD).addTo(map)
      }
    }

    function onMouseUp(e) {
      if (!drawingRef.current || !startRef.current) return
      map.dragging.enable()
      drawingRef.current = false
      setIsDrawing(false)

      const bounds = L.latLngBounds(startRef.current, e.latlng)
      startRef.current = null

      const size = map.latLngToContainerPoint(bounds.getNorthEast())
        .distanceTo(map.latLngToContainerPoint(bounds.getSouthWest()))
      if (size < 10) return

      // Mark as fresh so it stays bold until next search
      freshBboxRef.current = true

      // Force bold style on the just-drawn rectangle
      if (rectRef.current) {
        rectRef.current.setStyle(BBOX_STYLE_BOLD)
      }

      onBboxSelect([
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth(),
      ])
    }

    map.on('mousedown', onMouseDown)
    map.on('mousemove', onMouseMove)
    map.on('mouseup', onMouseUp)

    return () => {
      map.off('mousedown', onMouseDown)
      map.off('mousemove', onMouseMove)
      map.off('mouseup', onMouseUp)
    }
  }, [map, onBboxSelect])

  function handleClear() {
    if (rectRef.current) {
      map.removeLayer(rectRef.current)
      rectRef.current = null
    }
    onBboxSelect(null)
  }

  return (
    <div className="bbox-control">
      {isDrawing && <span className="draw-hint-active">Release to set bbox</span>}
      {!isDrawing && bbox && bbox.length === 4 && (
        <button className="btn btn-sm btn-clear" onClick={handleClear}>
          ✕ Clear bbox
        </button>
      )}
      {!isDrawing && (!bbox || bbox.length !== 4) && (
        <span className="draw-hint">Shift + drag to draw bbox</span>
      )}
    </div>
  )
}

function FitBounds({ items }) {
  const map = useMap()
  const prevIdsRef = useRef('')

  useEffect(() => {
    if (!items || items.length === 0) {
      prevIdsRef.current = ''
      return
    }

    const ids = items.map(i => i.id).join(',')
    if (ids === prevIdsRef.current) return
    prevIdsRef.current = ids

    const allCoords = []
    items.forEach(item => {
      if (item.bbox) {
        allCoords.push([item.bbox[1], item.bbox[0]])
        allCoords.push([item.bbox[3], item.bbox[2]])
      }
    })

    if (allCoords.length > 0) {
      map.fitBounds(allCoords, { padding: [30, 30], maxZoom: 12 })
    }
  }, [items, map])

  return null
}

/**
 * Imperatively updates GeoJSON layer styles when hoveredItemId or selectedItem changes,
 * avoiding expensive full re-renders of the GeoJSON component.
 */
function HoverHighlight({ layersRef, hoveredItemId, selectedItem }) {
  const prevHoveredRef = useRef(null)

  useEffect(() => {
    const layers = layersRef.current
    if (!layers) return

    // Reset previously hovered layer
    if (prevHoveredRef.current && prevHoveredRef.current !== hoveredItemId) {
      const prevLayer = layers[prevHoveredRef.current]
      if (prevLayer) {
        const isSelected = selectedItem && prevHoveredRef.current === selectedItem.id
        prevLayer.setStyle({
          color: isSelected ? '#ef4444' : '#3b82f6',
          weight: isSelected ? 3 : 2,
          fillOpacity: isSelected ? 0.3 : 0.1,
        })
      }
    }

    // Highlight newly hovered layer
    if (hoveredItemId) {
      const layer = layers[hoveredItemId]
      if (layer) {
        layer.setStyle({
          color: '#f59e0b',
          weight: 3,
          fillOpacity: 0.25,
        })
        layer.bringToFront()
      }
    }

    prevHoveredRef.current = hoveredItemId
  }, [hoveredItemId, selectedItem, layersRef])

  return null
}

function MapView({ items, selectedItem, hoveredItemId, onItemSelect, onBboxSelect, bbox }) {
  const geoJsonKey = useRef(0)
  const layersRef = useRef({})

  useEffect(() => {
    geoJsonKey.current += 1
    layersRef.current = {}
  }, [items])

  const geojsonData = items && items.length > 0 ? {
    type: 'FeatureCollection',
    features: items.map(item => ({
      type: 'Feature',
      geometry: item.geometry,
      properties: {
        id: item.id,
        frame_id: item.properties?.frame_id,
        product_type: item.properties?.['sar:product_type'],
        processing_mode: item.properties?.['iceye:processing_mode'],
        start_datetime: item.properties?.start_datetime,
      }
    }))
  } : null

  const onEachFeature = useCallback((feature, layer) => {
    const props = feature.properties
    layersRef.current[props.id] = layer

    layer.bindTooltip(
      `<b>${props.frame_id || props.id.slice(0, 8)}</b><br/>` +
      `${props.processing_mode || ''} ${props.product_type || ''}<br/>` +
      `${props.start_datetime ? new Date(props.start_datetime).toLocaleDateString() : ''}`,
      { sticky: true }
    )
    layer.on('click', () => {
      const original = items.find(i => i.id === props.id)
      if (original) onItemSelect(original)
    })
  }, [items, onItemSelect])

  function styleFeature(feature) {
    const isSelected = selectedItem && feature.properties.id === selectedItem.id
    return {
      color: isSelected ? '#ef4444' : '#3b82f6',
      weight: isSelected ? 3 : 2,
      fillOpacity: isSelected ? 0.3 : 0.1,
    }
  }

  return (
    <div className="map-container">
      <MapContainer
        center={[30, 0]}
        zoom={2}
        className="leaflet-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {geojsonData && (
          <GeoJSON
            key={geoJsonKey.current}
            data={geojsonData}
            onEachFeature={onEachFeature}
            style={styleFeature}
          />
        )}
        <HoverHighlight
          layersRef={layersRef}
          hoveredItemId={hoveredItemId}
          selectedItem={selectedItem}
        />
        <FitBounds items={items} />
        <DrawBbox onBboxSelect={onBboxSelect} bbox={bbox} hasResults={items && items.length > 0} />
      </MapContainer>
    </div>
  )
}

export default MapView
