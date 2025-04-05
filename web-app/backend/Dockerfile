# Choose a lightweight base image
FROM python:3.10-slim

# Environment variables to avoid Python buffering and .pyc files
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# System dependencies for building Python packages
RUN apt-get update && \
    apt-get install -y build-essential && \
    rm -rf /var/lib/apt/lists/*

# Create and use a non-root user for security
RUN adduser --disabled-password --gecos "" appuser
WORKDIR /app

# Copy requirements early to leverage Docker caching
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the Django application code
# This is done after installing dependencies to take advantage of Docker caching
COPY . /app/

# Run static file collection and migrations (consider moving these to a deploy script in production)
RUN python manage.py collectstatic --noinput
RUN python manage.py migrate

# Switch to non-root user
USER appuser

# Start Gunicorn server
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "backend.wsgi:application"]