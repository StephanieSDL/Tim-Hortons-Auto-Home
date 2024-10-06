$(document).ready(function () {
    let deviceStates = {};
    let isDeviceOn = false;
    // Connect to Socket.IO
    var socket = io.connect();

    // Receive status updates from the server
    socket.on('status_update', function (data) {
        console.log('syn_3');
        updateDeviceStatuses(data.devices);
        // Assuming security status and proximity data are included
        updateSecurityStatus(data.security_status);
        simulateUserMovement(data.is_user_nearby);
    });

    socket.on('answer_update', function(data) {
        console.log("Received new answer from server:", data.data);
        // Here, you can use the answer (data.data) in your logic
        // updateAnswerOnPage(data.data);
        console.log(data.data['status'])
        console.log(data.data['category'])
        let command = data.data['status'] === 'True' ? '1' : '0';
        switch(data.data['category'].toLowerCase()) {
            case 'tv':
                var deviceId = 'tv';
                break;
            case 'bathroom light':
                var deviceId = 'bathroom-light';
                break;
            case 'counter light':
                var deviceId = 'counter-light';
                break;
            case 'desk light':
                var deviceId = 'desk-light';
                break;
            case 'dishwasher':
                var deviceId = 'dishwasher';
                break;
            case 'lock':
                var deviceId = 'lock';
                break;
            case 'stove':
                var deviceId = 'stove';
                break;
        };          

        $.ajax({
            url: '/device/' + deviceId + '/control',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ command }),
            success: function (response) {
                // The server will emit a status_update event
                console.log('Device state updated:', deviceId, command);
            },
            error: function () {
                console.log('Error updating device state.');
            }
        });
    });

    socket.on('control_all_devices', function (data) {
        let command = data.state === 'on' ? '1' : '0';  // '1' for on, '0' for off

        // Send AJAX requests to control each device
        deviceOrder.forEach(deviceId => {
            $.ajax({
                url: '/device/' + deviceId + '/control',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ command: command }),
                success: function (response) {
                    console.log('Device', deviceId, 'turned', data.state);
                },
                error: function () {
                    console.error('Error controlling device:', deviceId);
                }
            });
        });
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
    $('.device-card').click(function () {
        
        var deviceId = $(this).data('device-id');
        // isDeviceOn = !data(devices[deviceID]['status']);
        if (typeof deviceStates[deviceId] === 'undefined') {
            deviceStates[deviceId] = false; // Default is off
        }
        // isDeviceOn = !isDeviceOn;
        deviceStates[deviceId] = !deviceStates[deviceId];
        let isDeviceOn = deviceStates[deviceId];

        // Update UI with new state
        if (isDeviceOn) {
            $('#status-' + deviceId).text('On');
            $(this).addClass('device-on').removeClass('device-off');
            // devices[deviceID]['status'] = '1';
        } else {
            $('#status-' + deviceId).text('Off');
            $(this).addClass('device-off').removeClass('device-on');
            // devices[deviceID]['status'] = '0';
        }
        $.ajax({
            url: '/device/' + deviceId + '/control',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ command: isDeviceOn ? '1' : '0'}),
            success: function (response) {
                // The server will emit a status_update event
                console.log('Device state updated:', deviceId, isDeviceOn ? '1' : '0');
            },
            error: function () {
                console.log('Error updating device state.');
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
            // Update device appearance
            if (status === '1') {
                $('#device-' + deviceId).addClass('device-on').removeClass('device-off');
                $('#status-' + deviceId).text('On');
            } else if (status == '0') {
                $('#device-' + deviceId).addClass('device-off').removeClass('device-on');
                $('#status-' + deviceId).text('Off');
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
