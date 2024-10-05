$(document).ready(function () {
    // Connect to Socket.IO
    var socket = io.connect('http://' + document.domain + ':' + location.port);

    // Receive status updates from the server
    socket.on('status_update', function (data) {
        updateDeviceStatuses(data.devices);
        // Assuming security status and proximity data are included
        updateSecurityStatus(data.security_status);
        simulateUserMovement(data.is_user_nearby);
    });

    // Fetch initial device statuses
    $.ajax({
        url: '/devices',
        type: 'GET',
        success: function (response) {
            if (response.status === 'success') {
                updateDeviceStatuses(response.devices);
            }
        }
    });

    // Handle device toggle buttons
    $('.device-toggle').click(function () {
        const deviceId = $(this).data('device-id');
        $.ajax({
            url: '/device/' + deviceId + '/control',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ command: 'toggle' }),
            success: function (response) {
                // The server will emit a status_update event
            }
        });
    });

    // Handle natural language command submission
    $('#send-command').click(function () {
        const commandText = $('#nl-command').val();
        $('#ai-response').text('Processing...');
        $.ajax({
            url: '/process_command',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ command: commandText }),
            success: function (response) {
                if (response.status === 'success') {
                    $('#ai-response').text('Executed: ' + response.action.device + ' - ' + response.action.action);
                } else {
                    $('#ai-response').text('Error: ' + response.message);
                }
            },
            error: function () {
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
