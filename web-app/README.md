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

# Running in Docker:
Docker is used for the production environment. It consists of 5 services:
1. Nginx: A web server that serves the frontend and proxies requests to the backend. All traffic goes through Nginx. This only exposes port 80 and 443 to the outside world, and all HTTP requests are redirected to HTTPS. Also serves all static and media files from the Django app. This is done to reduce the load on the Django server and to allow for caching of static files.
2. Frontend: React app served by react-router. Utilizes SSR (Server Side Rendering) for better SEO and performance.
3. Backend: Django app that serves the API and handles the database. Uses gunicorn as the WSGI server. And gunicorn with uvicorn workers for ASGI (Asynchronous Server Gateway Interface) to handle websockets.
4. Redis: A caching server that is used by Django channels to handle websockets. More performance and scalability than using in-memory caching. Also used by Django to cache data and sessions storage. This is done to reduce the load on the database and to allow for caching of data.
5. Postgres: A database server that is used by Django to store data. It is a relational database that is used to store the data for the app. Again, more performance and scalability than using SQLite. Uses a volume to persist data.

## TODOs for docker:
- [ ] Find a way to handle SSL certificates for Nginx. Currently, it is set to use self-signed certificates. This is not recommended for production use. You can use Let's Encrypt to get free SSL certificates. This is a bit tricky to set up, but there are many tutorials online. You can also use a reverse proxy like Traefik or Caddy to handle SSL certificates automatically.
- [ ] When a new Postgres database is created (empty), we want to migrate the database automatically. We then also want to fill the database with some initial data. This is done by running the `python manage.py migrate` and `python manage.py loaddata exercises.json`. Potentially a CI/CD issue.
- [ ] Set up CI/CD for automatic deployment to Heroku, with traffic routed through Cloudflare.

## Running frontend and backend in docker production environment:
- Build the production docker images and run the containers detached `docker compose up -d --build`
- To stop the containers, run `docker compose down`

## Endpoints:
Requests to https://your-server/ (root) get proxied to the frontend.
Requests to https://your-server/api/... get proxied to Django.
Requests to https://your-server/ws/... get proxied to Django channels. (websockets).
Requests to https://your-server/static/... get proxied to the static files served by Django.
Requests to https://your-server/media/... get proxied to the media files served by Django.