from flask import Blueprint, jsonify, request, session
from keys import USER_KEY
import os
import openai

openai.api_key = os.getenv(USER_KEY)

openai_bp = Blueprint('openai_bp', __name__)

@openai_bp.route('/process_command', methods=['POST'])
def process_command():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'status': 'fail', 'message': 'Unauthorized'}), 401
    command_text = request.json.get('command')
    if not command_text:
        return jsonify({'status': 'fail', 'message': 'No command provided'}), 400

    prompt = f"""
    Interpret the following smart home command and extract the device and action as JSON:
    Command: "{command_text}"
    Response format: {{"device": "<device_id>", "action": "<action>"}}
    """

    response = openai.Completion.create(
        engine='text-davinci-003',
        prompt=prompt,
        max_tokens=60,
        temperature=0
    )

    # Parse OpenAI response
    try:
        response_text = response.choices[0].text.strip()
        # Ensure the response is a valid JSON string
        import json
        action_data = json.loads(response_text)
        device_id = action_data.get('device')
        action = action_data.get('action')
    except Exception as e:
        return jsonify({'status': 'fail', 'message': 'Failed to parse AI response'}), 500

    # Control the device
    from devices import devices, control_device_logic

    if device_id in devices:
        # Call the device control logic directly
        result = control_device_logic(device_id, action)
        if result['status'] == 'success':
            return jsonify({'status': 'success', 'action': action_data})
        else:
            return jsonify({'status': 'fail', 'message': result['message']}), 400
    else:
        return jsonify({'status': 'fail', 'message': 'Device not found'}), 404
