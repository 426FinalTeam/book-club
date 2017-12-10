var express = require('express');
var router = express.Router();

var path = require('path');
var Db = require('./db.js');
var db = new Db();

var cycleStartDate = null;

//API calls
//GET calls
router.get('/', function (req, res, next) {
    res.status(200).sendFile(path.join(__dirname + '/../client-side/index.html'));
});
router.get('/getUser', function (req, res, next) {
    if (req.session.loggedIn && req.session.loggedIn != null) {
        //returns information about a user
        var username = req.session.loggedIn;
        db.getUserInfo(username, function (result) {
            if (result == null) {
                res.status(404).send({
                    'msg': 'Error: username is not in database',
                    'username': username
                });
            }
            else {
                var userInfo = {
                    'username': result[0].username,
                    'email': result[0].email,
                    'currentVoteUsed': result[0].currentVoteUsed,
                    'bookQueued': result[0].bookQueued,
                    'queuedISBN': result[0].queuedISBN,
                    'preferences':
                        {
                            'color': result[0].preferenceColor,
                            'picture': result[0].preferencePicture,
                        }

                }
                db.getUserFavoritesList(username, function (favorites) {
                    if (favorites == null) {
                        userInfo.favorites = null;
                    } else {
                        var faves = [];
                        for (var i = 0; i < favorites.length; i++) {
                            faves.push(favorites[i].isbn);
                        }
                        userInfo.favorites = faves;
                    }
                    res.status(200).send(userInfo);
                });
            }
        });
    } else {
        res.status(401).sendFile(path.join(__dirname + '/../client-side/index.html'));
    }
});
router.get('/getUsers', function (req, res, next) {
    if (req.session.loggedIn && req.session.loggedIn != null) {
        //returns array of all usernames
        db.getUsers(function (result) {
            if (result == null) {
                res.status(404).send('Error: no users are in the database');
            }
            else {
                var users = [];
                for (var i = 0; i < result.length; i++) {
                    users.push({
                        'username': result[i].username,
                        'picture': result[i].preferencePicture
                    });
                }
                res.status(200).send(users);
            }
        });
    } else {
        res.status(401).sendFile(path.join(__dirname + '/../client-side/index.html'));
    }
});
router.get('/getCurrentBook', function (req, res, next) {
    if (req.session.loggedIn && req.session.loggedIn != null) {
        //returns the current book isbn, if there is no current book returns null
        db.getCurrentBook(function (result) {
            var isbn = null;
            if (result != null) {
                isbn = result[0].isbn;
            }
            res.status(200).send(isbn);
        });
    } else {
        res.status(401).sendFile(path.join(__dirname + '/../client-side/index.html'));
    }
});
router.get('/getVotingBooks', function (req, res, next) {
    if (req.session.loggedIn && req.session.loggedIn != null) {
        //returns array of ISBN numbers of books currently up for voting, if voting list is empty returns null
        db.getVotingList(function (result) {
            var books = [];
            if (result == null) {
                books = null;
            } else {
                for (var i = 0; i < result.length; i++) {
                    books.push({
                        'isbn': result[i].isbn,
                        'votes': result[i].votes,
                        'username': result[i].username
                    });
                }
            }
            res.status(200).send(books);
        });
    } else {
        res.status(401).sendFile(path.join(__dirname + '/../client-side/index.html'));
    }
});
router.get('/getFavorites/:username', function (req, res, next) {
    if (req.session.loggedIn && req.session.loggedIn != null) {
        var username = req.params.username;
        db.getUserFavoritesList(username, function (result) {
            var favorites = null
            if (result != null) {
                var faves = [];
                for (var i = 0; i < result.length; i++) {
                    faves.push(result[i].isbn);
                }
                favorites = faves;
            }
            res.status(200).send(favorites);
        });
    } else {
        res.status(401).sendFile(path.join(__dirname + '/../client-side/index.html'));
    }
});
router.get('/getTime', function (req, res, next) {
    if (req.session.loggedIn && req.session.loggedIn != null) {
        //returns the time left on the clock and whether it is a reading or voting period
        var date = new Date();
        var currentDate = {
            'year': date.getFullYear(),
            'month': date.getMonth() + 1,
            'day': date.getDate(),
            'hour': date.getHours(),
            'minutes': date.getMinutes()
        }
        //check if cycleStartDate has been initialized
        if (cycleStartDate == null) {
            if (currentDate.day < 11) {
                cycleStartDate = {
                    'year': currentDate.year,
                    'month': currentDate.month,
                    'day': 1,
                }
            } else if (currentDate.day < 21) {
                cycleStartDate = {
                    'year': currentDate.year,
                    'month': currentDate.month,
                    'day': 11,
                }
            } else {
                cycleStartDate = {
                    'year': currentDate.year,
                    'month': currentDate.month,
                    'day': 21,
                }
            }
        }
        //check for the first day in the ten day cycle
        if (currentDate.day % 10 == 1) {
            //start 'voting' cycle
            cycleStartDate = {
                'year': currentDate.year,
                'day': currentDate.day,
                'month': currentDate.month
            }
            //delete current book
            db.deleteCurrentBook(function () {
                //return time left in voting cycle
                getEndDate(function (endDate) {
                    res.status(200).send({
                        'time': endDate,
                        'msg': 'new voting period, current book deleted',
                    });
                });
            });
        } else {
            //check if there's a current book yet
            db.getCurrentBook(function (result) {
                if (result == null) {
                    newCurrentBook(function () {
                        //return time left in reading cycle
                        getEndDate(function (endDate) {
                            res.status(200).send({
                                'time': endDate,
                                'msg': 'new current book, voting period happened',
                            });
                        });
                    });
                } else {
                    //check cycle start date to see if a cycle has been completed without any updates
                    if (currentDate.day > cycleStartDate.day + 10 || currentDate.month > cycleStartDate.month || currentDate.year > cycleStartDate.year) {
                        //set new cycle start date and update current book
                        if (currentDate.day < 11) {
                            cycleStartDate = {
                                'year': currentDate.year,
                                'month': currentDate.month,
                                'day': 1,
                            }
                        } else if (currentDate.day < 21) {
                            cycleStartDate = {
                                'year': currentDate.year,
                                'month': currentDate.month,
                                'day': 11,
                            }
                        } else {
                            cycleStartDate = {
                                'year': currentDate.year,
                                'month': currentDate.month,
                                'day': 21,
                            }
                        }
                        //delete current book
                        db.deleteCurrentBook(function () {
                            newCurrentBook(function () {
                                //return time left in reading cycle
                                getEndDate(function (endDate) {
                                    res.status(200).send({
                                        'time': endDate,
                                        'msg': 'New current book, missed voting period',
                                    });
                                });
                            });
                        });
                    } else {
                        //return time left in reading cycle
                        getEndDate(function (endDate) {
                            res.status(200).send({
                                'time': endDate,
                                'msg': 'standard reading cycle time',
                            });
                        });
                    }
                }
            });
        }
    } else {
        res.status(401).sendFile(path.join(__dirname + '/../client-side/index.html'));
    }
});
var newCurrentBook = function (callback) {
    //decide winner
    db.getWinner(function (winningBook) {
        if (winningBook == null) {
            winningBookISBN = '9780132966269';
        } else {
            winningBookISBN = winningBook[0].isbn;
        }
        //add winner to app_current_book in db and empty voting list
        db.newCurrentBook(winningBookISBN, function () {
            return callback();
        });
    });
}
var getEndDate = function (callback) {
    var date = new Date();
    var endCycle = {
        'year': date.getFullYear(),
    }
    if (cycleStartDate.day == 1) {
        endCycle.day = 11;
        endCycle.month = date.getMonth();
    } else if (cycleStartDate.day == 11) {
        endCycle.day = 21;
        endCycle.month = date.getMonth();
    } else {
        if (cycleStartDate.month == 11) {
            endCycle.year = date.getFullYear() + 1;
            endCycle.month = 1;
        } else {
            endCycle.month = date.getMonth() + 1;
        }
        endCycle.day = 1;
    }
    var endDate = new Date(endCycle.year, endCycle.month, endCycle.day, 0, 0, 0).getTime();
    return callback(endDate);
}

//POST calls
router.post('/login', function (req, res, next) {
    //verifies login info with database, sets cookie and returns 200 if good to go
    //expects req.body to have two properties: username and password
    if (req.body.username == undefined || req.body.password == undefined) {
        res.status(400).send('Faulty request, username and password required');
    }
    else {
        var username = req.body.username;
        var password = req.body.password;
    
        db.login(username, password, function (loggedIn) {
            if (loggedIn) {
                //add session date here
                req.session.loggedIn = username;
                res.status(200).send('logged in');
            }
            else {
                res.status(404).send('username and password are not in the database');
            }
        });
    }
});
router.post('/newUser', function (req, res, next) {
    //expects req.body to have three properties: username, password, email
    if (req.body.username == undefined || req.body.password == undefined || req.body.email == undefined) {
        res.status(400).send('Faulty request: username, password, and email required');
    }
    else {
        var username = req.body.username;
        var password = req.body.password;
        var email = req.body.email;
        //validate that usersname is unique
        db.getUsers(function (users) {
            if (users == null) {
                //usersname is not already in the database, ok to add
                db.newUser(username, password, email, function (added, message) {
                    if (added) {
                        //user succesfully added, sign them in and continue
                        //add session data here
                        req.session.loggedIn = username;
                        res.status(200).send('registered and logged in');
                    }
                    else {
                        if (message == 'email') {
                            res.status(409).send('email');
                        } else {
                            res.status(409).send('username');
                        }
                    }
                });
            }
            else {
                for (var i = 0; i < users.length; i++) {
                    if (users[i] == username) {
                        //username is already in the database, send a failure response
                        res.status(409).send('username');
                    }
                    else if (i == users.length - 1) {
                        //usersname is not already in the database, ok to add
                        db.newUser(username, password, email, function (added, message) {
                            if (added) {
                                //user succesfully added, sign them in and continue
                                //add session data here
                                req.session.loggedIn = username;
                                res.status(200).send('registered and logged in');
                            }
                            else {
                                if (message == 'email') {
                                    res.status(409).send('email');
                                } else {
                                    res.status(409).send('username');
                                }
                            }
                        });
                    }
                }
            }
        });
    }
});
router.post('/newVote', function (req, res, next) {
    if (req.session.loggedIn && req.session.loggedIn != null) {
        //expects req.body to have two properties: username and isbn
        if (req.body.username == undefined || req.body.isbn == undefined) {
            res.status(400).send('Faulty request: username and isbn required');
        } else {
            //add a vote to a certain book that matches the isbn number
            //check if user has already voted
            var username = req.body.username;
            var isbn = req.body.isbn;
            db.getUserInfo(username, function (userInfo) {
                if (userInfo == null) {
                    res.status(404).send('user');
                }
                else {
                    if (userInfo[0].currentVoteUsed == 1) {
                        res.status(409).send('Conflict: user has already voted');
                    } else {
                        db.newVote(isbn, username, function (validVote, message) {
                            if (validVote) {
                                res.status(200).send('Vote processed');
                            }
                            else {
                                if (message == 'voting_list') {
                                    res.status(404).send('book not found');
                                }
                                else {
                                    res.status(500).send('DB Error');
                                }
                            }
                        })
                    }
                }
            });
        }
    } else {
        res.status(401).sendFile(path.join(__dirname + '/../client-side/index.html'));
    }
});
router.post('/newBook', function (req, res, next) {
    if (req.session.loggedIn && req.session.loggedIn != null) {
        //expects req.body to have two properties: username and isbn
        if (req.body.username == undefined || req.body.isbn == undefined) {
            res.status(400).send('Faulty request: username and isbn required');
        } else {
            //adds a book to the list of books to be voted on
            var username = req.body.username;
            var isbn = req.body.isbn;
            db.getUserInfo(username, function (userInfo) {
                if (userInfo == null) {
                    res.status(404).send('Username not found');
                } else {
                    if (userInfo[0].bookQueued == 1) {
                        res.status(409).send('user');
                    } else {
                        db.newBook(isbn, username, function (bookAdded, message) {
                            if (bookAdded) {
                                res.status(200).send('Book added');
                            }
                            else {
                                if (message == 'duplicate') {
                                    res.status(409).send('book');
                                } else {
                                    res.status(500).send('DB error');
                                }
                            }
                        });
                    }
                }
            });
        }
    } else {
        res.status(401).sendFile(path.join(__dirname + '/../client-side/index.html'));
    }
});
router.post('/newFavorite', function (req, res, next) {
    if (req.session.loggedIn && req.session.loggedIn != null) {
        //expects req.body to have two properties: username and isbn
        if (req.body.username == undefined || req.body.isbn == undefined) {
            res.status(400).send('Faulty request: username and isbn are required');
        } else {
            var username = req.body.username;
            var isbn = req.body.isbn;
            db.newFavorite(username, isbn, function (added) {
                if (added) {
                    res.status(200).send('Favorite added');
                } else {
                    res.status(500).send('Server error :(');
                }
            });
        }
    } else {
        res.status(401).sendFile(path.join(__dirname + '/../client-side/index.html'));
    }
});
router.post('/updatePreferences', function (req, res, next) {
    if (req.session.loggedIn && req.session.loggedIn != null) {
        //expects req.body to have properties: username, type and color || username, type and picture
        if (req.body.username == undefined || req.body.type == undefined || (req.body.color == undefined && req.body.picture == undefined)) {
            res.status(400).send('Faulty request: username, type, and type_info are required');
        } else {
            var username = req.body.username;
            var type = req.body.type;
            if (type == 'color') {
                db.updatePreferenceColor(username, req.body.color, function () {
                    res.status(200).send('New Color');
                });
            } else {
                db.updatePreferencePicture(username, req.body.picture, function () {
                    res.status(200).send('New Profile Picture');
                });
            }
        }
    } else {
        res.status(401).sendFile(path.join(__dirname + '/../client-side/index.html'));
    }
});
router.post('/logout', function (req, res, next) {
    //Remove session data from the client, essentially log them out
    if (req.session.loggedIn && req.session.loggedIn != null) {
        req.session.loggedIn = null;
        res.status(200).send('Logged Out');
    } else {
        res.status(200).send('Already Logged Out');
    }
});
router.post('/delUser', function (req, res, next) {
    if (req.session.loggedIn && req.session.loggedIn != null) {
        //expects req.body to have one property: username
        if (req.body.username == undefined) {
            res.status(400).send('Faulty request: username required');
        }
        else {
            var username = req.body.username;
            //removes a user from the database
            db.deleteUser(username, function (deleted) {
                if (deleted) {
                    //user successfully deleted, remove cookie and tell them to have a nice life
                    req.session.loggedIn = null;
                    res.status(200).send('User account succesfully removed');
                }
                else {
                    res.status(500).send('No deletion occured');
                }
            });
        }
    } else {
        res.status(401).sendFile(path.join(__dirname + '/../client-side/index.html'));
    }
});

module.exports = router;
