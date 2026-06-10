import React, { useCallback, useRef } from "react";
import { StyleSheet, type ImageSourcePropType } from "react-native";
import { RasterImage } from "@/ui/RasterImage";
import {
  clampZoomScale,
  IMAGE_ZOOM_DOUBLE_TAP_SCALE,
  IMAGE_ZOOM_MAX_SCALE,
  IMAGE_ZOOM_MIN_SCALE,
} from "./zoomImageLimits";

type Props = {
  source: ImageSourcePropType;
  width: number;
  height: number;
};

/**
 * Веб: pinch (trackpad/touch), drag, екі рет басу — CSS transform.
 */
export function ZoomableImageContent({ source, width, height }: Props) {
  const scaleRef = useRef(IMAGE_ZOOM_MIN_SCALE);
  const translateRef = useRef({ x: 0, y: 0 });
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const pinchStartRef = useRef<{ dist: number; scale: number } | null>(null);
  const panStartRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);

  const applyTransform = useCallback(() => {
    const node = nodeRef.current;
    if (!node) return;
    const { x, y } = translateRef.current;
    node.style.transform = `translate(${x}px, ${y}px) scale(${scaleRef.current})`;
  }, []);

  const resetZoom = useCallback(() => {
    scaleRef.current = IMAGE_ZOOM_MIN_SCALE;
    translateRef.current = { x: 0, y: 0 };
    applyTransform();
  }, [applyTransform]);

  const onWheel = useCallback(
    (event: React.WheelEvent) => {
      event.preventDefault();
      const delta = event.deltaY > 0 ? 0.92 : 1.08;
      scaleRef.current = clampZoomScale(scaleRef.current * delta);
      if (scaleRef.current <= IMAGE_ZOOM_MIN_SCALE) {
        resetZoom();
        return;
      }
      applyTransform();
    },
    [applyTransform, resetZoom]
  );

  const onDoubleClick = useCallback(() => {
    if (scaleRef.current > IMAGE_ZOOM_MIN_SCALE) {
      resetZoom();
      return;
    }
    scaleRef.current = IMAGE_ZOOM_DOUBLE_TAP_SCALE;
    applyTransform();
  }, [applyTransform, resetZoom]);

  const touchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const a = touches[0];
    const b = touches[1];
    const dx = a.clientX - b.clientX;
    const dy = a.clientY - b.clientY;
    return Math.hypot(dx, dy);
  };

  const onTouchStart = useCallback((event: React.TouchEvent) => {
    if (event.touches.length === 2) {
      pinchStartRef.current = { dist: touchDistance(event.touches), scale: scaleRef.current };
      panStartRef.current = null;
      return;
    }
    if (event.touches.length === 1 && scaleRef.current > IMAGE_ZOOM_MIN_SCALE) {
      panStartRef.current = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
        tx: translateRef.current.x,
        ty: translateRef.current.y,
      };
    }
  }, []);

  const onTouchMove = useCallback(
    (event: React.TouchEvent) => {
      if (event.touches.length === 2 && pinchStartRef.current) {
        event.preventDefault();
        const dist = touchDistance(event.touches);
        const ratio = dist / pinchStartRef.current.dist;
        scaleRef.current = clampZoomScale(pinchStartRef.current.scale * ratio);
        applyTransform();
        return;
      }
      if (event.touches.length === 1 && panStartRef.current) {
        event.preventDefault();
        const dx = event.touches[0].clientX - panStartRef.current.x;
        const dy = event.touches[0].clientY - panStartRef.current.y;
        translateRef.current = {
          x: panStartRef.current.tx + dx,
          y: panStartRef.current.ty + dy,
        };
        applyTransform();
      }
    },
    [applyTransform]
  );

  const onTouchEnd = useCallback(() => {
    pinchStartRef.current = null;
    panStartRef.current = null;
    if (scaleRef.current <= IMAGE_ZOOM_MIN_SCALE) {
      resetZoom();
    }
  }, [resetZoom]);

  return (
    <div
      ref={nodeRef}
      style={{
        width,
        height,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        touchAction: "none",
        cursor: scaleRef.current > IMAGE_ZOOM_MIN_SCALE ? "grab" : "zoom-in",
      }}
      onWheel={onWheel}
      onDoubleClick={onDoubleClick}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      <RasterImage
        source={source}
        style={[styles.image, { width, height }]}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
    </div>
  );
}

const styles = StyleSheet.create({
  image: {
    userSelect: "none",
  } as never,
});
