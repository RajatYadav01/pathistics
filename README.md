# Pathistics

Pathistics is a comprehensive trip planning and Electronic Logging Device (ELD) compliance application for property-carrying truck drivers which can be used to plan trips, visualize routes, and generate ELD-compliant daily logs. It automatically generates optimized routes and FMCSA-compliant daily log sheets based on trip details, ensuring adherence to Hours of Service (HOS) regulations.

## Table of contents

- [Pathistics](#pathistics)
  - [Table of contents](#table-of-contents)
  - [Features](#features)
  - [Tech Stack](#tech-stack)
  - [Project Structure](#project-structure)
  - [Development](#development)
    - [Prerequisites](#prerequisites)
    - [Setup](#setup)
    - [Testing](#testing)
      - [All Tests](#all-tests)
      - [Unit Tests](#unit-tests)
      - [Integration Tests](#integration-tests)
      - [E2E (End-to-end) Tests](#e2e-end-to-end-tests)

## Features

- Trip Planning: Input current location, pickup, dropoff, and current cycle usage
- Route Generation: Interactive maps with turn-by-turn instructions using the OSRM API
- ELD Logs: Automatic generation of FMCSA-compliant daily log sheets
- HOS Compliance: Enforces 70hr/8day cycle, 11hr driving, 14hr on-duty, 10hr off-duty rules
- Fuel Stops: Automatic fuel stop calculation every 1,000 miles
- Visual Logs: Color-coded duty status grid with downloadable images
- Responsive Design: Works seamlessly on desktop, tablet, and mobile
- Trip History: Save and review previous trips
- Print Ready: Export ELD logs as images for printing

## Tech Stack

- Frontend: React.js + TypeScript + Material UI + Vite
- Backend: Django REST Framework + PostgreSQL
- APIs: [OSRM](https://project-osrm.org/) (OpenStreetMap Routing Machine) + Nominatim
- Testing: Vitest (frontend) + Django tests (backend) + Playwright (E2E)
- Package Management: pnpm + Turborepo
- Deployment: Docker + GitHub Actions (CI/CD) + [Vercel](https://vercel.com) (frontend) + [Render](https://render.com) (backend) + [Neon](https://neon.com) (database)

## Project Structure

```shell
pathistics/
├── .github/
│   └── workflows/                     # GitHub Actions workflows
├── apps/
│   ├── web/                           # React.js frontend app
│   │   ├── src/
│   │   │   ├── assets/                # Static assets
│   │   │   ├── components/            # Reusable components
│   │   │   ├── features/              # Feature modules
│   │   │   │   ├── eld-drawing/
│   │   │   │   ├── trip-planner/
│   │   │   │   └── trip-summary/
│   │   │   ├── hooks/                 # Custom hooks
│   │   │   ├── layouts/               # Layout components
│   │   │   ├── pages/                 # Page components
│   │   │   ├── services/              # API services
│   │   │   ├── styles/                # Global styles
│   │   │   ├── routes/                # Route configuration
│   │   │   ├── types/                 # TypeScript types
│   │   │   ├── utils/                 # Utility functions
│   │   │   ├── config/                # App configuration
│   │   │   ├── App.tsx
│   │   │   ├── mani.tsx
│   │   │   └── index.html
│   │   ├── vite.config.ts
│   │   ├── vitest.config.ts
│   │   ├── package.json
│   │   └── Dockerfile
│   └── api/                           # Django REST Framework backend app
│       ├── config/                    # Django project configuration (settings, urls, asgi, wsgi)
│       ├── apps/                      # Core backend business logic split into Django apps
│       │   └── trips/
│       ├── pyproject.toml             # Python tooling and package configuration for uv package manager
│       ├── requirements.txt           
│       ├── package.json               # Package file for Turborepo task orchestration
│       └── Dockerfile
├── packages/
│   ├── e2e-tests/                     # Playwright E2E tests
│   ├── eslint-config/                 # Shared ESLint config
│   └── tsconfig/                      # Shared TypeScript config
├── docker-compose.yml
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── package.json
└── turbo.json
```

## Development

### Prerequisites

- Node.js (preferably, version >= v24.x)
- Python (preferably, version >= v3.13.x)
- PostgreSQL (preferably, version >= v18.x)
- uv (preferably, version >= v0.11.20)
- pnpm (preferably, version >= v11.5.2)
- Docker (preferably the latest version)
- Git (preferably the latest version)

### Setup

To modify and use this project locally on your system, follow these steps:  

1. Clone the project's repository.

   ```shell
   git clone https://github.com/rajatyadav01/pathistics.git
   ```

2. Go to the project folder using the CLI.

   ```shell
   cd pathistics
   ```

3. Install all dependencies in the root of the monorepo using pnpm.

   ```shell
   pnpm install
   ```

4. Rename the `.env.example` file to `.env` in both `./apps/api/` and `./apps/web/` directories to use the environment variables in the apps.

5. Create a `user` with `password` and a `database` using the created `user` as owner in the PostgreSQL database since those are required to connect to the database. For this, you can either use the default values from the `env.example` file or use different values. Also, values of other variables can also be either used from the `env.example` file or different values based on your preference.

6. Install all the dependencies and apply the default migrations to setup the `Django REST Framework` app in `./apps/api` directory using `uv` package manager.

   ```shell
   pnpm --filter "./apps/api" setup
   ```

7. Generate the migration files to update the database schema based on changes to the models.

   ```shell
   pnpm --filter "./apps/api" db:makemigrations
   ```

8. Apply the migration files to update the database.

   ```shell
   pnpm --filter "./apps/api" db:migrate
   ```

9. Run the `Django REST Framework` app.

   ```shell
   pnpm dev:api
   ```

10. Open a different instance of the CLI that you are using or another instance of the code editor to run the `React.js` app.

    ```shell
    pnpm dev:web
    ```

11. After both the apps have been started, open any browser and go to `http://localhost:5173` to access the web application.<br /><br />

To setup the project using Docker:

1. Clone the project's repository.

   ```shell
   git clone https://github.com/rajatyadav01/pathistics.git
   ```

2. Go to the project folder using the CLI.

   ```shell
   cd pathistics
   ```

3. Run the project using docker-compose.

   ```shell
   docker-compose up --build
   ```

4) After all the containers have been started, open any browser and go to `http://localhost:5173` to access the web application.

### Testing

To run a test suite, run the script at the root of the monorepo.

#### All Tests

```shell
pnpm test
```

#### Unit Tests

```shell
pnpm test:unit
```

#### Integration Tests

```shell
pnpm test:integration
```

#### E2E (End-to-end) Tests

```shell
pnpm test:e2e
```
