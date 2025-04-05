FROM nginx:alpine

# Remove the default configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy in our custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf