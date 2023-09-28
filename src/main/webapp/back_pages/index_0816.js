/**
 * This is the JavaScript file for the "index" page.
 */

var currentPage = "loginPage";
var currentUser = "";
var btnForAnnotateProjectList = [];
var btnForManageUsersList = [];
var btnForUpdateDataList = [];
var btnForDelProjectList = [];
var btnForResolveProjectList = [];
var btnForDownloadList = [];
var aForProjectList = [];
var categorySchemas = {};
var projAnnotator = [];
var projAdministrated = [];
var annoPromises = [];
var btnForCheckStatusList = [];


$("#btnSignup").click(function() {
	/*setTimeout(function() { $("#loginPage").css("display", "none"); }, 50);
	setTimeout(function() { $("#signupPage").css("display", "flex"); }, 50);*/
	$("#loginPage").fadeOut(500);
	setTimeout(loadSignupPage, 550);
});


$("#hyperResetPassword").click(function() {
	$("#loginPage").fadeOut(500);
	setTimeout(loadResetPasswordPage, 550);
});


$("#hyperReturnInReset, #hyperReturnInSignup").click(function() {
	$("#" + currentPage).fadeOut(500);
	setTimeout(loadLoginPage, 550);
	currentPage = "loginPage";
});


var navBar = $('#navBar');
navBar.on('click', '#hyperGALLOC', function(event) {
	$("#" + currentPage).fadeOut(500);
	setTimeout(loadLoginPage, 550);
	currentPage = "loginPage";
});


$("#btnSignin").click(function() {
	var username = $("#inputUsernameForSignin").val();
	var password = $("#inputPasswordForSignin").val();

	if (username == "" || password == "") {
		alert("Please input both your username and password.")
		return false;
	}

	$.ajax({
		url: 'UserServlet',
		type: 'GET',
		data: { action: "signin", username: username, password: password },
		dataType: 'text',
		success: function(result, textStatus, jqXHR) {
			var resultObject = JSON.parse(result);
			if (resultObject.status == "success") {
				$("#loginPage").fadeOut(500);
				setTimeout(loadStartProjectPage, 550);
				currentUser = username;
			}
			else {
				$("#alertForSignin").css("display", "block");
				$("#alertForSignin").text(resultObject.error);
			}
		},
		error: function(jqXHR, textStatus, errorThrown) {
			alert('ERRORS: ' + ':' + textStatus);
		}
	});
});


function loadLoginPage() {
	$("#loginPage").css("display", "flex");
	$("#inputUsernameForSignin").val("");
	$("#inputPasswordForSignin").val("");
	$("#alertForSignin").css("display", "none");

	var html = "";
	html += "<a class=\"navbar-brand\" role=\"button\" id=\"hyperGALLOC\" style=\"font-size: 28px;\">GALLOC</a>";
	html += "A GeoAnnotator for Labeling LOCation descriptions from disaster-related text messages";
	$("#navBar").html(html);

	currentPage = "loginPage";
}


function loadResetPasswordPage() {
	$("#resetPasswordPage").css("display", "flex");
	$("#divResetPasswordAction").css("display", "block");
	$("#inputUsernameForResetPW").val("");
	$("#inputPasswordForResetPW").val("");
	$("#alertForResetPassword").css("display", "none");
	currentPage = "resetPasswordPage";
}


function loadSignupPage() {
	$("#signupPage").css("display", "flex");
	$("#divSignupAction").css("display", "block");
	$("#inputUsernameForSignup").val("");
	$("#inputPasswordForSignup").val("");
	$("#alertForSignup").css("display", "none");
	$("#divAlertPuncForSignup").html("");
	currentPage = "signupPage";
}


function loadStartProjectPage() {
	$("#startProjectPage").css("display", "flex");
	$("#inputNameForAddingProject").val("");
	$('#divProjectList').html("");

	if ($("#divAlertForAddingProject").length) {
		$("#divAlertForAddingProject").remove();
	}
	getProjectsList();
	dynamicalNaviBar("startProjectPage");
	currentPage = "startProjectPage";
}


function getProjectsList() {
	$.ajax({
		url: 'ProjectServlet',
		type: 'GET',
		data: { action: "getProjectList", username: currentUser },
		dataType: 'text',
		success: function(result, textStatus, jqXHR) {
			var resultObject = JSON.parse(result);
			if (resultObject.status == "success") {
				aForProjectList = [];
				btnForAnnotateProjectList = [];
				btnForCheckStatusList = [];
				btnForResolveProjectList = [];
				btnForUpdateDataList = [];
				btnForDownloadList = [];
				btnForManageUsersList = [];
				btnForDelProjectList = [];
				categorySchemas = {};
				projAnnotator = [];
				projAdministrated = [];
				var projName_Administrated = [];
				
				projAnnotator = resultObject.proj_anno;
				projAdministrated = resultObject.proj_administrated;

				html = "";
				if (projAnnotator.length + projAdministrated.length > 0) {
					$("#divAlertNoProjects").css("display", "none");
					var rowNum = 0;
					html += "<table class=\"table table-striped align-middle\"><thead><tr><th scope=\"col\">#</th><th scope=\"col\">Project name</th><th scope=\"col\">Geographic scope</th><th scope=\"col\">Operations</th></tr></thead><tbody>"
					for (var i = 0; i < projAdministrated.length; i++) {
						projName = decodeURIComponent(projAdministrated[i].ProjectName);
						projName_Administrated.push(projName);
						//categorySchemas[projName] = JSON.parse(decodeURIComponent(projAdministrated[i].categorySchema));
						projGeoScopeType = Object.keys(JSON.parse(decodeURIComponent(projAdministrated[i].GeoScope)))[0];
						projGeoScopeValue = Object.values(JSON.parse(decodeURIComponent(projAdministrated[i].GeoScope)))[0];
						if (projGeoScopeType == 'State') {
							projGeoScope = projGeoScopeValue;
						} else {
							projGeoScope = "geojson{coordinates:" + projGeoScopeValue.features[0].geometry.coordinates;
							projGeoScope = projGeoScope.substring(0, 24) + "...}";
						}
						rowNum++;

						html += "<tr> <th scope=\"row\">" + rowNum + "</th>";
						html += "<td><a role=\"button\" style=\"text-decoration: underline; color: blue;\" onmouseover=\"this.style.color='red';\" onmouseout=\"this.style.color='blue';\" id=\"aForProject" + projName + "\">" + projName + "</a></td>";
						aForProjectList.push("aForProject" + projName);
						html += "<td>" + projGeoScope + "</td>";
						html += "<td>";
						html += "<button type=\"button\" class=\"btn btn-secondary btn-sm\" style=\"margin-right:5px;\" data-bs-toggle=\"modal\" data-bs-target=\"#modalStatusProject\" id=\"btnCheckStatus_" + projName + "\">Check status</button>";
						btnForCheckStatusList.push("btnCheckStatus_" + projName);
						html += "<button type=\"button\" class=\"btn btn-secondary btn-sm\" style=\"margin-right:5px;\" id=\"btnStartAnnotating_" + projName + "\">Annotate</button>";
						btnForAnnotateProjectList.push("btnStartAnnotating_" + projName);
						html += "<button type=\"button\" class=\"btn btn-secondary btn-sm\" style=\"margin-right:5px;\" id=\"btnStartResolving_" + projName + "\">Resolve</button>";
						btnForResolveProjectList.push("btnStartResolving_" + projName);
						html += "<button type=\"button\" class=\"btn btn-secondary btn-sm\" style=\"margin-right:5px;\" data-bs-toggle=\"modal\" data-bs-target=\"#projectUpdateDataModal\" id=\"btnUpdateData_" + projName + "\"> Update data</button>";
						btnForUpdateDataList.push("btnUpdateData_" + projName);
						html += "<button type=\"button\" class=\"btn btn-secondary btn-sm\" style=\"margin-right:5px;\" id=\"btnDownloadCorpus_" + projName + "\"> Download corpus</button>";
						btnForDownloadList.push("btnDownloadCorpus_" + projName);
						html += "<button type=\"button\" class=\"btn btn-secondary btn-sm\" style=\"margin-right:5px;\" data-bs-toggle=\"modal\" data-bs-target=\"#userManageModal\" id=\"btnManageUser_" + projName + "\"> Manage users</button>";
						btnForManageUsersList.push("btnManageUser_" + projName);
						html += "<button type=\"button\" class=\"btn btn-secondary btn-sm\" data-bs-toggle=\"modal\" data-bs-target=\"#delProjectModal\" id=\"delProj_" + projName + "\"> Delete project</button></td></tr>"
						btnForDelProjectList.push("delProj_" + projName);
					}

					for (var j = 0; j < projAnnotator.length; j++) {
						projName = decodeURIComponent(projAnnotator[j].ProjectName);
						//categorySchemas[projName] = JSON.parse(decodeURIComponent(projAnnotator[j].categorySchema));					
						if (!projName_Administrated.includes(projName)) {
							//projCreator = projAnnotator[j].creator;
							projGeoScopeType = Object.keys(JSON.parse(decodeURIComponent(projAnnotator[j].GeoScope)))[0];
							projGeoScopeValue = Object.values(JSON.parse(decodeURIComponent(projAnnotator[j].GeoScope)))[0];
							if (projGeoScopeType == 'State') {
								projGeoScope = projGeoScopeValue;
							} else {
								projGeoScope = "geojson{coordinates:" + projGeoScopeValue.features[0].geometry.coordinates;
								projGeoScope = projGeoScope.substring(0, 24) + "...}";
							}
							rowNum++;

							html += "<tr> <th scope=\"row\">" + rowNum + "</th>";
							html += "<td><a role=\"button\" style=\"text-decoration: underline; color: blue;\" onmouseover=\"this.style.color='red';\" onmouseout=\"this.style.color='blue';\" id=\"aForProject" + projName + "\">" + projName + "</a></td>";
							aForProjectList.push("aForProject" + projName);
							html += "<td>" + projGeoScope + "</td>";
							//html += "<td>" + projCreator + "</td>";
							html += "<td><button type=\"button\" class=\"btn btn-secondary btn-sm\" style=\"margin-right:5px;\" id=\"btnStartAnnotating_" + projName + "\">Annotate</button>";
							btnForAnnotateProjectList.push("btnStartAnnotating_" + projName);
							html += "<button type=\"button\" class=\"btn btn-secondary btn-sm\" style=\"margin-right:5px;\" id=\"btnDownloadCorpus_" + projName + "\"> Download corpus</button>";
							btnForDownloadList.push("btnDownloadCorpus_" + projName);
						}
					}
					html += "</tbody></table>"
					$('#divProjectList').html(html);

					/*for (var p = 0; p < btnForAnnotateProjectList.length; p++) {
						var annoProjName = btnForAnnotateProjectList[p].split("_")[1];
						annoPromises.push(doAsyncAnnotation(annoProjName));
					}*/
				} else {
					$('#divProjectList').html(html);
					$("#divAlertNoProjects").css("display", "block");
				}
			}
			else {
				alert('ERRORS: ' + ':' + resultObject.error);
			}
		},
		error: function(jqXHR, textStatus, errorThrown) {
			alert('ERRORS: ' + ':' + textStatus);
		}
	});
}


/*function doAsyncAnnotation(projName) {
	return new Promise((resolve, reject) => {
		$.ajax({
			url: 'ProjectServlet',
			type: 'GET',
			data: { action: "isDataExists", projName: projName },
			dataType: 'text',
			success: function(result, textStatus, jqXHR) {
				var resultObject = JSON.parse(result);
				if (resultObject.status == "success") {
					if (resultObject.label == "Yes") {
						$("#btnStartAnnotating_" + projName).prop('disabled', false);
					} else {
						$("#btnStartAnnotating_" + projName).prop('disabled', true);
					}
				}
				else {
					alert(resultObject.error);
				}
			},
			error: function(jqXHR, textStatus, errorThrown) {
				alert('ERRORS: ' + ':' + textStatus);
			}
		});
	});
}*/


/*window.onbeforeunload = function() {
	var isRefresh = false;

	if (performance.navigation.type == 1) {
		isRefresh = true;
	}

	if (isRefresh) {
		return "You will leave GALLOC!";
	}
}*/

/*window.addEventListener('beforeunload', function(event) {
  event.returnValue = 'Are you sure you want to leave this page?';
});*/

/*window.onbeforeunload = function() {
	return "Leaving this page will reset the wizard."
};*/

/*$(window).bind('beforeunload', function(event){
	return "You have some unsaved changes!"
});*/