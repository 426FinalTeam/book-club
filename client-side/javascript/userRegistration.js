$(document).ready(function () {
    $("#createAccount").click(function () {
        var userName = $("#user").val().toString();
        var email = $("#email").val().toString();
        var password = $("#pass").val().toString();
        var confirmPassword = $("#cPass").val().toString();

        if (password != confirmPassword) {
            $('.invalidInputHolder').text("Passwords do not match!");
        }
        else {
            //Check if input exists
            if (userName == "" || userName == undefined || password == "" || password == undefined) {
                $(".invalidInputHolder").text("Invalid username or password");
            } 
            else if (email == "" || email == undefined || $("#email").is(":invalid")) {
                $(".invalidInputHolder").text("Invalid email");
            }
            else {
                //If input exists, make ajax post to newUser.
                $.ajax({
                    type: "POST",
                    url: "http://localhost:3000/newUser",
                    data: { 'username': userName, 'password': password, 'email': email},
                    success: loginHandler,
                    error: errorHandler
                });
            }
        }
    })
})

/*Handler for successfull login, redirects to main.html for further site navigation*/
var loginHandler = function (result, status, xhr) {
    if (xhr.status == 200) {
        window.location = "../html/main.html";
    } else {
        $(".invalidInputHolder").text("status is " + status);
    }
}

/*Handler for unsuccessful login, will display message to user that username/password was incorrect*/
var errorHandler = function (xhr, status, error) {
    if (xhr.status == 400) {
        $(".invalidInputHolder").text("Invalid input for username, password, or email");
    } else if (xhr.status == 409 && xhr.responseText == 'username') {
        $(".invalidInputHolder").text("Username is already in the database!");
    } else if (xhr.status == 409 && xhr.responseText == 'email') {
        $(".invalidInputHolder").text("Email is already in the database!");
    } else {
        $(".invalidInputHolder").text("Server error :(");
    }
}
