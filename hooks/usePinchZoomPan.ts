import { useEffect } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue } from 'react-native-reanimated';

type Offset = { x: number; y: number };

type Params = {
  zoom: number;
  setZoom: (updater: (current: number) => number) => void;
  offset: Offset;
  setOffset: (updater: (current: Offset) => Offset) => void;
  minZoom: number;
  maxZoom: number;
  /** Appelé quand un geste pinch/pan démarre ou se termine, pour désactiver
   * le scroll de l'écran pendant la manipulation de la photo. */
  onGestureActiveChange?: (active: boolean) => void;
};

/**
 * Geste pincer-pour-zoomer + déplacer à un doigt, partagé entre les écrans
 * de pointage de façade (mode rapide et mode projet). Le zoom reste centré
 * sur le canevas (comme les boutons +/-), on ne recalcule pas de point focal
 * — cohérent avec le comportement existant, plus simple et plus fiable.
 *
 * Les valeurs `zoom`/`offset` restent la source de vérité côté React (elles
 * pilotent déjà tous les calculs de coordonnées existants) : ce hook se
 * contente de les mettre à jour via `runOnJS` depuis les gestes.
 */
export function usePinchZoomPan({
  zoom,
  setZoom,
  offset,
  setOffset,
  minZoom,
  maxZoom,
  onGestureActiveChange,
}: Params) {
  const zoomShared = useSharedValue(zoom);
  const offsetXShared = useSharedValue(offset.x);
  const offsetYShared = useSharedValue(offset.y);

  const pinchStartZoom = useSharedValue(1);
  const panStartOffsetX = useSharedValue(0);
  const panStartOffsetY = useSharedValue(0);

  useEffect(() => {
    zoomShared.value = zoom;
  }, [zoom, zoomShared]);

  useEffect(() => {
    offsetXShared.value = offset.x;
    offsetYShared.value = offset.y;
  }, [offset.x, offset.y, offsetXShared, offsetYShared]);

  function notifyActive(active: boolean) {
    onGestureActiveChange?.(active);
  }

  function applyZoom(next: number) {
    setZoom(() => next);
  }

  function applyOffset(next: Offset) {
    setOffset(() => next);
  }

  const pinch = Gesture.Pinch()
    .onStart(() => {
      pinchStartZoom.value = zoomShared.value;
      runOnJS(notifyActive)(true);
    })
    .onUpdate((event) => {
      'worklet';
      const next = Math.max(minZoom, Math.min(maxZoom, pinchStartZoom.value * event.scale));
      zoomShared.value = next;
      runOnJS(applyZoom)(next);
    })
    .onEnd(() => {
      runOnJS(notifyActive)(false);
    })
    .onFinalize(() => {
      runOnJS(notifyActive)(false);
    });

  const pan = Gesture.Pan()
    .minPointers(1)
    .maxPointers(1)
    .onStart(() => {
      panStartOffsetX.value = offsetXShared.value;
      panStartOffsetY.value = offsetYShared.value;
      runOnJS(notifyActive)(true);
    })
    .onUpdate((event) => {
      'worklet';
      const next = {
        x: panStartOffsetX.value + event.translationX,
        y: panStartOffsetY.value + event.translationY,
      };
      offsetXShared.value = next.x;
      offsetYShared.value = next.y;
      runOnJS(applyOffset)(next);
    })
    .onEnd(() => {
      runOnJS(notifyActive)(false);
    })
    .onFinalize(() => {
      runOnJS(notifyActive)(false);
    });

  return Gesture.Simultaneous(pinch, pan);
}
