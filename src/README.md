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

## Running backend tests:
Requires Python 3.8 or higher and pip. It is recommended to use a virtual environment to avoid conflicts with other projects.
If the python3 command is not available, use python instead. If the pip3 command is not available, use pip instead.
1. Change directory to backend `cd /path/to/project/src/backend`
2. (Optional but recommended) Create virtual environment in the backend folder `python3 -m venv ./myenv`
3. (Optional but recommended) Activate the virtual environment 
    - Windows: `./myenv/Scripts/Activate`
    - Linux/MacOS: `source ./myenv/bin/activate`
4. Install the dependencies `pip3 install -r requirements.txt`
5. Run the unit tests `python3 manage.py test backend/tests`
6. Run the feature tests `python3 manage.py test backend/acceptance_tests`


# How to Use the Application

Start by either registering or logging in

If you don't have an account, follow the **Registering an Account** instructions below. If you already have an account, follow the **Logging In** instructions.

### Registering an Account:

1. Click the **Register** button on the landing page.
2. When entering the register page, you can choose the type of registration: either **User** or **Personal Trainer**. Select the appropriate option to proceed with the registration process.
3. Fill in all the fields based on your registration type (**User** or **Personal Trainer**).  
    - **Common Fields**: Provide your **first name**, **last name**, **username**, and **password**.  
    - **For Users**: Enter your **weight** and **height**.  
    - **For Personal Trainers**: Specify your **experience** and **type of trainer**.  
4. Submit the registration form to complete your account creation.  
5. Log in using your newly created credentials (**username** and **password**) when redirected to the login page.  

### Logging In:

1. Click the **Login** button on the landing page.
2. Enter your **username** and **password** on the login page.
3. Click the **Login** button to login to your account.

### For Users:

* **Editing Profile**: When you are authenticated, click on your name or profile image in the top right corner (navbar) to enter the page for editing your profile or adding a profile image.
* **Personal Trainer Selection**: After setting up your account, click on the **Personal Trainers** link in the navbar to navigate to the selection page. 
    1. Use the filtering system to browse trainers by type, name, or alphabetical order. 
    2. Once you find a trainer, click on their profile card and confirm your selection to establish a connection with them. 
    3. When you establish a link to your personal trainer, you will be directed to your dedicated chat room. This allows you to start communicating and collaborating with your trainer right away.
* **Exercise View**: You can view all available exercises by clicking on **Exercises** in the navbar. 
    1. Here, you can browse through various categories such as **Legs**, **Arms**, **Shoulders**, **Back**, **Abdominals**, and **Chest**. 
    2. By clicking on a specific exercise, you can view detailed information with text descriptions and an image illustration to guide you.  
* **Creating Workouts**: You can create workouts by navigating to the dashboard either by clicking **Home** or the **iGym logo**. Once on the dashboard, click on **Create New Workout**.  
    1. Enter the name of the workout you want to create.  
    2. Click **Add Exercises** to add exercises to the workout. This will redirect you to a new page where you can select exercises.  
    3. On the exercise selection page, you can sort exercises by type, name, or alphabetical order.  
    4. After selecting the desired exercises, click **Confirm Selection** to store them in the workout.  
    5. Once you have chosen exercises and named the workout, click **Create Workout** to finalize the workout creation.  
* **Workout Session**: Once a workout is created, you can start logging your workout session related to the workout. Navigate to the dashboard and click **Start** button on the individual workout.  
    1. Inside a workout session, you can log the total amount of reps and weight for each individual set.  
    2. You can also add or remove sets as needed.  
    3. When finished, click **Save Session** to store the session on your dashboard and in your calendar.  
    4. This allows you to easily review your progress over time.  
* **Scheduling Workouts**: You can schedule workouts in your calendar by clicking the **Calendar** link via the navbar, entering the calendar page.  
    1. Select the desired date in the future for your scheduled workout.  
    2. Choose the date/time, and the workout you want to schedule.  
    3. After making your selections, click **Save** to add the workout to your calendar.  
    4. This feature allows you to easily view and manage your upcoming workouts.  
* **View Events**: By navigating to the **Calendar** page, you can view more detailed information about individual events. Click on each event to read more about it, such as:  
    - **1-on-1 sessions with your personal trainer**  
    - **Scheduled workouts**  
    - **Completed workout sessions**  
* **Chat**: You can enter the chat page by clicking the **Chat** link in the navbar. Once on the chat page, you can either select an existing chat room, such as your established chat with your personal trainer, or create a new chat room.  
    - **Creating a New Chat Room**:  
        1. Enter the name of the chat in the sidebar.  
        2. Add participants to the chat by typing their names or using the dropdown menu. Note that you can only add other clients to the chatroom.  
        3. Click **Create Chat Room** to finalize the creation of the chatroom.  
    - **Joining Chat Room**:  
        1. All available chatrooms are listed above the chat creation section, sorted by creation date.  
        2. Click on the desired chatroom, such as your personal trainer chat or a custom-made one with other clients, to enter it.  
    - **Sending Messages or Workouts**:  
        - To send a normal message, type into the text box and click **Send**.  
        - To send a workout:  
            1. Click the **strong bicep emoji**.  
            2. Use the dropdown menu to select the workout you want to send.  
            3. Click **Send Workout** to share it with the chatroom.  
    - **Accepting Workouts**:  
        - Other participants in the chatroom can accept a workout by clicking the **Accept Workout** button. Once accepted, they will also become owners of the workout.  

### For Personal Trainers:

* **Editing Profile**: When you are authenticated, click on your name or profile image in the top right corner (navbar) to enter the page for editing your profile or adding a profile image.
* **Exercise View**: You can view all available exercises by clicking on **Exercises** in the navbar. 
    1. Here, you can browse through various categories such as **Legs**, **Arms**, **Shoulders**, **Back**, **Abdominals**, and **Chest**. 
    2. By clicking on a specific exercise, you can view detailed information with text descriptions and an image illustration to guide you. 
* **Creating Workouts**: You can create workouts by navigating to the dashboard either by clicking **Home** or the **iGym logo**. Once on the dashboard, click on **Create New Workout**.  
    1. Enter the name of the workout you want to create.  
    2. Click **Add Exercises** to add exercises to the workout. This will redirect you to a new page where you can select exercises.  
    3. On the exercise selection page, you can sort exercises by type, name, or alphabetical order.  
    4. After selecting the desired exercises, click **Confirm Selection** to store them in the workout.  
    5. Once you have chosen exercises and named the workout, click **Create Workout** to finalize the workout creation.  
* **Client**: You can view your clients by clicking on the **My Clients** link in the navbar.  
    1. When opening the list, you can click on any of your clients to enter their client page.  
    2. The client page will display a client card with default information about your client.  
    3. Below the client card, you will see the **Client Calendar**, which shows the client's events, such as scheduled workouts, completed sessions, or 1-on-1 sessions with you.    
* **Scheduling 1-on-1 Sessions**: You can schedule 1-on-1 sessions in your calendar by clicking the **Calendar** link via the navbar, entering the calendar page.  
    1. Select the desired date in the future for your 1-on-1 session.   
    2. Choose the date/time, the client, and the workout you want to schedule.  
    3. After making your selections, click **Save** to add the session to your calendar and the client's calendar. 
    4. This feature allows you to easily manage and view your upcoming 1-on-1 sessions with clients.  
* **View Client Events**: By navigating to a **Client** page, you can view more detailed information about individual events. Click on each event to read more about it, such as:  
    - **1-on-1 sessions with you**  
    - **Scheduled workouts**  
    - **Completed workout sessions**  
* **View Own Events**: You can enter the **Calendar** page to view your own events. These are your scheduled 1-on-1 session. Click on each event to read more about it.  
* **Chat**: You can enter the chat page by clicking the **Chat** link in the navbar. Once on the chat page, you can either select an existing chat room, such as your established chats with your clients, or create a new chat room.  
    - **Creating a New Chat Room**:  
        1. Enter the name of the chat in the sidebar.  
        2. Add participants to the chat by typing their names or using the dropdown menu. Note that you can only add other clients to the chatroom.  
        3. Click **Create Chat Room** to finalize the creation of the chatroom.  
    - **Joining Chat Room**:  
        1. All available chatrooms are listed above the chat creation section, sorted by creation date.  
        2. Click on the desired chatroom, such as your client chats or a custom-made one with other clients, to enter it.  
    - **Sending Messages or Workouts**:  
        - To send a normal message, type into the text box and click **Send**.  
        - To send a workout:  
            1. Click the **strong bicep emoji**.  
            2. Use the dropdown menu to select the workout you want to send.  
            3. Click **Send Workout** to share it with the chatroom.  
    - **Accepting Workouts**:  
        - Other participants in the chatroom can accept a workout by clicking the **Accept Workout** button. Once accepted, they will also become owners of the workout.  

