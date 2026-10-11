CREATE TABLE games (id INTEGER PRIMARY KEY, date DATE UNIQUE NOT NULL);

CREATE TABLE rounds (
    round_id INTEGER, 
    game_id INTEGER, 
    year INTEGER NOT NULL, 
    map TEXT NOT NULL, 
    description TEXT, 
    PRIMARY KEY(game_id, round_id), 
    FOREIGN KEY(game_id) REFERENCES games(id) ON DELETE CASCADE
);