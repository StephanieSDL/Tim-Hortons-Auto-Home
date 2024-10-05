from flask import Blueprint, jsonify, request, session
from flask_socketio import emit

devices_bp = Blueprint('devices_bp', __name__)

# In-memory devices data structure
devices = {
    'light_1': {'status': 'off'},
    'thermostat': {'status': 'off', 'temperature': 22}
}

@devices_bp.route('/devices', methods=['GET'])
def list_devices():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'status': 'fail', 'message': 'Unauthorized'}), 401
    return jsonify({'status': 'success', 'devices': devices})

@devices_bp.route('/device/<device_id>/control', methods=['POST'])
def control_device(device_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'status': 'fail', 'message': 'Unauthorized'}), 401
    command = request.json.get('command')
    result = control_device_logic(device_id, command)
    if result['status'] == 'success':
        return jsonify(result)
    else:
        return jsonify(result), 400

def control_device_logic(device_id, command):
    if device_id not in devices:
        return {'status': 'fail', 'message': 'Device not found'}
    # Simple command processing
    if command == 'toggle':
        current_status = devices[device_id]['status']
        devices[device_id]['status'] = 'on' if current_status == 'off' else 'off'
    elif command in ('on', 'off'):
        devices[device_id]['status'] = command
    else:
        return {'status': 'fail', 'message': 'Invalid command'}
    # Broadcast updated device status
    from app import socketio
    socketio.emit('status_update', {'devices': devices})
    return {'status': 'success', 'device': device_id, 'new_status': devices[device_id]}