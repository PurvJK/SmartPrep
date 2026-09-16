# SmartPrep

## Project Structure

```text
SmartPrep/
├── backend/      # Express + MongoDB API
├── frontend/     # React + Vite app
├── README.md     # Project overview
└── .gitignore
```

## Clone the repository

```bash
git clone https://github.com/PurvJK/SmartPrep.git
cd SmartPrep
```

## Backend setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` folder:

```env
MONGODB_URI=mongodb://localhost:27017/smartprep
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

Start the backend:

```bash
npm run dev
```

## Frontend setup

```bash
cd ../frontend
npm install
```

Create a `.env` file in the `frontend` folder:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

Then open the URL shown in the terminal, usually:

```text
http://localhost:5173
```

## Tech Stack

### Frontend
- React
- Vite
- Tailwind CSS
- JavaScript

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT authentication

## Common commands

### Backend
```bash
cd backend
npm install
npm run dev
npm start
```

### Frontend
```bash
cd frontend
npm install
npm run dev
npm run build
npm run preview
```

## Notes

- The backend API must be running before the frontend can load data.
- Update the environment variables if your MongoDB or backend port is different.
- If port `5173` is already in use, Vite will choose another port automatically.

## Troubleshooting

### Frontend cannot connect to API
Check that:

1. The backend is running
2. `VITE_API_URL` matches the backend URL
3. The backend has `CLIENT_URL=http://localhost:5173` configured

### Backend fails to connect to MongoDB
Check that:

1. MongoDB is installed and running
2. `MONGODB_URI` is correct
3. The database server is reachable

## License

This project is for educational and personal use unless otherwise specified by the repository owner.
