# how-much-do-u-know-about-u-or-us-
Laura's 25
# 🎁 Tens ganes de saber el teu regal? 😏  
*A romantic and playful web app for Laura’s 25th birthday*

---

## 💡 About this project
This is a **custom web game** built as a digital birthday surprise for **Laura’s 25th birthday**.  
It’s designed to be accessed through a **QR code**, leading her into a fun and emotional **journey of 25 challenges**, all connected to our memories, music, moments and inside jokes.

When she completes enough challenges (≥ 8 points — a nod to her birthday on November 8th 🎂), she unlocks the **final reveal**:  
> ✨ A very elegant dinner in Rome 🇮🇹 this January — so she’d better pack something fancy.

---

## 🧠 Concept & Experience
The game combines different emotions — romantic, nostalgic, funny, reflective — through small interactive challenges like:
- Guessing songs or sounds 🎵  
- Remembering shared moments 💭  
- Answering spicy or funny questions 😏  
- Identifying blurred pictures from our trips 📸  
- Completing light mini-games (Kahoot-style, memory, puzzles…)

Everything happens **digitally**, within about **30–60 minutes**.

---

## 🧱 Tech structure
- **HTML / CSS / JavaScript (vanilla)**  
- **Data-driven** via JSON files (`config.json`, `challenges.json`)  
- **No backend**, fully static — ideal for GitHub Pages or Firebase Hosting  
- **Mobile-first design** (playable from her phone)  
- **LocalStorage** used to track progress  
- **Progress bar** + confetti + final screen with custom message  
- Optional **audio narration or clips** for a more personal touch

---

## 📂 File structure
index.html
css/
└─ styles.css
js/
└─ app.js
data/
├─ config.json
└─ challenges.json
assets/
├─ audio/
├─ images/
└─ icons/

pgsql
Copy code

---

## ⚙️ Configuration
All customizable content is stored in `data/config.json` and `data/challenges.json`.

### Example — `config.json`
```json
{
  "title": "Tens ganes de saber el teu regal? 😏",
  "goal": 8,
  "auth": { "username": "laura", "password": "08011" },
  "theme": { "accent": "#9b87f5", "accent2": "#22d3ee" },
  "final": {
    "heading": "🎉 Sorpresa desbloquejada!",
    "subheading": "Has superat les proves del meu cor.",
    "body": "Al gener, porta la teva roba més elegant. Tinc reservat un lloc especial per sopar junts a Roma. 💛"
  }
}
🚀 Deployment (GitHub Pages)
Upload all files to this repository.

Go to Settings → Pages.

Under Source, select:

Branch: main

Folder: / (root)

Save and wait a few seconds.

Your public URL will look like:

lua
Copy code
https://ramonpertinez.github.io/how-much-do-u-know-about-u-or-us/
💡 That’s the link you’ll encode in the QR on the physical letter with her flowers.

📱 Future improvements
Add PWA support (manifest + service worker → installable app)

Add new challenge types (drag-sort, timer, video, etc.)

Build an admin editor to let others create their own games

Optionally migrate to Firebase for user accounts and shared progress

🧑‍💻 Credits
Created with ❤️ by Ramon — for Laura,
with a little help from ChatGPT.

License: MIT
Feel free to fork and adapt this project to your own story.

💬 Notes (Català)
Aquest projecte és un regal molt especial.
La idea és que la Laura rebi unes flors amb una carta que conté un QR, que la portarà a aquest joc web.
A mesura que avanci superant proves, anirà descobrint records, àudios i moments compartits fins arribar al missatge final:

“Et porto a sopar a Roma, amb roba elegant, per celebrar-te com et mereixes 💛”.
