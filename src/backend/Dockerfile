# Choose a lightweight base image
FROM python:3.10-slim

# Environment variables to avoid Python buffering and .pyc files
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# System dependencies for building Python packages
RUN apt-get update && \
    apt-get install -y build-essential netcat-openbsd && \
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

# Give ownership of the app directory to the non-root user
RUN chown -R appuser:appuser /app

# Create directories for staticfiles and media, then give ownership to appuser
RUN mkdir -p /app/staticfiles /app/media && chown -R appuser:appuser /app/staticfiles /app/media
# Create directory for seeded volumes and give ownership to appuser
RUN mkdir -p /app/seeded && chown -R appuser:appuser /app/seeded

# Copy the entrypoint script and make it executable
COPY entrypoint.sh /app/
RUN chmod +x /app/entrypoint.sh

# Switch to non-root user
USER appuser

# Set the entrypoint to the script
ENTRYPOINT ["/app/entrypoint.sh"]