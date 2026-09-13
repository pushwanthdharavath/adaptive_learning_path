# Adaptive Learning Path 🚀

ALP is an AI-powered educational platform designed to personalize learning for children. It analyzes facial expressions and gameplay behavior to understand each child's emotional state and engagement level. Based on this, the system dynamically adjusts the learning path in real time to keep learners motivated and improve their learning outcomes.

## Features 🌟

- Educational games: Math, English, Science, and Tricky Games
- Real-time emotion detection using facial expression analysis via ML service
- Adaptive learning system that adjusts difficulty based on performance and emotional state
- Level 1 starts with easy questions; subsequent levels adapt based on score and aggregated expressions
- Parent dashboard to view child's complete history (mistakes, rounds qualified, expressions per round)
- Teacher dashboard to view all children's logs (scores, improvement needs, expressions)
- Secure authentication system with role-based access (Parent, Child, Teacher)
- Parent-Child relationship system using special Parent Codes (e.g., parent0001)
- Child-friendly colorful and playful UI

## Prerequisites 📋

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Python 3.8 or higher (for ML service)
- Modern web browser with camera access

## Installation 🛠️

1. Clone the repository:
```bash
git clone https://github.com/pushwanthdharavath/adaptive_learning_path.git
cd adaptive_learning_path
```

2. Install server dependencies:
```bash
cd server
npm install
```

3. Install ML service dependencies:
```bash
cd server/ml-models
pip install -r requirements.txt
```

4. Install client dependencies:
```bash
cd ../../client
npm install
```

## Running the Application 🚀

You need to run **3 services** in separate terminals:

### 1. Start MongoDB
```bash
mongod
```

### 2. Start the Backend Server (Port 5000)
```bash
cd server
node server.js
```

### 3. Start the ML Service (Port 5001)
```bash
cd server/ml-models
python app.py
```

### 4. Start the Frontend (Port 3000)
```bash
cd client
npm start
```

5. Open your browser and navigate to `http://localhost:3000`

## Project Structure 📁

```
adaptive_learning_path/
├── client/                 # Frontend React application
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── api/           # API configuration
│   │   ├── components/    # Reusable components
│   │   │   └── common/    # Common UI components (Button, Input, Card, WebcamCapture, etc.)
│   │   ├── pages/         # Page components (dashboards, games, auth)
│   │   │   ├── ChildDashboard.js
│   │   │   ├── ParentDashboard.js
│   │   │   ├── TherapistDashboard.js
│   │   │   ├── MathQuizGame.js
│   │   │   ├── EnglishQuizGame.js
│   │   │   ├── ScienceQuizGame.js
│   │   │   ├── TrickyGames.js
│   │   │   ├── LevelSelection.js
│   │   │   ├── EnglishLevelSelection.js
│   │   │   ├── ScienceLevelSelection.js
│   │   │   ├── TrickyLevelSelection.js
│   │   │   ├── Login.js
│   │   │   └── Signup.js
│   │   ├── styles/        # CSS files
│   │   ├── App.js         # Main application component
│   │   └── index.js       # Entry point
│   ├── package.json
│   └── build/             # Production build output
├── server/                 # Backend Node.js application
│   ├── models/            # MongoDB models
│   │   ├── User.js
│   │   ├── GameProgress.js
│   │   ├── GameResult.js
│   │   └── MathQuizResult.js
│   ├── routes/            # API routes
│   │   ├── authRoutes.js
│   │   ├── gameRoutes.js
│   │   ├── questionRoutes.js
│   │   ├── expressionRoutes.js
│   │   ├── quizResultRoutes.js
│   │   ├── therapistRoutes.js
│   │   ├── userListRoutes.js
│   │   ├── userRoutes.js
│   │   └── gameProgressRoutes.js
│   ├── utils/             # Server utilities
│   │   └── expressionSessionManager.js
│   ├── ml-models/         # ML service (Flask)
│   │   ├── app.py
│   │   ├── requirements.txt
│   │   └── setup_and_start.bat
│   ├── package.json
│   └── server.js          # Main server file
├── docs/                  # Documentation
│   ├── ARCHITECTURE.md    # System architecture documentation
│   ├── DEPLOYMENT.md      # Deployment guide
│   └── RESTRUCTURING_SUMMARY.md # Restructuring details
├── .gitignore
└── README.md
```

## Technologies Used 🛠️

### Frontend:
- React.js (Create React App)
- React Router
- Axios
- CSS3 (custom styles)

### Backend:
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- CORS

### ML Service:
- Python
- Flask
- Flask-CORS
- OpenCV
- MediaPipe
- TensorFlow

## User Roles 👥

### Parent
- Signup receives a special Parent Code (e.g., parent0001)
- Share Parent Code with children during their signup to establish relationship
- Monitor children's progress and performance
- View detailed analytics and reports
- See Stars Earned, High Score, and Highest Level for each child
- View game history with correct/wrong answers and expressions per round

### Child
- Access educational games (Math, English, Science, Tricky Games)
- Experience adaptive difficulty based on performance and facial expressions
- Track personal progress and achievements
- Enjoy colorful, child-friendly UI
- Webcam captures expressions approximately once per second during gameplay
- Difficulty of next level based on aggregated expression and score

### Teacher (Therapist)
- Monitor all children's learning progress and performance
- View detailed logs of questions answered correctly and incorrectly
- Identify children who need improvement based on scores and expressions
- Access comprehensive reports with expression data for each round

## Development 🛠️

### Available Scripts

#### Server:
```bash
cd server
node server.js      # Start backend server on port 5000
```

#### ML Service:
```bash
cd server/ml-models
python app.py       # Start ML service on port 5001
```

#### Client:
```bash
cd client
npm start           # Start development server on port 3000
npm build           # Build for production
```

## API Endpoints 🔌

### Authentication
- `POST /api/auth/signup` - Register new user (Parent/Child/Teacher)
- `POST /api/auth/login` - Login user

### Users
- `GET /api/users/children` - Get children for logged-in parent
- `GET /api/users/parent/:parentId/children` - Get children by parent ID
- `GET /api/users/profile` - Get user profile

### Games
- `GET /api/questions` - Get game questions
- `POST /api/game-progress/save` - Save game progress
- `GET /api/game-progress/:childId/:gameType` - Get progress for specific game
- `POST /api/game-progress/reset` - Reset game progress (Play Again)
- `GET /api/game-progress/history/:childId` - Get complete game history
- `GET /api/game-progress/all-children` - Get all children's history (for teachers)

### Expressions (ML Service)
- `POST /api/expressions/start-tracking` - Start expression tracking
- `POST /api/expressions/stop-tracking` - Stop expression tracking
- `GET /api/expressions/current` - Get current expression
- `POST /api/expressions/analyze` - Analyze frame for expression

### Quiz Results
- `POST /api/quiz-results/math` - Save math quiz result
- `GET /api/quiz-results/math` - Get math quiz results
- `GET /api/quiz-results/math/average` - Get average scores by level

## Contributing 🤝

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Acknowledgments 🙏

- MediaPipe for providing the Face Mesh model
- Flask and Python communities for ML tools
- The React and Node.js communities for their excellent tools and libraries