<div align="center">

# 🐉 Dragonfly Node

**High-performance Redis-compatible cache API powered by Dragonfly DB**

[![Node.js](https://img.shields.io/badge/Node.js-22+-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Optimized-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![Dragonfly](https://img.shields.io/badge/Dragonfly-Latest-FF6B35?style=flat&logo=redis&logoColor=white)](https://dragonflydb.io/)

*A production-ready Express.js API with optimized Docker containerization for blazing-fast key-value operations*

</div>

---

## ✨ Features

### 🚀 **Performance First**
- **Dragonfly DB**: Redis-compatible with superior memory efficiency and multi-threading
- **Optimized Docker**: Multi-stage builds with aggressive caching and minimal runtime footprint
- **TypeScript**: Full type safety with modern ES2022+ features

### 🛡️ **Production Ready**
- **Health Monitoring**: Built-in health checks and graceful shutdown handling
- **Rate Limiting**: IP-based request throttling with Redis counters
- **Error Handling**: Comprehensive error responses and logging
- **Security**: Non-root container execution and environment isolation

### 🔧 **Developer Experience**
- **Hot Reload**: Development mode with `tsx watch`
- **Code Quality**: ESLint, Prettier, and Husky pre-commit hooks
- **Docker Compose**: One-command development environment
- **TypeScript**: Modern module resolution and strict type checking

---

## 🏗️ Architecture

```mermaid
graph TB
    subgraph "Docker Compose Stack"
        API[Express API<br/>:3000]
        DB[(Dragonfly DB<br/>:6379)]
        API -->|Redis Protocol| DB
    end
    
    subgraph "API Endpoints"
        HEALTH["/health"]
        CACHE["/cache/:key"]
        SET["/set"]
        GET["/get/:key"]
        INCR["/incr/:key"]
        LIMIT["/limited"]
    end
    
    CLIENT[Client Apps] --> API
    API --> HEALTH
    API --> CACHE
    API --> SET
    API --> GET
    API --> INCR
    API --> LIMIT
```

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 22+ (for local development)

### 1️⃣ **Clone & Setup**
```bash
# Clone the repository
git clone <your-repo-url>
cd dragonfly-node

# Copy environment template
cp .env.example .env
```

### 2️⃣ **Configure Environment**
Edit `.env` with your settings:
```bash
# Application
PORT=3000

# Dragonfly / Redis
REDIS_PASSWORD=your-secure-password-here
```

### 3️⃣ **Launch Services**
```bash
# Build and start all services
docker compose up -d

# View logs
docker compose logs -f
```

### 4️⃣ **Verify Installation**
```bash
# Check API health
curl http://localhost:3000/health

# Expected response:
# {"status":"ok","redis":"PONG"}
```

---

## 📚 API Reference

### 🩺 **Health Check**
```http
GET /health
```
**Response:**
```json
{
  "status": "ok",
  "redis": "PONG"
}
```

### 📝 **Set Key-Value**
```http
POST /set
Content-Type: application/json

{
  "key": "user:123",
  "value": {"name": "John", "email": "john@example.com"}
}
```

### 📖 **Get Value**
```http
GET /get/user:123
```
**Response:**
```json
{
  "key": "user:123",
  "value": {"name": "John", "email": "john@example.com"}
}
```

### ⚡ **Cache with TTL**
```http
POST /cache
Content-Type: application/json

{
  "key": "session:abc123",
  "value": {"userId": 123, "role": "admin"},
  "ttl": 3600
}
```

### 🔢 **Increment Counter**
```http
POST /incr/page:views
```
**Response:**
```json
{
  "key": "page:views",
  "value": 42
}
```

### 🚦 **Rate Limited Endpoint**
```http
GET /limited
```
*10 requests per minute per IP*

---

## 🛠️ Development

### **Local Development**
```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Run linting
npm run lint

# Format code
npm run format
```

### **Docker Development**
```bash
# Rebuild after code changes
docker compose build api

# View real-time logs
docker compose logs -f api

# Execute commands in running container
docker compose exec api npm run lint
```

### **Testing API Endpoints**
```bash
# Set a value
curl -X POST http://localhost:3000/set \
  -H 'Content-Type: application/json' \
  -d '{"key":"test","value":"Hello World"}'

# Retrieve the value
curl http://localhost:3000/get/test

# Test caching with TTL (expires in 60 seconds)
curl -X POST http://localhost:3000/cache \
  -H 'Content-Type: application/json' \
  -d '{"key":"temp","value":"expires soon","ttl":60}'

# Increment a counter
curl -X POST http://localhost:3000/incr/counter

# Test rate limiting (try multiple times)
curl http://localhost:3000/limited
```

---

## 🐳 Docker Optimization

### **Multi-Stage Build Process**
1. **Dev Dependencies**: Install build tools and TypeScript
2. **Build Stage**: Compile TypeScript to optimized JavaScript
3. **Prod Dependencies**: Install only runtime dependencies
4. **Runtime**: Minimal Node.js image with built app

### **Performance Features**
- 🚀 **BuildKit Cache Mounts**: Persistent npm cache across builds
- 📦 **Layer Optimization**: Strategic COPY ordering for maximum cache hits
- 🔒 **Security**: Non-root user execution
- 🗜️ **Size**: Minimal runtime footprint with Alpine Linux

### **Build Commands**
```bash
# Build with cache
docker compose build

# Force rebuild without cache
docker compose build --no-cache

# Build specific stage for debugging
docker build --target build -t dragonfly-node:debug .
```

---

## 📊 Monitoring & Logging

### **Health Checks**
- **API**: HTTP health endpoint with Redis connectivity test
- **Dragonfly**: Process monitoring via Docker Compose

### **Logs Access**
```bash
# All services
docker compose logs

# Specific service
docker compose logs api
docker compose logs dragonfly

# Follow logs in real-time
docker compose logs -f --tail=100
```

### **Metrics & Debugging**
```bash
# Container stats
docker stats

# Redis/Dragonfly info
docker compose exec dragonfly redis-cli -a $REDIS_PASSWORD info

# API container shell access
docker compose exec api sh
```

---

## 🚀 Production Deployment

### **Environment Variables**
```bash
NODE_ENV=production
PORT=3000
REDIS_PASSWORD=your-secure-production-password
REDIS_URL=redis://default:password@dragonfly:6379/0
```

### **Scaling Considerations**
- **Horizontal Scaling**: Multiple API containers with load balancer
- **Dragonfly Clustering**: For high availability and data distribution
- **Resource Limits**: Set memory/CPU limits in docker-compose.yml

### **Security Checklist**
- ✅ Strong Redis password
- ✅ Non-root container execution
- ✅ Environment variable isolation
- ✅ Network segmentation
- ✅ Regular security updates

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **[Dragonfly DB](https://dragonflydb.io/)** - Next-generation Redis replacement
- **[Express.js](https://expressjs.com/)** - Fast, unopinionated web framework
- **[TypeScript](https://www.typescriptlang.org/)** - JavaScript with syntax for types
- **[Docker](https://www.docker.com/)** - Containerization platform

---

<div align="center">

**Made with ❤️ and ⚡ by the Dragonfly Node team**

[Report Bug](../../issues) · [Request Feature](../../issues) · [Documentation](../../wiki)

</div>
