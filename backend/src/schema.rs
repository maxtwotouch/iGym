// @generated automatically by Diesel CLI.

diesel::table! {
    scores (id) {
        id -> Int4,
        username -> Text,
        score -> Int4,
    }
}
