# Deployment Guide

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Python 3.8+ (for ML models)
- Git

## Local Development Setup

### 1. Environment Setup

#### Server Environment Variables
Create a `.env` file in the `server/` directory:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/mern_auth
JWT_SECRET=your_secure_jwt_secret_here
NODE_ENV=development
```

#### Client Environment Variables
The client uses a proxy configured in `package.json` for development:
```json
"proxy": "http://localhost:5000"
```

### 2. Database Setup

#### Local MongoDB
```bash
# Start MongoDB service
mongod

# Or start with custom data directory
mongod --dbpath /path/to/your/data/directory
```

#### MongoDB Atlas (Cloud)
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Add your IP address to the whitelist
4. Create a database user
5. Update `.env` with your connection string:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mern_auth
```

### 3. Installation

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 4. Running the Application

#### Development Mode

```bash
# Terminal 1: Start the backend server
cd server
npm run dev

# Terminal 2: Start the frontend development server
cd client
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### 5. ML Models Setup (Optional)

If you want to run the emotion detection ML models:

```bash
# Install Python dependencies
cd server/ml-models
pip install -r requirements.txt

# Start Flask server (if needed)
python app.py
```

## Production Deployment

### Frontend Deployment (React)

#### Option 1: Netlify
```bash
cd client
npm run build
# Deploy the 'build' folder to Netlify
```

#### Option 2: Vercel
```bash
cd client
npm run build
# Deploy the 'build' folder to Vercel
```

#### Option 3: Traditional Hosting
```bash
cd client
npm run build
# Upload 'build' folder contents to your web server
```

### Backend Deployment (Node.js)

#### Option 1: Heroku
1. Create a `Procfile` in the server directory:
```
web: node server.js
```

2. Set environment variables in Heroku dashboard:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
NODE_ENV=production
```

3. Deploy:
```bash
cd server
heroku create your-app-name
git push heroku main
```

#### Option 2: DigitalOcean
1. Create a Droplet with Node.js
2. SSH into the server
3. Install dependencies:
```bash
sudo apt update
sudo apt install nodejs npm mongodb
```

4. Clone your repository
5. Install dependencies and start server with PM2:
```bash
npm install
pm2 start server.js --name "space-learning-api"
pm2 startup
pm2 save
```

#### Option 3: AWS
1. Create an EC2 instance
2. Install Node.js and MongoDB
3. Clone your repository
4. Configure security groups (open port 5000)
5. Deploy using the same process as DigitalOcean

### Database Deployment

#### MongoDB Atlas (Recommended)
1. Create a production cluster
2. Configure security settings
3. Update environment variables with production connection string
4. Enable backups and monitoring

#### Self-hosted MongoDB
1. Set up MongoDB on a separate server
2. Configure authentication
3. Enable SSL/TLS
4. Set up regular backups

## Security Considerations

### Environment Variables
- Never commit `.env` files to version control
- Use strong, unique JWT secrets
- Rotate secrets regularly
- Use different secrets for development and production

### API Security
- Enable HTTPS in production
- Implement rate limiting
- Add CORS restrictions
- Validate all input
- Sanitize user data

### Database Security
- Use strong database passwords
- Enable authentication
- Restrict network access
- Implement proper indexing
- Regular backups

## Monitoring and Maintenance

### Application Monitoring
- Use tools like PM2 for process management
- Implement logging (Winston, Morgan)
- Set up error tracking (Sentry)
- Monitor performance (New Relic, DataDog)

### Database Monitoring
- Monitor connection pool usage
- Track query performance
- Set up alerts for unusual activity
- Regular backup verification

### Backup Strategy
- Daily database backups
- Weekly full system backups
- Store backups in multiple locations
- Test restore procedures regularly

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process
taskkill /PID <PID> /F
```

#### MongoDB Connection Issues
```bash
# Check MongoDB status
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log
```

#### Build Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear npm cache
npm cache clean --force
```

## Scaling Considerations

### Horizontal Scaling
- Use load balancers (Nginx, HAProxy)
- Implement session management (Redis)
- Deploy multiple server instances
- Use containerization (Docker)

### Vertical Scaling
- Increase server resources
- Optimize database queries
- Implement caching strategies
- Use CDN for static assets

## Support

For deployment issues:
1. Check logs: `pm2 logs` or application logs
2. Verify environment variables
3. Test database connectivity
4. Review firewall/security settings
5. Check application health endpoints