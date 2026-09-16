# SmartPrep Frontend

This folder contains the React + Vite frontend for SmartPrep.

## Clone the project from GitHub

```bash
git clone https://github.com/PurvJK/SmartPrep.git
cd SmartPrep
```

## Open the frontend

```bash
cd frontend
npm install
```

## Environment setup

Create a `.env` file inside the `frontend` folder:

```env
VITE_API_URL=http://localhost:5000/api
```

This tells the frontend where the backend API is running.

## Start the frontend

```bash
npm run dev
```

Then open the local URL shown in the terminal, usually:

```text
http://localhost:5173
```

## Backend requirement

The frontend depends on the backend API. Make sure the backend is running before using the app.

```bash
cd ../backend
npm install
```

Then create a `.env` file in the backend folder with your database and JWT settings, for example:

```env
MONGODB_URI=mongodb://localhost:27017/smartprep
JWT_SECRET=your_super_secret_jwt_key_here
PORT=5000
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

Start the backend:

```bash
npm run dev
```

## Useful scripts

```bash
npm run dev
npm run build
npm run preview
```

## Notes

- The project uses Vite.
- The frontend API base URL is configured from `VITE_API_URL`.
- If you are using a different backend port or host, update the `.env` value accordingly.

## Troubleshooting

### Frontend not loading data
Check that:

1. The backend is running on port `5000`
2. Your `.env` contains the correct `VITE_API_URL`
3. CORS is enabled in the backend

### Port already in use
If port `5173` is busy, Vite will suggest another port. Use the new local URL it prints in the terminal.
