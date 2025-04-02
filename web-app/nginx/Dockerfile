FROM nginx:alpine

# Remove the default server block
RUN rm /etc/nginx/conf.d/default.conf

# Copy your custom server config into conf.d
COPY nginx.conf /etc/nginx/conf.d/default.conf