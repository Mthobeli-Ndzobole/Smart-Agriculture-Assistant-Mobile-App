# Local Run Pipeline

This project includes a single-command local pipeline that:
1. Installs backend dependencies.
2. Runs backend migrations.
3. Seeds a demo login user and sample farm data.
4. Runs backend tests (`check`, `test`).
5. Starts backend first.
6. Confirms backend is healthy.
7. Installs frontend dependencies.
8. Aligns frontend packages to Expo-compatible versions (`npx expo install --fix --npm`) and runs lint.
9. Starts frontend (Expo).

The pipeline is sequential by design: backend first, then frontend.

## One Command

Run this from the project root:

```powershell
powershell -ExecutionPolicy Bypass -File .\run-local-pipeline.ps1
```

## Optional Faster Run

Skip dependency reinstall:

```powershell
powershell -ExecutionPolicy Bypass -File .\run-local-pipeline.ps1 -SkipInstall
```

## Behavior

- Backend starts in the background on `http://127.0.0.1:8000`.
- Frontend starts in the current terminal (`npm run start`).
- When you stop Expo (`Ctrl+C`), the script stops the backend process automatically.
- If `npm` is not on PATH, the script attempts to install Node.js LTS using `winget` and then continues.
- The script also prints the Node version in use so you can confirm you are on an LTS runtime.
- Demo credentials available on every run: `demo_farmer` / `Demo@12345`.
- Demo crop logs, farm records, market prices, and alerts are seeded when missing.
