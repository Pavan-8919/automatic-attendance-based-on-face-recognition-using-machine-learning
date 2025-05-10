import joblib
import json
import numpy as np
import base64
import cv2
import pywt
import pandas as pd
from datetime import datetime
import shutil
import os
import logging

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

__class_name_to_number = {}
__class_number_to_name = {}

__model = None


def submit_image(image_base64_data):
    try:
        imgs = get_cropped_image_if_2_eyes(image_base64_data)

        result = []
        path_to_cropped = "./cropped"
        if os.path.exists(path_to_cropped):  # Check if path exists
            shutil.rmtree(path_to_cropped)  # Recursively delete the directory
        os.mkdir(path_to_cropped)  # Create a new empty directory

        count = 1
        for img in imgs:
            if count > 50:  # Limit to 50 frames
                break

            cropped_file_name = f"cropped{count}.png"
            cropped_file_path = os.path.join(path_to_cropped, cropped_file_name)
            cv2.imwrite(cropped_file_path, img)
            count += 1

            # Process the image
            scalled_raw_img = cv2.resize(img, (32, 32))
            img_har = w2d(img, 'db1', 5)
            scalled_img_har = cv2.resize(img_har, (32, 32))
            combined_img = np.vstack((scalled_raw_img.reshape(32 * 32 * 3, 1), scalled_img_har.reshape(32 * 32, 1)))

            len_image_array = 32 * 32 * 3 + 32 * 32
            final = combined_img.reshape(1, len_image_array).astype(float)

            # Predict the class
            predicted_class = __model.predict(final)[0]
            class_probabilities = np.around(__model.predict_proba(final) * 100, 2).tolist()[0]
            class_name = class_number_to_name(predicted_class)

            result.append({
                'class': class_name,
                'class_probability': class_probabilities,
                'class_dictionary': __class_name_to_number
            })

            # Mark attendance
            mark_attendance(class_name)

        return result

    except ValueError as e:
        logger.error(f"ValueError in submit_image: {e}")
        raise
    except Exception as e:
        logger.error(f"Error in submit_image: {e}")
        raise


def mark_attendance(candidate_id, name):
    try:
        file_path = "./registered_students/attendance.xlsx"

        # Check if the directory exists, create it if not
        if not os.path.exists("./registered_students"):
            os.makedirs("./registered_students")

        # Load or create the attendance file
        if not os.path.exists(file_path):
            # Create a new DataFrame if the file doesn't exist
            df = pd.DataFrame(columns=["Candidate ID", "Name", "Date", "Time"])
            df.to_excel(file_path, index=False)

        # Load the existing attendance file
        df = pd.read_excel(file_path)

        # Get the current date and time
        current_date = datetime.today().strftime('%Y-%m-%d')
        current_time = datetime.now().strftime('%H:%M:%S')

        # Check if the candidate's attendance is already marked for today
        if not ((df["Candidate ID"] == candidate_id) & (df["Date"] == current_date)).any():
            # Add a new row for the candidate
            new_row = {
                "Candidate ID": candidate_id,
                "Name": name,
                "Date": current_date,
                "Time": current_time
            }
            df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)

        # Save the updated attendance file
        df.to_excel(file_path, index=False)
        logger.info(f"Attendance marked for {name} (ID: {candidate_id}) on {current_date} at {current_time}")

    except Exception as e:
        logger.error(f"Error in mark_attendance: {e}")
        raise


def w2d(img, mode='haar', level=1):
    """
    Perform Wavelet Transform on the input image.
    """
    imArray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)  # Convert to grayscale
    imArray = np.float32(imArray) / 255  # Normalize
    coeffs = pywt.wavedec2(imArray, mode, level=level)

    # Process coefficients
    coeffs_H = list(coeffs)
    coeffs_H[0] *= 0  # Set approximation coefficients to zero

    # Reconstruction
    imArray_H = pywt.waverec2(coeffs_H, mode)
    imArray_H *= 255
    imArray_H = np.uint8(imArray_H)

    return imArray_H


def class_number_to_name(class_num):
    """
    Convert class number to class name using the loaded dictionary.
    """
    if class_num not in __class_number_to_name:
        raise ValueError(f"Class number {class_num} not found in class dictionary.")
    return __class_number_to_name[class_num]


def load_saved_artifacts():
    """
    Load saved artifacts such as the class dictionary and the trained model.
    """
    logger.info("Loading saved artifacts...start")
    global __class_name_to_number
    global __class_number_to_name

    # Use absolute paths for reliability
    base_path = os.path.dirname(__file__)
    class_dict_path = os.path.join(base_path, "artifacts", "class_dictionary.json")
    model_path = os.path.join(base_path, "artifacts", "saved_model.pkl")

    # Check if class_dictionary.json exists
    if not os.path.exists(class_dict_path):
        logger.error(f"{class_dict_path} not found. Please ensure the file exists.")
        raise FileNotFoundError(f"{class_dict_path} not found. Please ensure the file exists.")

    with open(class_dict_path, "r") as f:
        __class_name_to_number = json.load(f)
        __class_number_to_name = {v: k for k, v in __class_name_to_number.items()}

    # Check if saved_model.pkl exists
    if not os.path.exists(model_path):
        logger.error(f"{model_path} not found. Please ensure the file exists.")
        raise FileNotFoundError(f"{model_path} not found. Please ensure the file exists.")

    with open(model_path, 'rb') as f:
        __model = joblib.load(f)

    logger.info("Loading saved artifacts...done")


def get_cv2_image_from_base64_string(b64str):
    """
    Decode a Base64 string into a CV2 image.
    """
    try:
        encoded_data = b64str.split(',')[1]
        nparr = np.frombuffer(base64.b64decode(encoded_data), np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Decoded image is invalid.")
        return img
    except Exception as e:
        logger.error(f"Error decoding base64 string: {e}")
        raise ValueError("Invalid base64 image data.")


def get_cropped_image_if_2_eyes(image_base64_data):
    """
    Detect faces and crop them if at least two eyes are detected.
    """
    face_cascade = cv2.CascadeClassifier('./opencv/haarcascades/haarcascade_frontalface_default.xml')
    eye_cascade = cv2.CascadeClassifier('./opencv/haarcascades/haarcascade_eye.xml')

    img = get_cv2_image_from_base64_string(image_base64_data)

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.3, 5)

    cropped_faces = []
    for (x, y, w, h) in faces:
        roi_gray = gray[y:y + h, x:x + w]
        roi_color = img[y:y + h, x:x + w]
        eyes = eye_cascade.detectMultiScale(roi_gray)
        if len(eyes) >= 2:
            cropped_faces.append(roi_color)

    if len(cropped_faces) == 0:
        raise ValueError("No face detected in the image.")

    return cropped_faces


if __name__ == "__main__":
    try:
        load_saved_artifacts()
        logger.info("Artifacts loaded successfully.")
        logger.info(f"Current working directory: {os.getcwd()}")
    except Exception as e:
        logger.error(f"Error loading artifacts: {e}")


def classify_image(image_data):
    return None