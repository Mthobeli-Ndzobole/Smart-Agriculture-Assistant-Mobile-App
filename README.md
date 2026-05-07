# Smart Agriculture Assistant (React Native + Django)

## One-Command Pipeline (Backend -> Tests -> Frontend)

Run this in VS Code terminal from project root:

```powershell
powershell -ExecutionPolicy Bypass -File .\run-local-pipeline.ps1
```

What this pipeline does, in order:
1. Backend dependency install
2. Backend migrate
3. Seed demo login user + sample farm data
4. Backend tests (`python manage.py check` and `python manage.py test`)
5. Start backend
6. Backend health confirmation
7. Frontend dependency install
8. Frontend Expo version alignment (`npx expo install --fix --npm`) + lint test
9. Start frontend (`npm run start`)

- No backend `.env` is required for local execution.
- If `npm` is missing from PATH, the pipeline will try to install Node.js LTS via `winget`.
- Expo recommends Node.js LTS; if you still see unstable Metro worker errors, switch to Node LTS and rerun.
- Demo credentials (auto-seeded each pipeline run): `demo_farmer` / `Demo@12345`
- Demo crop logs, farm records, market prices, and alerts are also seeded.
- Full pipeline documentation: [PIPELINE.md](/C:/Workspace/Smart-Agriculture-Assistant-Mobile-App-main/PIPELINE.md)

## What was implemented
- Full Django REST APIs for:
  - Weather proxy (with mock fallback when no API key is set)
  - Crop logs
  - Farm records + summary analytics
  - Market prices + overview analytics
  - Alerts + mark-all-read + summary
  - AI disease detection (image upload + history + summary)
- JWT auth with token refresh and logout blacklist support.
- Database migrations for all custom apps.
- Reworked React Native views with improved styling and dynamic data flow:
  - Home dashboard
  - Weather
  - Alerts
  - Farm records
  - Crop logs
  - Market prices
  - AI disease detection
  - Login/Register
- Centralized frontend API config and authenticated client.

## Run in VS Code

### 1. Open project
- Open folder: `C:\Workspace\Smart-Agriculture-Assistant-Mobile-App-main`

### 2. Backend setup (Terminal 1)
```powershell
cd Main_backend
python -m venv .venv
.\.venv\Scripts\activate
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 3. Frontend setup (Terminal 2)
```powershell
cd Smart_Agriculture_Assistant-App
npm install
npx expo start
```

### 4. Connect app to backend
The app auto-detects host in most cases.  
If needed, set explicit API base URL in a `.env` file inside `Smart_Agriculture_Assistant-App`:
```env
EXPO_PUBLIC_API_BASE_URL=http://YOUR_PC_IP:8000
```

Then restart Expo.

### 5. Test flow
1. Register a user.
2. Login.
3. Add farm records / crop logs.
4. Add market entries.
5. Create alerts and mark them read.
6. Upload crop images in AI disease detection.
7. Use weather search/current-location.
