from dotenv import load_dotenv
from flask import json
from google import genai
import requests
import os 

# try:
#     from watchdog.observers import Observer 
#     from watchdog.events import FileSystemEventHandler
# except (ImportError, ModuleNotFoundError):  
#     Observer = None
#     FileSystemEventHandler = None
   

# class JsonHandler(FileSystemEventHandler):
#     def on_created(self, event):
#         if event.is_directory or not event.src_path.endswith('.json'):
#             return
        
#         print(f"New file detected: {event.src_path}")
        
#         # Read the new file and send it
#         with open(event.src_path, 'r') as f:
#             data = json.load(f)
#             requests.post("http://127.0.0.1/api/emails", json=data)

load_dotenv()
api = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api) 

Tags = ["Internship", "Job Offer", "Meeting Request", "Assigments/Deadlines", "Newsletter", "Other"]; 


def analyze_email_with_gemini(subject, body):
    """
    Takes an email subject and body, sends it to Gemini, 
    and returns a clean Python dictionary.
    """
    
    prompt = f"""
    Act as a highly efficient executive email assistant. 
    Analyze the following email and categorize it using ONLY one of these categories: {TAGS} 

    Your output MUST be a valid, parseable JSON object containing exactly these keys:
    1. "summary": Concise summary (max 2 sentences). Include deadlines if present.
    2. "assignedCategory": The single best-fitting category from the list.
    3. "priorityLevel": Integer 1-4 (1=Critical, 4=Low).
    4. "uiBadges": Array of 1-2 short tags (e.g. ["Internship", "Resume"]).
    5. "tasks": Array of actionable tasks.
    6. "deadlines": Array of deadline statements.
    7. "events": Array of event statements.

    Input Email: 
    Subject: {subject} 
    Body: {body}
    """

    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash", # Updated to latest fast model
            contents=prompt,
        )
        
        # 3. Clean the response (Remove markdown backticks if Gemini adds them)
        raw_text = response.text.strip()
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:]
        if raw_text.startswith("```"):
            raw_text = raw_text[3:]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]
            
        # 4. Convert string to Python Dictionary
        return json.loads(raw_text)
        
    except Exception as e:
        print(f"AI Error: {e}")
        # Return a fallback object so the app doesn't crash
        return {
            "summary": "AI could not process this email.",
            "assignedCategory": "Other",
            "priorityLevel": 4,
            "uiBadges": ["Error"],
            "tasks": [],
            "deadlines": [],
            "events": []
        }




# email_subject = "[ecs.all] Reminder: ECS Printing Notice - Sunday 3/1"
# email_body = f"""Good afternoon.
 
# Printing will be unavailable for printers managed by ECSIT (Papercut) on Sunday, 3/1/2026 from 8:30am to 12:00pm due to maintenance.
 
# Printer locations include the following buildings: ECSW, ECSN, ECSS, SPN, WTSC, BSB, RL, and UTSW TI-BMES.
 
# We appreciate your patience and understanding while periodic maintenance is performed.
 
# Thank you.
 
# Regards,
 
# ECS IT Backend Support
# Erik Jonsson School of Engineering & Computer Science
# The University of Texas at Dallas 
# """


# prompt = f"""
# Act as a highly efficient executive email assistant. 
# Your job is to help the user spend less time checking emails by extracting only the core facts, required actions, and deadlines. 

# You must omit all pleasantries, introductions, and transition words. 

# Do not make assumptions; stick strictly to the facts provided in the text.

#  Please analyze the following email and categorize it using ONLY one of the following available categories: {Tags} 

# Your output MUST be a valid JSON object containing exactly these four keys:

#  1. "summary": A highly concise summary (maximum 2 sentences). Put the most important, fastest-action-needed information first. If there is a deadline, include it (e.g., "Internship offer. Respond with your resume and portfolio. Deadline: March 15, 2026"). 
#  2. "assignedCategory": The single best-fitting category selected EXACTLY from the provided list of tags.
#  3. "priorityLevel": An integer from 1 to 4 determining the urgency (1 = Critical/Immediate Action Required, 2 = High Priority/Important, 3 = Normal/Informational, 4 = Low Priority/No Action Needed).
#  4. "uiBadges": An array of 1 to 2 very short, single-word strings to be used as visual tags (e.g., ["Internship", "Resume"] or ["Temporary", "Credit"]). 
#  5. "tasks/to-dos": An array of 0 to 3 concise, actionable tasks that the user needs to complete, each task should be a single sentence starting with a verb (e.g., "Submit resume", "Schedule meeting", "Review document").
#  6. "deadlines": An array of 0 to 2 concise deadline statements, each starting with "Deadline: " (e.g., "Deadline to submit: March 15, 2026").
#  7. "events": An array of 0 to 2 concise event statements, each starting with "Event: " (e.g., "Event: Interview on March 20, 2026 at 3 PM").
 

# Input Email: Subject: {email_subject} 
# Body: {email_body}

# """


# response = client.models.generate_content(
#     model="gemini-3-flash-preview",
#     contents=prompt,
# )

# print(response.text)