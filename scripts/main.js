import { animate } from './animation.js';
import { loadMap, mapConfig, flyMap, addMarker, toggleDistanceVisibility } from './maps.js';
import "https://api.mapbox.com/mapbox-gl-js/v3.0.0/mapbox-gl.js";


// Variables declaration here

var route = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": [0, 0]
            }
        }
    ]
};

// A single point that animates along the route.
// Coordinates are initially set to origin.
var point = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "type": "Point",
                "coordinates": [0, 0]
            }
        }
    ]
};


let steps = 400;
let arc = [];
/// New vars of animation Line on land


route.features[0].geometry.coordinates = arc;


const ACCESS_TOKEN = 'pk.eyJ1Ijoib2JhZ2dvIiwiYSI6ImNscnV1dzZyeTAxYm0yaW8yeWtzM2VtejgifQ.lrrKCPKUjiKL1c6UjbF6_A'
let travelMode = 'land';
let vehicle = 'motorCar';
let routeLineStyle = 'blue';
let landAnimationFrameID, airAnimationFrameID, boatAnimationFrameID
let counter = 0;
let running = false;
let recorder;
let isRecording = false;
let animationStarted = false;
let origin;
let destination;

function lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
}

const images = [ 'boat', 'plane', 'motorCar'];
const RoutelinesWithStyles = {
    'blue':{
        'line-color': "#007cbf",
        'line-dasharray': [],
        },
    'red_dotted':{
        'line-color': "#FF0000",
        'line-dasharray': [2, 2],
        },
    'yellow':{
        'line-color': "#FFFF00",
        'line-dasharray': [],
        },
    };

mapboxgl.accessToken = ACCESS_TOKEN;

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/satellite-streets-v12',
    center: [-96, 37.8],
    zoom: 1,
    project:'globe',
    bearing: 0,
});

function geocode(city, callback) {
    fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${city}.json?access_token=${mapboxgl.accessToken}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Geocoding failed');
            }
            return response.json();
        })
        .then(data => {
            const features = data.features;
            if (features.length > 0) {
                const [lng, lat] = features[0].center;
                callback([lng, lat]);
            } else {
                throw new Error('No coordinates found for the given location');
            }
        })
        .catch(error => {
            console.error('Geocoding error:', error);
        });
}
document.getElementById('search-js').onload = () => {
    const submitBtn = document.querySelector('#submitBtn');
    const vehicleDropdownItems = document.querySelectorAll('#vehicleDropdown .dropdown-item');
    const travelModeDropdownItems = document.querySelectorAll('#travelModeDropdown .dropdown-item');
    const routeStyleDropdownItems = document.querySelectorAll('#routeLineStyleDropdown .dropdown-item');
    const animationSpeedSlider = document.querySelector('#animationSpeedSlider');
    const clearAnimationBtn = document.querySelector('#clearAnimationBtn');
    const distanceCheckbox = document.querySelector('#distanceCheckbox');
    const showMoreMapStyles = document.querySelector('#showMoreMapStyles');

    const departure = document.querySelector('mapbox-search-box#departure');
    const arrival = document.querySelector('mapbox-search-box#arrival');
    departure.accessToken = ACCESS_TOKEN;
    arrival.accessToken = ACCESS_TOKEN;

    //departure.bindMap(map);
    departure.addEventListener('retrieve', (e) => {
        if (e.target !== e.currentTarget) return;
        const existingMarker = document.querySelector('#marker.departure-marker');
        if (existingMarker) existingMarker.remove();
        
        const city = e.detail.features[0].place_name;
        geocode(city, (coordinates) => {
            origin = coordinates;
            let bgImage = 'https://www.shutterstock.com/image-vector/pin-point-logo-can-be-600nw-1679653036.jpg';
            addMarker(map, 'departure-marker', origin, bgImage);
            flyMap(map, origin, 0, 5);
            if(destination) {
                animateRoute('motorCar', 'land'); // Assuming motorCar and land are default values
            }
        });
    });

    //arrival.bindMap(map);
    arrival.addEventListener('retrieve', (e) => {
        if (e.target !== e.currentTarget) return;
        const existingMarker = document.querySelector('#marker.arrival-marker');
        if (existingMarker) existingMarker.remove();
        
        const city = e.detail.features[0].place_name;
        geocode(city, (coordinates) => {
            destination = coordinates;
            let bgImage = 'https://thumbs.dreamstime.com/b/red-maps-pin-location-map-icon-location-pin-pin-icon-vector-red-maps-pin-location-map-icon-location-pin-pin-icon-vector-vector-140200096.jpg';
            addMarker(map, 'arrival-marker', destination, bgImage);
            flyMap(map, destination, 0, 5);
            if(origin) {
                animateRoute('motorCar', 'land'); // Assuming motorCar and land are default values
            }
        });
    });

    showMoreMapStyles.addEventListener('click', (e) => {
        e.preventDefault();
    });

    Array.from(travelModeDropdownItems).forEach(ele => {
        ele.addEventListener('click', () => travelMode = ele.getAttribute('data-value'));
    });

    Array.from(vehicleDropdownItems).forEach(ele => {
        ele.addEventListener('click', () => vehicle = ele.getAttribute('data-value'));
    });

    Array.from(routeStyleDropdownItems).forEach(ele => {
        ele.addEventListener('click', () => routeLineStyle = ele.getAttribute('data-value'));
    });

    distanceCheckbox.addEventListener('change', () => toggleDistanceVisibility());
    clearAnimationBtn.addEventListener('click', () => {
        resetAnimation();
        const markers = document.querySelectorAll('div#marker');
        Array.from(markers).forEach(ele => ele.remove());
        arrival.value = '';
        departure.value = '';
    });

    animationSpeedSlider.addEventListener('input', e => {
        const sliderValue = parseInt(e.target.value);
        animationSpeedSlider.style.background = `linear-gradient(to right, var(--primary-color) 0%, var(--primary-color) ${(sliderValue * 10) - 2}%, #fff ${(sliderValue * 10) - 2}%, white 100%)`;
        const maxSteps = 1000;
        const minSteps = 100;
        steps = Math.round(minSteps + (maxSteps - minSteps) * (1 - sliderValue / 10));
    });

    submitBtn.addEventListener('click', () => {
        
        console.log(travelMode, vehicle, routeLineStyle);
        if (origin && destination) {
            resetAnimation();
            animateRoute(vehicle, travelMode);
        }
    });
};


map.on('style.load', ()=> {
    mapConfig(map, route, point);

    images.forEach(imageName => {
        map.loadImage(`/assets/images/${imageName}.png`, (error, img) => {
            if (error) throw error;
            map.addImage(imageName, img);
        });
    });

    origin = [67.020705,24.854684]
   destination = [-0.127647, 51.5073]
   origin = [74.314183, 31.565682]
    destination = [67.020705,24.854684]
    animateRoute('plane', 'air')


});
map.on('load', () =>{    
    map.setFog({});
});



const animateRoute = async (selectedVehicle, selectedTravelMode) => {

    flyMap(map, origin, null, 10, {speed: 1.5, essential: true})

    setTimeout(() => {
        map.flyTo({ center: origin, zoom: 3, speed: 1.5, essential: true }, { duration: 5000 });
    }, 2000);

    setTimeout(() => {
        map.flyTo({ center: destination, zoom: 10, speed: 1.5, essential: true }, { duration: 5000});
    }, 4000);

    setTimeout(() => {
        map.flyTo({ center: destination, zoom: 3, speed: 1.5, essential: true }, { duration: 5000});
    }, 6000);

    setTimeout(() => {
        map.flyTo({ center: origin, zoom: 4.6, speed: 1.5, essential: true }, { duration: 5000 });
    }, 8000);


    setTimeout(async () => {
        arc.length = 0;
        counter = 0
        
        map.setLayoutProperty( 'point', 'icon-image', selectedVehicle);
        Object.keys(RoutelinesWithStyles).forEach(e =>{
            if (e === routeLineStyle) {
                const val =  RoutelinesWithStyles[e]
                for (const property in val) {
                    if (val.hasOwnProperty(property)) {
                        map.setPaintProperty('route', property, val[property]);
                    }
                }
            }
        })

        if(selectedTravelMode==="land"){
            try {
                const isAvailable = await isLandRouteAvailable(origin, destination)
                if (!isAvailable) {
                    alert('Your route is crossing international waters. Please select air/water route.');
                    resetAnimation();
                    return;
                }

                await getLandRoute(origin, destination);
            } catch (error) {
                console.error('Error checking land route availability:', error);
                resetAnimation();
            };
        }
        else if(selectedTravelMode==="air"){
            route.features[0].geometry.coordinates = [origin, destination];
            const lineDistance = turf.length(route.features[0], 'kilometers');

            document.getElementById('distanceTag').innerText = lineDistance.toFixed(2);
            // Draw an arc between the `origin` & `destination` of the two points
            for (let i = 0; i < lineDistance; i += lineDistance / steps) {
                const segment = turf.along(route.features[0], i);
                arc.push(segment.geometry.coordinates);
            };
            route.features[0].geometry.coordinates = [];
            // Start the animation if it hasn't already started
            if (!animationStarted) {
                animationStarted = true;
                animatePlanAnimation();
            };
            counter = 0;
            animationStarted = false;
        };

    }, 10000);



        route.features[0].geometry.coordinates = arc;
        
        // Start the animation.
        animate(0, 0);
        
        

        map.panTo(arc[0]);

        point.features[0].properties.vehicle = selectedVehicle;

        startRecording();
        let running = false;
        animate(map, animationStarted, route, running, counter, steps);

        // Stop recording and show download link when animation is complete
        setTimeout(() => {
            stopRecording();
            document.getElementById('downloadLink').style.display = 'block';
        }, 8000 + steps * (1000 / document.getElementById('animationSpeedSlider').value));

};



const getLandRoute = async (origin, destination) => {
    const accessToken = 'pk.eyJ1Ijoib2JhZ2dvIiwiYSI6ImNscnV1dzZyeTAxYm0yaW8yeWtzM2VtejgifQ.lrrKCPKUjiKL1c6UjbF6_A';
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?steps=true&geometries=geojson&access_token=${accessToken}`;

    const response = await fetch(url);
    const data = await response.json();
    const routeCoordinates = data.routes[0].geometry.coordinates;

    route.features[0].geometry.coordinates = routeCoordinates;

    const lineDistance = turf.lineDistance(route.features[0], 'kilometers');
    document.getElementById('distanceTag').innerText = lineDistance.toFixed(2);

    let turfArc = [];
    turfArc.length = 0;
    // Data of an arc between the `origin` & `destination` of the two points
    for (let i = 0; i < lineDistance; i += lineDistance / steps) {
        let segment = turf.along(route.features[0], i, 'kilometers');
        turfArc.push(segment.geometry.coordinates)
    };
    // console.log(origin, destination)
    const animateLine = () => {
    
        if (counter < steps) {

            //// Animate the Line
            arc.push(turfArc[counter]);
            route.features[0].geometry.coordinates = arc;

            /// Animate Icon based on Line
            point.features[0].geometry.coordinates = turfArc[counter]
            if (counter < route.features[0].geometry.coordinates.length - 1) {
                point.features[0].properties.bearing = turf.bearing(
                    turf.point(route.features[0].geometry.coordinates[counter]),
                    turf.point(route.features[0].geometry.coordinates[counter + 1])
                );
            }

            map.getSource('point').setData(point);
            map.getSource('route').setData(route);


            //// Animate The Camera
            const camera = map.getFreeCameraOptions();
            camera.position = mapboxgl.MercatorCoordinate.fromLngLat(
                {
                    lng: turfArc[counter][0],
                    lat: turfArc[counter][1]
                },
                800000
            );
            
            // camera.setPitchBearing(10, 0);
            // map.setPitch(30)
            // map.setBearing(0)

            map.setFreeCameraOptions(camera);
            
            counter++;
            landAnimationFrameID = requestAnimationFrame(animateLine);
        } else {
            FitMapToCoordinates(turfArc[0], turfArc[turfArc.length - 1])
            animationStarted = false;
        }
    };
    
    // Start the animation if it hasn't already started
    if (!animationStarted) {
        animationStarted = true;
        animateLine();
    };
    counter = 0;
    animationStarted = false;
};



const FitMapToCoordinates = (originCoords, destinationCoords) => {
    console.log("🚀 ~ FitMapToCoordinates ~ originCoords:", originCoords)    
    // Calculate bounds to fit both origin and destination
    const bounds = [
        [originCoords[0], originCoords[1]],
        [destinationCoords[0], destinationCoords[1]]
    ];
    
    // Fit the map to the bounds
    map.fitBounds(bounds, {maxZoom: map.getZoom() + .5, linear: true, pitch:10});

    map.once('moveend', () => {
        map.zoomOut();
    });
};



const animatePlanAnimation = async () =>{
        if (counter < steps) {
            //// Animate the Line
            let updatedArc = [...route.features[0].geometry.coordinates, [...arc[counter]]]
            route.features[0].geometry.coordinates = updatedArc;

            /// Animate Icon based on Line
            point.features[0].geometry.coordinates = arc[counter];
            if (counter < route.features[0].geometry.coordinates.length - 1) {
                point.features[0].properties.bearing = turf.bearing(
                    turf.point(route.features[0].geometry.coordinates[counter]),
                    turf.point(route.features[0].geometry.coordinates[counter + 1])
                );
            }

            map.getSource('point').setData(point);
            map.getSource('route').setData(route);

            // Animate The Camera
            const camera = map.getFreeCameraOptions();
            camera.position = mapboxgl.MercatorCoordinate.fromLngLat(
                {
                    lng: arc[counter][0],
                    lat: arc[counter][1]
                },
                400000
            );
            // camera.setPitchBearing(30, -40);
            map.setFreeCameraOptions(camera);

            counter++;
            airAnimationFrameID = requestAnimationFrame(animatePlanAnimation);
        } else {
            animationStarted = false;
            FitMapToCoordinates(origin, destination)
        }
};

// function updateDistanceTagPosition(coordinates) {
//     const distanceContainer = document.getElementById('distance-container');
        // distanceContainer.style.left = `${pointPixels.x + 10}px`;
        // distanceContainer.style.top = `${pointPixels.y + 10}px`;
// }


function resetAnimation() {
    running = false;
    animationStarted = false;
    counter = 0;
    cancelAnimationFrame(airAnimationFrameID);
    cancelAnimationFrame(landAnimationFrameID);
    cancelAnimationFrame(boatAnimationFrameID);

    map.setLayoutProperty( 'point', 'icon-image', 'none');

    route.features[0].geometry.coordinates = [];
    point.features[0].geometry.coordinates = [0, 0];
    point.features[0].properties.bearing = 0;

    if(map.getSource('route'))  map.getSource('route').setData(route);
    if(map.getSource('point'))  map.getSource('point').setData(point);
    
    map.setPitch(0);
    map.flyTo({
        center: [-96, 37.8],
        zoom: 1,
    });

    document.getElementById('departure').disabled = false;
    document.getElementById('arrival').disabled = false;
    // document.getElementById('vehicleDropdown').disabled = false;
    document.getElementById('submitBtn').disabled = false;
}


function isLandRouteAvailable(origin, destination) {
    const accessToken = 'pk.eyJ1Ijoib2JhZ2dvIiwiYSI6ImNscnV1dzZyeTAxYm0yaW8yeWtzM2VtejgifQ.lrrKCPKUjiKL1c6UjbF6_A';
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?steps=true&access_token=${accessToken}`;

    return fetch(url)
        .then(response => response.json())
        .then(data => data.routes && data.routes.length > 0)
        .catch(error => {
            console.error('Error checking land route availability:', error);
            return false;
        });
};



function getCoordinates(city, type) {
    fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${city}.json?access_token=${mapboxgl.accessToken}`)
        .then(response => {
            if (!response.ok) throw new Error('Geocoding failed');
            return response.json();
        })
        .then(data => {
            const features = data.features;
            if (features.length > 0) {
                const coordinates = features[0].center;
                if (type === 'origin') {
                    origin = coordinates;
                } else {
                    destination = coordinates;
                }

                console.log(`${type} set to:`, coordinates);

                // Optional: Trigger any action once both coordinates are set
                if (origin && destination) {
                    // Example: Initialize the map view or trigger animations
                    console.log('Both origin and destination are set.');
                    flyMap(map, origin, 0, 5);  // Fly to origin to demonstrate
                    setTimeout(() => flyMap(map, destination, 0, 5), 3000); // Then fly to destination
                }
            } else {
                throw new Error('No coordinates found for the given location');
            }
        })
        .catch(error => console.error('Geocoding error:', error));
}


document.addEventListener("DOMContentLoaded", function() {
   
        const submitBtn = document.getElementById('submitBtn');
    
        submitBtn.addEventListener('click', () => {
            const departureCity = document.getElementById('departure').value;
            const arrivalCity = document.getElementById('arrival').value;
    
            if (departureCity && arrivalCity) {
                getCoordinates(departureCity, 'origin');
                getCoordinates(arrivalCity, 'destination');
            } else {
                console.log("Please enter both a departure and arrival city.");
            }
        });
    

    //////////////////  Logic for Applying click events to Map Style Buttons  //////////////////

    const mapStyleBtns = document.querySelectorAll(".map-style-button.map-style-switcher");
    const IdsWithStyles = {
        "streets":"mapbox://styles/mapbox/streets-v12",
        'outdoors':"mapbox://styles/mapbox/outdoors-v12",
        'light':"mapbox://styles/mapbox/light-v11",
        'dark':"mapbox://styles/mapbox/dark-v11",
    };

    Array.from(mapStyleBtns).forEach(ele =>{
        const style = IdsWithStyles[ele.id];
        ele.addEventListener('click', (e) =>{
            loadMap(map, style)
        })
    })  
    
    
    // function startRecording() {
    //     const canvas = document.getElementById('animationCanvas');
    //     const stream = canvas.captureStream();
    //     recorder = RecordRTC(stream, {
    //         type: 'video',
    //         frameInterval: 1,
    //         mimeType: 'video/webm;codecs=vp9',
    //     });
    
    //     recorder.startRecording();
    //     isRecording = true;
    // }
    
    // function stopRecording() {
    //     if (isRecording) {
    //         document.getElementById('downloadLink').style.display = 'block';
    
    //         recorder.stopRecording(() => {
    //             const blob = recorder.getBlob();
    //             const formData = new FormData();
    //             formData.append('video', blob, 'animation.webm');
    
    //             // Send the recorded video to the server using AJAX/fetch
    //             fetch('/server.js', {
    //                 method: 'POST',
    //                 body: formData,
    //             })
    //             .then(response => {
    //                 if (!response.ok) {
    //                     throw new Error(`HTTP error! Status: ${response.status}`);
    //                 }
    //                 return response.json();
    //             })
    //             .then(data => {
    //                 console.log('Video saved on server:', data);
    //             })
    //             .catch(error => {
    //                 console.error('Error saving video on server:', error.message);
    //                 // Print server response to console if available
    //                 if (error.response) {
    //                     error.response.text().then(text => console.log('Server response:', text));
    //                 }
    //             });
    
    //             isRecording = false;
    //         });
    //     }
    // }
    
   

});






