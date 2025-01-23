# INF-2900

# React + TypeScript + Vite

# Install Dependencies
npm install
# Start the development server:
npm run dev

# Build for production:
npm run build

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

# Running backend in Docker:

