from flask import Blueprint, jsonify, session
import requests
import math

location_bp = Blueprint('location_bp', __name__)

# Replace with actual home location coordinates
HOME_LATITUDE = 43.6532
HOME_LONGITUDE = -79.3832

def haversine_distance(lat1, lon1, lat2, lon2):
    # Calculate distance between two points on the Earth
    R = 6371e3  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = math.sin(delta_phi/2)**2 + \
        math.cos(phi1)*math.cos(phi2)*math.sin(delta_lambda/2)**2
    c = 2*math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance = R * c
    return distance  # in meters

@location_bp.route('/location', methods=['GET'])
def get_location():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'status': 'fail', 'message': 'Unauthorized'}), 401

    # Simulate a location API call (Replace with actual Rogers Location API call)
    # For demonstration, return a fixed location
    user_location = {'latitude': 43.6532, 'longitude': -79.3832}  # Example: Toronto coordinates

    distance = haversine_distance(
        user_location['latitude'], user_location['longitude'],
        HOME_LATITUDE, HOME_LONGITUDE
    )

    # Define proximity threshold (e.g., within 500 meters)
    proximity_threshold = 500  # in meters
    is_nearby = distance <= proximity_threshold

    return jsonify({
        'status': 'success',
        'is_nearby': is_nearby,
        'distance': distance
    })