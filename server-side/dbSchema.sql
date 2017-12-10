CREATE DATABASE book_club;
USE book_club;

CREATE TABLE app_users (
    userId integer not null AUTO_INCREMENT,
    username VARCHAR(255) unique not null,
    password VARCHAR(255) not null,
    email VARCHAR(255) unique not null,
    currentVoteUsed boolean not null,
    bookQueued boolean not null,
    queuedISBN VARCHAR(255) unique,
    preferenceColor text,
    preferencePicture VARCHAR(255),
    PRIMARY KEY (userId)
);

CREATE TABLE app_favorites_list (
    favoriteId integer not null AUTO_INCREMENT,
    isbn VARCHAR(255) not null,
    userId integer not null,
    PRIMARY KEY (favoriteId),
    FOREIGN KEY (userId) references app_users(userId)
);

CREATE TABLE app_current_book (
    isbn VARCHAR(255) not null
);

CREATE TABLE app_voting_list (
    votingId integer not null AUTO_INCREMENT,
    isbn VARCHAR(255) unique not null,
    votes integer not null,
    userId integer not null,
    PRIMARY KEY (votingId),
    FOREIGN KEY (userId) references app_users(userId)
);

CREATE USER 'app'@'localhost' IDENTIFIED BY 'PB1234';
GRANT ALL PRIVILEGES ON * . * TO 'app'@'localhost';
FLUSH PRIVILEGES;