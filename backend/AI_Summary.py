from dotenv import load_dotenv
from google import genai
import os

load_dotenv()
api = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api)

Tags = ["Internship", "Job Offer", "Meeting Request", "Assigments/Deadlines", "Newsletter", "Other"]; 
#tasks , events, date for something is due or event. 

email_subject = "[ecs.all] Reminder: ECS Printing Notice - Sunday 3/1"
email_body = f"""Good afternoon.
 
Printing will be unavailable for printers managed by ECSIT (Papercut) on Sunday, 3/1/2026 from 8:30am to 12:00pm due to maintenance.
 
Printer locations include the following buildings: ECSW, ECSN, ECSS, SPN, WTSC, BSB, RL, and UTSW TI-BMES.
 
We appreciate your patience and understanding while periodic maintenance is performed.
 
Thank you.
 
Regards,
 
ECS IT Backend Support
Erik Jonsson School of Engineering & Computer Science
The University of Texas at Dallas 
"""


prompt = f"""
Act as a highly efficient executive email assistant. 
Your job is to help the user spend less time checking emails by extracting only the core facts, required actions, and deadlines. 

You must omit all pleasantries, introductions, and transition words. 

Do not make assumptions; stick strictly to the facts provided in the text.

 Please analyze the following email and categorize it using ONLY one of the following available categories: {Tags} 

Your output MUST be a valid JSON object containing exactly these four keys:

 1. "summary": A highly concise summary (maximum 2 sentences). Put the most important, fastest-action-needed information first. If there is a deadline, include it (e.g., "Internship offer. Respond with your resume and portfolio. Deadline: March 15, 2026"). 
 2. "assignedCategory": The single best-fitting category selected EXACTLY from the provided list of tags.
 3. "priorityLevel": An integer from 1 to 4 determining the urgency (1 = Critical/Immediate Action Required, 2 = High Priority/Important, 3 = Normal/Informational, 4 = Low Priority/No Action Needed).
 4. "uiBadges": An array of 1 to 2 very short, single-word strings to be used as visual tags (e.g., ["Internship", "Resume"] or ["Temporary", "Credit"]). 
 5.


Input Email: Subject: {email_subject} 
Body: {email_body}

"""


response = client.models.generate_content(
    model="gemini-3-flash-preview",
    contents=prompt,
)

print(response.text)