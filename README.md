
<div align="center">
  <img src="https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3eXd1bnA5YW0xenlnczNxZXgyZDF3Y2h3NWR4bXltNjh0OXViMzJqNCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/OothRHNJSCaTS/giphy.gif" alt="Wave of Emails GIF">
</div>

# TagIt 📨

TagIt is a Chrome extension that helps users manage email overload by transforming inbox content into clear actions. It connects to users' email accounts (Gmail/Outlook) and calendars (Google Calendar) to automatically organize chaotic inboxes and prevent scheduling disasters. AI reads incoming emails, assigns urgency/category tags, generates one-line summaries, extracts deadlines and action items, then automatically detects meeting invitations and syncs them to the calendar while checking for conflicts. 

## MVP 🏆

- OAuth (Gmail/Outlook)
- Inbox scanning with action summary
- AI tagging system (Urgent, Action Required, Promotional)
  - Tag reasoning
- Deadline & meeting time extraction
- Auto-sync to calendar w/ conflict alerts
  - Events only added w/ user confirmation
  - Manual override
- Unified dashboard

## Stretch Goals 💪

- Weekly digest
- Follow-up reminders
- Unsubscribe suggestions
- Context aware summaries

## Timeline 📆

<details>
  <summary>Week 1: Set Up ⚙️</summary>

  - Discuss who’s frontend/backend and overall project goals & techstack
  - Go over GitHub basics:
    - Create branches.
  - Start wireframing on Figma
  - Research techstack and gain familiarity
<br></details>

<details>
  <summary>Week 2: More Preparation 💡</summary>

  - **Front End:**
    - UI/UX design in Figma for pop up extension
    - UI/UX design in Figma for website
    - Color palette & logo design
  - **Back End:**
    - Set up user authentication & read email perms
    - Work on designing the Schema for the Database
    - API research
<br></details>

<details>
  <summary>Weeks 3-4: Coding 👨🏻‍💻</summary>
  
  - **Front End:**
    - Signup/Login
    - “Connecting email…” screen
    - Tag badges
    - Pop ups for detected events/deadlines


  - **Back End:**
    - Implement Oauth
    - Fetch recent emails
      - Store in database
    - AI tagging
      - Deadline extraction
    - Google Calendar integration

<br></details>

<details>
  <summary>Weeks 5-6: Middle Stretch 👾</summary>

  - **Front End:**
    - Priority inbox view
    - Action summary
    - Email hierarchy
    - Deadline view


  - **Back End:**
    - Priority logic
    - Urgency reasoning
    - Fetch calendar meeting times
    - Conflict detection logic
    - Set up demo account


<br></details>

<details>
  <summary>Weeks 7-8: Finishing Touches 👔</summary>
  
  - Plan and brainstorm for the presentation.
    - Watch previous presentations for inspiration and understanding.
  - Work on stretch goals.

  - **Front End:**
    - Presentation slides & script
    - Final feature touches

  - **Back End:**
    - Last integrations 
    - Finished video/demo

  
<br></details>

<details>
  <summary>Weeks 9-10: Wrapping Up/Presentation Night 🗣🎤🖥️</summary>
  
  - Complete any remaining stretch goals.
  - Prepare and practice the presentation & Q&A.
  - Present!
<br></details>

## Tech Stack & Resources 💻

#### Start here!

  - [What is a frontend?](https://youtu.be/WG5ikvJ2TKA?si=mBepopDcfIZK37jk)
  - [What is a backend?](https://youtu.be/XBu54nfzxAQ?si=kuioRqmCAxXhQocA)
  - [REST APIs](https://youtu.be/LooL6_chvN4?si=amF2wvhjfx1-UiaM)
  - [Basic Git & GitHub in VSCode Tutorial](https://youtu.be/z5jZ9lrSpqk?si=51sKMz2JHPklqfnV)

#### React Chrome Extension

- <a href="https://www.luckymedia.dev/blog/how-to-create-a-chrome-extension-with-react-typescript-tailwindcss-and-vite-in-2024">How to Create a Chrome Extension with React, TypeScript, TailwindCSS, and Vite</a>
- <a href="https://web-highlights.com/blog/how-to-build-a-chrome-extension-using-react/">How To Build A Chrome Extension Using React</a>
- Tailwind CSS:
  - <a href="https://tailwindcss.com/docs/installation">Documentation</a>
  - <a href="https://www.youtube.com/watch?v=bv_YdzsW3XY">Build a Chrome Extension in MINUTES With React and Tailwind CSS!</a>
- Vite:
  - <a href="https://vite.dev/guide/">Documentation</a>
  - <a href="https://www.youtube.com/watch?v=GGi7Brsf7js">Full Tutorial | Building a Chrome Extension in Typescript and Vite</a>
- <a href="https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts?utm_source=chatgpt.com">Content Scripts:</a>
  - It allows you to read details from the web page
  - <a href="https://dev.to/oluwatobi2001/a-beginners-guide-to-building-content-scripts-df?utm_source=chatgpt.com">Beginners guide to Building Content Scripts</a>

#### React Website

- <a href="https://legacy.reactjs.org/tutorial/tutorial.html#setup-for-the-tutorial">Setup</a>
- <a href="https://legacy.reactjs.org/tutorial/tutorial.html#setup-for-the-tutorial">Setting up the Environment</a>
- <a href="https://youtu.be/SqcY0GlETPk?si=7m4sb_bs-ksPQLkv">React Tutorial for Beginners</a>
- Do’s and Don'ts - 
  - <a href="https://www.youtube.com/watch?v=b0IZo2Aho9Y">10 React Antipatterns to Avoid - Code This, Not That!</a>

## Git Commands 🤖

| Command                       | What it does                        |
| ----------------------------- | ----------------------------------- |
| git branch                    | lists all the branches              |
| git branch "branch name"      | makes a new branch                  |
| git checkout "branch name"    | switches to specified branch       |
| git add .                     | finds all changed files             |
| git commit -m "Testing123"    | commit with a message               |
| git push                      | push to branch                      |
| git pull "branch"             | pull updates from a specific branch |

## Team TagIt 😆

**Developers**
- Ankitha Shaji Thomas
- Peyton McEntire
- Aryan Sanoj Raj
- Sneha Lal
- Hayden Hayes

**Project Manager**
- Tramanh Trinh 

**Industry Mentor**
- Abis Naqvi