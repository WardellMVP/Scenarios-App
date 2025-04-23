# Cybersecurity Threat Simulator

A sophisticated cybersecurity threat simulator that leverages GitLab integration for comprehensive security analysis and real-time threat monitoring. This application allows security teams to run pre-configured threat simulations against target systems to evaluate security posture and readiness.

## Features

- **GitLab OAuth Authentication**: Secure user authentication
- **Containerized Threat Simulation**: Run isolated security scenarios 
- **Real-time Execution**: Monitor simulation progress in real-time
- **Web-based Dashboard**: View and analyze simulation results
- **Multi-tenant Support**: Manage access for different team members
- **Predefined Scenarios**: Includes phishing, ransomware, and DDoS simulations

## Technology Stack

- **Frontend**: React with TailwindCSS and Shadcn UI components
- **Backend**: Node.js with Express
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: GitLab OAuth
- **Real-time Updates**: WebSockets
- **Deployment**: Docker & Docker Compose

## Getting Started

### Prerequisites

- Node.js 20 or higher
- PostgreSQL database
- GitLab account for OAuth setup

### Environment Setup

1. Clone the repository
2. Copy `.env.example` to `.env` and configure the variables:

```
# Application Settings
PORT=5000
NODE_ENV=development

# Session Configuration
SESSION_SECRET=your_secure_secret_here

# Database Configuration
DATABASE_URL=postgres://user:password@localhost:5432/cybersecurity_simulator
PGUSER=your_db_user
PGPASSWORD=your_db_password
PGHOST=localhost
PGPORT=5432
PGDATABASE=cybersecurity_simulator

# Authentication (GitLab OAuth)
GITLAB_CLIENT_ID=your_gitlab_client_id
GITLAB_SECRET=your_gitlab_secret
GITLAB_REDIRECT_URI=http://localhost:5000/auth/gitlab/callback
```

### GitLab OAuth Setup

1. Go to GitLab > User Settings > Applications
2. Create a new application with:
   - Name: Cybersecurity Threat Simulator
   - Redirect URI: `http://localhost:5000/auth/gitlab/callback` (or your production URL)
   - Scopes: `read_user` and `api`
3. Copy the generated client ID and secret to your `.env` file

### Installation

#### Using Docker (Recommended)

```bash
# Build and start the application and database
docker-compose up -d

# Run migrations on first setup
docker-compose exec app npm run db:push
```

#### Manual Installation

```bash
# Install dependencies
npm install

# Set up the database
npm run db:push

# Start the development server
npm run dev

# For production
npm run build
npm start
```

## Deployment

The application can be deployed to any environment that supports Docker containers or Node.js applications with PostgreSQL.

### Docker Deployment

```bash
# Build the Docker image
docker build -t cybersecurity-simulator .

# Run the container
docker run -p 5000:5000 --env-file .env cybersecurity-simulator
```

### Custom Deployment

For custom deployments, ensure:

1. The application has access to a PostgreSQL database
2. Environment variables are properly configured
3. The GitLab OAuth redirect URI matches your deployed URL

## Adding Custom Scenarios

Custom threat scenarios can be added to the `scenarios` directory as YAML files with the following structure:

```yaml
name: Custom Threat
description: Description of the threat
target_apps: ["Web App", "API", "Database"]
exec_command: "node ./scenarios/custom_script.js"
```

## License

[MIT License](LICENSE)