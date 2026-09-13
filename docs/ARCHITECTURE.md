# Architecture Documentation

## System Overview

The Space Learning Platform is a full-stack web application with emotion detection capabilities for adaptive learning. The system consists of three main components:

1. **Frontend (React)** - User interface and emotion detection
2. **Backend (Node.js/Express)** - API server and business logic
3. **ML Models (Python/Flask)** - Expression detection and learning path prediction

## Component Architecture

### Frontend Architecture

```
client/
├── src/
│   ├── api/              # API configuration and base setup
│   ├── assets/           # Static assets (images, fonts)
│   ├── components/       # Reusable React components
│   │   └── common/       # Shared UI components (Button, Input, Card)
│   ├── pages/            # Route-based page components
│   │   ├── HomeScreen.js
│   │   ├── Login.js
│   │   ├── Signup.js
│   │   ├── ChildDashboard.js
│   │   ├── ParentDashboard.js
│   │   ├── TherapistDashboard.js
│   │   ├── MathQuizGame.js
│   │   ├── PuzzleGame.js
│   │   ├── ColorGame.js
│   │   └── LevelSelection.js
│   ├── styles/           # CSS files organized by component
│   ├── App.js            # Main app component with routing
│   └── index.js          # Entry point
```

### Backend Architecture

```
server/
├── models/               # MongoDB data models
│   ├── User.js          # User authentication and profile
│   ├── GameResult.js    # Game performance data
│   └── MathQuizResult.js # Quiz-specific results
├── routes/               # API route handlers
│   ├── authRoutes.js    # Authentication endpoints
│   ├── gameRoutes.js    # Game data endpoints
│   ├── questionRoutes.js # Question management
│   ├── expressionRoutes.js # Expression tracking
│   ├── quizResultRoutes.js # Quiz results
│   ├── therapistRoutes.js # Therapist-specific endpoints
│   ├── userListRoutes.js # User management
│   └── userRoutes.js    # User profile management
├── middleware/           # Express middleware
├── utils/                # Utility functions
│   └── expressionSessionManager.js # Expression session handling
├── ml-models/            # ML models and scripts
│   ├── *.py             # Python ML scripts
│   ├── *.h5             # Trained models
│   ├── *.pkl            # Scalers and encoders
│   └── *.json           # Training data
├── server.js             # Main server entry point
└── .env.example          # Environment variables template
```

## Data Flow

### Authentication Flow
1. User submits login/signup form
2. Frontend sends request to `/api/auth/login` or `/api/auth/signup`
3. Backend validates credentials using MongoDB
4. Backend generates JWT token
5. Token stored in localStorage
6. Subsequent requests include token in Authorization header

### Game Session Flow
1. Child selects game from dashboard
2. Frontend loads game component with emotion detection
3. MediaPipe Face Mesh tracks facial landmarks
4. Expression data sent to backend for analysis
5. ML models predict emotional state
6. Game difficulty adjusted based on expression + performance
7. Results saved to MongoDB
8. Analytics updated for parent/therapist dashboards

### Expression Detection Flow
1. WebcamCapture component captures video frames
2. MediaPipe Face Mesh extracts facial landmarks
3. Landmarks sent to backend expression tracking
4. ML models analyze landmark patterns
5. Emotional state predicted (happy, frustrated, engaged, etc.)
6. Adaptive learning system adjusts content accordingly

## Database Schema

### User Model
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  password: String (hashed),
  role: String (parent|child|therapist),
  age: Number,
  gender: String,
  parentId: String (for child accounts),
  createdAt: Date,
  updatedAt: Date
}
```

### GameResult Model
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  gameName: String,
  level: Number,
  score: Number,
  completed: Boolean,
  timeSpent: Number,
  expressionData: Array,
  date: Date
}
```

### MathQuizResult Model
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  level: Number,
  score: Number,
  totalQuestions: Number,
  correctAnswers: Number,
  timeSpent: Number,
  expressionData: Array,
  date: Date
}
```

## API Communication

### Frontend → Backend
- **Protocol**: HTTP/HTTPS
- **Data Format**: JSON
- **Authentication**: JWT Bearer tokens
- **CORS**: Enabled for development

### Backend → ML Models
- **Protocol**: HTTP (Flask API)
- **Data Format**: JSON
- **Endpoints**: `/api/predict-path`, expression analysis endpoints

## Security Considerations

1. **Authentication**: JWT tokens with expiration
2. **Password Security**: bcrypt hashing
3. **CORS**: Configured for specific origins
4. **Input Validation**: Server-side validation on all endpoints
5. **Environment Variables**: Sensitive data in .env files
6. **Role-Based Access**: Different permissions for parent/child/therapist

## Performance Optimization

1. **Frontend**: Code splitting, lazy loading, memoization
2. **Backend**: Database indexing, connection pooling
3. **ML Models**: Model optimization, batch processing
4. **Caching**: Redis for session management (optional)

## Deployment Architecture

### Development
- Frontend: React development server (port 3000)
- Backend: Node.js server (port 5000)
- ML Models: Flask server (port 5001)
- Database: Local MongoDB instance

### Production
- Frontend: Static files served via CDN
- Backend: Node.js server with PM2/process manager
- ML Models: Flask server with Gunicorn
- Database: MongoDB Atlas or managed instance
- Load Balancer: Nginx/HAProxy for traffic distribution