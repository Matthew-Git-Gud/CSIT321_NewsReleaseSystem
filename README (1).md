# News Release System

A web-based community news platform for discovering, publishing, sharing and discussing news articles. The system supports public readers, registered contributors and administrators, with AI-assisted features and real-time notifications.

> **Project:** CSCI321 Final Year Project — News Release System Design and Implementation  
> **Group:** FYP-26-S3-28

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Repository Structure](#repository-structure)
- [Live Deployment](#live-deployment)
- [Local Development Setup](#local-development-setup)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [External Services](#external-services)
- [Documentation](#documentation)
- [Contributors](#contributors)

## Overview

The News Release System is designed to provide a shared platform where visitors can read published news, registered users can contribute and interact with articles, and administrators can manage users and moderate platform content.

The application uses a React and TypeScript frontend, a Node.js and Express backend, and a MySQL database. The frontend and backend are deployed on Render, while the MySQL database is hosted on Aiven.

## Key Features

### News discovery and publishing
- Browse published articles without signing in.
- Search articles and filter by category.
- Discover external news articles through the news aggregation feature.
- Create, edit, save as draft, publish and manage articles.
- View related articles and article information.

### Registered-user features
- Register, log in and manage an authenticated session.
- Personalised article feed based on preferred categories.
- Save articles for later reading.
- Comment on and rate articles.
- Report articles for administrator review.
- Manage friends and friend requests.
- Share articles with friends and view articles shared by others.
- Customise appearance preferences, including theme and accent colour.

### AI and interactive features
- AI News Assistant for news-related questions.
- AI-generated article summaries.
- AI-assisted article cover image generation.
- AI-based article credibility analysis and related moderation workflows.
- Text-to-speech article playback.
- Real-time notifications using Socket.IO.

### Administration
- View dashboard information.
- Manage users and account status.
- Review article reports.
- Manage article content.
- Review credibility moderation items.
- Review suspension appeals.

## Technology Stack

| Area | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite, React Router |
| Rich-text editing | CKEditor 5 |
| Backend | Node.js, Express |
| Database | MySQL |
| Database driver | mysql2 |
| Authentication | JSON Web Tokens (JWT), HTTP cookies, bcrypt |
| Real-time communication | Socket.IO |
| AI services | Azure AI, Azure FLUX |
| Speech | Microsoft Cognitive Services Speech SDK / browser speech capabilities, where configured |
| External news | GNews API |
| Deployment | Render (frontend and backend), Aiven (MySQL) |
| Version control | Git and GitHub |

## System Architecture

The application follows a client-server architecture:

1. **Frontend:** The React application provides the user interface and sends HTTP requests to the backend API. It also connects to the backend Socket.IO server for real-time notifications.
2. **Backend:** The Express application handles authentication, authorisation, article workflows, user interactions, administration and integrations with external services.
3. **Database:** MySQL stores application data, including users, articles, categories, comments, ratings, saved articles, reports, appeals and related records.
4. **External services:** Azure services provide AI-related capabilities, while GNews supplies external news content.

### Deployment

- Frontend: hosted on Render.
- Backend API and Socket.IO server: hosted on Render.
- MySQL database: hosted on Aiven.

## Repository Structure

The project is maintained as a single repository containing the frontend, backend and root-level configuration.

```text
CSIT321_NewsReleaseSystem/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── constants/     # Shared constants and role definitions
│   │   ├── context/       # Authentication and notification context
│   │   ├── data/          # Frontend configuration data
│   │   ├── layouts/       # Shared page layouts
│   │   ├── pages/         # Application pages
│   │   ├── routes/        # Client-side route configuration
│   │   ├── services/      # API and Socket.IO client services
│   │   └── styles/        # CSS stylesheets
│   ├── package.json
│   └── index.html
│
├── backend/
│   ├── config/            # Database and Socket.IO configuration
│   ├── jobs/              # Background jobs
│   ├── middleware/        # Authentication and authorisation middleware
│   ├── modules/           # Feature modules and business logic
│   ├── routes/            # API route registration
│   ├── shared/            # Shared backend utilities
│   ├── tests/             # Backend tests
│   ├── package.json
│   └── server.js
│
├── package.json           # Root scripts for running frontend and backend together
├── package-lock.json
├── pnpm-lock.yaml
└── README.md
```

The root `package.json` uses `concurrently` to start the frontend and backend development servers with one command.

## Live Deployment

| Resource | URL |
|---|---|
| Live application | https://csit321-newsreleasesystem-frontend.onrender.com |
| Frontend service (Render) | https://csit321-newsreleasesystem-frontend.onrender.com |
| Backend service (Render) | https://csit321-newsreleasesystem.onrender.com |
| GitHub repository | https://github.com/Matthew-Git-Gud/CSIT321_NewsReleaseSystem |

Replace the placeholders with the actual project URLs before publishing this README. Do not include private dashboard links unless the intended readers have permission to access them.

## Local Development Setup

### Prerequisites

- Node.js and npm.
- MySQL access and a compatible MySQL server or database instance.
- Git, if cloning the repository.
- A modern web browser.
- Required credentials for external services used by the application.

### 1. Obtain the source code

Clone the repository:

```bash
git clone https://github.com/Matthew-Git-Gud/CSIT321_NewsReleaseSystem.git
cd CSIT321_NewsReleaseSystem
```

### 2. Install root dependencies

From the repository root:

```bash
npm install
```

The root package uses `concurrently` to run both applications from one terminal.

### 3. Configure the backend

From the backend directory:

```bash
npm install
```

Create a `.env` file using `.env.example` as a reference, then configure the database connection, authentication secret and any required external-service credentials.

### 4. Configure the frontend

From the frontend directory:

```bash
npm install
```

Configure the frontend API base URL using the environment variable described below.

### 5. Start the applications

From the repository root, run:

```bash
npm run dev
```

This executes the root script:

```bash
concurrently "npm run dev --prefix frontend" "npm run dev --prefix backend"
```

The frontend Vite development server commonly runs at `http://localhost:5173`. The backend defaults to port `3000` unless the `PORT` environment variable is configured.

Alternatively, the frontend and backend can be started separately by running `npm run dev` in each respective directory.

The backend checks its MySQL connection before starting to accept requests. The frontend should point to the backend base URL.

> **Database caution:** Use a development database when running schema changes, seed scripts or tests. Do not run development setup scripts against the deployed production database.

## Environment Variables

Create environment files locally. The following table describes variables referenced by the supplied source code. Actual secret values must be obtained from the project maintainers and must not be committed to Git.

### Backend

| Variable | Purpose |
|---|---|
| `PORT` | Backend listening port; defaults to `3000`. |
| `FRONTEND_ORIGIN` | Allowed frontend origin for credentialed CORS and Socket.IO connections. |
| `DB_HOST` | MySQL host. |
| `DB_PORT` | MySQL port. |
| `DB_USER` | MySQL username. |
| `DB_PASSWORD` | MySQL password. |
| `DB_NAME` | Database name. |
| `JWT_SECRET` | Secret used to sign authentication tokens. |
| `NODE_ENV` | Runtime environment. |
| `AZURE_AI_ENDPOINT` | Azure AI service endpoint. |
| `AZURE_AI_API_KEY` | Azure AI API key. |
| `AZURE_AI_DEPLOYMENT` | Azure AI model deployment name. |
| `AZURE_FLUX_ENDPOINT` | Azure FLUX image-generation endpoint. |
| `AZURE_FLUX_API_KEY` | Azure FLUX API key. |
| `AZURE_SPEECH_KEY` | Azure Speech service key, where enabled. |
| `AZURE_SPEECH_REGION` | Azure Speech service region, where enabled. |
| `GNEWS_API_KEY` | GNews API key for external news retrieval. |
| `PUBLIC_API_URL` | Public API URL used by backend functionality that references it. |

### Frontend

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Backend base URL, for example `http://localhost:3000`. The frontend appends `/api` for API requests. |

Only expose values intended for browser use through `VITE_` variables. Never place database passwords, JWT secrets or private service API keys in frontend environment variables.

## Available Scripts

### Root

Run these commands from the repository root:

| Command | Description |
|---|---|
| `npm install` | Installs root-level dependencies. |
| `npm run dev` | Starts the frontend and backend development servers concurrently. |

### Frontend

| Command | Description |
|---|---|
| `npm run dev` | Starts the Vite development server. |
| `npm run build` | Runs the TypeScript build checks and creates a production build. |
| `npm run preview` | Previews the production build locally. |
| `npm run lint` | Runs Oxlint. |

### Backend

| Command | Description |
|---|---|
| `npm run dev` | Starts the backend with Node.js watch mode. |
| `npm start` | Starts the backend in normal mode. |

## External Services

- **Azure AI:** Used for text-based AI functionality, including the AI assistant and article-related AI capabilities.
- **Azure FLUX:** Used for AI-generated article cover images.
- **GNews API:** Provides external news content for the Discover feature.
- **Azure Speech:** Backend dependency is present for speech-related functionality; configure the service credentials if this integration is enabled in the deployed version.
- **Aiven:** Hosts the MySQL database.

External service availability and usage may depend on API credentials, deployment configuration, quotas and provider availability.

## Documentation

For detailed instructions on using the application, refer to the **CSCI321 Final User Manual**. It contains installation guidance and walkthroughs for the public, registered-user and administrator interfaces.

- User Manual: **Add link to the submitted user manual or include the document in the repository.**
- Architecture Diagram: **Add link or image path if included in the repository.**

## Contributors

**Group FYP-26-S3-28**

- Chan Kei Hong
- Qi Yue
- Tham Yang Zhen Matthew
- Glynis Yeo

---

*This README provides a project overview and developer setup reference. Refer to the User Manual for detailed end-user instructions.*
