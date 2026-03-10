from dotenv import load_dotenv
import json
from google import genai
import requests
import os 


load_dotenv()
api = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api) 

TAGS = ["Internship", "Job Offer", "Meeting Request", "Assigments/Deadlines", "Newsletter", "Other"]; 


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
    6. "deadlines": Array of deadline statements that includes a date and time.
    7. "events": Array of event statements.
    8. "location": The physical room number, address, or virtual link for the event. If there is no location mentioned, output an empty string "".
    9. "time": The date and time of the event in ISO 8601 format. If there is no time mentioned, output an empty string "".
    

    Input Email: 
    Subject: {subject} 
    Body: {body}
    """

    try:
        response = client.models.generate_content(
            model="gemini-3.1-flash-lite-preview", 
            contents=prompt,
        )
        
        raw_text = response.text.strip()
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:]
        if raw_text.startswith("```"):
            raw_text = raw_text[3:]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]
            
        return json.loads(raw_text)
        
    except Exception as e:
        print(f"AI Error: {e}")
        return {
            "summary": "AI could not process this email.",
            "assignedCategory": "Other",
            "priorityLevel": 4,
            "uiBadges": ["Error"],
            "tasks": [],
            "deadlines": [],
            "events": []
        }