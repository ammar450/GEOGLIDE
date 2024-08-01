
const animate = (map, animationStarted, route, running, counter, steps) => {
    if (!animationStarted) {
        setTimeout(() => {
            animationStarted = true;
            animate();
        }, 1000);
        return;
    }

    running = true;

    const start = route.features[0].geometry.coordinates[counter >= steps ? counter - 1 : counter];
    const end = route.features[0].geometry.coordinates[counter >= steps ? counter : counter + 1];

    console.log("🚀 ~ animate ~ counter < steps:",route, start, end)


    if (!start || !end) {
        running = false;
        document.getElementById('replay').disabled = false;
        resetAnimation();
        return;
    }

    const lerpedCoordinates = [
        lerp(start[0], end[0], 0.1),
        lerp(start[1], end[1], 0.1)
    ];

    point.features[0].geometry.coordinates = lerpedCoordinates;
    point.features[0].properties.bearing = turf.bearing(turf.point(start), turf.point(end));

    // Check if sources exist before updating data
    const routeSource = map.getSource('route');
    const pointSource = map.getSource('point');

    if (routeSource && pointSource) {
        routeSource.setData(route);
        pointSource.setData(point);
    } else {
        console.error('Map sources not found.');
    }

    updateDistanceTagPosition(lerpedCoordinates);

    map.panTo(lerpedCoordinates);

    // Use the animation speed value to control the duration of each animation step
    const animationSpeed = document.getElementById('animationSpeedSlider').value;
    const duration = 1000 / animationSpeed; // Adjust the duration based on the speed value

    if (counter < steps) {
        setTimeout(() => {
            requestAnimationFrame(animate);
        }, duration);
    } else {
        return;
        resetAnimation();
        document.getElementById('replay').disabled = true;
        stopRecording();
    }

    counter = counter + 1;
};

export { animate }
