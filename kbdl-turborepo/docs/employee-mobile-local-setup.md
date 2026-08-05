# KBDL Employee app: local mobile setup

Use this guide to run the KBDL Employee frontend on a real Android phone against the local Docker backend.

## What you need

- Node.js 18+ and pnpm 9
- Docker Desktop running
- Android phone with the **kbdl-employee Development Build** already installed
- Phone and laptop on the same Wi-Fi network (recommended), or a USB cable with USB debugging enabled

> This is a local development build, not the official production app. It loads the frontend bundle from Metro on your laptop.

## Names used in this guide

Replace these examples with your own values:

```text
<PROJECT_ROOT> = D:\Kaam badlo\kbdl\kbdl-turborepo
<APP_DIR>      = D:\Kaam badlo\kbdl\kbdl-turborepo\apps\kbdl-employee
<LAN_IP>       = 192.168.1.7
```

In Git Bash, the same example paths are:

```bash
PROJECT_ROOT=/d/Kaam\ badlo/kbdl/kbdl-turborepo
APP_DIR=/d/Kaam\ badlo/kbdl/kbdl-turborepo/apps/kbdl-employee
```

## One-time backend configuration

From the project root, create a local environment file if one does not already exist:

```bash
cd /d/Kaam\ badlo/kbdl/kbdl-turborepo
cp .env.example .env
```

Set the required local secrets in `.env`. Do not commit or share this file.

## Start the backend and database

Open a Git Bash terminal and run:

```bash
cd /d/Kaam\ badlo/kbdl/kbdl-turborepo
docker compose up -d --build
```

Check that all services are healthy:

```bash
docker compose ps
curl http://localhost:8000/health
```

Expected services:

```text
kbdl-postgres
kbdl-redis
kbdl-backend
```

For local test users, seed the database:

```bash
pnpm.cmd docker:seed
```

## Recommended connection: Wi-Fi

This is the easiest method. Once connected, the phone can be unplugged from USB.

### 1. Find the laptop IP address

Run:

```bash
ipconfig
```

Find the Wi-Fi adapter's `IPv4 Address`, for example `192.168.1.7`.

### 2. Point the employee app at the local backend

Open `<APP_DIR>/.env` and set:

```env
EXPO_PUBLIC_API_URL=http://<LAN_IP>:8000/api/v1
```

Example:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.7:8000/api/v1
```

Restart Metro whenever this `.env` value changes.

### 3. Start Metro

Open a second Git Bash terminal:

```bash
cd /d/Kaam\ badlo/kbdl/kbdl-turborepo/apps/kbdl-employee
pnpm.cmd exec expo start --dev-client --lan
```

Keep this terminal open. It is the **Metro terminal** and will display a QR code.

### 4. Connect the phone

On the phone:

1. Open **kbdl-employee Development Build**.
2. Tap **Scan QR Code**.
3. Scan the QR code shown in the Metro terminal.

The app should load from Metro. Save a frontend file and the phone should refresh automatically.

## USB connection alternative

Use this when the phone is connected by cable. This makes the phone's `localhost` forward to your laptop.

### 1. Enable and authorize USB debugging

On the phone, enable Developer options and USB debugging. Connect the cable, unlock the phone, and accept **Allow USB debugging**.

In Git Bash:

```bash
export PATH="/d/Android/Sdk/platform-tools:$PATH"
adb devices
```

Expected result:

```text
RFCRA1845FX    device
```

If it says `unauthorized`, accept the prompt on the phone. If it says no devices, reconnect the cable and ensure USB debugging is enabled.

### 2. Change the employee API URL for USB

Set `<APP_DIR>/.env` to:

```env
EXPO_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### 3. Create port forwarding and start Metro

```bash
cd /d/Kaam\ badlo/kbdl/kbdl-turborepo/apps/kbdl-employee
adb reverse tcp:8081 tcp:8081
adb reverse tcp:8000 tcp:8000
pnpm.cmd dev
```

If the cable is disconnected, connect and authorize the phone again, then rerun the two `adb reverse` commands. The Wi-Fi method does not need ADB or USB.

## Test login

After the database has been seeded, use this employee test account:

```text
Mobile number: 9876543211
OTP:           123456
```

The backend transforms the 10-digit number into `+919876543211`, matching the seeded worker account.

## Daily startup checklist

1. Start Docker Desktop.
2. Run `docker compose up -d --build` from `<PROJECT_ROOT>`.
3. Confirm `curl http://localhost:8000/health` succeeds.
4. Start Metro using either the Wi-Fi or USB section.
5. Open the Development Build on the phone.

## Common problems

### Network Error: Unable to connect to server

Check the backend:

```bash
curl http://localhost:8000/health
```

For Wi-Fi, check that `<LAN_IP>` is current and the phone is on the same network. For USB, rerun:

```bash
adb reverse tcp:8000 tcp:8000
```

### Metro says “No apps connected”

- Wi-Fi: scan the current Metro QR code again in the Development Build.
- USB: run `adb devices`, then recreate the `adb reverse` mappings.

### Docker cannot build or the engine crashes

Ensure Docker Desktop is running and has sufficient free disk space. Docker Desktop's disk image can be moved to a larger drive through **Settings → Resources → Advanced → Disk image location**. Do not manually move Docker's VHDX file in File Explorer.

### Phone shows an Expo development screen instead of the app

The phone is not connected to Metro. Use **Scan QR Code** for Wi-Fi, or recreate the USB reverse mappings and reload.
