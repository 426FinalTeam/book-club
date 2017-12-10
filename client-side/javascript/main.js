var user = {};
var votingList = [];
var currentBook = '';
$(document).ready(function () {
  //initial ajax requests
  $.ajax({
    type: "GET",
    url: "http://localhost:3000/getUser",
    success: userInfoHandler,
    error: userInfoErrorHandler
  });
  $.ajax({
    type: "GET",
    url: "http://localhost:3000/getTime",
    success: function (result, status, xhr) {
      if (xhr.status == 200) {
        //start time countdown and get current book
        countDown(result.time);
        $.ajax({
          type: "GET",
          url: "http://localhost:3000/getCurrentBook",
          success: currentBookSuccessHandler,
          error: currentBookErrorHandler
        });
      }
    },
    error: function (xhr, status, error) { 
      if (xhr.status == 401) window.location = '../';
      else alert('getTime Server Error');
    }
  });
  $.ajax({
    type: "GET",
    url: "http://localhost:3000/getVotingBooks",
    success: function (result, status, xhr) {
      votingListSuccessHandler(result, status, xhr);
      //updateVotingList();
    },
    error: votingListErrorHandler
  });
  //Allow user to add current book to favorites
  $("#addToFavorites").click(function () {
    var alreadyFavorited = false;
    if (user.favorites != null) {
      for (var i = 0; i < user.favorites.length; i++) {
        if (user.favorites[i] == currentBook) {
          alreadyFavorited = true;
          break;
        }
      }
    }
    if (alreadyFavorited) {
      $('#addToFavoritesPrompt').text('This book is already in your favorites!');
    } else {
      if (currentBook != null) {
        //Ajax call to add to favorites
        $.ajax({
          type: "POST",
          url: "http://localhost:3000/newFavorite",
          data: { 'username': user.username, 'isbn': currentBook },
          success: favoriteAddSuccessHandler,
          error: favoriteAddErrorHandler
        });
      } else {
        alert('No Current Book to Add');
      }
    }
    $("#addToFavorites").attr('disabled', 'disabled');
  });

  //Toggle the search view when suggestBook button is pressed.
  $("#suggestBook").click(function () {
    $(".exitButton").click();
    $(".centerPanel").toggle();
    $('#suggestBook').addClass('select');
  })

  $('#searchInterface').on('click', '.searchListButton', function () {
    //Suggest book for that user
    var isbn = $(this).attr('value');
    $.ajax({
      type: "POST",
      url: "http://localhost:3000/newBook",
      data: { 'username': user.username, 'isbn': isbn },
      success: newBookSuccessHandler,
      error: newBookErrorHandler
    });

    $("#confirmQueuePopup").css("display", "inline-block");

    $("#popupConfirm").click(function () {
      $("#confirmQueuePopup").css("display", "none");
    });
  });

  $('#votingInterface').on('click', '.votingListButton', function () {
    //add new vote
    var isbn = $(this).attr('value');
    $.ajax({
      type: "POST",
      url: "http://localhost:3000/newVote",
      data: { 'username': user.username, 'isbn': isbn },
      success: newVoteSuccessHandler,
      error: newVoteErrorHandler
    });
  });

  //Toggle vote view when voting button is pressed
  $("#voteOnBook").click(function () {
    if (votingList.length == 0) {
      $('#votingInterfaceHeader').text('No books have been suggested yet!');
    } else if (user.currentVoteUsed == 1) {
      $('#votingInterfaceHeader').text("You've already voted for the next book, but here's the standings:");
    }
    $(".exitButton").click();
    $(".centerPanel2").toggle();
    $('#voteOnBook').addClass('select');
  });

  //Query the google books api for books to then display to the user
  $("#searchbar").on("keydown", function (event) {
    var keyPress;
    if (window.event) {
      keyPress = event.which;
    } else {
      keyPress = event.keyCode;
    }
    if (keyPress == 13) {
      var input = $("#searchbar").val();
      $("#bookList").empty();
      displaySearchResults(input);
    }
  });

  //When either of the exit buttons are pressed, hide popups
  $(".exitButton").click(function () {
    $("#searchInterface").css("display", "none");
    $("#votingInterface").css("display", "none");
    $('#voteOnBook').removeClass('select');
    $('#suggestBook').removeClass('select');
    $("#centerPanel").show();
  });
});

var displayCurrentBook = function () {
  //query google books for current book
  $.ajax({
    url: "https://www.googleapis.com/books/v1/volumes?key=AIzaSyCjpABEQF4pAZ9PNrgioZrt8pGUM5FvNQY&q=isbn:" + currentBook,
    datatype: "json",
    success: function (data) {
      var title = data.items[0].volumeInfo.title;
      var author = data.items[0].volumeInfo.authors[0];
      if (data.items[0].volumeInfo.imageLinks) {
        var thumbnail = data.items[0].volumeInfo.imageLinks.thumbnail;
      }
      $('#currentBookInfo').append('<img src="' + thumbnail + '"><h2 id=title>' + title + '</h2><h3>by ' + author + '</h3>');
    },
    type: 'GET'
  });
}

var displayVotingListResults = function () {
  for (var i = 0; i < votingList.length; i++) {
    var isbn = votingList[i].isbn;
    var username = votingList[i].username;
    var votes = votingList[i].votes;
    getVotingListResult(isbn, username, votes);
  }
}
var getVotingListResult = function (isbn, username, votes) {
  $.ajax({
    url: "https://www.googleapis.com/books/v1/volumes?key=AIzaSyCjpABEQF4pAZ9PNrgioZrt8pGUM5FvNQY&q=isbn:" + isbn,
    datatype: "json",
    success: function (data) {
      var title = data.items[0].volumeInfo.title;
      var author = data.items[0].volumeInfo.authors[0];
      if (data.items[0].volumeInfo.imageLinks) {
        var thumbnail = data.items[0].volumeInfo.imageLinks.thumbnail;
      }
      var listItemString = '<li class="votingListItem centerUlLi-' + user.preferences.hue + '">'
        + '<img src ="' + thumbnail + '">'
        + '<div class="centeringContainer">'
        + '<div class="votingListItem_infoContainer">'
        + '<p>' + title + '</p></br>'
        + '<p>by ' + author + '</p></br>'
        + '<p>Votes:' + votes + '</p></br>'
        + '<p>Suggested by: ' + username + '</p></br>';
      if (user.currentVoteUsed == 0) {
        listItemString = listItemString + '<button class="votingListButton button-' + user.preferences.hue + '" value="' + isbn + '" type=button>Vote</button>';
      }
      listItemString = listItemString + '</li>';
      $("#votingList").append(listItemString);
    },
    type: 'GET'
  });
}

var displaySearchResults = function (input) {
  $.ajax({
    url: "https://www.googleapis.com/books/v1/volumes?key=AIzaSyCjpABEQF4pAZ9PNrgioZrt8pGUM5FvNQY&q=" + input,
    datatype: "json",
    success: function (data) {
      for (var i = 0; i < data.items.length; i++) {
        if (data.items[i].volumeInfo.authors == undefined || data.items[i].volumeInfo.title == undefined || data.items[i].volumeInfo.industryIdentifiers == undefined) {
          data.items.splice(i, 1);
          i--;
        } else {
          for (var j = 0; j < data.items[i].volumeInfo.industryIdentifiers.length; j++) {
            if (data.items[i].volumeInfo.industryIdentifiers[j].type == 'ISBN_13') {
              data.items[i].volumeInfo.isbn = data.items[i].volumeInfo.industryIdentifiers[j].identifier;
            }
          }
          if (data.items[i].volumeInfo.isbn == null) {
            data.items.splice(i, 1);
            i--;
          }
        }
      }
      var resultLimit = 20;
      if (resultLimit > data.items.length) {
        resultLimit = data.items.length;
      }
      for (var i = 0; i < resultLimit - 1; i++) {

        var title = data.items[i].volumeInfo.title;
        var author = data.items[i].volumeInfo.authors[0];
        var isbn = data.items[i].volumeInfo.isbn;
        if (data.items[i].volumeInfo.imageLinks) {
          var thumbnail = data.items[i].volumeInfo.imageLinks.thumbnail;
        }
        $("#bookList").append('<li class="searchListItem centerUlLi-' + user.preferences.hue + '">'
          + '<img src ="' + thumbnail + '">'
          + '<div class="centeringContainer">'
          + '<div class="searchListItem_infoContainer">'
          + '<p>' + title + '</p></br>'
          + '<p>by ' + author + '</p></br>'
          + '<button class="searchListButton button-' + user.preferences.hue + '" value="' + isbn + '" type=button>Suggest This Book</button>'
          + '</div>'
          + '</div>'
          + "</li>");

      }
    },
    type: 'GET'
  });
}


var userInfoHandler = function (result, status, xhr) {
  if (xhr.status === 200) {
    $('#userName').text(result.username);
    user = result;
    if (user.bookQueued == 1) {
      $('#suggestBook').parent().hide();
    }
    updatePreferences();
  }
}
var userInfoErrorHandler = function (xhr, status, error) {
  if (xhr.status == 401) {
    window.location = '../';
  } else if (xhr.status == 404) {
    alert("Error: username not found");
  } else {
    alert("Server error :(");
  }
}

var currentBookSuccessHandler = function (result, status, xhr) {
  if (xhr.status === 200) {
    if (result == null || result == '') {
      $('.cyclePeriod').text('Voting Period');
      $(".exitButton").click();
      $(".centerPanel2").toggle();
      $('#voteOnBook').addClass('select');
      $(".exitButton").hide();
    } else {
      currentBook = result;
      $('.cyclePeriod').text('Reading Period');
      displayCurrentBook();
    }

  }
}
var currentBookErrorHandler = function (xhr, status, error) {
  alert("Current book server error :(");
}

var votingListSuccessHandler = function (result, status, xhr) {
  if (xhr.status == 200) {
    $('#votingList').empty();
    if (result != null || result != '') {
      //populate voting list
      votingList = result;
      displayVotingListResults();
    }
  }
}
var votingListErrorHandler = function (xhr, status, error) {
  if (xhr.status == 401) {
    window.location = '../';
  } else {
    alert("Voting book server error :(");
  }
}

var newBookSuccessHandler = function (result, status, xhr) {
  if (xhr.status == 200) {
    $.ajax({
      type: "GET",
      url: "http://localhost:3000/getVotingBooks",
      success: votingListSuccessHandler,
      error: votingListErrorHandler
    });
    $(".exitButton").click();
    $(".centerPanel2").toggle();
    $('#voteOnBook').addClass('select');
    $('#suggestBook').parent().hide();
  }
}
var newBookErrorHandler = function (xhr, status, error) {
  if (xhr.status == 401) {
    window.location = '../';
  } else if (xhr.status == 400) {
    alert("Error: username and isbn required");
  } else if (xhr.status == 404) {
    alert("Error: username not found");
  } else if (xhr.status == 409 && xhr.responseText == 'user') {
    alert("Error: conflict. user has already submitted a book");
  } else if (xhr.status == 409 && xhr.responseText == 'book') {
    alert("Error: Book is already in voting list");
  } else {
    alert("Server Error :(");
  }
}

var newVoteSuccessHandler = function (result, status, xhr) {
  //Update UI with new vote
  user.currentVoteUsed = 1;
  $('#votingInterfaceHeader').text("You've already voted for the next book, but here's the standings:");
  $.ajax({
    type: "GET",
    url: "http://localhost:3000/getVotingBooks",
    success: votingListSuccessHandler,
    error: votingListErrorHandler
  });
}
var newVoteErrorHandler = function (xhr, status, error) {
  if (xhr.status == 401) {
    window.location = '../';
  } else if (xhr.status == 400) {
    alert("Error: username and isbn required");
  } else if (xhr.status == 404 && xhr.responseText == 'user') {
    alert("Error: username not found");
  } else if (xhr.status == 404 && xhr.responseText == 'book') {
    alert("Error: book not found in voting list");
  } else if (xhr.status == 409) {
    alert("Error: conflict. user has already voted on a book");
  } else {
    alert("Server Error :(");
  }
}

var favoriteAddSuccessHandler = function (result, status, xhr) {
  if (xhr.status == 200) {
    $('#addToFavoritesPrompt').text("Book added to favorites!");
  }
}
var favoriteAddErrorHandler = function (xhr, status, error) {
  if (xhr.status == 401) {
    window.location = '../';
  } else if (xhr.status == 400) {
    alert("Error: username and isbn required");
  } else {
    alert("Server Error :(");
  }

}

var countDown = function (countDownTime) {
  var interval = setInterval(function () {
    var currentDate = new Date().getTime();
    var distance = countDownTime - currentDate;
    var cd = {
      'days': Math.floor(distance / (1000 * 60 * 60 * 24)),
      'hours': Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      'minutes': Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
      'seconds': Math.floor((distance % (1000 * 60)) / 1000)
    }
    $('#countDown').text(cd.days + 'd ' + cd.hours + 'h ' + cd.minutes + 'm ' + cd.seconds + 's');
    if (distance < 0) {
      location.reload();
    }
  }, 1000);
}

var updatePreferences = function () {
  switch (user.preferences.color) {
    case '#6379ff': { user.preferences.hue = 'blue'; break; }
    case '#199976': { user.preferences.hue = 'green'; break; }
    case '#F9903B': { user.preferences.hue = 'orange'; break; }
    case '#FF1D18': { user.preferences.hue = 'red'; break; }
    default: { user.preferences.hue = 'purple'; break; }
  }
  $('#topInfoContainer').addClass('background-' + user.preferences.hue + '');
  $('.leftPanelStuff').addClass('leftPanel-' + user.preferences.hue + '');
  $('.center input').addClass('input-' + user.preferences.hue + '');
  $('.center').addClass('center-' + user.preferences.hue + '');
  $('button').addClass('button-' + user.preferences.hue + '');
  $('.cycleHeader span').addClass('color-' + user.preferences.hue + '');
  $('.cycleHeader').css('border-color', user.preferences.color);
  $('.leftPanelStuff_topBox').addClass('border-' + user.preferences.hue + '');
}