/*global Aidmo _config*/

var Aidmo = window.Aidmo || {};
Aidmo.map = Aidmo.map || {};

(function esriMapScopeWrapper($) {
    require([
        'esri/Map',
        'esri/views/MapView',
        'esri/Graphic',
        'esri/geometry/Point',
        'esri/symbols/TextSymbol',
        'esri/symbols/PictureMarkerSymbol',
        'esri/geometry/support/webMercatorUtils',
        'dojo/domReady!'
    ], function requireCallback(
        Map, MapView,
        Graphic, Point, TextSymbol,
        PictureMarkerSymbol, webMercatorUtils
    ) {
        var aidmoMap = Aidmo.map;

        var map = new Map({ basemap: 'gray-vector' });

        var view = new MapView({
            center: [-122.31, 47.60],
            container: 'map',
            map: map,
            zoom: 12
        });

        var pinSymbol = new TextSymbol({
            color: '#f50856',
            text: '\ue61d',
            font: {
                size: 20,
                family: 'CalciteWebCoreIcons'
            }
        });

        var ambulanceSymbol = new PictureMarkerSymbol({
            url: '/images/ambulance-icon.png',
            width: '25px',
            height: '25px'
        });

        var pinGraphic;
        var ambulanceGraphic;

        function updateCenter(newValue) {
            aidmoMap.center = {
                latitude: newValue.latitude,
                longitude: newValue.longitude
            };
        }

        function updateExtent(newValue) {
            var min = webMercatorUtils.xyToLngLat(newValue.xmin, newValue.ymin);
            var max = webMercatorUtils.xyToLngLat(newValue.xmax, newValue.ymax);
            aidmoMap.extent = {
                minLng: min[0],
                minLat: min[1],
                maxLng: max[0],
                maxLat: max[1]
            };
        }

        view.watch('extent', updateExtent);
        view.watch('center', updateCenter);
        view.then(function onViewLoad() {
            updateExtent(view.extent);
            updateCenter(view.center);
        });

        view.on('click', function handleViewClick(event) {
            aidmoMap.selectedPoint = event.mapPoint;
            view.graphics.remove(pinGraphic);
            pinGraphic = new Graphic({
                symbol: pinSymbol,
                geometry: aidmoMap.selectedPoint
            });
            view.graphics.add(pinGraphic);
            $(aidmoMap).trigger('pickupChange');
        });

        aidmoMap.animate = function animate(origin, dest, callback) {
            var startTime;
            var step = function animateFrame(timestamp) {
                var progress;
                var progressPct;
                var point;
                var deltaLat;
                var deltaLon;
                if (!startTime) startTime = timestamp;
                progress = timestamp - startTime;
                progressPct = Math.min(progress / 2000, 1);
                deltaLat = (dest.latitude - origin.latitude) * progressPct;
                deltaLon = (dest.longitude - origin.longitude) * progressPct;
                point = new Point({
                    longitude: origin.longitude + deltaLon,
                    latitude: origin.latitude + deltaLat
                });
                view.graphics.remove(ambulanceGraphic);
                ambulanceGraphic = new Graphic({
                    geometry: point,
                    symbol: ambulanceSymbol
                });
                view.graphics.add(ambulanceGraphic);
                if (progressPct < 1) {
                    requestAnimationFrame(step);
                } else {
                    callback();
                }
            };
            requestAnimationFrame(step);
        };

        aidmoMap.unsetLocation = function unsetLocation() {
            view.graphics.remove(pinGraphic);
        };
    });
}(jQuery));
