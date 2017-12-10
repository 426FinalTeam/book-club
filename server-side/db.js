var mysql = require('mysql');

var Db = function () {
    //establish connection to the database
    this.connection = mysql.createConnection({
        host: 'localhost',
        user: 'app',
        password: 'PB1234',
        database: 'book_club'
    });
}

//db calls
Db.prototype.getUserInfo = function (username, callback) {
    //validate username
    //query database for username, return accompanying info in JSON
    this.connection.query("SELECT username,email,currentVoteUsed,bookQueued,queuedISBN,preferenceColor,preferencePicture FROM app_users WHERE username = '" + username + "';", function (err, results, fields) {
        if (err) shutdown();
        else {
            //if results is empty, no user was found
            if (results.length == 0) {
                return callback(null);
            }
            else {
                //return data
                return callback(results);
            }
        }
    });
}
Db.prototype.getUsers = function (callback) {
    //query database for list of usernames, return as an array
    this.connection.query("SELECT username, preferencePicture FROM app_users ORDER BY userId;", function (err, results, fields) {
        if (err) shutdown();
        else {
            //if results is empty, no users in db
            if (results.length == 0) {
                return callback(null);
            }
            else {
                return callback(results);
            }
        }
    });
}
Db.prototype.getUserFavoritesList = function (username, callback) {
    this.connection.query("SELECT isbn FROM app_favorites_list WHERE userId = (SELECT userId FROM app_users WHERE username = '" + username + "') ORDER BY isbn;", function (err, results, fields) {
        if (err) shutdown();
        else {
            //if results is empty, no favorites for that user
            if (results.length == 0) {
                return callback(null);
            } else {
                return callback(results);
            }
        }
    });
}
Db.prototype.getCurrentBook = function (callback) {
    //query database for current book, return isbn number or null
    this.connection.query("SELECT isbn FROM app_current_book;", function (err, results, fields) {
        if (err) shutdown();
        else {
            //if results is empty, no current book in db
            if (results.length == 0) {
                return callback(null);
            }
            else {
                return callback(results);
            }
        }
    });
}
Db.prototype.getVotingList = function (callback) {
    //query database for list of books in the voting queue (array of ISBNs)
    this.connection.query("SELECT isbn,votes,username FROM app_voting_list JOIN app_users ON app_voting_list.userId = app_users.userId ORDER BY isbn;", function (err, results, fields) {
        if (err) shutdown();
        else {
            //if results is empty, voting list is empty
            if (results.length == 0) {
                return callback(null);
            }
            else {
                return callback(results);
            }
        }
    });
}
Db.prototype.getWinner = function (callback) {
    //query for the book with the most vote in the db
    this.connection.query("SELECT isbn FROM app_voting_list ORDER BY votes DESC LIMIT 1;", function (err, results, fields) {
        if (err) shutdown();
        else {
            if (results.length == 0) {
                return callback(null);
            } else {
                return callback(results);
            }
        }
    })
}
Db.prototype.login = function (username, password, callback) {
    //query database for valid (decoded) username and password, return true or false
    this.connection.query("SELECT 1 FROM app_users WHERE username='" + username + "' AND password='" + password + "';", function (err, results, fields) {
        if (err) shutdown();
        else {
            //if results is empty, username and password aren't in database
            if (results.length == 0) {
                return callback(false);
            }
            else {
                return callback(true);
            }
        }
    });
}
Db.prototype.newUser = function (username, password, email, callback) {
    //add new user to database, return true upon sucessful add
    this.connection.query("INSERT INTO app_users (username, password, email, currentVoteUsed, bookQueued, preferenceColor, preferencePicture) VALUES ('" + username + "', '" + password + "', '" + email + "', false, false, '#7825BE', NULL);", function (err, results, fields) {
        if (err) {
            if (err.code == 'ER_DUP_ENTRY') {
                //duplicate, return failure
                var message = err.message.split(/'/);
                if (message[message.length - 2] == 'email') {
                    return callback(false, 'email');
                } else {
                    return callback(false, 'username');
                }
            }
            else {
                shutdown();
            }
        }
        else {
            //send success
            return callback(true, null);
        }
    });
}
Db.prototype.newVote = function (isbn, username, callback) {
    //add a new vote to isbn number in question
    var currentConnection = this.connection;
    currentConnection.query("UPDATE app_voting_list SET votes=(votes+1) WHERE isbn='" + isbn + "';", function (err, results, fields) {
        if (err) shutdown();
        else {
            if (results.changedRows != 1) {
                return callback(false, 'voting_list');
            } else {
                currentConnection.query("UPDATE app_users SET currentVoteUsed=true WHERE username='" + username + "';", function (err, results, fields) {
                    if (err) shutdown();
                    else {
                        if (results.changedRows != 1) {
                            return callback(false, 'user');
                        } else {
                            return callback(true, null);
                        }
                    }
                });
            }
        }
    });
}
Db.prototype.newBook = function (isbn, username, callback) {
    //add a new book to the voting list
    var currentConnection = this.connection;
    currentConnection.query("INSERT INTO app_voting_list (isbn, votes, userId) VALUES ('" + isbn + "', 0, (SELECT userId FROM app_users WHERE username='" + username + "'));", function (err, results, fields) {
        if (err) {
            if (err.code == 'ER_DUP_ENTRY') {
                return callback(false, 'duplicate');
            }
            else {
                shutdown();
            }
        } else {
            currentConnection.query("UPDATE app_users SET bookQueued=true, queuedISBN = '" + isbn + "' WHERE username = '" + username + "';", function (err, results, fields) {
                if (err) shutdown();
                else {
                    if (results.changedRows != 1) {
                        return callback(false, 'user');
                    } else {
                        return callback(true, null);
                    }
                }
            });
        }
    });
}
Db.prototype.newFavorite = function (username, isbn, callback) {
    //add a new favorite to the favorites list
    //check if user & isbn combo are already in the db
    var currentConnection = this.connection;
    currentConnection.query("SELECT * FROM app_favorites_list WHERE isbn='" + isbn + "' AND userId=(SELECT userId FROM app_users WHERE username='" + username + "');", function (err, results, fields) {
        if (err) shutdown();
        else {
            //if result is not empty, combination is already in db, return false
            if (results.length != 0) {
                return callback(false);
            } else {
                currentConnection.query("INSERT INTO app_favorites_list (isbn, userId) values ('" + isbn + "', (SELECT userId FROM app_users WHERE username='" + username + "'));", function (err, results, fields) {
                    if (err) shutdown();
                    else {
                        //success
                        return callback(true);
                    }
                });
            }
        }
    });
}
Db.prototype.newCurrentBook = function (isbn, callback) {
    //empty voting list, update users, and add new current book
    var currentConnection = this.connection;
    currentConnection.query("DELETE FROM app_voting_list;", function (err, results, fields) {
        if (err) shutdown();
        else {
            currentConnection.query("UPDATE app_users SET currentVoteUsed=false, bookQueued=false, queuedISBN=NULL;", function (err, results, fields) {
                if (err) shutdown();
                else {
                    //insert new current book
                    currentConnection.query("INSERT INTO app_current_book (isbn) VALUES ('" + isbn + "');", function (err, results, fields) {
                        if (err) shutdown();
                        else {
                            return callback();
                        }
                    });
                }
            });
        }
    });
}
Db.prototype.updatePreferenceColor = function (username, color, callback) {
    this.connection.query("UPDATE app_users SET preferenceColor='" + color + "' WHERE username = '" + username + "';", function (err, results, fields) {
        if (err) shutdown();
        else {
            return callback();
        }
    });
}
Db.prototype.updatePreferencePicture = function (username, picture, callback) {
    this.connection.query("UPDATE app_users SET preferencePicture='" + picture + "' WHERE username = '" + username + "';", function (err, results, fields) {
        if (err) shutdown();
        else {
            return callback();
        }
    });
}
Db.prototype.deleteUser = function (username, callback) {
    //remove user from database
    var currentConnection = this.connection;
    currentConnection.query("DELETE FROM app_favorites_list WHERE userId = (SELECT userId FROM app_users WHERE username='" + username + "');", function (err, results, fields) {
        if (err) shutdown();
        else {
            currentConnection.query("DELETE FROM app_voting_list WHERE userId = (SELECT userId FROM app_users WHERE username = '" + username + "');", function (err, results, fields) {
                if (err) shutdown();
                else {
                    currentConnection.query("DELETE FROM app_users WHERE username ='" + username + "';", function (err, results, fields) {
                        if (err) shutdown();
                        else {
                            if (results.affectedRows != 1) {
                                return callback(false);
                            }
                            else {
                                return callback(true);
                            }
                        }
                    });
                }
            });
        }
    });
}
Db.prototype.deleteCurrentBook = function (callback) {
    this.connection.query("DELETE FROM app_current_book;", function (err, results, fields) {
        if (err) shutdown();
        else {
            return callback();
        }
    });
}

var shutdown = function () {
    console.log("Error: The database is not running properly. Run the app once you get the database back on its feet!");
    //shutdown the app
    process.exit();
}

module.exports = Db;