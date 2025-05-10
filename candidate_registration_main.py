from flask import Flask, request, jsonify, render_template
import os
import base64
import cv2
import numpy as np
import face_recognition
from pymongo import MongoClient  # Import MongoDB client
from util import get_cropped_image_if_2_eyes, submit_image, load_saved_artifacts
import logging
from flask_cors import CORS
import json

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__, static_folder='static')
CORS(app)
CORS(app, resources={r"/*": {"origins": "http://127.0.0.1:5000"}})

# MongoDB connection
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")  # Use environment variable or default URI
client = MongoClient(MONGO_URI)
db = client["attendance_system"]  # Database name
collection = db["registered_candidates"]  # Collection name


def save_cropped_faces_with_recognition(candidate_id, candidate_name, image_data, save_path):
    try:
        # Decode the Base64 image
        decoded_image = base64.b64decode(image_data)
        np_image = np.frombuffer(decoded_image, np.uint8)
        image = cv2.imdecode(np_image, cv2.IMREAD_COLOR)
        if image is None:
            raise ValueError("Decoded image is invalid.")
    except Exception as e:
        raise ValueError(f"Failed to decode image data: {e}")

    # Create directory for the candidate
    candidate_dir = os.path.join(save_path, f"{candidate_id}_{candidate_name}")
    if not os.path.exists(candidate_dir):
        os.makedirs(candidate_dir)

    # Detect and crop faces
    cropped_faces = get_cropped_image_if_2_eyes(image)
    if len(cropped_faces) == 0:
        raise ValueError("No face detected in the image.")

    candidate_data = {
        "candidate_id": candidate_id,
        "candidate_name": candidate_name,
        "images": [],
    }

    for idx, face in enumerate(cropped_faces):
        try:
            # Convert face to RGB and encode
            rgb_face = cv2.cvtColor(face, cv2.COLOR_BGR2RGB)
            face_encodings = face_recognition.face_encodings(rgb_face)
            if len(face_encodings) == 0:
                logger.warning(f"Face {idx + 1} could not be encoded. Skipping...")
                continue

            # Save face image and encoding
            image_path = os.path.join(candidate_dir, f"{candidate_id}_{idx + 1}.jpg")
            cv2.imwrite(image_path, face)
            logger.info(f"Face saved at {image_path}")

            encoding_path = os.path.join(candidate_dir, f"{candidate_id}_{idx + 1}_encoding.npy")
            np.save(encoding_path, face_encodings[0])
            logger.info(f"Encoding saved at {encoding_path}")

            # Add image data to candidate record
            with open(image_path, "rb") as img_file:
                encoded_image = base64.b64encode(img_file.read()).decode("utf-8")
            candidate_data["images"].append({
                "image_path": image_path,
                "encoding_path": encoding_path,
                "base64_image": encoded_image,
            })
        except Exception as e:
            logger.error(f"Error processing face {idx + 1}: {e}")

    # Save candidate data to MongoDB
    collection.insert_one(candidate_data)
    logger.info(f"Candidate {candidate_id} ({candidate_name}) data saved to MongoDB.")


@app.route('/register', methods=['POST'])
def register():
    try:
        # Your registration logic here
        return jsonify({'message': 'Registration successful'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/mark_attendance', methods=['POST'])
def mark_attendance():
    data = request.get_json()
    if not data or 'image_data' not in data:
        return jsonify({'error': 'Image file is required'}), 400

    # Process the image data (e.g., perform face recognition)
    image_data = data['image_data']
    # Add your face recognition logic here

    return jsonify({'attendance': 'marked successfully'}), 200


@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    # Save the file or process it
    file.save(f"./uploads/{file.filename}")
    return jsonify({'message': 'File uploaded successfully'}), 200


# Flask route to fetch candidate details
@app.route('/get_candidate', methods=['POST'])
def get_candidate():
    data = request.json
    candidate_id = data.get('candidate_id')

    # Path to registered students' data
    REGISTERED_IMAGES_PATH = "registered_students/images"

    # Check if the candidate exists
    for filename in os.listdir(REGISTERED_IMAGES_PATH):
        if filename.startswith(f"{candidate_id}_"):
            return {"candidate_name": f"Candidate {candidate_id}"}, 200

    return {"error": "Candidate not found"}, 404


@app.route('/verify/<candidate_id>', methods=['GET'])
def verify_candidate(candidate_id):
    # Replace this with your actual verification logic
    # For example, check if the candidate ID exists in your database
    candidates = {
        "1": "John Doe",
        "2": "Jane Smith"
    }

    if candidate_id in candidates:
        return {"name": candidates[candidate_id]}, 200
    else:
        return {"error": "Candidate not found"}, 404


@app.route('/')
def home():
    return render_template('app1.html')


if __name__ == "__main__":
    # Load artifacts during app initialization
    load_saved_artifacts()
    app.run(debug=True)

# JavaScript code moved to a separate file (static/register.js)