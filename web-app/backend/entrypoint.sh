#!/bin/sh
set -e

# Wait for Postgres to be available
echo "Waiting for postgres..."
while ! nc -z $POSTGRES_HOST $POSTGRES_PORT; do
  sleep 0.5
done
echo "Postgres is up - executing commands"

# Run migrations and collect static files
python manage.py migrate --noinput
python manage.py collectstatic --noinput

# Only load fixture data if marker file doesn't exist
if [ ! -f /app/seeded/loaddata_done.txt ]; then
  echo "Loading fixture data..."
  python manage.py loaddata exercises.json
  # Create marker file to prevent reloading in the future
  mkdir -p /app/seeded && touch /app/seeded/loaddata_done.txt
else
  echo "Fixture data already loaded; skipping loaddata."
fi

# Start Gunicorn server
exec gunicorn --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000 backend.asgi:application
