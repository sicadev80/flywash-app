import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, {
  Marker,
  Polygon,
  Polyline,
  PROVIDER_DEFAULT,
  Region,
  UrlTile,
} from 'react-native-maps';
import type { LatLng } from '../../lib/polygonArea';

// Pendant le glisser d'un point déjà posé, on zoome directement la vraie
// carte satellite autour de ce point (plutôt qu'une loupe séparée, jugée peu
// intuitive) pour viser précisément, puis on revient au niveau de zoom
// d'avant le glisser une fois le point relâché.
const DRAG_ZOOM_FACTOR = 4;
const DRAG_ZOOM_MIN_DELTA = 0.00002;
const DRAG_ZOOM_ANIMATION_MS = 220;
const DRAG_UNZOOM_ANIMATION_MS = 260;

type Props = {
  region: Region;
  onRegionChangeComplete: (region: Region) => void;
  points: LatLng[];
  onDragPoint: (index: number, point: LatLng) => void;
  closed?: boolean;
  baseLayer?: 'standard' | 'satellite' | 'hybrid';
  showIgnOrtho?: boolean;
  showCadastre?: boolean;
  mapKey?: string;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitPolygon: () => void;
  // Quand la couche Cadastre est active, on bascule sur la sélection directe
  // du bâtiment IGN (tap sur la carte) plutôt que le pointage manuel au
  // viseur — onMapPress reçoit alors la coordonnée tapée.
  onMapPress?: (coordinate: LatLng) => void;
  buildingLookupLoading?: boolean;
};

const IGN_ORTHO_WMTS =
  'https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&STYLE=normal&TILEMATRIXSET=PM&FORMAT=image/jpeg&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}';

const IGN_CADASTRE_WMTS =
  'https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=CADASTRALPARCELS.PARCELLAIRE_EXPRESS&STYLE=normal&TILEMATRIXSET=PM&FORMAT=image/png&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}';

export function TerrainMap({
  region,
  onRegionChangeComplete,
  points,
  onDragPoint,
  closed = false,
  baseLayer = 'satellite',
  showIgnOrtho = false,
  showCadastre = false,
  mapKey = 'default',
  onZoomIn,
  onZoomOut,
  onFitPolygon,
  onMapPress,
  buildingLookupLoading = false,
}: Props) {
  const mapRef = useRef<MapView>(null);
  const preDragRegionRef = useRef<Region | null>(null);
  const [isDraggingPoint, setIsDraggingPoint] = useState(false);

  function handleDragStart(coordinate: LatLng) {
    preDragRegionRef.current = region;
    setIsDraggingPoint(true);

    const zoomedRegion: Region = {
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      latitudeDelta: Math.max(region.latitudeDelta / DRAG_ZOOM_FACTOR, DRAG_ZOOM_MIN_DELTA),
      longitudeDelta: Math.max(region.longitudeDelta / DRAG_ZOOM_FACTOR, DRAG_ZOOM_MIN_DELTA),
    };
    mapRef.current?.animateToRegion(zoomedRegion, DRAG_ZOOM_ANIMATION_MS);
  }

  function handleDragEnd(index: number, coordinate: LatLng) {
    onDragPoint(index, coordinate);
    setIsDraggingPoint(false);

    const previousRegion = preDragRegionRef.current;
    preDragRegionRef.current = null;
    if (previousRegion) {
      mapRef.current?.animateToRegion(previousRegion, DRAG_UNZOOM_ANIMATION_MS);
    }
  }

  return (
    <View style={styles.wrap}>
      <MapView
        ref={mapRef}
        key={mapKey}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        region={region}
        onRegionChangeComplete={onRegionChangeComplete}
        mapType={baseLayer}
        maxZoomLevel={25}
        minZoomLevel={3}
        onPress={showCadastre && onMapPress ? (e) => onMapPress(e.nativeEvent.coordinate) : undefined}
      >
        {showIgnOrtho ? (
          <UrlTile
            urlTemplate={IGN_ORTHO_WMTS}
            maximumZ={22}
            flipY={false}
            zIndex={1}
            tileSize={256}
          />
        ) : null}

        {showCadastre ? (
          <UrlTile
            urlTemplate={IGN_CADASTRE_WMTS}
            maximumZ={20}
            flipY={false}
            zIndex={2}
            tileSize={256}
          />
        ) : null}

       {points.map((point, index) => (
  <Marker
    key={`${point.latitude}-${point.longitude}-${index}`}
    coordinate={point}
    draggable
    onDragStart={(e) => handleDragStart(e.nativeEvent.coordinate)}
    onDragEnd={(e) => handleDragEnd(index, e.nativeEvent.coordinate)}
  >
    <View style={styles.pointBadge}>
      <Text style={styles.pointBadgeText}>{index + 1}</Text>
    </View>
  </Marker>
))}

        {!closed && points.length >= 2 ? (
          <Polyline coordinates={points} strokeColor="#D4AF37" strokeWidth={3} />
        ) : null}

        {points.length >= 3 ? (
          <Polygon
            coordinates={points}
            strokeColor="#D4AF37"
            fillColor="rgba(212,175,55,0.22)"
            strokeWidth={3}
          />
        ) : null}
      </MapView>

      {!showCadastre ? (
        <View pointerEvents="none" style={styles.crosshairWrap}>
          <View style={styles.crosshairCircle}>
            <View style={styles.crosshairH} />
            <View style={styles.crosshairV} />
          </View>
        </View>
      ) : null}

      <View style={styles.zoomControls}>
        <Pressable style={styles.zoomButton} onPress={onZoomIn}>
          <Text style={styles.zoomText}>+</Text>
        </Pressable>
        <Pressable style={styles.zoomButton} onPress={onZoomOut}>
          <Text style={styles.zoomText}>−</Text>
        </Pressable>
        <Pressable style={styles.fitButton} onPress={onFitPolygon}>
          <Text style={styles.fitText}>Cadrer</Text>
        </Pressable>
      </View>

      <View style={styles.helpBadge}>
        <Text style={styles.helpText}>
          {isDraggingPoint
            ? 'Vise précisément puis relâche pour valider'
            : showCadastre
            ? 'Appuie sur le bâtiment pour sélectionner son contour'
            : 'Déplace la carte sous le viseur, puis ajoute un point'}
        </Text>
      </View>

      {buildingLookupLoading ? (
        <View pointerEvents="none" style={styles.loadingBadge}>
          <Text style={styles.loadingText}>Recherche du bâtiment…</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 440,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2A2A2E',
  },
  map: {
    flex: 1,
  },
  crosshairWrap: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crosshairCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: '#D4AF37',
    backgroundColor: 'rgba(15,15,16,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crosshairH: {
    position: 'absolute',
    width: 22,
    height: 2,
    backgroundColor: '#D4AF37',
  },
  crosshairV: {
    position: 'absolute',
    width: 2,
    height: 22,
    backgroundColor: '#D4AF37',
  },
  zoomControls: {
    position: 'absolute',
    right: 10,
    top: 10,
    gap: 8,
  },
  zoomButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(15,15,16,0.88)',
    borderWidth: 1,
    borderColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomText: {
    color: '#D4AF37',
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 26,
  },
  fitButton: {
    minWidth: 72,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(15,15,16,0.88)',
    borderWidth: 1,
    borderColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  fitText: {
    color: '#D4AF37',
    fontSize: 13,
    fontWeight: '800',
  },
  helpBadge: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    backgroundColor: 'rgba(15,15,16,0.88)',
    borderWidth: 1,
    borderColor: '#2A2A2E',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  helpText: {
    color: '#F5F5F5',
    fontSize: 12,
    fontWeight: '600',
  },
pointBadge: {
  width: 22,
  height: 22,
  borderRadius: 11,
  backgroundColor: '#D4AF37',
  borderWidth: 2,
  borderColor: '#111111',
  justifyContent: 'center',
  alignItems: 'center',
},

pointBadgeText: {
  fontSize: 11,
  fontWeight: '900',
  color: '#111111',
},
loadingBadge: {
  position: 'absolute',
  top: 10,
  left: 10,
  backgroundColor: 'rgba(15,15,16,0.88)',
  borderWidth: 1,
  borderColor: '#D4AF37',
  borderRadius: 12,
  paddingHorizontal: 10,
  paddingVertical: 8,
},
loadingText: {
  color: '#D4AF37',
  fontSize: 12,
  fontWeight: '700',
},
});
