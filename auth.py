from flask import Blueprint, request, jsonify, session
from models import User
from database import db
import requests
import apidata

auth_bp = Blueprint('auth_bp', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    if User.query.filter_by(username=username).first():
        return jsonify({'status': 'fail', 'message': 'Username already exists'}), 400
    new_user = User(username=username)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'status': 'success', 'message': 'User registered successfully'}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    user = User.query.filter_by(username=username).first()
    if user and user.check_password(password):
        response_NV = requests.post(apidata.url_NV, headers=apidata.headers, json=apidata.data)
        response_SS = requests.post(apidata.url_SS, headers=apidata.headers, json=apidata.data)
        response_LV = requests.post(apidata.url_LV, headers=apidata.headers, json=apidata.data_LV)
        print("Status Code:", response_NV.status_code, "| DevicePhoneNumberVerified:", response_NV.json()['devicePhoneNumberVerified'])
        print("Status Code:", response_SS.status_code, "| Swapped:", response_SS.json()['swapped'])
        print("Status Code:", response_LV.status_code, "| LocationVerified:", response_LV.json()['verificationResult'])
        session['user_id'] = user.id
        return jsonify({'status': 'success', 'message': 'Logged in successfully'})
    else:
        return jsonify({'status': 'fail', 'message': 'Invalid credentials'}), 401

@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    return jsonify({'status': 'success', 'message': 'Logged out successfully'})
