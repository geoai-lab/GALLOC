/**
 * This is the JavaScript file for the "resetPassword" page.
 */

// reset password based on the username and new password
$("#btnResetPasswordAction").click(function() {
	var username = $("#inputUsernameForResetPW").val();
	var password = $("#inputPasswordForResetPW").val();

	if (username == "" || password == "") {
		alert("Please input both your username and new password.")
		return false;
	}
	
	// ajax request and response for resetting the password
	$.ajax({
		url: 'UserServlet',
		type: 'GET',
		data: { action: "resetPassword", username: username, password: password },
		dataType: 'text',
		success: function(result, textStatus, jqXHR) {
			var resultObject = JSON.parse(result);
			if (resultObject.status == "success") {
				$("#alertForResetPassword").css("display", "block");
				$("#alertForResetPassword").text("");
				html = "Successfully! You can <a id=\"hyperResetPasswordGoSignin\" role=\"button\" style=\"text-decoration: underline;color: blue;\" onmouseover=\"this.style.color='red';\" onmouseout=\"this.style.color='blue';\" >signin</a> now!"
				$('#alertForResetPassword').html(html);
				$("#divResetPasswordAction").css("display", "none");
				$("#alertForResetPassword").css("margin-bottom", "0px");

				$("#hyperResetPasswordGoSignin").click(function() {
					$("#resetPasswordPage").fadeOut(500);
					setTimeout(loadLoginPage, 550);
				});
			}
			else {
				$("#alertForResetPassword").css("display", "block");
				$("#alertForResetPassword").text(resultObject.error);
			}
		},
		error: function(jqXHR, textStatus, errorThrown) {
			alert('ERRORS: ' + ':' + textStatus);
		}
	});
});