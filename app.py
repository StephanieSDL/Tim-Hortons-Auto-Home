from flask import Flask, render_template, redirect, url_for, session, send_from_directory
from database import db
from auth import auth_bp
from location import location_bp
from devices import devices_bp
from flask_socketio import SocketIO
from openai_integration import openai_bp
from socketio_setup import socketio


app = Flask(__name__)
app.secret_key = 'your_secret_key'  # Replace with a secure secret key

socketio.init_app(app)

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
db.init_app(app)

# Register Blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(location_bp)
app.register_blueprint(devices_bp)
app.register_blueprint(openai_bp)

@app.route('/')
def index():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return redirect(url_for('login_page'))

@app.route('/register', methods=['GET'])
def register_page():
    return render_template('register.html')

@app.route('/login', methods=['GET'])
def login_page():
    return render_template('login.html')

@app.route('/dashboard', methods=['GET'])
def dashboard():
    if 'user_id' not in session:
        return redirect(url_for('login_page'))
    return render_template('dashboard.html')

@app.route('/home_view', methods=['GET'])
def home_view_page():
    return render_template('home_view.html')

@app.route('/static/<path:filename>')
def static_files(filename):
    return send_from_directory(app.static_folder, filename)

@app.route('/logout', methods=['GET'])
def logout_page():
    session.pop('user_id', None)
    return redirect(url_for('login_page'))

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    socketio.run(app, host='0.0.0.0', port=5001, debug=True)