#!/bin/sh

# Use Let's Encrypt cert if available, otherwise fallback to self-signed
if [ -f "/etc/letsencrypt/live/igym.vikingthe.dev/fullchain.pem" ]; then
    ln -sf /etc/letsencrypt/live/igym.vikingthe.dev/fullchain.pem /etc/ssl/certs/certificate.crt
    ln -sf /etc/letsencrypt/live/igym.vikingthe.dev/privkey.pem /etc/ssl/private/certificate.key
    echo "Using Let's Encrypt certificates"
else
    cp /etc/ssl/backup/fallback.crt /etc/ssl/certs/certificate.crt
    cp /etc/ssl/backup/fallback.key /etc/ssl/private/certificate.key
    echo "Using self-signed fallback certificates"
fi

# Start nginx
exec nginx -g "daemon off;"