$(document).ready(function(){
  $("#login").click(function(){
    var userName = $("#usernameInput").val();
    var password = $("#passwordInput").val();
    //Check if input exists
    if(userName == "" || userName == undefined || password == "" || password == undefined){
      $(".invalidInputHolder").text("Invalid username or password");
    }else{
      //If input exists, make ajax post to our url/login.
      $.ajax({
        type: "POST",
        url: "http://localhost:3000/login",
        data: {'username': userName, 'password': password},
        success: loginHandler,
        error: errorHandler
      });
    }


    //window.location = "html/main.html";
  })

  //listen for going to sign up page.
  $("#signUp").click(function(){
    window.location = "html/userRegistration.html";
  })
})

/*Handler for successfull login, redirects to main.html for further site navigation*/
var loginHandler = function(result, status, xhr){
  if(xhr.status == 200){
    window.location = "../html/main.html";
  }else{
    $(".invalidInputHolder").text("status is " + status);
  }
}

/*Handler for unsuccessful login, will display message to user that username/password was incorrect*/
var errorHandler = function(xhr, status, error){
  if(xhr.status == 400){
      $(".invalidInputHolder").text("Undefined input for username/password");
  }else if (xhr.status = 404) {
      $(".invalidInputHolder").text("Username/password not found");
  } else {
    $(".invalidInputHolder").text("Server Error :(");
  }

}
