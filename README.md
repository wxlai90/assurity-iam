# Assurity - IAM

This is a simple Node.js application that connects to Microsoft Graph API to fetch security groups and stores them in MongoDB.

## Prerequisites

Before you can run the application, make sure you have the following installed:

- Docker and Docker Compose

Additionally, to run without docker/dev mode:

- Node.js is required
- MongoDB instance

### Environment Variables

Sample environment variables in `.env`:

```
CLIENT_ID=<client-id>
CLIENT_SECRET=<client-secret>
TENANT_ID=<tenant-id>
MONGO_URI=mongodb://mongo:27017/<db_name>
PORT=5000
```

These values can be obtained by registering an application in Azure Entra ID (Azure AD) and configuring Microsoft Graph API. Additionally, there is a **sample `.env` file** included that can be used.

## Setup

1. **Clone the repository**:

   ```bash
   git clone https://github.com/wxlai90/assurity-iam.git
   cd assurity-iam
   ```

## Docker Setup

This project includes a `Dockerfile` to containerize the Node.js application and a `docker-compose.yml` file to run the app along with MongoDB.

### Build and Run the Docker Containers

1. **Build the Docker containers**:

   The app and MongoDB will be built and started using Docker Compose.

   ```bash
   docker-compose build
   ```

2. **Run the Docker containers** (this will start both the Node.js app and MongoDB):

   ```bash
   docker-compose up
   ```

   By default, the app will be available at `http://localhost:5000`.

3. **Stop and remove the Docker containers**:

   When you're done and want to stop the app:

   ```bash
   docker-compose down
   ```

### Accessing the Application

After the Docker containers are up and running, you can test the following endpoints:

- **GET** `/api/v1/groups`: Fetch all security groups.

- **GET** `/api/v1/groups/{groupId}/details`: Fetch a security group by ID.

- **GET** `/api/v1/groups/db`: Fetch all security groups stored in MongoDB.

- **GET** `/api/v1/users`: Fetch all users.

- **GET** `/api/v1/users/:userId/groups`: Fetch all security groups for a partciular userId.

### MongoDB

- The MongoDB instance runs in the background via Docker and is connected to the Node.js app using the `MONGO_URI` variable from the `.env` file.
- If you're running MongoDB outside Docker, just update the `MONGO_URI` in `.env` to point to your MongoDB instance.

## Clean Up

1. **Stop and remove Docker containers**:

   To stop and remove the containers:

   ```bash
   docker-compose down
   ```

2. **Remove any unused Docker images**:

   If you want to completely clean up the environment and remove unused images:

   ```bash
   docker system prune -a
   ```

## Development

1. **Run in development mode**:

   If you'd like to run the app in development mode without Docker:

   ```bash
   # install dependencies
   npm install
   ```

   ```bash
   npm run dev
   ```

   This will start the application with **TypeScript** using **ts-node**.

2. **Build the app**:

   When you're ready to build the app for production:

   ```bash
   npm run build
   ```

3. **Start the app**:

   After building, run the app with:

   ```bash
   npm run start
   ```

## Test

Run the tests with

```bash
npm run test
```

To see test coverage, run the test with

```bash
npm run test:coverage
```

Coverage report can be located at `coverage/lcov-report/index.html`
