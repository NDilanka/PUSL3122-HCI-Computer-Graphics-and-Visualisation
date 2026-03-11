# ⬡ FurniSpace
### Furniture Room Visualisation Application
**PUSL3122 — HCI, Computer Graphics and Visualisation**
Plymouth University / NSBM Green University | Group Coursework

---

## 📋 Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Team Members](#team-members)
- [Getting Started](#getting-started)
- [Running on Mac (No XAMPP)](#running-on-mac-no-xampp)
- [Running on Windows (XAMPP)](#running-on-windows-xampp)
- [Demo Accounts](#demo-accounts)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Credits & Attribution](#credits--attribution)

---

## Overview

FurniSpace is a web-based furniture room visualisation tool built for furniture store designers and customers. It allows users to design room layouts in 2D, preview them in real-time 3D, customise colours and furniture, and save designs to a persistent database.

---

## Features

| Feature                | Description                                                             |
| ---------------------- | ----------------------------------------------------------------------- |
| 🔐 Authentication       | Secure login and registration with role-based access (Admin / Customer) |
| 🏠 2D Room Designer     | Drag-and-drop furniture placement on an interactive canvas              |
| 🎨 3D Visualisation     | Real-time 3D room preview powered by Three.js                           |
| 🛋️ 18 Furniture Items   | Across 6 categories: Seating, Tables, Storage, Bedroom, Office, Decor   |
| 🎨 Colour Customisation | Wall colour, floor colour, and per-item colour and shade controls       |
| 💾 Save & Load Designs  | Persistent design storage via PHP and MySQL                             |
| ↩ Undo / Redo          | 30-state history for all canvas actions                                 |
| ⌨️ Keyboard Shortcuts   | Full keyboard shortcut support for power users                          |
| 📐 Snap to Grid         | Optional grid snapping for precise furniture placement                  |
| 📱 Touch Support        | Touch events supported for tablet and mobile use                        |

---

## Tech Stack

| Layer     | Technology                                            |
| --------- | ----------------------------------------------------- |
| Frontend  | HTML5, CSS3, JavaScript (ES6+)                        |
| 2D Canvas | HTML Canvas API                                       |
| 3D Engine | Three.js r128                                         |
| Backend   | PHP 8                                                 |
| Database  | MySQL                                                 |
| Server    | Apache (XAMPP on Windows) / PHP built-in server (Mac) |
| Fonts     | Cormorant Garamond, Outfit (Google Fonts)             |

---

## Project Structure

```
furniture-visualizer/
│
├── index.html                  # Login page
│
├── pages/
│   ├── register.html           # Registration page
│   ├── dashboard.html          # User dashboard
│   ├── designer.html           # 2D Room designer
│   ├── room3d.html             # 3D visualisation view
│   └── saved-designs.html      # Saved designs list
│
├── css/
│   ├── variables.css           # Design tokens (colours, spacing, fonts)
│   ├── base.css                # Reset, typography, utilities
│   ├── animations.css          # Keyframes and animation classes
│   ├── components.css          # Buttons, inputs, cards, modals, toasts
│   ├── layout.css              # Page layouts (auth, dashboard, designer)
│   └── saved-designs.css       # Saved designs page styles
│
├── js/
│   ├── auth.js                 # Login, logout, session management
│   ├── savedesign.js           # Design CRUD operations
│   ├── room2d.js               # 2D canvas — room drawing and furniture
│   ├── room3d.js               # 3D scene — Three.js visualisation
│   ├── furniture.js            # Furniture catalogue and item factory
│   ├── controls.js             # Drag, resize, rotate, undo/redo, keyboard
│   ├── colorpicker.js          # Colour and shade controls UI
│   └── ui.js                   # Toasts, modals, tour, loading states
│
├── backend/
│   ├── config/
│   │   └── db.php              # MySQL connection
│   ├── auth/
│   │   ├── login.php           # POST: validate credentials
│   │   ├── register.php        # POST: create account
│   │   └── logout.php          # POST: destroy session
│   └── designs/
│       ├── save.php            # POST: insert or update design
│       └── delete.php          # POST: delete design (ownership verified)
│
└── database/
    └── furniture_db.sql        # MySQL schema and demo accounts
```

---

## Team Members

| #   | Name                  | Responsibility                                           |
| --- | --------------------- | -------------------------------------------------------- |
| 1   | Dineth nupehewa       | Authentication, backend PHP, database schema             |
| 2   | Mathrage perera       | 2D room canvas, furniture placement, room shapes         |
| 3   | Kodithuwakku Malshini | 3D visualisation with Three.js, lighting, camera         |
| 4   | Rammeththa Weliwehara | Furniture controls, drag/resize/rotate, undo/redo        |
| 5   | Dalugodage sahan      | UI/UX design, CSS system, animations, saved designs page |
| 6   | Thennakoon thennakoon | Report writing, user testing, usability evaluation       |

---

## Getting Started

### Prerequisites
- PHP 8.0 or higher
- MySQL 5.7 or higher
- A modern web browser (Chrome, Firefox, Safari, Edge)

---

## Running on Mac (No XAMPP)

### Step 1 — Install MySQL via Homebrew
```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install MySQL
brew install mysql

# Start MySQL service
brew services start mysql

# Secure your installation (set root password)
mysql_secure_installation
```

### Step 2 — Import the Database
```bash
mysql -u root -p < database/furniture_db.sql
```

### Step 3 — Update DB Credentials
Open `backend/config/db.php` and update:
```php
$host = 'localhost';
$user = 'root';
$pass = 'your_mysql_password';  // ← update this
$db   = 'furniture_db';
```

### Step 4 — Start PHP Built-in Server
```bash
# Navigate to the project folder
cd /path/to/furniture-visualizer

# Start the server
php -S localhost:8000
```

### Step 5 — Open in Browser
```
http://localhost:8000
```

### Verify Backend is Running
Visit this URL in your browser:
```
http://localhost:8000/backend/auth/login.php
```
You should see:
```json
{"success": false, "message": "Invalid request method."}
```
If you see that — the backend is working correctly ✅

---

## Running on Windows (XAMPP)

### Step 1 — Install XAMPP
Download from [apachefriends.org](https://www.apachefriends.org) and install.

### Step 2 — Start Services
Open XAMPP Control Panel and start:
- ✅ Apache
- ✅ MySQL

### Step 3 — Import Database
1. Open [http://localhost/phpmyadmin](http://localhost/phpmyadmin)
2. Click **Import** tab
3. Choose `database/furniture_db.sql`
4. Click **Go**

### Step 4 — Copy Project Files
Copy the entire `furniture-visualizer` folder to:
```
C:\xampp\htdocs\furniture-visualizer\
```

### Step 5 — Open in Browser
```
http://localhost/furniture-visualizer/
```

---

## Demo Accounts

| Role             | Username   | Password   |
| ---------------- | ---------- | ---------- |
| Admin (Designer) | `admin`    | `admin123` |
| Customer         | `user`     | `user123`  |
| Admin            | `sarah`    | `admin123` |
| Customer         | `customer` | `user123`  |

> ⚠️ Change these passwords in a production environment.

---

## Keyboard Shortcuts

| Shortcut               | Action                                            |
| ---------------------- | ------------------------------------------------- |
| `Arrow Keys`           | Nudge selected item (hold `Shift` for 10px steps) |
| `R`                    | Rotate selected item 45°                          |
| `Delete` / `Backspace` | Delete selected item                              |
| `Ctrl + Z`             | Undo                                              |
| `Ctrl + Y`             | Redo                                              |
| `Ctrl + C`             | Copy selected item                                |
| `Ctrl + V`             | Paste item                                        |
| `Ctrl + D`             | Duplicate item                                    |
| `S`                    | Toggle snap to grid                               |
| `+` / `-`              | Zoom in / out                                     |
| `0`                    | Reset zoom                                        |
| `Esc`                  | Deselect item                                     |

---

## Credits & Attribution

| Resource                | Source                                                               | License |
| ----------------------- | -------------------------------------------------------------------- | ------- |
| Three.js                | [threejs.org](https://threejs.org)                                   | MIT     |
| Cormorant Garamond font | [Google Fonts](https://fonts.google.com/specimen/Cormorant+Garamond) | SIL OFL |
| Outfit font             | [Google Fonts](https://fonts.google.com/specimen/Outfit)             | SIL OFL |
| PHP password hashing    | PHP built-in (`password_hash`)                                       | —       |

> All 3D furniture models in the application are **procedurally generated** using Three.js geometry — no external 3D model files are used.

---

## Academic Integrity

This project was developed as a group assignment for PUSL3122 at NSBM Green University in partnership with Plymouth University. All code was written by the team members listed above. External libraries are credited in the Credits section.
