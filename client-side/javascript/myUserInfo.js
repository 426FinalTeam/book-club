var user = {};
$(document).ready(function () {

  $.ajax({
    type: "GET",
    url: "http://localhost:3000/getUser",
    success: userInfoHandler,
    error: userInfoErrorHandler
  });

  /*Show dropdown with personal info; username and email*/
  $("#personalInfo > p").click(function () {
    hideInfo();
    removeBoxShadow();
    if ($("#personalInfo").find(".fullWidthList_hiddenListContent").css("display") == "none") {
      $("#personalInfo").find(".fullWidthList_hiddenListContent").slideDown("fast");
      $("#personalInfo").css("box-shadow", "0px 5px 10px #888888");
    }
  })

  /*Show drop down to display all favorite books when clicked.*/
  $("#favBook > p").click(function () {
    hideInfo();
    removeBoxShadow();
    //setUpCarousel();
    if ($("#favBook").find(".fullWidthList_hiddenListContent").css("display") == "none") {
      $("#favBook").find(".fullWidthList_hiddenListContent").slideDown("fast");
      $("#favBook").css("box-shadow", "0px 5px 10px #888888");
    }
  })

  /*Show dropdown with personal info; username and email*/
  $("#updatePreferences > p").click(function () {
    hideInfo();
    removeBoxShadow();
    if ($("#updatePreferences").find(".fullWidthList_hiddenListContent").css("display") == "none") {
      $("#updatePreferences").find(".fullWidthList_hiddenListContent").slideDown("fast");
      $("#updatePreferences").css("box-shadow", "0px 5px 10px #888888");
    }
  })

  /*Display pop up that appears asking if user is sure they want to delete their account*/
  $("#deleteAccount").click(function () {

    $("#deleteConfirmPopup").css("display", "inline-block");

    $("#confirmDelete").click(function (){
      $.ajax({
        type: "POST",
        url: "http://localhost:3000/delUser",
        data: { 'username': user.username },
        success: deleteSuccessHandler,
        error: deleteErrorHandler
      });
    });
    $("#cancelPopup").click(function(){
      $("#deleteConfirmPopup").css("display", "none");
    });
  });

  $('#colors li').click(function () {
    //update user preferences
    //put border around new color
    //update page with new color
    $('#colors li').css('border', '0');
    var color = $(this).attr('value');
    var colorSquare = $(this)
    $.ajax({
      type: "POST",
      url: "http://localhost:3000/updatePreferences",
      data: { 'username': user.username, 'type': 'color', 'color': color },
      success: function (result, status, xhr) {
        user.preferences.color = color;
        colorSquare.css('border', '4px solid black');
        updatePreferences();
      },
      error: function () { alert('Update Preferences Server Error'); }
    })
  });

  $('#profilePics li').click(function () {
    //update user preferences
    //put border around new color
    //update page with new color
    $('#profilePics li').children().css('border', '0');
    $('#profilePics li').removeClass('profilePicSelect');
    var picture = $(this).children().attr('value');
    var thumbnail = $(this);
    $.ajax({
      type: "POST",
      url: "http://localhost:3000/updatePreferences",
      data: { 'username': user.username, 'type': 'picture', 'picture': picture },
      success: function (result, status, xhr) {
        user.preferences.picture = picture;
        thumbnail.children().css('border', '4px solid black')
        thumbnail.addClass('profilePicSelect');
        updatePreferences();
      },
      error: function () { alert('Update Preferences Server Error'); }
    });
  });

});


//Used to transition information for each dropdown to be invisible
function hideInfo() {
  var dropdownElements = $(".fullWidthList_hiddenListContent").toArray();

  for (var i = 0; i < dropdownElements.length; i++) {
    if ($(dropdownElements[i]).attr("display") != "none") {
      $(dropdownElements[i]).slideUp("fast");
    }
  }
}

var userInfoHandler = function (result, status, xhr) {
  if (xhr.status === 200) {
    user = result;
    $('#userName').text(user.username);
    $('#nameGoesHere').text(user.username);
    updatePreferences();
    var colors = $("#colors > li").toArray();
    for (var i = 0; i < colors.length; i++) {
      if (colors[i].id == user.preferences.color) {
        $(colors[i]).css('border', '4px solid black');
        break;
      }
    }
    var pictures = $("#profilePics > li").toArray();
    for (var i = 0; i < pictures.length; i++) {
      if (pictures[i].children[0].id == user.preferences.picture) {
        $(pictures[i]).children().css('border', '4px solid black');
        $(pictures[i]).addClass('profilePicSelect');
      }
    }
    $("#userInfo").append('<li>Email: ' + user.email + '</li>'
                        + '<li>Vote Used: ' + (user.currentVoteUsed == 1 ? 'Yes' : 'No') + '</li>');
    if (user.bookQueued == 1 && user.queuedISBN != null) {
      $.ajax({
        type: "GET",
        url: "https://www.googleapis.com/books/v1/volumes?key=AIzaSyCjpABEQF4pAZ9PNrgioZrt8pGUM5FvNQY&q=isbn:" + user.queuedISBN,
        success: function (data) {
          $('#userInfo').append('<li>Book Queued: ' + data.items[0].volumeInfo.title + '</li>');
        },
        error: function () { alert('Queued Book Server Error :('); }
      });
    } else {
      $('#userInfo').append("<li>Book Queued: No</li>")
    }
    if (user.favorites != null) {
      if (user.favorites.length < 4) {
        $('#scrollLeft').hide();
        $('#scrollRight').hide();
      }
      var count = 0;
      for (var i = 0; i < user.favorites.length; i++) {
        getFavoriteBookInfo(user.favorites[i], i, function (isbn, data) {
          var imgUrl = data.items[0].volumeInfo.imageLinks.smallThumbnail;
          $("#faveBooks").append('<li data-pos="' + (count+1) + '"value="' + isbn + '">' + '<img class="thumbnailImgDropdown" src="' + imgUrl + '"><p class="bookNameList">' + data.items[0].volumeInfo.title + "</p><p>by " + data.items[0].volumeInfo.authors[0] + "</p></li>");
          count++;
          if(count == user.favorites.length){
            setUpCarousel();
          }
        });
      }
    } else {
      $("#favBook_hightestHolder").empty();
      $("#favBook_hightestHolder").append("<p style:'text-align:center;'>No books favorited</p>");
      $("#favBook_hightestHolder").css("text-align","center");
      $('#scrollLeft').hide();
      $('#scrollRight').hide();
    }
  }
}
var getFavoriteBookInfo = function (isbn, count, callback) {
  //Make ajax call to google books then append the books to book Holder
  $.ajax({
    url: "https://www.googleapis.com/books/v1/volumes?key=AIzaSyCjpABEQF4pAZ9PNrgioZrt8pGUM5FvNQY&q=isbn:" + isbn,
    datatype: "json",
    success: function (data) {
      callback(isbn, data);
    },
    type: 'GET'
  });
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

var deleteSuccessHandler = function (result, status, xhr) {
  if (xhr.status === 200) {
    window.location = "../";
  }
}
var deleteErrorHandler = function (xhr, status, error) {
  if (xhr.status == 401) {
    window.location = '../';
  } else if (xhr.status == 400) {
    alert("Bad request. No username was sent");
  } else if (xhr.status == 500) {
    alert("Error. No deletion occured");
  } else {
    alert("Server error :(");
  }
}

var removeBoxShadow = function () {
  $("#personalInfo").css("box-shadow", "0px 0px 0px #888888");
  $("#favBook").css("box-shadow", "0px 0px 0px #888888");
  $("#updatePreferences").css("box-shadow", "0px 0px 0px #888888");
}

var currentLastPos = 3; //For use in setUpCarousel function to keep track of current pos.
var currentFirstPos = 1; //For use in setUpCarousel function to keep track of current pos.
var setUpCarousel = function () {
  var books = $("#faveBooks > li").toArray();

  //Make sure that all elements are hidden at start
  for (var i = 0; i < books.length; i++) {
    var positionVal = $(books[i]).data("pos");
    if (parseInt($(books[i]).data("pos")) > 3) {
      $(books[i]).css("display", "none");
    }
  }

  $("#scrollLeft").click(function () {
    //Check if given the first element in list of books currently, there are any books before that one in list
    if (!(currentFirstPos - 1 <= 0)) {
      //Hide books above and equal to current left-most book
      //Display next three books in list at positions below current left-most book
      for (var i = 0; i < books.length; i++) {
        if (parseInt($(books[i]).data("pos")) >= currentFirstPos) {
          $(books[i]).css("display", "none");
        } else if (parseInt($(books[i]).data("pos")) >= currentFirstPos - 3) {
          $(books[i]).css("display", "inline-block");
        }
      }
      currentLastPos = currentLastPos - 3;
      currentFirstPos = currentFirstPos - 3;
    }
  })


  $("#scrollRight").click(function () {
    //If no more books are in the list then do nothing.
    if (!(currentLastPos + 1 > books.length)) {
      //Display next three books from list if they exist.
      for (var i = 0; i < books.length; i++) {
        if (parseInt($(books[i]).data("pos")) <= currentLastPos) {
          $(books[i]).css("display", "none");
        } else if (parseInt($(books[i]).data("pos")) <= currentLastPos + 3) {
          $(books[i]).css("display", "inline-block");
        }
      }
      currentLastPos = currentLastPos + 3;
      currentFirstPos = currentFirstPos + 3;

    }
  })



}

var updatePreferences = function () {


  
  switch (user.preferences.color) {
    case '#6379ff': { user.preferences.hue = 'blue'; break; }
    case '#199976': { user.preferences.hue = 'green'; break; }
    case '#F9903B': { user.preferences.hue = 'orange'; break; }
    case '#FF1D18': { user.preferences.hue = 'red'; break; }
    default: { user.preferences.hue = 'purple'; break; }
  }
  $('#topInfoContainer').removeAttr('class').addClass('background-' + user.preferences.hue);
  $('#confirmDelete').attr('class', 'confirmationPopup_button button-' + user.preferences.hue);
  $('#cancelPopup').attr('class', 'confirmationPopup_button button-' + user.preferences.hue);
  $('#confirmLogout').attr('class', 'confirmationPopup_button button-' + user.preferences.hue);
  $('#cancelLogout').attr('class', 'confirmationPopup_button button-' + user.preferences.hue);
  if (user.preferences.picture == null) {
    $('#bigUserPic').attr('src', '../images/placeHolder.png');
  } else {
    $('#bigUserPic').attr('src', '../images/' + user.preferences.picture + '.jpg');
  }
}
