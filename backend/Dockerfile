## Builds and runs the backend service
## It installs tools needed to interact with the Database (Diesel CLI), and builds the backend service
## The process is designed to be layered, so that dependencies are cached and only rebuilt when necessary

# ============================================
# 1) Builder image
# ============================================
FROM rust:1.82.0 AS builder

WORKDIR /backend

# Copy Cargo files first
COPY Cargo.toml Cargo.lock ./

# Create a dummy main.rs to cache dependency builds
RUN mkdir src && echo "fn main() {}" > src/main.rs

# Pre-build dependencies (cached layer)
RUN cargo build --release

# Now copy the real source
RUN rm -rf src
COPY src src

# We want to install Diesel CLI to run migrations at build time
RUN cargo install diesel_cli --no-default-features --features postgres

# Final build of your actual application
RUN cargo build --release

# ============================================
# 2) Runtime image
# ============================================
FROM debian:bookworm-slim AS runtime

# Install runtime dependencies: libpq (PostgreSQL client libs), CA certificates
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
       libpq5 \
       ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Copy the compiled binary from builder
COPY --from=builder /backend/target/release/backend /usr/local/bin/backend

# Copy diesel to run diesel commands at runtime:
COPY --from=builder /usr/local/cargo/bin/diesel /usr/local/bin/diesel

# Copy migrations
COPY migrations /app/migrations

WORKDIR /app
EXPOSE 8080

# Default CMD (overridden by docker-compose command if specified there)
CMD ["/usr/local/bin/backend"]