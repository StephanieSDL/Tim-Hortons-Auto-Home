from flask import Blueprint, jsonify, request, session
from flask_socketio import emit
from socketio_setup import socketio

devices_bp = Blueprint('devices_bp', __name__)

# In-memory devices data structure
devices = {
    'bathroom-light': {'status': '1'},
    'counter-light': {'status': '1'},
    'desk-light': {'status':'1'},
    'dishwasher': {'status':'1'},
    'lock': {'status':'1'},
    'stove': {'status':'1'},
    'tv': {'status': '1'}
}

@devices_bp.route('/devices', methods=['GET'])
def list_devices():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'status': 'fail', 'message': 'Unauthorized'}), 401
    return jsonify({'status': 'success', 'devices': devices})

# @devices_bp.route('/device/<device_id>/control', methods=['POST'])
# def control_device(device_id):
#     user_id = session.get('user_id')
#     if not user_id:
#         return jsonify({'status': 'fail', 'message': 'Unauthorized'}), 401
#     command = request.json.get('command')
#     result = control_device_logic(device_id, command)
#     if result['status'] == 'success':
#         return jsonify(result)
#     else:
#         return jsonify(result), 400

def control_device_logic(device_id, command):
    if device_id not in devices:
        return {'status': 'fail', 'message': 'Device not found'}
    # Simple command processing
    if command == '1':
        current_status = devices[device_id]['status']
        devices[device_id]['status'] = '1'
    elif command == '0':
        current_status = devices[device_id]['status']
        devices[device_id]['status'] = '0'
    else:
        return {'status': 'fail', 'message': 'Invalid command'}
    # Broadcast updated device status
    socketio.emit('status_update', {'device_id': device_id, 'device': devices[device_id]})
    return {'status': 'success', 'device': device_id, 'new_status': devices[device_id]}

@devices_bp.route('/device/<device_id>/control', methods=['POST'])
def control_device(device_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'status': 'fail', 'message': 'Unauthorized'}), 401

    data = request.get_json()
    if not data or 'command' not in data:
        return jsonify({'status': 'fail', 'message': 'Command not provided'}), 400

    command = data.get('command')
    if command == '1':
        # Logic to turn the device ON
        result = control_device_logic(device_id, command)
        print(f"Device {device_id} turned ON")
    elif command == '0':
        # Logic to turn the device OFF
        result = control_device_logic(device_id, command)
        print(f"Device {device_id} turned OFF")
    else:
        return jsonify({'status': 'fail', 'message': 'Invalid command'}), 400

    if result['status'] == 'success':
        return jsonify(result)
    else:
        return jsonify(result), 400

@socketio.on('control_all_devices')
def control_all_devices(data):
    state = data.get('state')
    if state not in ['on', 'off']:
        return {'status': 'fail', 'message': 'Invalid state'}

    command = '1' if state == 'on' else '0'

    for device_id in devices:
        control_device_logic(device_id, command)
        print(f"Device {device_id} turned {state}")

    emit('status_update', {'devices': devices})

