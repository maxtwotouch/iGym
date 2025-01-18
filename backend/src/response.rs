use serde::{Deserialize, Serialize};

// Create a general response struct that can be used to return a list of results
// We use this to wrap the results of a query in a JSON object
#[derive(Debug, Deserialize, Serialize)]
pub struct Response<T> {
    pub results: Vec<T>,
}

// Implement a function to create a new empty response
impl<T> Response<T> {
    pub fn new() -> Self {
        Self { results: vec![] }
    }
}