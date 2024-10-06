document.addEventListener('DOMContentLoaded', function() {
    let imageElement = document.getElementById('home-image');
    let botImage = document.getElementById('bot-image');
    const devicesStatus = [];
    const deviceOrder = [
        'bathroom-light',
        'counter-light',
        'desk-light',
        'dishwasher',
        'lock',
        'stove',
        'tv'
    ];

    // Going to and Returning from Work
    let goWorkButton = document.getElementById('gowork');
    let distanceDisplay = document.getElementById('distance-display');
    let distances = [0, 100, 300, 500, 800, 1000, 2000, 3000, 4000];
    let distanceIndex = 0;
    let goingToWork = true;

    goWorkButton.addEventListener('click', function () {
        if (goWorkButton.textContent == "Go to Work") {
            goWorkButton.textContent = "Go Back Home";
        } else if (goWorkButton.textContent == "Go Back Home") {
            goWorkButton.textContent = "Go to Work";
        }
        goToWorkOrHome();
    });

    function goToWorkOrHome() {
        let distanceInterval = setInterval(function () {
            if (goingToWork) {
                if (distanceIndex < distances.length - 1) {
                    distanceIndex++;
                } else {
                    clearInterval(distanceInterval);  // Stop the interval
                    goWorkButton.textContent = "Go Back Home";  // Prepare for return journey
                    goingToWork = false;  // Set flag for return journey
                    return;  // Exit function without continuing the journey
                }
            } else {
                if (distanceIndex > 0) {
                    distanceIndex--;
                } else {
                    clearInterval(distanceInterval);  // Stop the interval
                    goWorkButton.textContent = "Go to Work";  // Prepare for next work journey
                    goingToWork = true;  // Set flag for next work journey
                    return;  // Exit function
                }
            }

            let distanceValue = distances[distanceIndex];
            distanceDisplay.textContent = distanceValue < 1000 ? distanceValue + 'm' : (distanceValue / 1000) + 'km';

            // Check for device control based on the distance
            if (distanceValue === 100) {
                controlDevices(goingToWork ? 'off' : 'on');
            }

        }, 1000);  // Adjust time for speed of distance change
    }

    function controlDevices(state) {
        // Emit socket event to control all devices
        socket.emit('control_all_devices', { state: state });
        console.log('Turning devices', state === 'on' ? 'on' : 'off');
    }

    // Initialize devicesStatus array with default statuses '0'
    for (let i = 0; i < deviceOrder.length; i++) {
        devicesStatus[i] = '0';
    }

    let isTransitioning = false;
    let newImageSrc = '';

    // Connect to Socket.IO
    var socket = io.connect();
    socket.on('connect', function() {
        console.log("Connected to Socket.IO server");
    });

    // Receive device updates from the server
    socket.on('status_update', function (data) {
        console.log("Received status_update event:", data);
        updateDeviceStatus(data.device_id, data.device);
        updateImage();
    });
    
    // Fetch initial device statuses
    fetch('/devices')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                for (let deviceId in data.devices) {
                    updateDeviceStatus(deviceId, data.devices[deviceId]);
                }
                console.log("Initial device statuses fetched");
                updateImage();
            } else {
                console.error('Failed to fetch devices:', data.message);
            }
        })
        .catch(error => {
            console.error('Error fetching devices:', error);
        });
        
    function updateDeviceStatus(deviceId, device) {
        const index = deviceOrder.indexOf(deviceId);
        if (index !== -1) {
            devicesStatus[index] = device.status.toString();
            console.log(`Device ${deviceId} status updated to ${device.status}`);
        } else {
            console.error('Unknown device:', deviceId);
        }
    }

    function updateImage() {
        const statusString = devicesStatus.join('');
        newImageSrc = '/static/assets/render_' + statusString + '.png';
        console.log('Updating image to:', newImageSrc);

        botImage.src = newImageSrc;
        void imageElement.offsetWidth;
        imageElement.classList.add('fade-out');
        void imageElement.offsetWidth;  // Forces reflow before applying the next transition

        imageElement.addEventListener('transitionend', onFadeOut);
        
    }

    function onFadeOut(event) {
        if (event.propertyName === 'opacity') {
            imageElement.removeEventListener('transitionend', onFadeOut);

            // Update the image source
            imageElement.src = newImageSrc;

            // Start fade-in
            imageElement.classList.remove('fade-out');  // Remove fade-out and hidden

            // Force reflow to restart the transition
            void imageElement.offsetWidth;
        }
    }
});
