// Import the modules of external crates we want to use in our application
use std::io;
use actix_web::{web, App, HttpServer};
use r2d2::{ConnectionManager, Pool, PooledConnection};
use diesel::pg::PgConnection;
use diesel::r2d2;

// Define the modules (local files in our project) that we want to use in our application
// In Rust you need to explicitly define which files you want to use
// but doing this allows us to use all functions and types defined in the files (except private ones)
mod score;
mod schema;
mod response;

// Define the database pool and pooled connection types
// These are used to manage the database connection pool
// and to get a connection from the pool
pub type DBPool = Pool<ConnectionManager<PgConnection>>;
// The pooled connection type is used to get a connection from the pool
// and to pass the connection to functions that need to interact with the database
// This is a generic type that takes a connection manager as an argument
pub type DBPooledConnection = PooledConnection<ConnectionManager<PgConnection>>;

#[actix_web::main] // This is an attribute that tells the compiler to use the actix runtime, actix is a web framework for Rust that is built on top of tokio (an async runtime)
async fn main() -> io::Result<()> {
    // Start logger
    std::env::set_var("RUST_LOG", "actix_web=info");
    env_logger::init();

    // Set up database connection pool
    // The database connection URL is read from the databse_url environment variable
    // When running in Docker this is automatically set. If running locally you need to set it manually in the .env file.
    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    // Create a connection manager for the database connection
    let manager = ConnectionManager::<PgConnection>::new(database_url);
    // Create a connection pool with the connection manager
    let pool = r2d2::Pool::builder()
        .build(manager)
        .expect("Failed to create pool");

    // Start the HTTP server
    HttpServer::new(move || {
        // Create a new App
        App::new()
            // Add the database connection pool to the App data, this allows us to access the pool from the request handlers
            .app_data(web::Data::new(pool.clone()))
            // Add a logger middleware to the App, this logs all incoming requests
            .wrap(actix_web::middleware::Logger::default())
            // Add the request handlers to the App (these are defined in the score module)
            .service(score::get_scores)
            .service(score::add_score)
            .service(score::get_scores_by_username)
    })
    // Bind the server to port 8080
    .bind("0.0.0.0:8080")?
    // Start the server
    .run()
    // Wait for the server to finish, this is needed because the server runs in an async runtime
    .await
}
