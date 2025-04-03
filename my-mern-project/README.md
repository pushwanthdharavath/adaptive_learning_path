# Space Learning Platform 🚀

An adaptive learning platform with emotion detection for children, featuring space-themed educational games.

## Features 🌟

- Space-themed educational games (Puzzle and Color Recognition)
- Real-time emotion detection using MediaPipe Face Mesh
- Adaptive learning system that adjusts difficulty based on performance and emotional state
- Parent dashboard for monitoring children's progress
- Secure authentication system with role-based access (Parent, Child, Therapist)
- Beautiful space-themed UI with interactive elements


## Prerequisites 📋

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Modern web browser with camera access

## Installation 🛠️

1. Clone the repository:
```bash
git clone <repository-url>
cd my-mern-project
```

2. Install server dependencies:
```bash
cd server
npm install
```

3. Install client dependencies:
```bash
cd ../client
npm install
```

4. Create a .env file in the server directory:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/mern_auth
JWT_SECRET=your_jwt_secret
```

## Running the Application 🚀

1. Start the MongoDB server:
```bash
mongod
```

2. Start the backend server:
```bash
cd server
npm start
```

3. Start the frontend development server:
```bash
cd client
npm start
```

4. Open your browser and navigate to `http://localhost:3000`

## Project Structure 📁

```
my-mern-project/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/        # Page components
│   │   └── App.js        # Main application component
│   └── package.json
├── server/                # Backend Node.js application
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   └── server.js         # Main server file
└── README.md
```

## Technologies Used 🛠️

- Frontend:
  - React.js
  - TailwindCSS
  - TensorFlow.js
  - MediaPipe Face Mesh
  - Axios

- Backend:
  - Node.js
  - Express.js
  - MongoDB
  - Mongoose
  - JWT Authentication

## Contributing 🤝

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License 📄

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments 🙏

- MediaPipe for providing the Face Mesh model
- NASA for space imagery inspiration
- The React and Node.js communities for their excellent tools and libraries 