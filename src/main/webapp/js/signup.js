/**
 * This is the JavaScript file for the "signup" page.
 */

// sign up a new user account using the inputted username and password
$("#btnSignupAction").click(function() {
	var username = $("#inputUsernameForSignup").val();
	var password = $("#inputPasswordForSignup").val();

	if (username == "" || password == "") {
		alert("Please input both your username and password.")
		return false;
	}

	const alphanumericRegex = /^[0-9a-zA-Z]+$/;
	if (!alphanumericRegex.test(username)) {
		alert("Please use only letters and numbers for the username.")
		return false;
	}

	// ajax request and response for sign up
	$.ajax({
		url: 'UserServlet',
		type: 'GET',
		data: { action: "signup", username: username, password: password },
		dataType: 'text',
		success: function(result, textStatus, jqXHR) {
			var resultObject = JSON.parse(result);
			if (resultObject.status == "success") {
				$("#alertForSignup").css("display", "block");
				$("#alertForSignup").text("");
				html = "Successfully! You can <a id=\"hyperSignupGoSignin\" role=\"button\" style=\"text-decoration: underline;color: blue;\" onmouseover=\"this.style.color='red';\" onmouseout=\"this.style.color='blue';\" >signin</a> now!"
				$('#alertForSignup').html(html);
				$("#divSignupAction").css("display", "none");
				$("#alertForSignup").css("margin-bottom", "0px");

				$("#hyperSignupGoSignin").click(function() {
					$("#signupPage").fadeOut(500);
					setTimeout(loadLoginPage, 550);
				});
			}
			else {
				$("#alertForSignup").css("display", "block");
				$("#alertForSignup").addClass("m-2");
				$("#alertForSignup").text(resultObject.error);
			}
		},
		error: function(jqXHR, textStatus, errorThrown) {
			alert('ERRORS: ' + ':' + textStatus);
		}
	});
});


// alert for inputting a correct username
$('#inputUsernameForSignup').on('input', function() {
	var inputUsername = $(this).val();

	const alphanumericRegex = /^[0-9a-zA-Z]+$/;
	if (inputUsername != "" && !alphanumericRegex.test(inputUsername)) {
		var html = "Please use only letters and numbers for the username.";
		$("#divAlertPuncForSignup").html(html);
	} else {
		$("#divAlertPuncForSignup").html("");
	}
});