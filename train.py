import os
import cv2
import numpy as np
from flask import Flask, request, render_template
from PIL import Image

app = Flask(__name__)

# Path to save the trained model and images
TRAINING_DATA_PATH = "training_data"
MODEL_PATH = "trained_model.yml"

# Ensure directories exist
os.makedirs(TRAINING_DATA_PATH, exist_ok=True)

# Route to render the HTML form
@app.route('/')
def index():
    return render_template('app1.html')

# Route to handle image upload and training
@app.route('/train', methods=['POST'])
def train_images():
    # Directory where registered students' images are stored
    REGISTERED_IMAGES_PATH = "registered_students/images"

    if not os.path.exists(REGISTERED_IMAGES_PATH):
        return "No registered students' images found", 400

    faces, labels = [], []
    for filename in os.listdir(REGISTERED_IMAGES_PATH):
        filepath = os.path.join(REGISTERED_IMAGES_PATH, filename)

        # Ensure the file is an image
        if not filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            continue

        # Extract label (assuming filename format: <label>_<index>.jpg)
        try:
            label = int(filename.split('_')[0])  # Extract numeric label
        except ValueError:
            continue  # Skip files with invalid labels
        # Read and process the image
        img = Image.open(filepath).convert('L')  # Convert to grayscale
        img_np = np.array(img, 'uint8')
        faces.append(img_np)
        labels.append(label)

    if not faces or not labels:
        return "No valid images found for training", 400

    # Train the recognizer
    recognizer = cv2.face.LBPHFaceRecognizer_create()
    recognizer.train(faces, np.array(labels))
    recognizer.save(MODEL_PATH)

    return "Training completed successfully!"

if __name__ == '__main__':
    app.run(debug=True)
    # app.run(host='    '   # Uncomment this line to run on a specific host and port
    # app.run(port=5000)  # Uncomment this line to run on a specific port               
    