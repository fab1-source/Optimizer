# 2D Glass Cutting Stock Optimizer — Company Central Server Setup

A professional, high-yield 2D Guillotine Glass Cutting Optimizer with centralized company server storage, multi-PC local network access, and user access control.

---

## Architecture Overview

```
                        +-----------------------------------------+
                        |         COMPANY SERVER MACHINE          |
                        |       Running Express + Vite Server     |
                        |      Central Database: ./data/jobs.json |
                        +-----------------------------------------+
                                            |
                                  Local Area Network (LAN)
                                   Port 3000 (TCP)
          +-------------------+-------------+-------------------+
          |                   |             |                   |
    [PC 1: Admin]     [PC 2: Planner] [PC 3: Shop Floor] [PC 4: CNC Machine]
   http://<IP>:3000   http://<IP>:3000  http://<IP>:3000   http://<IP>:3000
```

- **1 Central Server**: Hosts the Node.js / Express backend and stores all jobs in `./data/jobs.json`.
- **Any PC on LAN (PC 1 to PC 4)**: Connects via standard web browser (Chrome, Edge, Firefox). No software installation required on client PCs!
- **Real-Time Synchronization**: Any job created, edited, optimized, or locked on one PC is instantly stored on the server and visible to all other PCs.
- **Permanent Job Retention**: Jobs cannot be deleted once created, ensuring 100% data audit compliance.
- **User Log On Flow**: When logging on as **User 1 (Admin)**, **User 2 (Planner)**, or **User 3 (Operator)**, the software immediately opens on the **Jobs Dashboard**.

---

## Quick Start Guide (Once Cloned from GitHub)

### Prerequisites

- **Node.js** version 18 or 20 (LTS recommended) installed on the Server machine.
  Download from [https://nodejs.org/](https://nodejs.org/)
- **Git** (optional, to clone the repo)

---

### Method A: Windows Server (1-Click Launch)

1. Clone or download this repository to the company server computer:
   ```cmd
   git clone <YOUR-GITHUB-REPO-URL>
   cd <REPO-FOLDER>
   ```
2. Double-click the included file:
   ```
   start-server.bat
   ```
3. This script will automatically:
   - Verify Node.js is installed
   - Run `npm install` (if first time)
   - Compile production bundles via `npm run build`
   - Start the centralized server on port `3000`

---

### Method B: Linux / Ubuntu Server

1. Clone the repository:
   ```bash
   git clone <YOUR-GITHUB-REPO-URL>
   cd <REPO-FOLDER>
   ```
2. Make script executable and run:
   ```bash
   chmod +x start-server.sh
   ./start-server.sh
   ```

---

### Method C: Manual Commands (Any OS)

From the project root folder:

```bash
# 1. Install all dependencies
npm install

# 2. Build the optimized production bundle
npm run build

# 3. Start the production server on port 3000 (0.0.0.0:3000)
npm start
```

*(For quick development/testing, you can also run `npm run dev`)*

---

## How to Access the App from Any PC (PC 1, 2, 3, 4)

Once the server is running on the Server PC:

1. **Find the Server PC's IP address**:
   - **On Windows**: Open Command Prompt on the server, type `ipconfig`, and look for `IPv4 Address` (for example: `192.168.1.50`).
   - **On Linux**: Open terminal, type `hostname -I` or `ip a`.
   - **In the App**: You can also click the **"Company Server (LAN)"** button in the header at any time — it detects and displays the server's local network IPs with a 1-click **"Copy URL"** button.

2. **Open browser on any client PC**:
   - Open Google Chrome, Microsoft Edge, or Mozilla Firefox on PC 1, PC 2, PC 3, or PC 4.
   - Enter the server's address in the URL bar:
     ```
     http://192.168.1.50:3000
     ```
     *(replace `192.168.1.50` with your actual server IP)*

---

## Firewall Configuration (Important)

If client PCs cannot reach `http://<SERVER-IP>:3000`, ensure port `3000` is allowed through the Server's firewall:

### Windows Defender Firewall:
Open **PowerShell as Administrator** on the Server PC and run:
```powershell
netsh advfirewall firewall add rule name="GlassOptimizerPort3000" dir=in action=allow protocol=TCP localport=3000
```

### Linux UFW:
```bash
sudo ufw allow 3000/tcp
```

---

## Keeping the Server Running 24/7 (PM2 Service)

To run the server continuously in the background and auto-restart if the server PC reboots:

```bash
# Install PM2 process manager globally
npm install -g pm2

# Build the project
npm run build

# Start the server as a background service
pm2 start dist/server.cjs --name "glass-optimizer"

# Save list and enable startup on boot
pm2 save
pm2 startup
```

---

## User Log On & Dashboard Access

### System Roles
- **User 1 (Admin)**: Full administrative access, job creation, lock/unlock authority.
- **User 2 (Planner)**: Cut list generation, stock sheet optimization, tolerance settings, job lock authority.
- **User 3 (Shop Floor / CNC Operator)**: Visualizer cutting map review, workshop print tickets, CNC G-Code / DXF / CSV exports.

### Log On Behavior
- Upon clicking **User 1**, **User 2**, or **User 3** to log on (or when switching user from the top header menu), the system **automatically redirects to the Jobs Dashboard**.
- The active user profile is remembered across browser sessions on that PC.

---

## Key Features

1. **Guillotine 2D Nesting Engine**:
   - Zero waste optimization, guillotine multi-level slicing, grain/rotation control, kerf & trim margins.
2. **Central Company Database (`./data/jobs.json`)**:
   - Automatically stores all jobs on the server machine.
3. **Job Locking**:
   - Protects confirmed orders from being altered on the shop floor.
4. **Permanent Record Retention**:
   - Deletion is disabled to guarantee full job history preservation.
5. **CAM / CNC Exports**:
   - Exports G-Code (`.nc`/`.tap`), AutoCAD DXF (`.dxf`), and CSV cut lists.
6. **Workshop Printing**:
   - Printable job cards and cutting tickets with QR/Barcodes and pane dimensions.
