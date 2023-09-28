/**
 * This is the JavaScript file for the "createProject" page.
 */

currentProjName = "";

/*---the element for adding or removing options---*/
selectOptionOperation('#addNewCategory', '#btnCategoryRemove', '#selectAllCategoriesAdded', '#inputNewCategory', 'Please enter the category.');


$('#inputProjectName').on('input', function() {
	const projName = $(this).val();
	projName = projName.replace("'","''");
	$.ajax({
		url: 'ProjectServlet',
		type: 'GET',
		data: { action: "isProjectExists", projName: encodeURIComponent(projName) },
		dataType: 'text',
		success: function(result, textStatus, jqXHR) {
			var resultObject = JSON.parse(result);
			if (resultObject.status == "success") {
				$("#divAlertIsProjectExists").html("");
			}
			else {
				$("#divAlertIsProjectExists").html(resultObject.error);
			}
		},
		error: function(jqXHR, textStatus, errorThrown) {
			alert('ERRORS: ' + ':' + textStatus);
		}
	});
});


$('#btnCancelCreateProjectAction').click(function() {
	$("#createProjectPage").fadeOut(500);
	setTimeout(loadStartProjectPage, 550);
})


$("#btnCreateProjectAction").click(function() {
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

	var newProjInfo = "";
	newProjInfo = projName + "_" + JSON.stringify(projGeo) + "_" + JSON.stringify(categorySchema) + "_" + annotatorNumber + "_" + batchNumber;
	var oldProjName = oldProjInfo.split("_")[0];

	if ($("#selectAllCategoriesAdded").children("option").length == 0) {
		$("#btnNocategory").off("click");
		var modalAlertForNoCategory = new bootstrap.Modal($("#modalAlertForNoCategory"));
		modalAlertForNoCategory.show();
	} else {
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


function requestCreatProject(projName, projGeo, creator, categorySchema, annotatorNumber, batchNumber) {
	$.ajax({
		url: 'ProjectServlet',
		type: 'GET',
		data: { action: "createProject", projName: encodeURIComponent(projName), geoScope: encodeURIComponent(JSON.stringify(projGeo)), creator: creator, categorySchema: encodeURIComponent(JSON.stringify(categorySchema)), annotatorNumber: annotatorNumber, batchNumber: batchNumber },
		dataType: 'text',
		success: function(result, textStatus, jqXHR) {
			var resultObject = JSON.parse(result);
			if (resultObject.status == "success") {
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


$("#btnUploadDataNow").click(function() {
	$("#modalAlertCreatedProject").modal('hide');
	var modalUploadDataProject = new bootstrap.Modal($("#modalUploadDataProject"));
	modalUploadDataProject.show();
	if ($("#divAlertForUploadingData").length) {
		$("#divAlertForUploadingData").remove();
	};
	$('#inputUploadFile').val('');
	currentProjName = projName;
})


$("#btnUploadDataLater").click(function() {
	$("#modalAlertCreatedProject").modal('hide');
	$("#createProjectPage").fadeOut(500);
	setTimeout(loadStartProjectPage, 550);
})


$("#btnFinishEditingProject").click(function() {
	$("#modalEditProject").modal('hide');
	$("#createProjectPage").fadeOut(500);
	setTimeout(loadStartProjectPage, 550);
})


function requestEditProject(oldProjName, newProjName, projGeo, categorySchema, annotatorNumber, batchNumber) {
	$.ajax({
		url: 'ProjectServlet',
		type: 'GET',
		data: { action: "editProject", oldProjName: oldProjName, newProjName: encodeURIComponent(newProjName), geoScope: encodeURIComponent(JSON.stringify(projGeo)), categorySchema: encodeURIComponent(JSON.stringify(categorySchema)), annotatorNumber: annotatorNumber, batchNumber: batchNumber },
		dataType: 'text',
		success: function(result, textStatus, jqXHR) {
			var resultObject = JSON.parse(result);
			if (resultObject.status == "success") {
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


// Uploading data for a project.
$("#btnUploadData").click(function() {
	var projName = $("#inputProjectName").val();
	var dataFile = $("#inputUploadFile").get(0).files[0];

	const divUploadData = $('#divUploadData');

	if (dataFile.length == 0) {
		alert("Please first select the file for data.");
		return false;
	}
	else {
		// disable the submit button to prevent the user clicking this button again during data uploading
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
					//alert(resultObject.message);
					$("#modalUploadDataProject").modal('hide');
					var modalUploadedData = new bootstrap.Modal($("#modalUploadedData"));
					modalUploadedData.show();
					$("#modalBodyUploadedDataProject").html("<div id=\"divAlertForUploadedData\" class=\"col-12\" style=\"font-size: 1rem;\">" + resultObject.message + "</div>");
				}
				else {
					//alert(resultObject.error);
					var modalUploadedData = new bootstrap.Modal($("#modalUploadedData"));
					modalUploadedData.show();
					$("#modalBodyUploadedDataProject").html("<div id=\"divAlertForUploadedData\" class=\"col-12\" style=\"font-size: 1rem;\">" + resultObject.error + "</div>");
				}
				// re-enable the submit button 
				$("#btnUploadData").prop('disabled', false);
			},
			error: function(jqXHR, textStatus, errorThrown) {
				alert('ERRORS: ' + ':' + textStatus);
				// re-enable the submit button 
				$("#btnUploadData").prop('disabled', false);
			}
		});
	}
});


$("#btnClosingModalUploadedData").click(function() {
	$("#modalUploadedData").modal('hide');
	$("#createProjectPage").fadeOut(500);
	setTimeout(loadStartProjectPage, 550);
})