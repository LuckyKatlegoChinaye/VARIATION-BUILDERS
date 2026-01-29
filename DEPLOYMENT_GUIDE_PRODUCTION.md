# 🚀 Deployment Guide - Production Ready

## Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] No hardcoded secrets
- [ ] HTTPS certificates ready
- [ ] CDN configured (optional)
- [ ] Backup strategy in place
- [ ] Monitoring setup (Sentry, DataDog, etc.)
- [ ] Error logging configured
- [ ] Rate limiting enabled

---

## Production Environment Setup

### 1. Environment Variables (.env Production)

```bash
# Database
DATABASE_URL=postgresql://username:password@db.host.com:5432/shop_prod

# JWT & Security
JWT_SECRET=use-a-strong-random-string-here
JWT_EXPIRE=7d
NODE_ENV=production

# Server
PORT=4000
BASE_URL=https://api.yourdomain.com

# CORS
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=/var/app/uploads

# Email (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Monitoring
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=info
```

---

## Option 1: Heroku Deployment

### Prerequisites
- Heroku CLI installed
- Git repository initialized
- Procfile created

### Steps

```bash
# 1. Login to Heroku
heroku login

# 2. Create Heroku app
heroku create your-app-name

# 3. Add PostgreSQL addon
heroku addons:create heroku-postgresql:standard-0

# 4. Set environment variables
heroku config:set JWT_SECRET=your-secret-key
heroku config:set NODE_ENV=production

# 5. Deploy
git push heroku main

# 6. Run migrations
heroku run npx prisma migrate deploy

# 7. Seed data (optional)
heroku run npx prisma db seed

# 8. Check logs
heroku logs --tail
```

### Create Procfile
```
web: npm run start
release: npx prisma migrate deploy
```

---

## Option 2: AWS (EC2 + RDS) Deployment

### Database Setup (RDS)

```bash
# Create RDS PostgreSQL instance
aws rds create-db-instance \
  --db-instance-identifier shop-management-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --allocated-storage 20 \
  --master-username admin \
  --master-user-password YourStrongPassword \
  --publicly-accessible false
```

### EC2 Setup

```bash
# 1. Connect to EC2 instance
ssh -i your-key.pem ec2-user@your-instance-ip

# 2. Install Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
npm install -g npm

# 3. Clone repository
git clone https://github.com/your-repo/shop-management.git
cd shop-management

# 4. Install dependencies
npm install

# 5. Configure environment
cp .env.example .env
# Edit .env with your production values

# 6. Run migrations
npx prisma migrate deploy

# 7. Build frontend
cd ../client
npm install
npm run build
cd ../server

# 8. Start application with PM2
npm install -g pm2
pm2 start npm --name "shop-api" -- run start
pm2 startup
pm2 save
```

---

## Option 3: DigitalOcean Deployment

### App Platform (Easiest)

```bash
# 1. Push code to GitHub

# 2. In DigitalOcean Console:
# - Create new App
# - Connect GitHub repository
# - Configure environment variables
# - Add PostgreSQL database
# - Deploy

# Environment vars in DigitalOcean:
DATABASE_URL=postgresql://...
JWT_SECRET=...
NODE_ENV=production
```

### App Spec (app.yaml)

```yaml
name: shop-management-system
services:
  - name: api
    github:
      repo: your-username/shop-management
      branch: main
    build_command: npm install && cd server && npm install
    run_command: cd server && npm run start
    envs:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        scope: RUN_AND_BUILD_TIME
        value: ${db.connection_string}
databases:
  - name: db
    engine: PG
    version: "12"
```

---

## Option 4: Docker Deployment

### Create Docker Files

**Dockerfile (Backend)**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY server/package*.json ./
RUN npm ci --only=production

# Copy application
COPY server/ ./

# Run migrations
RUN npx prisma migrate deploy || true

EXPOSE 4000

CMD ["npm", "run", "start"]
```

**docker-compose.yml**
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: shop_management_db
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  api:
    build: ./server
    ports:
      - "4000:4000"
    environment:
      DATABASE_URL: postgresql://user:password@postgres:5432/shop_management_db
      JWT_SECRET: your-secret
      NODE_ENV: production
    depends_on:
      - postgres

  frontend:
    build: ./client
    ports:
      - "80:80"
    depends_on:
      - api

volumes:
  postgres_data:
```

**Build and Deploy**
```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f api
```

---

## SSL/TLS Certificate Setup

### Using Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### Nginx Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # API Proxy
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Frontend
    location / {
        root /var/www/shop-app/client/dist;
        try_files $uri $uri/ /index.html;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

---

## Database Backup Strategy

### Automated Backups

```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR="/backups/postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

pg_dump -U admin -h localhost shop_management_db | gzip > $BACKUP_DIR/shop_db_$TIMESTAMP.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -type f -mtime +7 -delete

# Upload to cloud storage (AWS S3)
aws s3 cp $BACKUP_DIR/shop_db_$TIMESTAMP.sql.gz s3://your-bucket/backups/

echo "Backup completed: $TIMESTAMP"
```

### Cron Job
```bash
# Add to crontab
0 2 * * * /home/user/backup_database.sh
```

---

## Monitoring & Logging

### Using Sentry for Error Tracking

```bash
# Install
npm install @sentry/node @sentry/tracing

# In server.js
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

app.use(Sentry.Handlers.requestHandler());
// ... routes ...
app.use(Sentry.Handlers.errorHandler());
```

### Using Winston for Logging

```bash
npm install winston

# In logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

module.exports = logger;
```

---

## Performance Optimization

### 1. Database Query Optimization
```sql
-- Create indexes
CREATE INDEX idx_sales_created ON sale(created_at DESC);
CREATE INDEX idx_user_email ON "user"(email);
CREATE INDEX idx_product_sku ON product(sku);
CREATE INDEX idx_inventory_quantity ON inventory(quantity);
```

### 2. Caching with Redis

```bash
npm install redis

# Example: Cache products
const redis = require('redis');
const client = redis.createClient();

// Middleware to cache GET requests
app.use((req, res, next) => {
  if (req.method === 'GET') {
    const key = `${req.originalUrl}`;
    client.get(key, (err, data) => {
      if (data) {
        res.json(JSON.parse(data));
      } else {
        next();
      }
    });
  } else {
    next();
  }
});
```

### 3. Compression

```bash
npm install compression

const compression = require('compression');
app.use(compression());
```

### 4. Rate Limiting

```bash
npm install express-rate-limit

const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

---

## Post-Deployment Checklist

- [ ] Verify frontend loads
- [ ] Test user authentication
- [ ] Test POS transaction flow
- [ ] Verify database backups
- [ ] Check error logs (Sentry)
- [ ] Monitor server performance
- [ ] Test email notifications
- [ ] Verify API rate limiting
- [ ] Check HTTPS certificate
- [ ] Set up monitoring alerts
- [ ] Document deployment process
- [ ] Create runbook for common issues

---

## Monitoring Dashboard Setup

### Useful Services
- **Application Monitoring**: DataDog, New Relic
- **Error Tracking**: Sentry
- **Logging**: LogRocket, Papertrail
- **Uptime Monitoring**: Pingdom, Uptime Robot
- **Database Monitoring**: AWS CloudWatch, pgAdmin

---

## Troubleshooting Common Deployment Issues

### Connection Timeout
```bash
# Check if services are running
sudo systemctl status nginx
sudo systemctl status postgresql

# Check firewall rules
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### Database Connection Failed
```bash
# Test connection
psql -h db.host.com -U username -d shop_management_db

# Check DATABASE_URL format
postgresql://username:password@host:port/dbname
```

### Out of Memory
```bash
# Increase Node memory
NODE_OPTIONS="--max-old-space-size=2048" npm run start

# Or in systemd service
Environment="NODE_OPTIONS=--max-old-space-size=2048"
```

---

## Scaling Strategies

1. **Horizontal Scaling**
   - Load balancer (Nginx, HAProxy)
   - Multiple app instances
   - Session store (Redis)

2. **Vertical Scaling**
   - Larger EC2/server instance
   - More database resources
   - Increase memory/CPU

3. **Database Optimization**
   - Read replicas
   - Partitioning
   - Connection pooling

---

**Version**: 1.0.0
**Last Updated**: 2024

For more help, visit: https://expressjs.com/en/advanced/best-practice-performance.html
