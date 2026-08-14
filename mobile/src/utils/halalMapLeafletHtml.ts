import type { HalalDamuMapMarker } from "../api/halalDamuWp";
import { halalMapClusterChunkMs, halalMapMarkerCap } from "./halalPerformanceProfile";

const MAX_MAP_MARKERS = halalMapMarkerCap();

const LEAFLET_HEAD = `
  <link rel="preconnect" href="https://unpkg.com" crossorigin=""/>
  <link rel="dns-prefetch" href="https://unpkg.com"/>
  <link rel="preconnect" href="https://tile.openstreetmap.org" crossorigin=""/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin=""/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" crossorigin=""/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css" crossorigin=""/>
  <style>
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
    #map { position: absolute; left: 0; top: 0; right: 0; bottom: 0; width: 100%; height: 100%; min-height: 100vh; }
    .leaflet-popup-content { font-family: system-ui, -apple-system, sans-serif; font-size: 14px; max-width: 260px; }
  </style>`;

const LEAFLET_SCRIPTS = `
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
  <script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js" crossorigin=""></script>`;

/** CDN кэш — маркерсіз, Halal hub фонда. */
export function buildHalalLeafletPrewarmHtml(): string {
  return `<!DOCTYPE html>
<html lang="kk">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
  ${LEAFLET_HEAD}
</head>
<body>
  <div id="map"></div>
  ${LEAFLET_SCRIPTS}
  <script>
    (function () {
      try {
        if (typeof L === "undefined") return;
        var map = L.map("map", { zoomControl: false, attributionControl: false });
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
        map.setView([48.02, 66.92], 5);
      } catch (_) {}
    })();
  </script>
</body>
</html>`;
}

export function buildHalalLeafletMapHtml(
  points: HalalDamuMapMarker[],
  openDetailLabel: string,
  user?: { lat: number; lon: number } | null
): string {
  const { chunkInterval, chunkDelay } = halalMapClusterChunkMs();
  const payload = JSON.stringify(
    points.map((p) => ({
      id: p.id,
      lat: p.lat,
      lng: p.lng,
      title: p.title,
      address: p.address,
    }))
  );
  const detailJs = JSON.stringify(openDetailLabel);
  return `<!DOCTYPE html>
<html lang="kk">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
  ${LEAFLET_HEAD}
</head>
<body>
  <div id="map"></div>
  ${LEAFLET_SCRIPTS}
  <script>
    (function () {
      function send(obj) {
        try {
          var s = JSON.stringify(obj);
          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage(s);
          } else if (window.parent && window.parent !== window) {
            window.parent.postMessage(s, "*");
          }
        } catch (_) {}
      }
      try {
        if (typeof L === "undefined" || typeof L.markerClusterGroup !== "function") {
          send({ type: "mapJsErr", msg: "leaflet_load" });
          return;
        }
        var OPEN_DETAIL = ${detailJs};
        var pts = ${payload};
        var userPt = ${user ? JSON.stringify([user.lat, user.lon]) : "null"};
        function escapeHtml(s) {
          if (s == null) return "";
          return String(s)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
        }
        var map = L.map("map", { zoomControl: true });
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap",
          maxZoom: 19,
        }).addTo(map);
        var group = L.markerClusterGroup({
          chunkedLoading: true,
          chunkInterval: ${chunkInterval},
          chunkDelay: ${chunkDelay},
          maxClusterRadius: 56
        });
        pts.slice(0, ${MAX_MAP_MARKERS}).forEach(function (p) {
          var m = L.marker([p.lat, p.lng]);
          var addr = p.address
            ? '<div style="opacity:.88;font-size:12px;margin-top:6px;line-height:1.35">' +
              escapeHtml(p.address) +
              "</div>"
            : "";
          var lid = "halal-pick-" + p.id;
          m.bindPopup(
            "<div><b>" +
              escapeHtml(p.title) +
              "</b>" +
              addr +
              '<p style="margin:10px 0 0"><a href="#" id="' +
              lid +
              '">' +
              escapeHtml(OPEN_DETAIL) +
              "</a></p></div>"
          );
          m.on("popupopen", function () {
            var a = document.getElementById(lid);
            if (a) {
              a.onclick = function (ev) {
                ev.preventDefault();
                send({ type: "pick", id: p.id });
                return false;
              };
            }
          });
          group.addLayer(m);
        });
        map.addLayer(group);
        if (userPt) {
          L.circleMarker(userPt, {
            radius: 9,
            color: "#1d4ed8",
            fillColor: "#3b82f6",
            fillOpacity: 0.95,
            weight: 2
          }).addTo(map).bindPopup("Сіз");
        }
        try {
          if (pts.length > 0) {
            var bounds = group.getBounds();
            if (userPt) bounds.extend(userPt);
            map.fitBounds(bounds, { padding: [32, 32], maxZoom: userPt ? 15 : 14 });
          } else if (userPt) {
            map.setView(userPt, 13);
          } else {
            map.setView([48.02, 66.92], 5);
          }
        } catch (e2) {
          if (userPt) map.setView(userPt, 13);
          else map.setView([48.02, 66.92], 5);
        }
        setTimeout(function () {
          try {
            map.invalidateSize();
            if (pts.length > 0) {
              var b2 = group.getBounds();
              if (userPt) b2.extend(userPt);
              map.fitBounds(b2, { padding: [32, 32], maxZoom: userPt ? 15 : 14 });
            } else if (userPt) {
              map.setView(userPt, 13);
            }
          } catch (_) {}
        }, 120);
        send({ type: "mapReady" });
      } catch (e) {
        send({ type: "mapJsErr", msg: String((e && e.message) || e || "init") });
      }
    })();
  </script>
</body>
</html>`;
}
