import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_email(to_email, subject, body):
    # Email configuration
    sender_email = "noreply@kmce.com"
    sender_password = "kmce123$"
    smtp_server = "smtp.gmail.com"
    smtp_port = 587

    try:
        # Create the email
        message = MIMEMultipart()
        message["From"] = sender_email
        message["To"] = to_email
        message["Subject"] = subject
        message.attach(MIMEText(body, "plain"))

        # Connect to the SMTP server and send the email
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(sender_email, sender_password)
        server.sendmail(sender_email, to_email, message.as_string())
        server.quit()

        print(f"Email sent to {to_email}")
    except Exception as e:
        print(f"Failed to send email to {to_email}: {e}")

# Example usage
def notify_candidates(attendance_list):
    for candidate in attendance_list:
        name = candidate['name']
        email = candidate['email']
        body = f"Dear {name},\n\nYour attendance has been successfully marked.\n\nBest regards,\nAttendance System"
        send_email(email, "Attendance Confirmation", body)

# Example attendance list
attendance_list = [
    {"name": "John Doe", "email": "johndoe@example.com"},
    {"name": "Jane Smith", "email": "janesmith@example.com"}
]

# Notify candidates
notify_candidates(attendance_list)