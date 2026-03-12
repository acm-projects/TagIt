from dotenv import load_dotenv
import json
from google import genai
import requests
import os 


load_dotenv()
api = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api) 

TAGS = ["Internship", "Job Offer", "Meeting Request", "Assigments/Deadlines", "Newsletter", "Other"]; 


def analyze_emails_batch(emails):
    """
    Takes a list of dicts with 'subject' and 'body' keys (up to 25),
    sends them all in one prompt, and returns a list of analysis dicts.
    """
    emails_block = ""
    for i, email in enumerate(emails, 1):
        emails_block += f"""
--- EMAIL {i} ---
Subject: {email.get('subject', 'No Subject')}
Body: {email.get('body', 'No Body Content')}
"""

    prompt = f"""
    Act as a highly efficient executive email assistant.
    Analyze each of the following {len(emails)} emails and categorize each using ONLY one of these categories: {TAGS}

    Your output MUST be a valid, parseable JSON array containing exactly {len(emails)} objects, one per email, in the same order.
    Each object must contain exactly these keys:
    1. "summary": Concise summary (max 2 sentences). Include deadlines if present.
    2. "assignedCategory": The single best-fitting category from the list.
    3. "priorityLevel": Integer 1-4 (1=Critical, 4=Low).
    4. "uiBadges": Array of 1-2 short tags (e.g. ["Internship", "Resume"]).
    5. "tasks": Array of actionable tasks.
    6. "deadlines": Array of deadline statements that includes a date and time.
    7. "events": Array of event statements.
    8. "location": The physical room number, address, or virtual link for the event. If none, output "".
    9. "time": The date and time of the event in ISO 8601 format. If none, output "".

    Emails to analyze:
    {emails_block}

    Return ONLY the JSON array. No explanation, no markdown fences.
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

        results = json.loads(raw_text)

        # Ensure we got a list back with the right length
        if not isinstance(results, list):
            raise ValueError("Expected a JSON array from the model.")
        if len(results) != len(emails):
            print(f"Warning: expected {len(emails)} results, got {len(results)}")

        return results

    except Exception as e:
        print(f"AI Batch Error: {e}")
        # Return a fallback result for every email
        return [
            {
                "summary": "AI could not process this email.",
                "assignedCategory": "Other",
                "priorityLevel": 4,
                "uiBadges": ["Error"],
                "tasks": [],
                "deadlines": [],
                "events": [],
                "location": "",
                "time": "",
            }
            for _ in emails
        ]


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