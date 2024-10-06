from flask import Blueprint, jsonify, request, session
from flask_socketio import emit

devices_bp = Blueprint('devices_bp', __name__)

# In-memory devices data structure
devices = {
    'bathroom-light': {'status': '0'},
    'counter-light': {'status': '0'},
    'desk-light': {'status':'0'},
    'dishwasher': {'status':'0'},
    'lock': {'status':'0'},
    'stove': {'status':'0'},
    'tv': {'status': '0'}
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
    from app import socketio
    socketio.emit('status_update', {'devices': current_status})
    return {'status': 'success', 'device': device_id, 'new_status': devices[device_id]}

@devices_bp.route('/device/<device_id>/control', methods=['POST'])
def control_device(device_id):
    data = request.get_json()
    command = data.get('command')
    if command == '1':
        # Logic to turn the device ON
        control_device_logic(device_id, command)
        print(f"Device {device_id} turned ON")
    elif command == '0':
        # Logic to turn the device OFF
        control_device_logic(device_id, command)
        print(f"Device {device_id} turned OFF")
    return jsonify({'status': 'success'})
