# INF-2900

# Running backend locally:
1. Change directory to backend `cd backend`
1. Create virtual environment in the backend folder `python -m venv ./`
2. Activate the virtual environment 
    - Windows: `.\Scripts\Activate`
    - Linux/MacOS: `source ./bin/activate`
    - To ensure the venv is active, run `python3 env_checker.py`, which will tell you if it is running in a virtual environment
3. Install the dependencies `pip install -r requirements.txt`
4. Run the server `python3 manage.py runserver 0.0.0.0:8000`
5. When finished, deactivate the virtual environment `deactivate`

# Running frontend locally:
1. Change directory to frontend `cd frontend`
2. Install the dependencies `npm install`
3. Start the development server `npm run dev`
4. Open the browser and go to `http://localhost:3000/`

# Running frontend and backend in docker development environment:
1. Run `docker-compose -f docker-compose.test.yml up --build`
2. Frontned is running on `http://localhost:3000/`, backend is running on `http://localhost:8000/`

The development environment is now running in docker. The frontend is running on port 3000 and the backend is running on port 8000.
It is set up to mount the frontend and backend folders, so changes to the code will be reflected in the docker containers.
If changes are made to dependencies (npm or pip), the containers must be rebuilt with `docker compose -f docker-compose.test.yml up -d --build`.

To run just one of the services, use `docker compose -f docker-compose.test.yml up frontend -d` or `docker -f docker-compose.test.yml compose up backend -d`. (with the `--build` flag if needed)

To stop the containers, run `docker -f docker-compose.test.yml compose down`

# Running frontend and backend in docker production environment:
1. Build the production docker images `docker compose -f docker-compose.prod.yml --build`
2. Run (detached) the containers `docker compose -f docker-compose.prod.yml up -d`

React-router (the frontend service) listens internally on 3000.
Django (the backend service) listens internally on 8000. (Running with gunicorn)
Nginx listens on 80 and 443.
Requests to https://your-server/ (root) serve the React-router app.
Requests to https://your-server/api/... get proxied to Django.
Http requests are redirected to https.

To stop the containers, run `docker compose -f docker-compose.prod.yml down`