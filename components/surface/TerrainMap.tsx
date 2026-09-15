import React from 'react';
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
}: Props) {
  return (
    <View style={styles.wrap}>
      <MapView
        key={mapKey}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        region={region}
        onRegionChangeComplete={onRegionChangeComplete}
        mapType={baseLayer}
        maxZoomLevel={25}
        minZoomLevel={3}
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
    onDragEnd={(e) => onDragPoint(index, e.nativeEvent.coordinate)}
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

      <View pointerEvents="none" style={styles.crosshairWrap}>
        <View style={styles.crosshairCircle}>
          <View style={styles.crosshairH} />
          <View style={styles.crosshairV} />
        </View>
      </View>

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
        <Text style={styles.helpText}>Déplace la carte sous le viseur, puis ajoute un point</Text>
      </View>
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
});
