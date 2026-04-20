from dotenv import load_dotenv
import json
from google import genai
import requests
import os
import time


load_dotenv()
api = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api)

TAGS = ["Internship", "Job Offer", "Meeting Request", "Assigments/Deadlines", "Newsletter", "Other"]


def call_gemini_with_retry(prompt, model="Gemini 3.1 Flash Lite", max_retries=3, initial_backoff=1.0):
    """Send a Gemini request with retry/backoff on temporary failures."""
    backoff = initial_backoff
    last_exception = None
    for attempt in range(1, max_retries + 1):
        try:
            return client.models.generate_content(model=model, contents=prompt)
        except Exception as e:
            last_exception = e
            print(f"Gemini request failed (attempt {attempt}/{max_retries}): {e}")
            if attempt == max_retries:
                break
            time.sleep(backoff)
            backoff *= 2
    raise last_exception

# Known UTD building abbreviations and locations used in email contexts
UTD_LOCATIONS = {
    "ECSW": "Engineering and Computer Science West",
    "ECSS": "Engineering and Computer Science South",
    "JSOM": "Jindal School of Management Building",
    "SLC": "Student Learning Center",
    "SSB": "Student Services Building",
    "GR": "Green Hall",
    "FO": "Founders Building",
    "CB": "Chemistry Building",
    "MC": "McDermott Library",
    "HH": "Hoblitzelle Hall",
    "CN": "Callier Center North",
    "AD": "Administration Building",
    "ATC": "Activity Center",
    "RH": "Residence Hall",
}

# Known UTD schools for personalization
UTD_SCHOOLS = {
    "ECS": "Erik Jonsson School of Engineering and Computer Science",
    "JSOM": "Naveen Jindal School of Management",
    "NSM": "School of Natural Sciences and Mathematics",
    "EPPS": "School of Economic, Political and Policy Sciences",
    "AH": "School of Arts and Humanities",
    "BBS": "School of Behavioral and Brain Sciences",
    "IS": "School of Interdisciplinary Studies",
}


SPAM_CATEGORIES = """
FILTER OUT (mark isSpam: true) any email that falls into these categories — UNLESS it closely matches a user priority topic listed below:

PROMOTIONAL & COMMERCIAL:
- Sales, flash sales, discount codes, coupons, deals, merchandise promotions
- Store newsletters, product launches, brand announcements
- Loyalty/rewards program updates ("you earned points", "redeem your rewards")
- Subscription renewal reminders from commercial services
- Any "unsubscribe" footer indicating a mass mailing list

APP & SERVICE NOTIFICATIONS:
- Streaming/gaming notifications: Twitch (live alerts, clip highlights, streamer went live), YouTube recommendations, Spotify wrapped/playlists, Steam deals/game updates
- Financial app activity: Robinhood (stock movers, market summaries, portfolio digests), Coinbase/crypto price alerts, banking transaction summaries (unless flagged as fraud)
- Sports & hobby apps: UDisc round summaries, Strava activity, fitness tracker digests, fantasy sports updates
- Social media digests: Instagram/Twitter/X/LinkedIn/Facebook activity summaries, "You have new followers", "People you may know"
- App activity digests: "Here's what happened while you were away", weekly/monthly recap emails from any app
- Delivery tracking updates from retailers (unless user has shopping/deliveries in priorities)
- Food delivery apps (DoorDash, Uber Eats order confirmations/receipts — unless user tracks these)

GENERAL NOISE:
- Newsletters from organizations the user didn't specifically ask about
- Event invitations from commercial venues (concerts, festivals) unless in priorities
- "Tips & tricks" or onboarding drip emails from software products
- Survey requests from companies
- Press releases or company announcements

ALWAYS ALLOW THROUGH (mark isSpam: false) regardless of topic:
- Security alerts: unauthorized access, suspicious login, password compromise, account breach
- Direct personal emails requiring a reply (interview invites, recruiter messages, professor emails)
- Academic emails: course deadlines, grade notifications, registration, financial aid
- Work/internship-related action items
- Any email with a genuine deadline the user must act on
"""


def is_spam(subject, body, priority_topics=None):
    """
    Quick gatekeeper check for a single email.
    Flags promotional, app notification, and noise emails aggressively,
    unless the content closely matches one of the user's priority topics.
    Returns (isSpam: bool, reason: str).
    """
    topics_note = ""
    if priority_topics:
        topics_note = (
            f"\n\nUSER PRIORITY TOPICS (override filter if closely matched): {', '.join(priority_topics)}\n"
            f"If the email closely and specifically matches one of these topics, mark isSpam: false."
        )

    prompt = f"""You are an aggressive email filter for a student productivity app. Your job is to block noise so the user only sees emails that matter.

{SPAM_CATEGORIES}{topics_note}

Default to isSpam: true when in doubt — it is better to filter a borderline email than to let noise through.

Respond with ONLY a JSON object:
1. "isSpam": true or false
2. "reason": one short sentence explaining why (max 10 words)

Subject: {subject}
Body: {body[:1500]}

Return ONLY the JSON. No explanation, no markdown.
"""
    try:
        response = call_gemini_with_retry(
            prompt,
            model="Gemini 3.1 Flash Lite",
        )
        raw = response.text.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        result = json.loads(raw)
        return bool(result.get("isSpam", False)), result.get("reason", "")
    except Exception as e:
        print(f"Spam check error: {e}")
        return False, ""


def is_spam_batch(emails, priority_topics=None):
    """
    Check emails for spam/phishing AND all noise categories in a single Gemini call.
    App notifications, promotional content, and digests are filtered aggressively.
    If more than 50 emails, chunks internally to keep accuracy high.
    Returns a list of (isSpam: bool, reason: str) tuples in the same order.
    """
    if not emails:
        return []

    CHUNK_SIZE = 50
    if len(emails) > CHUNK_SIZE:
        all_results = []
        for start in range(0, len(emails), CHUNK_SIZE):
            chunk = emails[start:start + CHUNK_SIZE]
            all_results.extend(is_spam_batch(chunk, priority_topics))
        return all_results

    topics_note = ""
    if priority_topics:
        topics_note = (
            f"\n\nUSER PRIORITY TOPICS (override filter if closely matched): {', '.join(priority_topics)}\n"
            f"If an email closely and specifically matches one of these topics, mark isSpam: false."
        )

    emails_block = ""
    for i, email in enumerate(emails, 1):
        emails_block += f"\n--- EMAIL {i} ---\nSubject: {email.get('subject', '')}\nBody: {email.get('body', '')[:600]}\n"

    prompt = f"""You are an aggressive email filter for a student productivity app. Your job is to block noise so the user only sees emails that matter.

{SPAM_CATEGORIES}{topics_note}

Default to isSpam: true when in doubt — it is better to filter a borderline email than to let noise through.

Analyze each of the following {len(emails)} emails and respond with ONLY a JSON array containing exactly {len(emails)} objects in the same order, each with:
1. "isSpam": true or false
2. "reason": one short sentence explaining why (max 10 words)

Emails:
{emails_block}

Return ONLY the JSON array. No explanation, no markdown fences.
"""
    try:
        response = call_gemini_with_retry(
            prompt,
            model="Gemini 3.1 Flash Lite",
        )
        raw = response.text.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        results = json.loads(raw)
        if not isinstance(results, list) or len(results) != len(emails):
            raise ValueError(f"Expected {len(emails)} results, got {len(results) if isinstance(results, list) else 'non-list'}")
        return [(bool(r.get("isSpam", False)), r.get("reason", "")) for r in results]
    except Exception as e:
        print(f"Batch spam check error: {e}")
        return [(False, "") for _ in emails]


def _utd_context(sender_domain="", school=""):
    """
    Build an extra instruction line to inject into prompts when the email
    is from a UTD address. Helps the model prioritize academic info correctly.
    """
    if "utdallas.edu" not in sender_domain:
        return ""

    lines = [
        "This is a university email from UT Dallas.",
        "Prioritize academic deadlines, course-related tasks, and campus events.",
        f"Recognize these UTD building abbreviations: {', '.join(f'{k}={v}' for k, v in UTD_LOCATIONS.items())}.",
        f"Identify which school sent this if possible (ECS, JSOM, NSM, etc.) and include it in uiBadges.",
    ]

    if school == "ECS":
        lines.append(
            "The user is an ECS (Engineering & Computer Science) student. "
            "Boost priority for anything related to CS courses, engineering labs, coding projects, "
            "tech internships, research positions, and ECS department events."
        )
    elif school == "JSOM":
        lines.append(
            "The user is a JSOM (Jindal School of Management) student. "
            "Boost priority for anything related to business courses, finance, accounting, "
            "marketing, consulting internships, case competitions, and JSOM department events."
        )

    return "\n".join(lines)


def _priority_topics_context(priority_topics):
    """
    Build a prompt snippet that tells the model to boost priorityLevel
    for emails whose subject/body matches the user's topic list.
    Topics are ordered most important to least important.
    """
    if not priority_topics:
        return ""
    ranked = ", ".join(f'"{t}"' for t in priority_topics)
    return (
        f"The user has a personal priority list (most to least important): [{ranked}]. "
        "If the email subject or body closely relates to any of these topics, "
        "boost its priorityLevel accordingly — topics earlier in the list warrant a higher boost. "
        "Also add the matching topic as a uiBadge."
    )


def analyze_emails_batch(emails, school="", priority_topics=None):
    """
    Takes a list of dicts with 'subject', 'body', and optional 'received_at' keys,
    sends them all in one prompt, and returns a list of analysis dicts.
    If more than 50 emails, chunks internally to keep accuracy high.
    """
    if priority_topics is None:
        priority_topics = []

    CHUNK_SIZE = 50
    if len(emails) > CHUNK_SIZE:
        all_results = []
        for start in range(0, len(emails), CHUNK_SIZE):
            chunk = emails[start:start + CHUNK_SIZE]
            all_results.extend(analyze_emails_batch(chunk, school, priority_topics))
        return all_results

    emails_block = ""
    for i, email in enumerate(emails, 1):
        sender = email.get('sender', '')
        received = email.get('received_at', '')
        received_note = f"\nReceived: {received[:10]}" if received else ""
        utd_note = f"\n[NOTE: {_utd_context(sender, school)}]" if "utdallas.edu" in sender else ""
        emails_block += f"""
--- EMAIL {i} ---
Subject: {email.get('subject', 'No Subject')}
Body: {email.get('body', 'No Body Content')}{received_note}{utd_note}
"""

    topics_line = _priority_topics_context(priority_topics)

    prompt = f"""
    Act as a highly efficient executive email assistant.
    Analyze each of the following {len(emails)} emails and categorize each using ONLY one of these categories: {TAGS}
    {topics_line}

    Your output MUST be a valid, parseable JSON array containing exactly {len(emails)} objects, one per email, in the same order.
    Each object must contain exactly these keys:
    1. "summary": Concise summary (max 2 sentences). Include deadlines if present.
    2. "assignedCategory": The single best-fitting category from the list.
    3. "priorityLevel": Integer 1-4 (1=Critical, 4=Low).
    4. "uiBadges": Array of 1-2 short tags (e.g. ["Internship", "Resume"]).
    5. "tasks": Array of actionable tasks (plain strings).
    6. "deadlines": Array of deadline objects. Each object MUST have:
       - "text": concise description of what needs to be done
       - "date": the actual due date as "YYYY-MM-DD", calculated from the email's "Received" date and any relative time references in the body ("in 24 hours" = received + 1 day, "by Friday" = the next Friday on or after the received date, "by end of week" = that Friday, etc.). Use absolute dates from the body when stated. If truly no date can be determined, use the received date.
    7. "events": Array of event statements (plain strings).
    8. "location": The physical room number, address, or virtual link for the event. If none, output "".
    9. "time": The date and time of the event in ISO 8601 format. If none, output "".
    10. "needsReply": true if this email is a direct personal message to the user that requires a reply (e.g. interview invitation, direct question, recruiter outreach, professor asking something). false for newsletters, announcements, automated notifications, and mass emails.
    11. "draftReply": If needsReply is true, write a concise and professional draft reply (3-5 sentences) appropriate for the email context. If needsReply is false, output "".

    Emails to analyze:
    {emails_block}

    Return ONLY the JSON array. No explanation, no markdown fences.
    """

    try:
        response = call_gemini_with_retry(
            prompt,
            model="Gemini 3.1 Flash Lite",
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
        return [
            {
                "summary": "AI could not process this email.",
                "assignedCategory": "Other",
                "priorityLevel": 4,
                "uiBadges": ["Error"],
                "tasks": [],
                "deadlines": [],   # list of {"text": str, "date": "YYYY-MM-DD"}
                "events": [],
                "location": "",
                "time": "",
                "needsReply": False,
                "draftReply": "",
            }
            for _ in emails
        ]


def analyze_email_with_gemini(subject, body, sender="", school="", priority_topics=None, received_at=""):
    """
    Takes an email subject, body, and received date, sends it to Gemini,
    and returns a clean Python dictionary.
    """
    if priority_topics is None:
        priority_topics = []

    utd_note = _utd_context(sender, school)
    utd_line = f"\nExtra context: {utd_note}" if utd_note else ""
    topics_line = _priority_topics_context(priority_topics)
    received_line = f"\nEmail received: {received_at[:10]}" if received_at else ""

    prompt = f"""
    Act as a highly efficient executive email assistant.
    Analyze the following email and categorize it using ONLY one of these categories: {TAGS}{utd_line}
    {topics_line}

    Your output MUST be a valid, parseable JSON object containing exactly these keys:
    1. "summary": Concise summary (max 2 sentences). Include deadlines if present.
    2. "assignedCategory": The single best-fitting category from the list.
    3. "priorityLevel": Integer 1-4 (1=Critical, 4=Low).
    4. "uiBadges": Array of 1-2 short tags (e.g. ["Internship", "Resume"]).
    5. "tasks": Array of actionable tasks (plain strings).
    6. "deadlines": Array of deadline objects. Each object MUST have:
       - "text": concise description of what needs to be done
       - "date": the actual due date as "YYYY-MM-DD", calculated from the email received date ({received_at[:10] if received_at else "unknown"}) and any relative time references in the body ("in 24 hours" = received + 1 day, "by Friday" = the next Friday on or after the received date, "by end of week" = that Friday, etc.). Use absolute dates from the body when stated. If truly no date can be determined, use the received date.
    7. "events": Array of event statements (plain strings).
    8. "location": The physical room number, address, or virtual link for the event. If there is no location mentioned, output an empty string "".
    9. "time": The date and time of the event in ISO 8601 format. If there is no time mentioned, output an empty string "".
    10. "needsReply": true if this email is a direct personal message to the user that requires a reply (e.g. interview invitation, direct question, recruiter outreach, professor asking something). false for newsletters, announcements, automated notifications, and mass emails.
    11. "draftReply": If needsReply is true, write a concise and professional draft reply (3-5 sentences) appropriate for the email context. If needsReply is false, output "".

    Input Email:{received_line}
    Subject: {subject}
    Body: {body}
    """

    try:
        response = call_gemini_with_retry(
            prompt,
            model="Gemini 3.1 Flash Lite",
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
            "deadlines": [],   # list of {"text": str, "date": "YYYY-MM-DD"}
            "events": [],
            "location": "",
            "time": "",
            "needsReply": False,
            "draftReply": "",
        }