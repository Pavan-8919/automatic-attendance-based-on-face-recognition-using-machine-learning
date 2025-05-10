# automatic-attendance-based-on-face-recognition-using-machine-learning
 Automated Attendance SystemUsing FacialRecognition  attendance base system using machine learing  that detect face and marks attendance in data base using facial recognition.
 download requirements according to files  
need to download liberies to run the projrct 
need to maintain directory structure for this project
  AutomatedAttendanceSystemUsingFacialRecognition/
├── server/
│   ├── candidate_registration_main.py  # Main Flask backend file
│   ├── registered_students/            # Directory for storing registered candidates
│   │   ├── 7982_mewklfj/               # Example candidate directory
│   │   │   ├── 7982.jpg                # Candidate's image
│   │   │   └── 7982_data.json          # Candidate's metadata (JSON)
│   ├── static/                         # Static files (JavaScript, CSS, etc.)
│   │   ├── js/
│   │   │   └── registration.js         # JavaScript file for registration logic
│   │   └── uploads/                    # Directory for uploaded files
│   ├── templates/                      # HTML templates for the Flask app
│   │   └── app1.html                   # Main HTML file for the frontend
│   ├── util.py                         # Utility functions (e.g., face cropping, artifact loading)
│   └── __init__.py                     # (Optional) Package initialization file
├── .env                                # Environment variables (e.g., MongoDB URI)
├── requirements.txt                    # Python dependencies
└── README.md                           # Project documentation
