# Navigate to backend, and use the docker-compose file to start the backend and database
cd backend
# First shut down the containers (if they are running)
docker compose down
# Then start the containers
docker compose up -d --build

# Navigate to the frontend, and run it in development mode
cd ../frontend
npm run dev