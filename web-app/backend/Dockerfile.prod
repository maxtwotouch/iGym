# Choose a lightweight base image
FROM python:3.10-slim

# Environment variables to avoid Python buffering and .pyc files
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# System dependencies (adjust as needed for your project)
RUN apt-get update && \
    apt-get install -y build-essential && \
    rm -rf /var/lib/apt/lists/*

# Create the app directory inside the image
WORKDIR /app

# Copy requirements first to leverage Docker caching
COPY requirements.txt /app/

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your Django code
COPY . /app/

# Collect static files for production
RUN python manage.py collectstatic --noinput

# Expose port 8000 for Gunicorn
EXPOSE 8000

# Start Gunicorn (adjust "myproject" to match your Django project name)
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "backend.wsgi:application"]