$(document).ready(function(){
    $("#userName").click(function(){
        $("#confirmLogoutPopup").css("display", "inline-block");
    
        $("#confirmLogout").click(function(){
            $.ajax({
                type: "POST",
                url: "http://localhost:3000/logout",
                success: function () {
                    window.location = '../';
                }
              });
        })
    
        $("#cancelLogout").click(function(){
            $("#confirmLogoutPopup").css("display", "none");
        })
    })
})

