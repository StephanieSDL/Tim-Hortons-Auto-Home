from flask import Blueprint, jsonify, request, session
from flask_socketio import emit
from socketio_setup import socketio
from openai import OpenAI
import json, time
import requests
import apidata


devices_bp = Blueprint('devices_bp', __name__)
answer_ob = None

client = OpenAI(
    # This is the default and can be omitted
    api_key="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",
)

system_prompt = "You are an encoder that can help me read the given sentence and identify two variables returned \
                in a json format {'category': 'bathroom light','status':'True'}, one is the category should be a kind of home appliance \
                the second is the status of the appliance. The status should be a string format but is a boolen indicating it's on or off \
                or it can be an integer indicating its value. If the appliance device is not one of the following ones, the status should NA: \
                bathroom light, counter light, desk light, dishwasher, Lock, Stove, TV."   

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

@devices_bp.route('/events', methods=['POST'])
def receive_event():
    global answer_ob
    data = request.json
    transcript = data.get('transcript')
    if transcript:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",  # or any other available model
            messages=[{ "role": "system", "content": f"{system_prompt}" },
                        { "role": "user", "content": f"{transcript}"}]
        )
                
                # Extract the response content
        answer = response.choices[0].message.content
        new = answer.replace("'", '"')
        answer_ob = json.loads(new)
        answer_ob['transcript'] = f"{transcript}"
        print("Received event data:", answer_ob)
        socketio.emit('answer_update', {'data': answer_ob})
        # session['answer'] = answer_ob
    

    return jsonify(success=True)

# @socketio.on('connect')
# def send_answer():
#     global answer_ob
#     while True:
#         if answer_ob is None:
#             answer_ob = 'No answer available yet'
#         socketio.emit('answer_update', {'data': answer_ob})
#         time.sleep(1)
#  
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
    response_NV = requests.post(apidata.url_NV, headers=apidata.headers, json=apidata.data)
    response_SS = requests.post(apidata.url_SS, headers=apidata.headers, json=apidata.data)
    response_LV = requests.post(apidata.url_LV, headers=apidata.headers, json=apidata.data_LV)
    print("Status Code:", response_NV.status_code, "| DevicePhoneNumberVerified:", response_NV.json()['devicePhoneNumberVerified'])
    print("Status Code:", response_SS.status_code, "| Swapped:", response_SS.json()['swapped'])
    print("Status Code:", response_LV.status_code, "| LocationVerified:", response_LV.json()['verificationResult'])
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

