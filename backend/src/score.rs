// Imports from external crates
use actix_web::web::Data;
use actix_web::{get, post, web, HttpResponse, Responder};
use serde::{Serialize, Deserialize};
use diesel::{ExpressionMethods, Insertable, Queryable, RunQueryDsl};
use diesel::query_dsl::methods::{FilterDsl, LimitDsl, OrderDsl};

// Imports from our own modules
use super::{DBPool, DBPooledConnection};
use super::schema::scores;
use super::response::Response;

// Define a general scores type
// We use this is wrap a list of scores in a JSON object
// which makes it easier to return the scores from the API
pub type Scores = Response<Score>;

// Define a general score struct
#[derive(Debug, Serialize, Deserialize)]
pub struct Score {
    pub id: i32,
    pub username: String,
    pub score: i32,
}

// Implement functions to create a new score and convert a score to a database score
impl Score {
    pub fn new(username: String, score: i32) -> Score {
        Self {
            id: 0,
            username,
            score
        }
    }

    pub fn to_score_db(&self) -> ScoreDB {
        ScoreDB {
            id: self.id,
            username: self.username.clone(),
            score: self.score
        }
    }
}

// Define a score struct for the database, this must fully match the database schema,
// derive Queryable and Insertable to allow diesel to interact with the database,
// and define the table name to match the table in the database.
// We use this struct when interacting with the database, so it is essentially just 
// a type that represents a score in the database. When we have recieved it from the 
// database we can convert it to a general score struct.
#[derive(Queryable, Insertable)]
#[diesel(table_name = scores)]
pub struct ScoreDB {
    pub id: i32,
    pub username: String,
    pub score: i32,
}

// Implement a function to convert a database score to a general score
impl ScoreDB {
    fn to_score(&self) -> Score {
        Score {
            id: self.id,
            username: self.username.clone(),
            score: self.score
        }
    }
}

// Define a new score struct, this is used to insert a new score into the database
// We need to differntiate between the NewScore and ScoreDB structs as the NewScore struct
// does not have an id field. We use the SERIAL type in the database schema which will automatically
// generate an ID for every new score we insert. Thus we do not need to provide an ID when inserting.
// Actually, providing an ID will stop the ID from being generated automatically by the DBMS, which 
// usually leads to all insertions being written to ID 0.
#[derive(Queryable, Insertable)]
#[derive(Debug, Serialize, Deserialize)]
#[table_name = "scores"]
pub struct NewScore {
    pub username: String,
    pub score: i32,
}

// Implement a function to convert a new score to a score
impl NewScore {
    pub fn to_score(&self) -> Score {
        Score::new(self.username.clone(), self.score)
    }
}

// Function to list x number of top scores
fn list_scores(number_of_scores: i64, conn: &mut DBPooledConnection) -> Result<Scores, diesel::result::Error> {
    // Use the scores table
    use crate::schema::scores::dsl::*;

    // Get the x highest scores by creating a quary that:
    // 1. Orders the scores by score in descending order
    // 2. Limits the number of scores to x
    // Then we send the query to the database and get the results
    let _scores = match scores
        .order(score.desc())
        .limit(number_of_scores)
        .load::<ScoreDB>(conn) 
        {
            Ok(s) => s,
            Err(_) => Vec::new()
        };

    // If we successfully get the scores from the database we convert them to a general score struct and return them
    Ok(Scores {
        results: _scores.iter().map(|s| s.to_score()).collect()
    })
}

// Function to create a new score
fn create_score(new_score: NewScore, conn: &mut DBPooledConnection) -> Result<ScoreDB, diesel::result::Error> {
    use crate::schema::scores::dsl::*;

    // Insert the new score into the database and get the result,
    // we want the result so that we can return it to the user
    // for debugging purposes
    let ret: ScoreDB = diesel::insert_into(scores).values(&new_score).get_result(conn)?;

    // return the result
    Ok(ret)
}

// Function to list all scores by a user
fn list_scores_by_username(name: String, conn: &mut DBPooledConnection) -> Result<Scores, diesel::result::Error> {
    use crate::schema::scores::dsl::*;

    // Get all scores by a user by creating a query that:
    // 1. Filters the scores by username
    // 2. Orders the scores by score in descending order
    // Then we send the query to the database and get the results
    let _scores = match scores
        .filter(username.eq(name))
        .order(score.desc())
        .load::<ScoreDB>(conn) 
        {
            Ok(s) => s,
            Err(_) => Vec::new()
        };

    // If we successfully get the scores from the database we convert them to a general score struct and return them
    Ok(Scores {
        results: _scores.iter().map(|s| s.to_score()).collect()
    })
}

// return a list of top 20 scores
#[get("/scores")] // Adds a route to the web server. This handles GET requests to /scores
pub async fn get_scores(pool: Data<DBPool>) -> impl Responder {
    // Get a connection from the pool
    let mut conn = pool.get().expect("Couldn't get DB connection from pool");
    // Get the 20 highest scores. Need to use block as diesel does not support tokio and will cause blocking of web workers.
    let scores = web::block(move || list_scores(20, &mut conn)).await.unwrap().unwrap();

    // Return the scores
    HttpResponse::Ok().json(scores)
}

// add a new score
#[post("/scores")] // Adds a route to the web server. This handles POST requests to /scores
pub async fn add_score(new_score: web::Json<NewScore>, pool: Data<DBPool>) -> impl Responder {
    // Get a connection from the pool
    let mut conn = pool.get().expect("Couldn't get DB connection from pool");

    // Insert the new score into the database
    // We need to use web::block as diesel does not support tokio and will cause blocking of web workers.
    // Since our new score is wrapped in a web::Json object we need to unwrap it before passing it to the create_score function
    let score = web::block(move || create_score(new_score.into_inner(), &mut conn)).await.unwrap().map(|s| s.to_score());

    // Check if the database operation was successful
    // Return the score if successful, otherwise return a 204 No Content status
    match score {
        Ok(score) => HttpResponse::Created().json(score),
        _ => HttpResponse::NoContent().await.unwrap()
    }
}

// get all scores by a user
#[get("/scores/{username}")] // Adds a route to the web server. This handles GET requests to /scores/{username}
pub async fn get_scores_by_username(username: web::Path<String>, pool: Data<DBPool>) -> impl Responder {
    // Get a connection from the pool
    let mut conn = pool.get().expect("Couldn't get DB connection from pool");

    // Get the 20 highest scores. Need to use block as diesel does not support tokio and will cause blocking of web workers.
    let scores = web::block(move || list_scores_by_username(username.to_string(), &mut conn)).await.unwrap().unwrap();

    // Return the scores
    HttpResponse::Ok().json(scores)
}