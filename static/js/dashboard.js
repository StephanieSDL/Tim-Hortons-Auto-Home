$(document).ready(function() {
    let deviceStates = {};
    let isDeviceOn = false;
    // Connect to Socket.IO
    var socket = io.connect('http://' + document.domain + ':' + location.port);

    // Receive status updates from the server
    socket.on('status_update', function(data) {
        console.log("syn_3");
        updateDeviceStatuses(data.devices);
        // Assuming security status and proximity data are included\
        console.log("syn_3");
        updateSecurityStatus(data.security_status);
        simulateUserMovement(data.is_user_nearby);
    });

    // // Fetch initial device statuses
    // $.ajax({
    //     url: '/devices',
    //     type: 'GET',
    //     success: function (response) {
    //         if (response.status === 'success') {
    //             updateDeviceStatuses(response.devices);
    //         }
    //     }
    // });

    // var devices = {
    //     'bathroom-light': {'status': '0'},
    //     'counter-light': {'status': '0'},
    //     'desk-light': {'status':'0'},
    //     'dishwasher': {'status':'0'},
    //     'lock': {'status':'0'},
    //     'stove': {'status':'0'},
    //     'tv': {'status': '0'}
    // };

    // Handle device toggle buttons
    $('.device-card').click(function() {
        console.log("toggle hit");
        var deviceId = $(this).data('device-id');
        // isDeviceOn = !data(devices[deviceID]['status']);
        if (typeof deviceStates[deviceId] === 'undefined') {
            deviceStates[deviceId] = false; // Default is off
            console.log(deviceStates);
        }
        // isDeviceOn = !isDeviceOn;
        deviceStates[deviceId] = !deviceStates[deviceId];
        let isDeviceOn = deviceStates[deviceId];

        // Update UI with new state
        if (isDeviceOn) {
            $('#status-' + deviceId).text('On');
            $(this).addClass('device-on').removeClass('device-off');
            // devices[deviceID]['status'] = '1';
            console.log('Device state list:', deviceStates);
        } else {
            $('#status-' + deviceId).text('Off');
            $(this).addClass('device-off').removeClass('device-on');
            // devices[deviceID]['status'] = '0';
        }
        $.ajax({
            url: '/device/' + deviceId + '/control',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ command: isDeviceOn ? '1' : '0' }),
            success: function(response) {
                // The server will emit a status_update event
                console.log('Device state updated:', deviceId, isDeviceOn ? '1' : '0');
            },
            error: function() {
                console.log('Error updating device state.');
            }
        });
    });

    // Handle natural language command submission
    $('#send-command').click(function() {
        const commandText = $('#nl-command').val();
        $('#ai-response').text('Processing...');
        $.ajax({
            url: '/process_command',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ command: commandText }),
            success: function(response) {
                if (response.status === 'success') {
                    $('#ai-response').text('Executed: ' + response.action.device + ' - ' + response.action.action);
                } else {
                    $('#ai-response').text('Error: ' + response.message);
                }
            },
            error: function() {
                $('#ai-response').text('Failed to process the command.');
            }
        });
    });

    // Speech Recognition Setup
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        $('#voice-command-btn').click(function() {
            recognition.start();
            $('#mic-icon').text('🎙️'); // Change icon to indicate recording
        });

        recognition.addEventListener('result', function(event) {
            const transcript = event.results[0][0].transcript;
            $('#nl-command').val(transcript);
            $('#mic-icon').text('🎤'); // Reset icon
        });

        recognition.addEventListener('speechend', function() {
            recognition.stop();
            $('#mic-icon').text('🎤'); // Reset icon
        });

        recognition.addEventListener('error', function(event) {
            console.error('Speech recognition error:', event.error);
            $('#ai-response').text('Error during speech recognition: ' + event.error);
            $('#mic-icon').text('🎤'); // Reset icon
        });
    } else {
        // Browser doesn't support Speech Recognition API
        $('#voice-command-btn').prop('disabled', true);
        $('#ai-response').text('Speech recognition not supported in this browser.');
    }

    // Update device statuses on the dashboard
    function updateDeviceStatuses(devices) {
        for (let deviceId in devices) {
            const status = devices[deviceId].status;
            $('#status-' + deviceId).text(status);
            // Update device appearance
            if (status === 'on') {
                $('#device-' + deviceId).addClass('device-on').removeClass('device-off');
            } else {
                $('#device-' + deviceId).addClass('device-off').removeClass('device-on');
            }
        }
    }

    // Update security system status
    function updateSecurityStatus(status) {
        $('#security-status-text').text(status);
        if (status === 'Disarmed') {
            $('#security-status-text').css('color', 'green');
        } else {
            $('#security-status-text').css('color', 'red');
        }
    }

    // Simulate user movement in the location animation
    function simulateUserMovement(isNear) {
        const userIcon = $('#user-icon');
        if (isNear) {
            userIcon.animate({ left: '150px' }, 1000);
        } else {
            userIcon.animate({ left: '0px' }, 1000);
        }
    }
});