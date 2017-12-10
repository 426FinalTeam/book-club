var user = {};
$(document).ready(function () {
  $.ajax({
    type: "GET",
    url: "http://localhost:3000/getUser",
    success: userInfoSuccessHandler,
    error: userInfoErrorHandler
  });
  seeMoreListener();
  addToFavoritesListener();
});

var userInfoSuccessHandler = function (result, status, xhr) {
  if (xhr.status == 200) {
    $('#userName').text(result.username);
    user = result;
    updatePreferences();
    $.ajax({
      type: "GET",
      url: "http://localhost:3000/getUsers",
      success: allUsersInfoHandler,
      error: allUsersInfoErrorHandler
    });
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

var allUsersInfoHandler = function (result, status, xhr) {
  if (xhr.status === 200) {
    if (result.length <= 1) {
      $('#otherUserInfoContentContainer').empty().text("You're the only one...");
    } else {
      for (var i = 0; i < result.length; i++) {
        if (result[i].username == user.username) {
          result.splice(i, 1);
          break;
        }
      }
      for (var i = 0; i < result.length; i++) {
        var thumbnail = 'placeholder.png';
        if (result[i].picture != null) thumbnail = result[i].picture + '.jpg';
        var k = (i % 12);
        if (i < 12) {
          var row = Math.floor(k / 4);
          $("#" + row + '').append(''
            + '<div data-pos="' + i + '"class="rowOfProfileContainers_userInfo">'
            + '<img class="otherUserProfilePic" src="../images/' + thumbnail + '">'
            + '<p>' + result[i].username + '</p>' + '<button data-username="' + result[i].username + '" type="button" class="otherUserButton button-' + user.preferences.hue + '">See more info</button>'
            + '</div>'
            + '');
        } else {
          //Need to store data, but make the information only appear when clicked.
          //Same as firt 12 users to be displayed, but the divs need to be 'display:none;'
          var row = Math.floor(k / 4);
          $("#" + row + '').append(''
            + '<div data-pos="' + i + '"class="rowOfProfileContainers_userInfo" style="display:none">'
            + '<img class="otherUserProfilePic" src="../images/placeHolder.png">'
            + '<p>' + result[i].username + '</p>' + '<button data-username="' + result[i].username + '" type="button" class="otherUserButton button-' + user.preferences.hue + '">See more info</button>'
            + '</div>'
            + '');
        }
      }
      showMoreUsersListener();
    }
  }
}

var allUsersInfoErrorHandler = function (xhr, status, error) {
  if (xhr.status == 401) {
    window.location = '../';
  } else if (xhr.status == 404) {
    alert("Error: no users were found");
  } else {
    alert("Server error :(");
  }
}

//Sets up listener for when see more info button is pressed to show popup with user info.
var seeMoreListener = function () {
  $("#otherUserInfoContentContainer").on("click", ".otherUserButton", function () {
    var userName = $(this).data("username");
    var picURL = $(this).siblings("img").attr("src");
    //Ajax call to get all of this users info then display it
    $("#nameGoesHere").text(userName);
    $("#userPopupPic").attr("src", picURL);

    $.ajax({
      type: "GET",
      url: "http://localhost:3000/getFavorites/" + userName,
      success: favoritesInfoHandler,
      error: favoritesInfoErrorHandler
    })
  })
}
var addToFavoritesListener = function () {
  $('#faveBooks').on('click', '.faveBooksButton', function () {
    var isbn = $(this).parent().parent().attr('id');
    var alreadyFavorited = false;
    if (user.favorites != null) {
      for (var i = 0; i < user.favorites.length; i++) {
        if (user.favorites[i] == isbn) {
          alreadyFavorited = true;
          break;
        }
      }
    }
    if (alreadyFavorited) {
      $(this).text('Already Added');
    } else {
      user.favorites.push(isbn);
      //Ajax call to add to favorites
      $.ajax({
        type: "POST",
        url: "http://localhost:3000/newFavorite",
        data: { 'username': user.username, 'isbn': isbn },
        error: favoriteAddErrorHandler
      });
    }
    $(this).attr('disabled', 'disabled');
  });
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

$(document).on("click", "#exitPopup", function () {
  $("#popupPanel").css("display", "none");
})


var favoritesInfoHandler = function (result, status, xhr) {
  if (xhr.status == 200) {
    if (result == null || result == '') {
      $("#faveBooks").empty();
      $("#favoriteBooksHeader").text("No Favorite Books");
      $("#popupPanel").css("display", "inline-block");
    } else {
      $("#faveBooks").empty();
      for (var i = 0; i < result.length; i++) {
        var isbn = result[i];
        getFavoritesInfo(isbn);
      }
    }
  }
}
var getFavoritesInfo = function (isbn) {
  //Ajax call to get all the users' favorite books
  $.ajax({
    url: "https://www.googleapis.com/books/v1/volumes?key=AIzaSyCjpABEQF4pAZ9PNrgioZrt8pGUM5FvNQY&q=isbn:" + isbn,
    datatype: "json",
    success: function (data) {
      var imgUrl = data.items[0].volumeInfo.imageLinks.smallThumbnail;
      $("#faveBooks").append('<li class="bookInList border-' + user.preferences.hue + '" id="' + isbn + '">'
        + '<img class="thumbnailImg" src="' + imgUrl + '">'
        + '<div class="titleButtonPopupContainer">'
        + ' <p>' + data.items[0].volumeInfo.title + " by " + data.items[0].volumeInfo.authors[0] + "</p></br>"
        + '<button type="button" class="faveBooksButton button-' + user.preferences.hue + '">Add To Favorites</button>'
        + '</div>'
        + '</li>');
      //Make the popup visible after all fav books have been retrieved
      $("#popupPanel").css("display", "inline-block");
    },
    type: 'GET'
  });
}

var favoritesInfoErrorHandler = function (xhr, status, error) {
  if (xhr.status == 401) {
    window.location = '../';
  } else if (xhr.status == 404) {
    alert("Error: username not found");
  } else {
    alert("Server error :(");
  }
}

var currentLastPos = 11;
var currentFirstPos = 0;
var showMoreUsersListener = function () {
  var users = $(".rowOfProfileContainers_userInfo").toArray();
  for (var i = 0; i < users.length; i++) {
    var positionVal = $(users[i]).data("pos");
    if (positionVal > 12) {
      $(users[i]).css("display", "none");
    }
  }
  $("#scrollLeft").click(function () {
    //Check if there are any users below the current user
    if (!(currentFirstPos - 1 <= 0)) {
      //Hide users above and equal to current one.
      //Show the next up to twelve below the currently targeted user
      for (var i = 0; i < users.length; i++) {
        if (parseInt($(users[i]).data("pos")) >= currentFirstPos) {
          $(users[i]).css("display", "none");
        } else if (parseInt($(users[i]).data("pos")) >= currentFirstPos - 12) {
          $(users[i]).css("display", "inline-block");
        }
      }
      currentLastPos = currentLastPos - 12;
      currentFirstPos = currentFirstPos - 12;
    }
  })

  $("#scrollRight").click(function () {
    //check if there are any users above the current user
    if (!(currentLastPos + 1 > users.length)) {
      //display next 12 users from list if they exist
      for (var i = 0; i < users.length; i++) {
        if (parseInt($(users[i]).data("pos")) <= currentLastPos) {
          $(users[i]).css("display", "none");
        } else if (parseInt($(users[i]).data("pos")) <= currentLastPos + 12) {
          $(users[i]).css("display", "inline-block");
        }
      }
      currentLastPos = currentLastPos + 12;
      currentFirstPos = currentFirstPos + 12;
    }
  });
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
  $('button').addClass('button-' + user.preferences.hue + '');
  $('#booksContainer').addClass('center-' + user.preferences.hue + '');
}





