Dropzone.autoDiscover = false;

const myDropzone = new Dropzone("#cameraFeed", {
    url: "http://127.0.0.1:5000/upload", // Ensure this matches the actual backend route
    method: "post",
    paramName: "file",
    maxFilesize: 2, // Maximum file size in MB
    acceptedFiles: "image/*",
});

document.getElementById("registrationForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const candidateId = document.getElementById("candidateId").value;
    const candidateName = document.getElementById("candidateName").value;

    // Capture the image from the live camera feed
    const video = document.getElementById("cameraFeed");
    const canvas = document.getElementById("capturedImage");
    const context = canvas.getContext("2d");

    // Set canvas dimensions to match the video feed
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current video frame onto the canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert the canvas image to Base64
    const imageData = canvas.toDataURL("image/jpeg");

    try {
        const response = await fetch("http://127.0.0.1:5000/register", { // Ensure this matches the actual backend route
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ candidate_id: candidateId, candidate_name: candidateName, image_data: imageData }),
        });

        const result = await response.json();
        if (response.ok) {
            alert(result.message);
        } else {
            console.error("Error response:", result);
            alert(result.error || "Registration failed");
        }
    } catch (error) {
        console.error("Fetch error:", error);
        alert("Error: " + error.message);
    }
});

// Start the camera feed in the modal
document.getElementById("registerBtn").addEventListener("click", async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        const video = document.getElementById("cameraFeedModal");
        video.srcObject = stream;
        video.play().catch(error => {
            console.error("Error playing video:", error);
        });
    } catch (error) {
        alert("Error accessing camera: " + error.message);
        console.error("Camera error:", error);
    }
});

// Capture Image from Video Stream in Modal
document.getElementById("captureModalBtn").addEventListener("click", function () {
    const video = document.getElementById("cameraFeedModal");
    const canvas = document.getElementById("capturedImageModal");
    const context = canvas.getContext("2d");

    // Set canvas dimensions to match the video feed
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current video frame onto the canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert the canvas image to Base64
    const imageData = canvas.toDataURL("image/jpeg");
    localStorage.setItem("capturedImage", imageData); // Store the image temporarily

    alert("Image Captured! You can now register the candidate.");
});

// Handle Registration Form Submission with Captured Image
document.getElementById("submitModalButton").addEventListener("click", async () => {
    const candidateId = document.getElementById('candidateId').value;
    const candidateName = document.getElementById('candidateName').value;
    const capturedImage = localStorage.getItem("capturedImage");

    if (!candidateId || !candidateName || !capturedImage) {
        alert("All fields are required, and an image must be captured!");
        return;
    }

    // Remove the "data:image/*;base64," prefix from the captured image
    const base64Image = capturedImage.split(',')[1];

    // Prepare the data to send to the backend
    const data = {
        candidate_id: candidateId,
        candidate_name: candidateName,
        image_data: base64Image
    };

    console.log(data);

    try {
        // Send the POST request to the Flask API
        const response = await fetch('http://127.0.0.1:5000/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data),
            mode: 'no-cors' // Add this line
        });

        try {
            const result = await response.json();
            if (result && result.message) {
                alert(result.message);
            } else {
                alert("Unexpected response from the server.");
            }
        } catch (error) {
            console.error("Error parsing JSON:", error);
            alert("Failed to parse server response. Please check the server logs.");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Failed to connect to the server.");
    }
});

let isCameraRunning = false;

async function startCamera() {
    if (isCameraRunning) return; // Prevent multiple initializations
    isCameraRunning = true;

    try {
        const video = document.getElementById("cameraFeed");

        // Stop any existing video stream
        if (video.srcObject) {
            const tracks = video.srcObject.getTracks();
            tracks.forEach(track => track.stop());
        }

        // Start a new video stream
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        video.srcObject = stream;

        // Play the video and handle any errors
        await video.play().catch(error => {
            console.error("Error playing video:", error);
        });
    } catch (error) {
        alert("Error accessing camera: " + error.message);
        console.error("Camera error:", error);
    }
}

document.addEventListener("DOMContentLoaded", startCamera);

// Capture Image from Video Stream
document.getElementById("captureBtn").addEventListener("click", function () {
    const video = document.getElementById("cameraFeed");
    const canvas = document.getElementById("capturedImage");
    const context = canvas.getContext("2d");

    // Set canvas dimensions to match the video feed
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current video frame onto the canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert the canvas image to Base64
    const imageData = canvas.toDataURL("image/jpeg");
    localStorage.setItem("capturedImage", imageData); // Store the image temporarily

    console.log("Video dimensions:", video.videoWidth, video.videoHeight);
    console.log("Captured image data:", imageData);

    alert("Image Captured! You can now register the candidate.");
});

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("captureBtn").addEventListener("click", function () {
        // Your code here
    });
});

// Handle Registration Form Submission with Captured Image
document.getElementById("submitModalButton").addEventListener("click", async () => {
    const candidateId = document.getElementById('candidateId').value;
    const candidateName = document.getElementById('candidateName').value;
    const capturedImage = localStorage.getItem("capturedImage");

    if (!candidateId || !candidateName || !capturedImage) {
        alert("All fields are required, and an image must be captured!");
        return;
    }

    // Remove the "data:image/*;base64," prefix from the captured image
    const base64Image = capturedImage.split(',')[1];

    // Prepare the data to send to the backend
    const data = {
        candidate_id: candidateId,
        candidate_name: candidateName,
        image_data: base64Image
    };

    console.log(data);

    try {
        const response = await fetch('http://127.0.0.1:5000/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            // Handle HTTP errors
            const errorText = await response.text(); // Read the raw response text
            console.error("Error response:", errorText);
            alert(`Error: ${response.status} - ${response.statusText}`);
            return;
        }

        const result = await response.json(); // Parse JSON only if the response is valid
        alert(result.message);
        $('#registerModal').modal('hide'); // Close the modal
    } catch (error) {
        console.error("Error:", error);
        alert("Failed to connect to the server. Please ensure the backend server is running.");
    }
});

// Start the camera feed for attendance when the page loads
document.addEventListener("DOMContentLoaded", startCameraForAttendance);

// Start the camera feed
async function startCameraForAttendance() {
    if (isCameraRunning) return; // Prevent multiple initializations
    isCameraRunning = true;

    try {
        const video = document.getElementById("cameraFeed");

        // Stop any existing video stream
        if (video.srcObject) {
            const tracks = video.srcObject.getTracks();
            tracks.forEach(track => track.stop());
        }

        // Start a new video stream
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        video.srcObject = stream;

        // Play the video and handle any errors
        await video.play().catch(error => {
            console.error("Error playing video:", error);
        });

        // Start processing the video feed for attendance
        processAttendance(video);
    } catch (error) {
        alert("Error accessing camera: " + error.message);
        console.error("Camera error:", error);
    }
}

// Process the video feed for attendance
async function processAttendance(video) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    setInterval(async () => {
        // Capture the current frame from the video feed
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert the frame to Base64
        const imageData = canvas.toDataURL("image/jpeg").split(",")[1]; // Remove the "data:image/*;base64," prefix

        if (!imageData) {
            console.error("No image data available.");
            return;
        }

        // Send the image to the backend for face recognition
        try {
            const response = await fetch("http://127.0.0.1:5000/mark_attendance", { // Ensure this matches the actual backend route
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ image_data: imageData })
            });

            const result = await response.json();
            if (response.ok) {
                console.log("Attendance marked:", result.attendance);
            } else {
                console.warn("Error:", result.error);
            }
        } catch (error) {
            console.error("Error:", error);
        }
    }, 5000); // Process every 5 seconds
}

// Start the camera feed for attendance when the page loads
document.addEventListener("DOMContentLoaded", startCameraForAttendance);

// Ensure proper focus management when the modal is shown
$('#registerModal').on('shown.bs.modal', function () {
    $(this).removeAttr('aria-hidden'); // Ensure aria-hidden is removed
    $('#candidateId').focus(); // Set focus to the first input field
});

// Restore aria-hidden when the modal is hidden
$('#registerModal').on('hidden.bs.modal', function () {
    $(this).attr('aria-hidden', 'true');
});

document.addEventListener("DOMContentLoaded", function () {
    const captureBtn = document.getElementById("captureBtn");
    console.log(captureBtn); // Should log the button element or `null` if it doesn't exist
    if (captureBtn) {
        captureBtn.addEventListener("click", function () {
            // Your code here
        });
    } else {
        console.error("Element with id 'captureBtn' not found.");
    }
});

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("captureBtn").addEventListener("click", function () {
        // Your code here
    });
});

document.addEventListener("DOMContentLoaded", function () {
    const captureBtn = document.getElementById("captureBtn");
    if (captureBtn) {
        captureBtn.addEventListener("click", function () {
            console.log("Capture button clicked!");
            // Your capture logic here
        });
    } else {
        console.error("Element with id 'captureBtn' not found.");
    }
});

document.getElementById("verifyBtn").addEventListener("click", async () => {
    const candidateId = document.getElementById("verifyCandidateId").value;

    if (!candidateId) {
        alert("Please enter a Candidate ID!");
        return;
    }

    try {
        const response = await fetch("http://127.0.0.1:5000/get_candidate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ candidate_id: candidateId })
        });

        const result = await response.json();
        if (response.ok) {
            document.getElementById("recognizedName").innerText = `Candidate Name: ${result.candidate_name}`;
            console.log("Candidate Details:", result);
        } else {
            alert(`Error: ${result.error}`);
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Failed to connect to the server. Please ensure the backend server is running.");
    }
});

document.getElementById("verifyBtn").addEventListener("click", async () => {
    const candidateId = document.getElementById("verifyCandidateId").value;

    if (!candidateId) {
        alert("Please enter a Candidate ID!");
        return;
    }

    try {
        // Capture the current frame from the live video feed
        const video = document.getElementById("cameraFeed");
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert the canvas image to Base64
        const imageData = canvas.toDataURL("image/jpeg");

        // Prepare the data to send to the backend
        const data = {
            candidate_id: candidateId,
            image_data: imageData.split(",")[1] // Remove the "data:image/*;base64," prefix
        };

        // Send the POST request to the Flask API for verification
        const response = await fetch("http://127.0.0.1:5000/verify", { // Ensure this matches the actual backend route
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        if (response.ok) {
            alert(`Verification Successful: ${result.message}`);
            startFaceRecognition(); // Start face recognition after successful verification
        } else {
            alert(`Verification Failed: ${result.error}`);
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Failed to connect to the server. Please ensure the backend server is running and accessible at the specified URL.");
    }
});

// Function to start face recognition
async function startFaceRecognition() {
    try {
        const video = document.getElementById("cameraFeed");

        // Ensure the camera is on
        if (!video.srcObject) {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            video.srcObject = stream;
            await video.play();
        }

        // Continuously capture frames and send them to the backend for face recognition
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        setInterval(async () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            const imageData = canvas.toDataURL("image/jpeg");

            // Send the frame to the backend for recognition
            const response = await fetch("http://127.0.0.1:5000/recognize", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ image_data: imageData.split(",")[1] })
            });

            const result = await response.json();
            if (response.ok) {
                console.log(`Recognized: ${result.name}`);
                // Optionally, display the recognized name on the screen
                document.getElementById("recognizedName").innerText = `Recognized: ${result.name}`;
            } else {
                console.log("Face not recognized.");
            }
        }, 2000); // Capture a frame every 2 seconds
    } catch (error) {
        console.error("Error during face recognition:", error);
    }
}

document.addEventListener("DOMContentLoaded", startCameraForAttendance);

document.addEventListener("click", function (event) {
    if (event.target && event.target.id === "captureBtn") {
        console.log("Capture button clicked!");
        // Your capture logic here
    }
});
// Handle Registration Form Submission
document.getElementById("submitModalButton").addEventListener("click", async () => {
    const candidateId = document.getElementById('candidateId').value;
    const candidateName = document.getElementById('candidateName').value;
    const candidateEmail = document.getElementById('candidateEmail').value;

    if (!candidateId || !candidateName || !candidateEmail) {
        alert("All fields are required!");
        return;
    }

    const base64Image = localStorage.getItem("capturedImage");
    if (!base64Image) {
        alert("Please capture an image first!");
        return;
    }

    // Verify the candidate ID before proceeding
    try {
        const verifyResponse = await fetch('http://127.0.0.1:5000/verify_candidate_id', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ candidate_id: candidateId })
        });

        const verifyResult = await verifyResponse.json();
        if (!verifyResponse.ok) {
            alert(`Verification Failed: ${verifyResult.error}`);
            return;
        }

        alert("Candidate ID verified successfully!");

        // Start the live camera feed
        const video = document.getElementById("cameraFeed");
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        video.srcObject = stream;
        await video.play();

    } catch (error) {
        console.error("Error verifying candidate ID:", error);
        alert("Failed to verify candidate ID. Please try again.");
        return;
    }

    // Prepare the data to send to the backend
    const data = {
        candidate_id: candidateId,
        candidate_name: candidateName,
        candidate_email: candidateEmail,
        image_data: base64Image.split(',')[1] // Remove the "data:image/*;base64," prefix
    };

    try {
        // Send the POST request to the Flask API
        const response = await fetch('http://127.0.0.1:5000/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data),
            mode: 'no-cors' // Add this line
        });

        try {
            const result = await response.json();
            if (result && result.message) {
                alert(result.message);
            } else {
                alert("Unexpected response from the server.");
            }
        } catch (error) {
            console.error("Error parsing JSON:", error);
            alert("Failed to parse server response. Please check the server logs.");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Failed to connect to the server. Please ensure the backend server is running and accessible at the specified URL. Check the console for more details.");
        console.error("Fetch error:", error);
    }
});

document.getElementById("submitModalButton").addEventListener("click", async () => {
    const candidateId = document.getElementById('candidateId').value;
    const candidateName = document.getElementById('candidateName').value;
    const candidateEmail = document.getElementById('candidateEmail').value; // Get email

    if (!candidateId || !candidateName || !candidateEmail) {
        alert("All fields are required!");
        return;
    }

    const base64Image = localStorage.getItem("capturedImage");
    if (!base64Image) {
        alert("Please capture an image first!");
        return;
    }

    // Prepare the data to send to the backend
    const data = {
        candidate_id: candidateId,
        candidate_name: candidateName,
        candidate_email: candidateEmail, // Include email
        image_data: base64Image.split(',')[1] // Remove the "data:image/*;base64," prefix
    };

    try {
        // Send the POST request to the Flask API
        const response = await fetch('http://127.0.0.1:5000/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data),
            mode: 'no-cors' // Add this line
        });

        if (!response.ok) {
            // Handle HTTP errors
            const errorText = await response.text(); // Read the raw response text
            console.error("Error response:", errorText);
            alert(`Error: ${response.status} - ${response.statusText}`);
            return;
        }

        const result = await response.json(); // Parse JSON only if the response is valid
        alert(result.message);
        $('#registerModal').modal('hide'); // Close the modal
    } catch (error) {
        console.error("Error:", error);
        alert("Failed to connect to the server. Please ensure the backend server is running.");
    }
});