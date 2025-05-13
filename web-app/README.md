# Running the project in Docker:
Docker is configured as a production environment, and is the preferred way to run the project. It consists of 5 services:
1. Nginx: Reverse proxy into our internal Docker network, and handles SSL termination. By only exposing port 80 and 443 to the outside (outside of Docker) we funnel all traffic to our application through Nginx. By also redirecting all HTTP requests to HTTPS we force all network traffic to and from out application to use HTTPS. Also serves all static and media files from the Django app. This is done to reduce the load on the Django server and to allow for caching of static files.
2. Frontend: React app served by react-router. Utilizes SSR (Server Side Rendering) for better SEO and initial load performance.
3. Backend: Django app that serves the API and handles the database. Uses gunicorn as the application server, with uvicorn workers to handle both HTTP and WebSocket requests.
4. Redis: An in-memory key-value store that is used to cache data in Django. This is done to reduce the load on the database and potentially speed up the application. Also used by Django channels to handle websockets. More performance and scalability than using in-memory caching.
5. Postgres: A relational database that is used to store the data for the app. Again, more performance and scalability than using SQLite. Uses a volume to persist data.

Comes with self-signed SSL certificates for localhost, which need to be trusted in the browser. To host on a domain, SSL certificates need to be generated and added to the Nginx configuration.

## Prerequisites:
- Docker and Docker Compose installed. Follow the instructions on the [Docker website](https://docs.docker.com/get-docker/) to install Docker and Docker Compose.

## Running frontend and backend in docker production environment:
For the Docker compose commands it might be necessary to use `sudo` depending on your system configuration.
- Change directory to the `src` folder in the root of the project `cd /path/to/project/src`
- Build the production docker images and run the containers detached `docker compose up -d --build` (Older versions of Docker may use the command `docker-compose` instead of `docker compose`)
- To stop the containers, run `docker compose down`

## Endpoints:
Requests to https://your-server/ (root) get proxied to the frontend.
Requests to https://your-server/api/... get proxied to Django.
Requests to https://your-server/ws/... get proxied to Django channels. (websockets).
Requests to https://your-server/static/... will be served by Nginx.
Requests to https://your-server/media/... will be served by Nginx.

# Running the project locally:
The project can be run locally without Docker. This is useful for development and testing purposes. When ran locally the application only consists of the frontend and backend.
The frontend is served on port 5173 and the backend is served on port 8000. 
Things to note: 
- When running locally, Django will use SQLite as the database. This is not recommended for production, but it is fine for development and testing purposes.
- All traffic will go through HTTP. This is not recommended for production, but it is fine for development and testing purposes.
- The frontend will run in development mode, which means that it will use hot reloading and debug tools are active. This is not recommended for production, but it is fine for development and testing purposes.
- The backend will run using Django's built-in development server. This is not recommended for production, but it is fine for development and testing purposes.
- When running locally the Redis cache is not available, so the application will use Django's in-memory cache.

## Running backend locally:
Requires Python 3.8 or higher and pip. It is recommended to use a virtual environment to avoid conflicts with other projects.
If the python3 command is not available, use python instead. If the pip3 command is not available, use pip instead.
1. Change directory to backend `cd /path/to/project/src/backend`
2. (Optional but recommended) Create virtual environment in the backend folder `python3 -m venv ./myenv`
3. (Optional but recommended) Activate the virtual environment 
    - Windows: `./myenv/Scripts/Activate`
    - Linux/MacOS: `source ./myenv/bin/activate`
4. Install the dependencies `pip3 install -r requirements.txt`
5. Create and migrate the database `python3 manage.py migrate`
6. Load the initial data `python3 manage.py loaddata exercises.json users.json`
7. Run the server `python3 manage.py runserver`
8. When finished, stop the server `Ctrl + C` in the terminal where the server is running.
9. (Optional but recommended) Deactivate the virtual environment `deactivate`
10. (Optional but recommended) Delete the virtual environment `rm -rf ./myenv` (Linux/MacOS) or `rmdir /s /q myenv` (Windows)

## Running frontend locally:
Requires Node.js and npm installed. Follow the instructions on the [Node.js website](https://nodejs.org/en/download/) to install Node.js and npm.
1. Change directory to frontend `cd /path/to/project/src/frontend`
2. Install the dependencies `npm install --save-dev`
3. Start the development server `npm run dev`
4. Open the browser and go to `http://localhost:5173/` (Requires the backend to be running on port 8000)
5. When finished, stop the server `Ctrl + C` in the terminal where the server is running.


# How to Use the Application

Start by either **registering** or **logging in** using the navigation bar.

You can register as either a **User** or a **Personal Trainer**.

### For Users:

* After logging in, visit your **Profile** page (via the navbar) to update your personal information and upload a profile picture.
* Start by **selecting a personal trainer** and initiate a chat with them.
* You can then create workouts and schedule them in your personal calendar.
* Once a workout is created, you can **start it directly from the dashboard**, and it will appear in your calendar.
* After completing a workout, it will be marked as completed and remain visible both on the dashboard and in the calendar.
* Click on events in the calendar to view more detailed information.

### For Personal Trainers:

* After logging in, your dashboard will display your current clients.
* You can **chat with clients**, **create workouts**, and **send workouts directly to them**.
* From your personal calendar, you can also **schedule 1-on-1 sessions**, which will automatically appear in both your own calendar and the client’s calendar.
* To view a client’s calendar, select them from the **Clients** dropdown in the navbar.

All users can update their profile information and upload a personal profile picture at any time by navigating to the **Profile** page via the navbar.
