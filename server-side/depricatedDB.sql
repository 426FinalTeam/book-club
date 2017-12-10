CREATE DATABASE book_club;
USE book_club;

CREATE TABLE app_users (
    username VARCHAR(255) unique references favorites_list(username),
    password text,
    userId integer not null AUTO_INCREMENT,
    currentVoteUsed boolean,
    bookQueued boolean,
    queuedISBN VARCHAR(255) unique,
    email VARCHAR(255) unique,
    PRIMARY KEY (userId),
    FOREIGN KEY (userId) references user_preferences(userId)
);

CREATE TABLE user_preferences (
    userId integer not null references app_users(userId),
    preferenceId integer not null AUTO_INCREMENT,
    PRIMARY KEY (userId),
    FOREIGN KEY (preferenceId) references preferences(preferenceId)
);
CREATE TABLE preferences (
    preferenceId integer not null references user_preferences(preferenceId),
    color text,
    fontSize integer,
    emailAlerts boolean,
    PRIMARY KEY (preferenceId)
);

CREATE TABLE favorites_list (
    isbn text,
    name text,
    author text,
    username text references app_users(username)
)



CREATE TABLE app_current_book (
    isbn text
);
CREATE TABLE app_voting_list (
    isbn VARCHAR(255) unique,
    numberOfVotes integer,
    recommendedBy VARCHAR(255) unique
);

CREATE USER 'app'@'localhost' IDENTIFIED BY 'PB1234';
GRANT ALL PRIVILEGES ON * . * TO 'app'@'localhost';
FLUSH PRIVILEGES;