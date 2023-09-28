/**
 *
 */

/*var mapForCreateProject = L.map('divMapForCreateProject').setView([43.008, -78.785], 13);
mapForCreateProject.invalidateSize()
L.tileLayer(
	'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
	{
		maxZoom: 19,
		attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
	}).addTo(mapForCreateProject);

var drawnItems = new L.FeatureGroup();
mapForCreateProject.addLayer(drawnItems);
var drawControl = new L.Control.Draw({
	edit: {
		featureGroup: drawnItems
	},
	draw: {
		polygon: false,
		marker: false,
		circle: false,
		circleMarker: false,
		rectangle: true,
		polyline: false
	}
});

mapForCreateProject.addControl(drawControl);

mapForCreateProject.on(L.Draw.Event.CREATED, function(event) {
	var layer = event.layer;
	drawnItems.addLayer(layer);
});

if (geoScopeType == "Coords") {
	$("#radioDrawScope").prop('checked', true);
	$("#optionStateDefault").prop('selected', true);
	var recGeoScopeValue = L.rectangle(geoScopeValue, { color: "#ff7800", weight: 1 });
	drawnItems.addLayer(recGeoScopeValue);
	var centerLatLng = drawnItems.getBounds().getCenter();
	mapForCreateProject.setView(centerLatLng, Object.values(geoScope)[1]);
}*/

var latLngs = layer.getLatLngs()[0];
			var coords = latLngs.map(function(latlng) {
				geoScope = [latlng.lat, latlng.lng];
			});