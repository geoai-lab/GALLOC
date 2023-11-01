/**
 * This is the JavaScript file for the "createProject" page.
 */

currentProjName = "";

// response function for operating the select box of categories schema
selectOptionOperation('#addNewCategory', '#btnCategoryRemove', '#selectAllCategoriesAdded', '#inputNewCategory', 'Please enter the category.');


// response function for the oninput event of an input element for project name 
$('#inputProjectName').on('input', function() {
	const projName = $(this).val();
	// dynamically examine whether this project name has been occupied
	$.ajax({
		url: 'ProjectServlet',
		type: 'GET',
		data: { action: "isProjectExists", projName: projName },
		dataType: 'text',
		success: function(result, textStatus, jqXHR) {
			var resultObject = JSON.parse(result);
			if (resultObject.status == "success") {
				$("#divAlertIsProjectExists").html("");
			}
			else {
				// if yes, show an alert information
				$("#divAlertIsProjectExists").html(resultObject.error);
			}
		},
		error: function(jqXHR, textStatus, errorThrown) {
			alert('ERRORS: ' + ':' + textStatus);
		}
	});
});


// cancel the creation of a project and return to the home page
$('#btnCancelCreateProjectAction').click(function() {
	$("#createProjectPage").fadeOut(500);
	setTimeout(loadStartProjectPage, 550);
})


// create a projec based on the project information that a user inputs
$("#btnCreateProjectAction").click(function() {
	// get the project information including project name, geographic scope, category schema, annotator number, and batch size
	var projName = $("#inputProjectName").val();
	var projGeo = {};
	if ($("#radioSelectState").is(":checked")) {
		projGeo["State"] = $("#selectState").val();
	}
	else if ($("#radioDrawScope").is(":checked")) {
		if (projGeoScopeMap == undefined) {
			projGeo["Coords"] = Object.values(JSON.parse(oldProjInfo.split("_")[1]))[0];
		} else {
			projGeo["Coords"] = projGeoScopeMap;
		}
	}
	var categorySchema = {};
	var numberCategory = 0;
	$("#selectAllCategoriesAdded option").each(function() {
		numberCategory += 1
		categorySchema["C" + numberCategory] = $(this).val();
	});
	var annotatorNumber = $("#inputNumAnnotator").val();
	var batchNumber = $("#inputBatchNumber").val();

	if (projName == "" || (projGeo.Coords == undefined && projGeo["State"] == undefined) || annotatorNumber < 1) {
		alert("To create a project, please input your project name, define the geographic scope, and ensure the annotator number is at least 1.")
		return false;
	}
	
	// always record the current project information
	var newProjInfo = "";
	newProjInfo = projName + "_" + JSON.stringify(projGeo) + "_" + JSON.stringify(categorySchema) + "_" + annotatorNumber + "_" + batchNumber;
	var oldProjName = oldProjInfo.split("_")[0];

	// examine whether the user inputs a category schema. if no, show a modal to remind the user
	if ($("#selectAllCategoriesAdded").children("option").length == 0) {
		$("#btnNocategory").off("click");
		var modalAlertForNoCategory = new bootstrap.Modal($("#modalAlertForNoCategory"));
		modalAlertForNoCategory.show();
	} else {
		// use different functions according to whether this user is to create a project or to edit a project 
		if (editOrCreate == "edit") {
			if (newProjInfo == oldProjInfo) {
				alert("You did not modify any information of this project.")
				return false;
			}
			requestEditProject(oldProjName, projName, projGeo, categorySchema, annotatorNumber, batchNumber);
		} else {
			requestCreatProject(projName, projGeo, currentUser, categorySchema, annotatorNumber, batchNumber);
		}
	}
	
	// if the user continues to create or edit a project with no category schema
	$("#btnNocategory").click(function() {
		if (editOrCreate == "edit") {
			if (newProjInfo == oldProjInfo) {
				alert("You did not modify any information of this project.")
				return false;
			}
			requestEditProject(oldProjName, projName, projGeo, categorySchema, annotatorNumber, batchNumber);
		} else {
			requestCreatProject(projName, projGeo, currentUser, categorySchema, annotatorNumber, batchNumber);
		}
	})
});


// response function for create a new project
function requestCreatProject(projName, projGeo, creator, categorySchema, annotatorNumber, batchNumber) {
	$.ajax({
		url: 'ProjectServlet',
		type: 'GET',
		data: { action: "createProject", projName: projName, geoScope: encodeURIComponent(JSON.stringify(projGeo)), creator: creator, categorySchema: encodeURIComponent(JSON.stringify(categorySchema)), annotatorNumber: annotatorNumber, batchNumber: batchNumber },
		dataType: 'text',
		success: function(result, textStatus, jqXHR) {
			var resultObject = JSON.parse(result);
			if (resultObject.status == "success") {
				// show a modal to remind the user to upload data
				var modalAlertCreatedProject = new bootstrap.Modal($("#modalAlertCreatedProject"));
				modalAlertCreatedProject.show();
				var alertMessage = '<h5> The new project has been successfully created.</h5> <br>However, it currently has no data. Do you want to upload a data corpus now or later?';
				$('#modalBodyAlertCreatedProject').html("<div class=\"col-12\" style=\"font-size: 1rem;\">" + alertMessage + "</div>");
			}
			else {
				alert(resultObject.error);
				return false;
			}
		},
		error: function(jqXHR, textStatus, errorThrown) {
			alert('ERRORS: ' + ':' + textStatus);
		}
	});
}


// if the user chooses to upload data immediately after the project is created 
$("#btnUploadDataNow").click(function() {
	$("#modalAlertCreatedProject").modal('hide');
	var modalUploadDataProject = new bootstrap.Modal($("#modalUploadDataProject"));
	modalUploadDataProject.show();
	$('#inputUploadFile').val('');
	currentProjName = projName;
})


// if the user chooses to upload data later
$("#btnUploadDataLater").click(function() {
	$("#modalAlertCreatedProject").modal('hide');
	$("#createProjectPage").fadeOut(500);
	setTimeout(loadStartProjectPage, 550);
})


// response function for clicking the "close" button when the project is updated successfully 
$("#btnFinishEditingProject").click(function() {
	$("#modalEditProject").modal('hide');
	$("#createProjectPage").fadeOut(500);
	setTimeout(loadStartProjectPage, 550);
})


// response function for editing an existing project
function requestEditProject(oldProjName, newProjName, projGeo, categorySchema, annotatorNumber, batchNumber) {
	$.ajax({
		url: 'ProjectServlet',
		type: 'GET',
		data: { action: "editProject", oldProjName: oldProjName, newProjName: newProjName, geoScope: encodeURIComponent(JSON.stringify(projGeo)), categorySchema: encodeURIComponent(JSON.stringify(categorySchema)), annotatorNumber: annotatorNumber, batchNumber: batchNumber },
		dataType: 'text',
		success: function(result, textStatus, jqXHR) {
			var resultObject = JSON.parse(result);
			if (resultObject.status == "success") {
				// show a modal to remind the user that the project information has been updated
				var modalEditProject = new bootstrap.Modal($("#modalEditProject"));
				modalEditProject.show();
				var alertMessage = "Your project has been successfully updated.";
				$("#modalBodyEditProject").html("<div id=\"divAlertForEditProject\" class=\"col-12\" style=\"font-size: 1rem;\">" + alertMessage + "</div>");
				currentProjName = newProjName;
			}
			else {
				alert(resultObject.error);
				return false;
			}
		},
		error: function(jqXHR, textStatus, errorThrown) {
			alert('ERRORS: ' + ':' + textStatus);
		}
	});
}


// uploading data for a project.
$("#btnUploadData").click(function() {
	var projName = $("#inputProjectName").val();
	var dataFile = $("#inputUploadFile").get(0).files[0];

	const divUploadData = $('#divUploadData');

	if (dataFile.length == 0) {
		alert("Please first select the file for data.");
		return false;
	}
	else {
		// disable the button to prevent the user clicking this button again during data uploading
		$("#btnUploadData").prop('disabled', true);

		var corpus_data = new FormData();
		corpus_data.append('dataFile', dataFile);
		corpus_data.append('projName', projName);

		$.ajax({
			url: 'CorpusUploadServlet',
			type: 'POST',
			data: corpus_data,
			cache: false,
			dataType: 'text',
			processData: false,
			contentType: false,
			success: function(result, textStatus, jqXHR) {
				// parse returned json message 
				var resultObject = JSON.parse(result);
				if (resultObject.status == "success") {
					$("#modalUploadDataProject").modal('hide');
					var modalUploadedData = new bootstrap.Modal($("#modalUploadedData"));
					modalUploadedData.show();
					$("#modalBodyUploadedDataProject").html("<div id=\"divAlertForUploadedData\" class=\"col-12\" style=\"font-size: 1rem;\">" + resultObject.message + "</div>");
				}
				// if the format of the data uploaded is not consistent with the format GALLOC recommends
				else if (resultObject.status == "incorrectFormat") {
					$("#modalUploadDataProject").modal('hide');
					var modalIncorrectUploadingDataFormat = new bootstrap.Modal($("#modalIncorrectUploadingDataFormat"));
					modalIncorrectUploadingDataFormat.show();
					$('#modalBodyIncorrectUploadingDataFormat').html(resultObject.error + " You can check the format that GALLOC requires for the data of text messages in the user manual.");
				}
				else {
					alert(resultObject.error);
				}
				// re-enable the button 
				$("#btnUploadData").prop('disabled', false);
			},
			error: function(jqXHR, textStatus, errorThrown) {
				alert('ERRORS: ' + ':' + textStatus);
				// re-enable the button
				$("#btnUploadData").prop('disabled', false);
			}
		});
	}
});


// close the modal for reminding the user that the data format is incorrect
$("#btnCloseModalIncorrectFormat").click(function() {
	if (currentPage == "createProjectPage") {
		var modalUploadDataProject = new bootstrap.Modal($("#modalUploadDataProject"));
		modalUploadDataProject.show();
		$('#inputUploadFile').val('');
	}
})


// close the modal for telling the user that the data is uploaded
$("#btnClosingModalUploadedData").click(function() {
	$("#modalUploadedData").modal('hide');
	$("#createProjectPage").fadeOut(500);
	setTimeout(loadStartProjectPage, 550);
})