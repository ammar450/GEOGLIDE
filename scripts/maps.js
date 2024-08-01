function loadMap(map, style) {
    map.setStyle(style);
};

const mapConfig = async(map, route, point) => {        
        // Check if sources exist; if not, add the sources and layers
        if (!map.getSource('route')) {
            map.addSource('route', {
                "type": "geojson",
                "data": route
            });
        
            map.addSource('point', {
                "type": "geojson",
                "data": point
            });
        
            map.addLayer({
                "id": "route",
                "source": "route",
                "type": "line",
                "paint": {
                    "line-width": 7,
                    "line-color": "#007cbf"
                }
            });
        
            map.addLayer({
                "id": "point",
                "source": "point",
                "type": "symbol",
                "layout": {
                    "icon-size": 1,
                    "icon-rotate": ["get", "bearing"],
                    "icon-rotation-alignment": "map",
                    "icon-allow-overlap": true,
                    "icon-ignore-placement": true
                }
            });

        }

        // Update existing sources with new data
        map.getSource('route').setData(route);
        map.getSource('point').setData(point);
}


const flyMap = (map, coordinates, pitch=0, zoom=3, others) =>{
    map.flyTo({
        center:coordinates,
        zoom:zoom,
        pitch:pitch,
        ...others
    })
};


const addMarker = (map, classes, coordinates, image) =>{
    const el = document.createElement('div');
    el.id = 'marker';
    classes && el.classList.add(classes)
    el.style.backgroundImage =`url(${image})`
    new mapboxgl.Marker(el).setLngLat(coordinates).addTo(map);
};

function toggleDistanceVisibility() {
    const distanceContainer = document.getElementById('distance-container');
    distanceContainer.style.display = document.getElementById('distanceCheckbox').checked ? 'block' : 'none';
} 


export {loadMap, mapConfig, flyMap, addMarker, toggleDistanceVisibility}