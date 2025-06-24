# Assurity - IAM

This is a simple Node.js application that connects to Microsoft Graph API to fetch security groups and stores them in MongoDB.

## Prerequisites

Before you can run the application, make sure you have the following installed:

- Node.js (v18 or later)
- Docker and Docker Compose
- MongoDB instance (if not using Docker)

### Environment Variables

Make sure to set the following environment variables in your `.env` file:

```
CLIENT_ID=<client-id>
CLIENT_SECRET=<client-secret>
TENANT_ID=<tenant-id>
MONGO_URI=mongodb://mongo:27017/<db_name>
PORT=5000
```

These values can be obtained by registering an application in Azure Entra ID (Azure AD) and configuring Microsoft Graph API.

## Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/wxlai90/assurity-iam.git
   cd assurity-iam
   ```

2. **Install dependencies**:

   Since Docker handles the installation of dependencies, there's no need to manually install them. However, if you wish to run the app locally without Docker:

   ```bash
   npm install
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

- **GET** `/api/v1/groups/{groupId}`: Fetch a security group by ID.

- **GET** `/api/v1/groups/db`: Fetch all security groups stored in MongoDB.

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
