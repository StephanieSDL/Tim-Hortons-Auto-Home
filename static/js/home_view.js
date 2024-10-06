$(document).ready(function() {
    const imageElement = document.getElementById('home-image');
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

    // Initialize devicesStatus array with default statuses '0'
    for (let i = 0; i < deviceOrder.length; i++) {
        devicesStatus[i] = '0';
    }

    // Connect to Socket.IO
    var socket = io.connect('http://' + document.domain + ':' + location.port);
    console.log("connected");

    // Receive device updates from the server
    socket.on('status_update', function(data) {
        console.log("3");
        updateDeviceStatus(data.device_id, data.device);
        updateImage();
    });

    // Fetch initial device statuses
    $.ajax({
        url: '/devices',
        type: 'GET',
        success: function(response) {
            if (response.status === 'success') {
                for (let deviceId in response.devices) {
                    updateDeviceStatus(deviceId, response.devices[deviceId]);
                    print('get success')
                }
                updateImage();
            }
        }
    });

    function updateDeviceStatus(deviceId, device) {
        console.log("update log");
        const index = deviceOrder.indexOf(deviceId);
        if (index !== -1) {
            devicesStatus[index] = device.status.toString();
        } else {
            console.error('Unknown device:', deviceId);
        }
    }

    function updateImage() {
        const statusString = devicesStatus.join('');
        const newImageSrc = 'assets/render_' + statusString + '.png';

        // Apply the dissolving effect
        imageElement.classList.add('fade-out');

        // After the transition ends, update the src and remove the class
        imageElement.addEventListener('transitionend', onTransitionEnd);

        function onTransitionEnd() {
            imageElement.removeEventListener('transitionend', onTransitionEnd);

            // Update the image source
            imageElement.src = newImageSrc;

            // Force reflow to restart the transition
            void imageElement.offsetWidth;

            // Remove the fade-out class to fade back in
            imageElement.classList.remove('fade-out');
        }
    }
});
