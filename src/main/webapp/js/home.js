/**
 * This is the JavaScript file for the "startProject" page.
 */


var mapGeoCoords;
var projGeoScopeMap;
var divProjectList = $('#divProjectList');
var currentProjName = "";
var editOrCreate;
var oldProjInfo = "";
var messagesOneBatch = [];
var batchMsgIDs = [];
var batchMsgIDsForLabel = new Set();
var previousMsgs = [];
var currentMsgID = "";
var currentMsgText = "";
var loadFirstMsg;
var isAnnotator = false;
var hasData = false;
var drawnItemsForAnnotations;
var mapForAnnotations;
var currentBatchNumber = 0;
var updateUserList = [];
var deleteUserList = [];


$("#createNewProject").click(function() {
	editOrCreate = "create";
	$("#startProjectPage").fadeOut(500);
	setTimeout(loadCreateProjectPage, 550);
});


$("#btnStartAnnotating").click(function() {
	$("#startProjectPage").fadeOut(500);
	setTimeout(loadAnnotationPage, 550);
});


$("#btnStartResolving").click(function() {
	$("#startProjectPage").fadeOut(500);
	setTimeout(loadResolveAnnotationPage, 550);
});


function loadCreateProjectPage() {
	toggleCreatePage(false);
	$("#createProjectPage").css("display", "flex");
	naviForPage = "createProjectPage";
	dynamicalNaviBar(naviForPage);
	$("#inputProjectName").val("");
	$("#btnCreateProjectAction").html("Create");
	$("#radioSelectState").prop('checked', false);
	$("#radioDrawScope").prop('checked', true);
	$("#optionStateDefault").prop('selected', true);
	$("#inputNewCategory").val("");
	$("#selectAllCategoriesAdded").html("");
	$("#inputNumAnnotator").val("2");
	$("#inputBatchNumber").val("10");
	$("divAlertIsProjectExists").html("");

	if ($(window).width() < 1400) {
		$("#selectAllCategoriesAdded").prop("size", 3);
	} else {
		$("#selectAllCategoriesAdded").prop("size", 5);
	}

	$('#divMapContainerForCreateProject').html("<div id='divMapForCreateProject' style='width: 100%; height: 100%;'></div>");
	addMap('divMapForCreateProject', 'project');

	currentPage = "createProjectPage";
	currentProjName = "";
}


/*function loadAnnotationPage() {
	$("#annotationPage").css("display", "flex");
	naviForPage = "annotationPage";
	dynamicalNaviBar(naviForPage);
	$("#checkPreAnnotation").prop('checked', true);
	$("#optionCategoryDefault").prop('selected', true);
	$("#inputTemporaryCategory").val("");
	$("#optionGeometryDefault").prop('selected', true);

	$('#divMapContainerForAnnotation').html("<div id='divMapForAnnotation' style='width: 100%; height: 80%;'></div>");
	addMap('divMapForAnnotation', 'annotation');

	currentPage = "annotationPage";
}*/


divProjectList.on('click', 'button', function(event) {
	if (btnForResolveProjectList.indexOf(event.target.id) != -1) {
		/*setTimeout(function() {
			var projName = $(event.target).attr('id').split("_")[1];
			currentProjName = projName;
			$("#spanResolveProjectName").html(projName);
			getResolveAnnotations(projName)
				.then(function(diffAnnosForOneMsg) {
					$("#startProjectPage").fadeOut(500);
					resetResolveParameter();
					var Annotations = diffAnnosForOneMsg.Annotation;
					var annotatorList = [];
					for (var i = 0; i < Annotations.length; i++) {
						annotatorList.push(Annotations[i].Annotator);
					}
					loadResolveAnnotationPage(annotatorList, projName);
					//getPreAnnotatorsList(projName, "selectPreAnnotatorForResolve");
					showDifferentAnnos(diffAnnosForOneMsg, projName);
				})
				.catch(function(error) {
					if (error == "noDisagreements") {
						var modalNoDisagreementsHome = new bootstrap.Modal($("#modalNoDisagreementsHome"));
						modalNoDisagreementsHome.show();
						$('#modalBodyNoDisagreementsHome').html("<div class=\"col-12\" style=\"font-size: 1rem;\">All disagreements in annotation have been resolved.</div>");
					} else {
						alert('ERROR: ' + error);
					}											
				});
			currentPage = "resolveAnnotationPage";
		}, 550);*/

		var projName = $(event.target).attr('id').split("_")[1];
		currentProjName = projName;
		getResolveAnnotations(projName)
			.then(function(diffAnnosForOneMsg) {
				$("#startProjectPage").fadeOut(500);
				setTimeout(function() {
					resetResolveParameter();
					var Annotations = diffAnnosForOneMsg.Annotation;
					var annotatorList = [];
					for (var i = 0; i < Annotations.length; i++) {
						annotatorList.push(Annotations[i].Annotator);
					}
					loadResolveAnnotationPage(annotatorList, projName);
					$("#spanResolveProjectName").html(projName);
					//getPreAnnotatorsList(projName, "selectPreAnnotatorForResolve");
					showDifferentAnnos(diffAnnosForOneMsg, projName);
					currentPage = "resolveAnnotationPage";
				}, 550);
			})
			.catch(function(error) {
				if (error == "noDisagreements") {
					var modalNoDisagreementsHome = new bootstrap.Modal($("#modalNoDisagreementsHome"));
					modalNoDisagreementsHome.show();
					$('#modalBodyNoDisagreementsHome').html("<div class=\"col-12\" style=\"font-size: 1rem;\">All disagreements in annotation have been resolved.</div>");
				} else {
					alert('ERROR: ' + error);
				}
			});
	}
})


function loadResolveAnnotationPage(annotatorList, projName) {
	$("#resolveAnnotationPage").css("display", "flex");
	$("#resolveAnnotation").css("display", "none");
	$("#divDiffAnnotations").css("display", "flex");
	naviForPage = "resolveAnnotationPage";
	annotateOrResolve = "Resolve";
	dynamicalNaviBar(naviForPage);

	buildContainerForDifferentAnnos(annotatorList);

	/*resolveHtml = ""
	resolveHtml += "<div class=\"col-12\" style=\"position: sticky;\">"
	resolveHtml += "<div class=\"mb-2 row d-flex justify-content-center\">"
	resolveHtml += "<label style=\"font-weight: bold;\">Resolve annotations</label>"
	resolveHtml += "</div>"
	resolveHtml += "<div id=\"mapForResolving\" class=\"mb-2 col-12\"></div>"
	resolveHtml += "<div class=\"mb-2 d-flex align-items-center justify-content-center\">"
	resolveHtml += "<div class=\"card col-12\">"
	resolveHtml += "<div class=\"card-body\">"
	resolveHtml += "<p id=\"resolveMsg\" class=\"card-text\"></p>"
	resolveHtml += "</div></div></div>"
	resolveHtml += "<div class=\"mb-2 row d-flex align-items-center justify-content-center\">"
	resolveHtml += "<div class=\"col-5\"> <label class=\"form-select-label\" for=\"selectCategoryForRevolve\" style=\"font-weight: bold;\">Category</label> </div>"
	resolveHtml += "<div class=\"col-7\"> <select class=\"form-select\" id=\"selectCategoryForRevolve\"> <option selected>Choose...</option> <option>C1: House number addresses</option> <option>C2: Street names</option> <option>C3: Highways</option> <option>C4: Exits of highways</option> <option>C5: Intersections of roads (or rivers)</option> <option>C6: Natural features</option> <option>C7: Other humanmade features</option> <option>C8: Local organizations</option> <option>C9: Administrative units</option> <option>C10: Multiple areas</option> <option>C11:</option> </select> </div>"
	resolveHtml += "</div>"
	resolveHtml += "<div class=\"mb-2 row d-flex align-items-center\"> <span class=\"col-8\" style=\"font-weight: bold;\">Spatial footprint:</span> </div>"
	resolveHtml += "<div class=\"mb-4 row d-flex align-items-center justify-content-center\"> <div class=\"col-2\"> <label>Type:</label> </div>"
	resolveHtml += "<div class=\"col-5\"> <select class=\"form-select\" id=\"selectGeometryType\"> <option selected>Choose...</option> <option>point</option> <option>polyline</option> <option>polygon</option> </select> </div>"
	resolveHtml += "<div class=\"col-5\"> <button type=\"button\" class=\"btn btn-primary float-end\">Draw on map</button> </div> </div>"
	resolveHtml += "<div class=\"row d-flex justify-content-center\"> <div class=\"d-grid col-3\"> <button type=\"button\" class=\"btn btn-primary float-end\" id=\"annotationSave\">Save</button> </div> <div class=\"d-grid col-3\"> <button type=\"submit\" class=\"btn btn-primary float-start\" id=\"annotationSubmit\">Submit</button> </div> </div>"
	resolveHtml += "</div>"*/
	//$('#resolveAnnotation').html(resolveHtml);
	/*for (var i = 0; i < numofAnnotators; i++) {
		$("#mapForAnnotation" + (i + 1)).height($("#mapForAnnotation" + (i + 1)).width());
		addMap('mapForAnnotation' + (i + 1), 'annotation');
	}
	$("#mapForResolving").height($("#mapForResolving").width());
	addMap('mapForResolving', 'annotation');*/

	currentProjName = projName;
	currentPage = "resolveAnnotationPage";
}


function addMap(divID, mapTaskType) {
	if (mapTaskType == "project") {
		drawTools = { polygon: true, marker: false, circle: false, circlemarker: false, rectangle: true, polyline: false }
	} else {
		drawTools = { marker: true, polyline: true, polygon: true, circle: false, circlemarker: false, rectangle: false }
	}

	var map = L.map(divID).setView([43.008, -78.785], 13);
	map.invalidateSize();
	L.tileLayer(
		'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
		{
			maxZoom: 19,
			attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
		}).addTo(map);

	var drawnItems = new L.FeatureGroup();
	map.addLayer(drawnItems);
	var drawControl = new L.Control.Draw({
		edit: {
			featureGroup: drawnItems
		},
		draw: drawTools
	});

	if (mapTaskType == "project" || mapTaskType == "resolve" || mapTaskType == "annotation") {
		map.addControl(drawControl);

		var searchControl = L.Control.geocoder({
			geocoder: L.Control.Geocoder.nominatim(),
			defaultMarkGeocode: false,
		}).addTo(map);

		searchControl.on('markgeocode', function(event) {
			var center = event.geocode.center;
			map.setView(center, 13);
		});
	}

	if (mapTaskType != "project") {
		var drawToolbarContainer = $('#' + divID + ' .leaflet-draw-toolbar');
		var drawButtons = drawToolbarContainer.find('a.leaflet-draw-draw-marker, a.leaflet-draw-draw-polyline, a.leaflet-draw-draw-polygon').toArray();
		var firstButton = drawButtons[0];
		var thirdButton = drawButtons[2];
		$(thirdButton).insertBefore(firstButton);
	}

	map.on(L.Draw.Event.CREATED, function(event) {
		var layer = event.layer;
		if (mapTaskType == "annotation" && currentWorkingSpanID != "") {
			layer.options.id = currentWorkingSpanID;
		}

		if (mapTaskType == "resolve" && currentWorkingSpanIDResolve != "") {
			layer.options.id = currentWorkingSpanIDResolve;
		}

		if (layer instanceof L.Polyline || layer instanceof L.Polygon) {
			layer.setStyle({
				opacity: 1,
				weight: 3
			});
		}

		drawnItems.addLayer(layer);
		mapGeoCoords = { type: "FeatureCollection", features: [{ type: "Feature", geometry: layer.toGeoJSON().geometry, properties: {} }] };
		if (mapTaskType == "project") {
			projGeoScopeMap = mapGeoCoords;
		}
	});

	map.on(L.Draw.Event.EDITED, function(event) {
		var layers = event.layers;
		var features = [];

		layers.eachLayer(function(layer) {
			drawnItems.addLayer(layer);
			features.push({
				type: "Feature",
				geometry: layer.toGeoJSON().geometry,
				properties: {}
			});
		});

		mapGeoCoords = { type: "FeatureCollection", features: features };
		if (mapTaskType == "project") {
			projGeoScopeMap = mapGeoCoords;
		}
	});

	map.on(L.Draw.Event.DELETED, function(event) {
		mapGeoCoords = undefined;
		if (mapTaskType == "project") {
			projGeoScopeMap = mapGeoCoords;
		}
	});

	return [map, drawnItems, drawControl, searchControl];
}


$("#btnNameForAddingProject").click(function() {
	var username = currentUser;
	var projName = $("#inputNameForAddingProject").val();

	if ($("#divAlertForAddingProject").length) {
		$("#divAlertForAddingProject").remove();
	}

	const divNameForAddingProject = $('#divNameForAddingProject');

	if (projName == "") {
		let alertMessage = "Please input the project name you want to add."
		divAlertForAddingProject = $("<div id=\"divAlertForAddingProject\" class=\"col-5\" style=\"color: red; font-size: 12px;\">" + alertMessage + "</div>");
		divNameForAddingProject.after(divAlertForAddingProject);
		return false;
	}

	var projectNamesList = [];
	var cells = document.querySelectorAll('table tr td');
	cells.forEach(function(cell) {
		if (cell.cellIndex === 1) {
			projectNamesList.push(cell.textContent);
		}
	});

	if (projectNamesList.includes(projName)) {
		alertMessage = "You have already been the administrator or an annotator for this project."
		divAlertForAddingProject = $("<div id=\"divAlertForAddingProject\" class=\"col-5\" style=\"color: red; font-size: 12px;\">" + alertMessage + "</div>");
		divNameForAddingProject.after(divAlertForAddingProject);
		$("#inputNameForAddingProject").val('');
		return false;
	}

	$.ajax({
		url: 'ProjectServlet',
		type: 'GET',
		data: { action: "addUserToProject", username: username, role: "annotator", projName: projName },
		dataType: 'text',
		success: function(result, textStatus, jqXHR) {
			var resultObject = JSON.parse(result);
			if (resultObject.status == "success") {
				/*alertMessage = "You have successfully added this project."
				divAlertForAddingProject = $("<div id=\"divAlertForAddingProject\" class=\"col-5\" style=\"color: red; font-size: 12px;\">" + alertMessage + "</div>");
				divNameForAddingProject.after(divAlertForAddingProject);*/
				getProjectsList();
				$("#inputNameForAddingProject").val('');
			}
			else {
				alertMessage = resultObject.error;
				divAlertForAddingProject = $("<div id=\"divAlertForAddingProject\" class=\"col-5\" style=\"color: red; font-size: 12px;\">" + alertMessage + "</div>");
				divNameForAddingProject.after(divAlertForAddingProject);
				$("#inputNameForAddingProject").val('');
			}
		},
		error: function(jqXHR, textStatus, errorThrown) {
			alert('ERRORS: ' + ':' + textStatus);
		}
	});
})


$('#inputNameForAddingProject').focus(function() {
	if ($("#divAlertForAddingProject").length) {
		$("#divAlertForAddingProject").remove();
	}
})


//aForProjectListID = aForProjectList.join(",");
divProjectList.on('click', 'a', function(event) {
	//var $aThis = $(this);

	if (aForProjectList.indexOf(event.target.id) != -1) {
		editOrCreate = "edit";
		if ($('#divMapForCreateProject').length != 0) {
			$('#divMapForCreateProject').remove();
		}
		var projName = $(event.target).html();
		$.ajax({
			url: 'ProjectServlet',
			type: 'GET',
			data: { action: "getProjectInfo", projName: projName },
			dataType: 'text',
			success: function(result, textStatus, jqXHR) {
				var resultObject = JSON.parse(result);
				if (resultObject.status == "success") {
					oldProjInfo = "";
					geoScope = JSON.parse(decodeURIComponent(resultObject.GeoScope));
					categorySchema = JSON.parse(decodeURIComponent(resultObject.categorySchema));
					var annotatorNumber = resultObject.annotatorNumber;
					var batchNumber = resultObject.batchNumber;
					var administrators = resultObject.administrators;
					oldProjInfo = projName + "_" + JSON.stringify(geoScope) + "_" + JSON.stringify(categorySchema) + "_" + annotatorNumber + "_" + batchNumber;

					$("#startProjectPage").fadeOut(500);
					setTimeout(function() {
						$("#createProjectPage").css("display", "flex");
						naviForPage = "createProjectPage";
						dynamicalNaviBar(naviForPage);
						$("#inputProjectName").val(projName);
						$("#btnCreateProjectAction").html("Save");

						$("#inputNewCategory").val("");
						categorySchemaList = Object.values(categorySchema);
						categorySchemaHtml = "";
						for (var i = 0; i < categorySchemaList.length; i++) {
							categorySchemaHtml += '<option value="' + categorySchemaList[i] + '">' + categorySchemaList[i] + '</option>';
						}
						$("#selectAllCategoriesAdded").html(categorySchemaHtml);

						$("#inputNumAnnotator").val(annotatorNumber);
						$("#inputBatchNumber").val(batchNumber);
						$("divAlertIsProjectExists").html("");

						geoScopeType = Object.keys(geoScope)[0];
						geoScopeValue = Object.values(geoScope)[0];
						if (geoScopeType == "State") {
							$("#radioSelectState").prop('checked', true);
							//$('#selectState option[value=geoScopeValue]').prop('selected', true);
							$("#selectState").val(geoScopeValue);
							//var geocoder = L.Control.Geocoder.google({apiKey: 'AIzaSyAOMBkZ6XpE0U45B86LTRpBsZ4gPBNs0dg',});
							//var requestUrl = 'https://geoai.geog.buffalo.edu/nominatim/search?q=' + geoScopeValue + '&limit=5&format=json&&addressdetails=1';
							var geocoder = L.Control.Geocoder.nominatim();
							geocoder.geocode(geoScopeValue, function(results) {
								var bbox = results[0].bbox;
								if (bbox) {
									$('#divMapContainerForCreateProject').html("<div id='divMapForCreateProject' style='width: 100%; height: 100%;'></div>");
									mapValues = addMap('divMapForCreateProject', 'project');
									var map = mapValues[0];
									var drawnItems = mapValues[1];
									var rectangle = L.rectangle(bbox, { color: 'red', weight: 2, opacity: 0.6 })
									rectangle.addTo(drawnItems);
									map.fitBounds(bbox);

									if (!administrators.includes(currentUser)) {
										drawControl = mapValues[2];
										searchControl = mapValues[3];
										map.removeControl(drawControl);
										map.removeControl(searchControl);
									}
								}
							});
						} else {
							$("#radioDrawScope").prop('checked', true);
							$("#optionStateDefault").prop('selected', true);
							//var geojsonLayer = L.geoJSON(geoScopeValue, { style: function(feature) { return { color: 'red', weight: 2, opacity: 0.6 }; } });
							$('#divMapContainerForCreateProject').html("<div id='divMapForCreateProject' style='width: 100%; height: 100%;'></div>");
							mapValues = addMap('divMapForCreateProject', 'project');
							var map = mapValues[0];
							var drawnItems = mapValues[1];
							var polygon = L.GeoJSON.geometryToLayer(geoScopeValue.features[0].geometry);
							polygon.addTo(drawnItems);
							map.fitBounds(polygon.getBounds());

							if (!administrators.includes(currentUser)) {
								drawControl = mapValues[2];
								searchControl = mapValues[3];
								map.removeControl(drawControl);
								map.removeControl(searchControl);
							}

							//drawnItems.addLayer(geojsonLayer);
							//map.fitBounds(geojsonLayer.getBounds());						
							//geojsonLayer.addTo(map);

							/*var geoScopeValueToMap;
							if (geoScopeValue.length == 2) {
								geoScopeValueToMap = L.rectangle(geoScopeValue, { color: "#ff7800", weight: 1 });
							} else {
								geoScopeValueToMap = L.polygon(geoScopeValue, { color: "#ff7800", weight: 1 });
							}
							drawnItems.addLayer(geoScopeValueToMap);
							map.fitBounds(geoScopeValueToMap.getBounds());*/

							/*var centerLatLng = drawnItems.getBounds().getCenter();
							map.setView(centerLatLng, Object.values(geoScope)[1]);*/
						}
						currentPage = "createProjectPage";

						if (!administrators.includes(currentUser)) {
							toggleCreatePage(true);
							drawControl = mapValues[2];
							searchControl = mapValues[3];
							map.removeControl(drawControl);
							map.removeControl(searchControl);
						} else {
							toggleCreatePage(false);
						}
					}, 550);
				}
				else {
					//divAlertForNoProject = $("<div id=\"divAlertForNoProject\" class=\"d-flex align-items-center justify-content-start\" style=\"color: red; font-size: 12px;\">" + resultObject.error + "</div>");
					//$aThis.after(divAlertForNoProject);
					alert('ERRORS: ' + ':' + resultObject.error);
				}
			},
			error: function(jqXHR, textStatus, errorThrown) {
				alert('ERRORS: ' + ':' + textStatus);
			}
		});
	}
})


function checkIsAnnotator(projName) {
	return new Promise((resolve, reject) => {
		$.ajax({
			url: 'ProjectServlet',
			type: 'GET',
			data: { action: "getProjectInfo", projName: projName },
			dataType: 'text',
			success: function(result, textStatus, jqXHR) {
				var resultObject = JSON.parse(result);
				if (resultObject.status == "success") {
					annotatorList = resultObject.annotators;
					if (annotatorList.includes(currentUser)) {
						isAnnotator = true;
						resolve(isAnnotator);
					} else {
						isAnnotator = false;
						resolve(isAnnotator);
					}
					currentProjName = projName;
				}
				else {
					reject('ERRORS: ' + ':' + resultObject.error);
				}
			},
			error: function(jqXHR, textStatus, errorThrown) {
				reject('ERRORS: ' + ':' + textStatus);
			}
		});
	});
}


function checkDataExists(projName) {
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
						hasData = true;
						resolve(hasData);
					} else {
						hasData = false;
						resolve(hasData);
					}
					currentProjName = projName;
				}
				else {
					reject(resultObject.error);
				}
			},
			error: function(jqXHR, textStatus, errorThrown) {
				reject('ERRORS: ' + ':' + textStatus);
			}
		});
	});
}


//btnForAnnotateProjectListID = btnForAnnotateProjectList.join(",");
divProjectList.on('click', 'button', function(event) {
	//var $aThis = $(this);

	if ($('#divMapForAnnotation').length != 0) {
		$('#divMapForAnnotation').remove();
	}

	if (btnForAnnotateProjectList.indexOf(event.target.id) != -1) {
		messagesOneBatch = [];
		loadFirstMsg = false;
		previousMsgs = [];
		nextMsgs = [];
		var projName = $(event.target).attr('id').split("_")[1];

		Promise.all([
			checkDataExists(projName),
			checkIsAnnotator(projName)
		])
			.then(function(results) {
				var hasData_checked = results[0];
				var isAnnotator_checked = results[1];
				if (hasData_checked && isAnnotator_checked) {
					$.ajax({
						url: 'AnnotationServlet',
						type: 'GET',
						data: { action: "getBatchMessages", projName: projName, annotator: currentUser },
						dataType: 'text',
						success: function(result, textStatus, jqXHR) {
							var resultObject = JSON.parse(result);
							if (resultObject.status == "success") {
								loadAnnotationPage(projName);
								hasData = false;
								isAnnotator = false;
							}
							else {
								if (resultObject.status == "noData") {
									alert(resultObject.error);
								} else {
									var modalNoRemainingMsgHome = new bootstrap.Modal($("#modalNoRemainingMsgHome"));
									modalNoRemainingMsgHome.show();
									$('#modalBodyNoRemainingMsgHome').html("<div class=\"col-12\" style=\"font-size: 1rem;\">All messages in the data of this project have been annotated.</div>");
								}
							}
						},
						error: function(jqXHR, textStatus, errorThrown) {
							alert('ERRORS: ' + ':' + textStatus);
						}
					});
				} else if ((!isAnnotator_checked) & hasData_checked) {
					var modalIsAnnotatorData = new bootstrap.Modal($("#modalIsAnnotatorData"));
					modalIsAnnotatorData.show();
					var message = "You are currently not an annotator of this project. Please first add yourself as an annotator before starting to annotate by clicking <a role=\"button\" style=\"text-decoration: underline; color: blue;\" onmouseover=\"this.style.color='red';\" onmouseout=\"this.style.color='blue';\" id= \"a_ManageAnno_" + projName + "\">Manage user</a>.";
					$("#modalBodyIsAnnotatorData").html("<div id=\"divAlertForIsAnnotatorData\" class=\"col-12\" style=\"font-size: 1rem;\">" + message + "</div>");
					return false;
				} else if ((!hasData_checked) & isAnnotator_checked) {
					var modalIsAnnotatorData = new bootstrap.Modal($("#modalIsAnnotatorData"));
					modalIsAnnotatorData.show();
					var message = "There is currently no data in this project. Please first upload data before starting to annotate by clicking <a role=\"button\" style=\"text-decoration: underline; color: blue;\" onmouseover=\"this.style.color='red';\" onmouseout=\"this.style.color='blue';\" id= \"a_UpdateData_" + projName + "\">Update data</a>.";
					$("#modalBodyIsAnnotatorData").html("<div id=\"divAlertForIsAnnotatorData\" class=\"col-12\" style=\"font-size: 1rem;\">" + message + "</div>");
					return false;
				} else {
					var modalIsAnnotatorData = new bootstrap.Modal($("#modalIsAnnotatorData"));
					modalIsAnnotatorData.show();
					var message = "You are currently not an annotator of this project, and there is also no data in this project. Please first add yourself as an annotator and upload data before starting to annotate by clicking <a role=\"button\" style=\"text-decoration: underline; color: blue;\" onmouseover=\"this.style.color='red';\" onmouseout=\"this.style.color='blue';\" id= \"a_ManageAnno_" + projName + "\">Manage users</a> and <a role=\"button\" style=\"text-decoration: underline; color: blue;\" onmouseover=\"this.style.color='red';\" onmouseout=\"this.style.color='blue';\" id= \"a_UpdateData_" + projName + "\">Update data</a>.";
					$("#modalBodyIsAnnotatorData").html("<div id=\"divAlertForIsAnnotatorData\" class=\"col-12\" style=\"font-size: 1rem;\">" + message + "</div>");
					return false;
				}
			})
			.catch(function(error) {
			});
	}
})


function loadAnnotationPage(projName) {
	$("#startProjectPage").fadeOut(500);
	setTimeout(function() {
		resetAnnotationVariable();
		annotateOrResolve = "Annotate";
		$("#annotationPage").css("display", "flex");
		naviForPage = "annotationPage";
		dynamicalNaviBar(naviForPage);
		$("#checkPreAnnotation").prop('checked', true);
		if ($('#optionCategoryDefaultForAnnotation').length) {
			$("#optionCategoryDefaultForAnnotation").prop('selected', true);
		}
		$("#inputTemporaryCategory").val("");
		$("#optionGeometryDefault").prop('selected', true);
		$("#checkPreAnnotation").prop('checked', false);
		$("#selectWebservice").val("default");
		$('input[name="radioSpatialFootprintType"][value="Point"]').prop('checked', true);

		$("#spanAnnoatationProjectName").html(projName);
		$("#spanAnnotatedMessage").css("display", "none");
		$("#checkNoAnnotation").prop('checked', false);

		var projectLists = projAnnotator.concat(projAdministrated);
		for (var i = 0; i < projectLists.length; i++) {
			if (projectLists[i].ProjectName == projName) {
				getPreAnnotatorsList(projName, "selectPreAnnotator");
				categorySchema = JSON.parse(decodeURIComponent(projectLists[i].categorySchema));
				categorySchemaKeys = Object.keys(categorySchema);
				categorySchemaValues = Object.values(categorySchema);
				var categorySchemaHtml = "";
				if (categorySchemaKeys.length > 0) {
					categorySchemaHtml += '<option id="optionCategoryDefaultForAnnotation" value="default" selected>Choose...</option>';
					for (var j = 0; j < categorySchemaKeys.length; j++) {
						categoryWithKey = categorySchemaKeys[j] + ": " + categorySchemaValues[j];
						categorySchemaHtml += '<option value="' + categoryWithKey + '">' + categoryWithKey + '</option>';
					}
				} else if (categorySchemaKeys.length == 0) {
					categorySchemaHtml += '<option value="C: Location" selected>C: Location</option>';
				}
				$("#selectCategoryForAnnotation").html(categorySchemaHtml);

				currentBatchNumber = projectLists[i].batchNumber;

				geoScopeType = Object.keys(JSON.parse(decodeURIComponent(projectLists[i].GeoScope)))[0];
				geoScopeValue = Object.values(JSON.parse(decodeURIComponent(projectLists[i].GeoScope)))[0];

				if (geoScopeType == "State") {
					var geocoder = L.Control.Geocoder.nominatim({ geocodingQueryParams: { "countrycodes": "us" } });
					geocoder.geocode(geoScopeValue, function(results) {
						var bbox = results[0].bbox;
						if (bbox) {
							$('#divMapContainerForAnnotation').html("<div id='divMapForAnnotation' style='width: 100%; height: 100%;'></div>");
							mapValues = addMap('divMapForAnnotation', 'annotation');
							disableMapControls();
							mapForAnnotations = mapValues[0];
							drawnItemsForAnnotations = mapValues[1];
							mapForAnnotations.fitBounds(bbox);
							//currentViewPort = [bbox.getSouthWest().lng, bbox.getSouthWest().lat, bbox.getNorthEast().lng, bbox.getNorthEast().lat];
							currentViewPort = bbox;
						}
					});
				} else {
					$('#divMapContainerForAnnotation').html("<div id='divMapForAnnotation' style='width: 100%; height: 100%;'></div>");
					mapValues = addMap('divMapForAnnotation', 'annotation');
					disableMapControls();
					mapForAnnotations = mapValues[0];
					drawnItemsForAnnotations = mapValues[1];
					var geojsonLayer = L.geoJSON(geoScopeValue);
					//currentViewPort = [geojsonLayer.getBounds().getSouthWest().lng, geojsonLayer.getBounds().getSouthWest().lat, geojsonLayer.getBounds().getNorthEast().lng, geojsonLayer.getBounds().getNorthEast().lat];
					currentViewPort = geojsonLayer.getBounds();
					mapForAnnotations.fitBounds(geojsonLayer.getBounds());
					/*var bounds = L.latLngBounds(geoScopeValue);
					var centerLatLng = bounds.getCenter();
					map.setView(centerLatLng, Object.values(geoScope)[1]);*/
				}
				$("#btnPrevMessage").prop('disabled', true);

				$.ajax({
					url: 'AnnotationServlet',
					type: 'GET',
					data: { action: "getBatchMessages", projName: projName, annotator: currentUser },
					dataType: 'text',
					success: function(result, textStatus, jqXHR) {
						var resultObject = JSON.parse(result);
						if (resultObject.status == "success") {
							showFirstMsg(resultObject.messages);
						}
						else {
							alert(resultObject.error);
						}
					},
					error: function(jqXHR, textStatus, errorThrown) {
						alert('ERRORS: ' + ':' + textStatus);
					}
				});
			}
		}
		currentPage = "annotationPage";
	}, 550);
}


var modalBodyIsAnnotatorData = $("#modalBodyIsAnnotatorData");
modalBodyIsAnnotatorData.on('click', 'a', function() {
	var projName = $(event.target).attr('id').split("_")[2];
	var annotatorOrData = $(event.target).attr('id').split("_")[1];
	if (annotatorOrData == "ManageAnno") {
		$("#modalIsAnnotatorData").modal('hide');
		var userManageModal = new bootstrap.Modal($("#userManageModal"));
		userManageModal.show();
		loadUsers(projName);
	} else if (annotatorOrData == "UpdateData") {
		$("#modalIsAnnotatorData").modal('hide');
		var projectUpdateDataModal = new bootstrap.Modal($("#projectUpdateDataModal"));
		projectUpdateDataModal.show();
		updateDataModal(projName);
	}
});


function showFirstMsg(messages) {
	if (!loadFirstMsg) {
		batchMsgIDs.length = 0;
		for (var i = 0; i < messages.length; i++) {
			var message = {};
			message["messageData"] = JSON.parse(messages[i].MessageData);
			message["messageID"] = messages[i].MessageID;
			batchMsgIDs.push(messages[i].MessageID);
			messagesOneBatch.push(message);
		}
		batchMsgIDsForLabel = new Set(batchMsgIDs);
		currentMsgText = messagesOneBatch[0].messageData.text;
		$("#pMessageContent").html(messagesOneBatch[0].messageData.text);
		currentMsgID = messagesOneBatch[0].messageID;
		loadFirstMsg = true;
	}
}


divProjectList.on('click', 'button', function(event) {
	if (btnForManageUsersList.indexOf(event.target.id) != -1) {
		var projName = $(event.target).attr('id').split("_")[1];
		currentProjName = projName;
		loadUsers(projName);
	}
});


function loadUsers(projName) {
	$("#inputUsernameOfUser").val('');
	$("#optionDefaultRoleType").prop('selected', true);
	updateUserList = [];
	deleteUserList = [];

	$.ajax({
		url: 'ProjectServlet',
		type: 'GET',
		data: { action: "getProjectInfo", projName: projName },
		dataType: 'text',
		success: function(result, textStatus, jqXHR) {
			var resultObject = JSON.parse(result);
			if (resultObject.status == "success") {
				var annotatorList = resultObject.annotators;
				var administratorList = resultObject.administrators;
				var userList = {};
				for (var i = 0; i < annotatorList.length; i++) {
					var element = annotatorList[i];
					if (userList[element]) {
						userList[element].push('annotator');
					} else {
						userList[element] = ['annotator'];
					}
				}
				for (var j = 0; j < administratorList.length; j++) {
					var element = administratorList[j];
					if (userList[element]) {
						userList[element].push('administrator');
					} else {
						userList[element] = ['administrator'];
					}
				}

				var userslistHtml = "";
				userslistHtml += '<table id= "userTable" class="table table-success table-striped"> <thead> <tr> <th scope="col">Username</th> <th scope="col">Roles</th> <th scope="col">Manage</th> </tr> </thead><tbody>';
				for (var user in userList) {
					var roles = userList[user];
					var roleHtml = "";
					if (roles.includes('annotator') && !roles.includes('administrator')) {
						roleHtml = '<input class="form-check-input" value="administrator" type="checkbox" id="checkAdministrator_' + user + '"> <label class="form-check-label" style="margin-right:10px;" for="checkAdministrator_' + user + '">Administrator</label><input class="form-check-input" value="annotator"  type="checkbox" id="checkAnnotator_' + user + '" checked> <label for="checkAnnotator_' + user + '">Annotator</label>';
					} else if (roles.includes('administrator') && !roles.includes('annotator')) {
						roleHtml = '<input class="form-check-input" value="administrator" type="checkbox" id="checkAdministrator_' + user + '" checked> <label class="form-check-label" style="margin-right:10px;" for="checkAdministrator_' + user + '">Administrator</label><input class="form-check-input" value="annotator"  type="checkbox" id="checkAnnotator_' + user + '"> <label for="checkAnnotator_' + user + '">Annotator</label>';
					} else if (roles.includes('administrator') && roles.includes('annotator')) {
						roleHtml = '<input class="form-check-input" value="administrator" type="checkbox" id="checkAdministrator_' + user + '" checked> <label class="form-check-label" style="margin-right:10px;" for="checkAdministrator_' + user + '">Administrator</label><input class="form-check-input" value="annotator"  type="checkbox" id="checkAnnotator_' + user + '" checked> <label for="checkAnnotator_' + user + '">Annotator</label>';
					}
					userslistHtml += '<tr><td>' + user + '</td><td>' + roleHtml + '</td><td><button type="button" class="btn btn-secondary btn-sm" style="margin-right:10px;" id="btnUpdateUser_' + user + '">Update</button><button type="button" class="btn btn-secondary btn-sm" id="btnDelUser_' + user + '">Delete</button></td></tr>';
					updateUserList.push('btnUpdateUser_' + user);
					deleteUserList.push('btnDelUser_' + user);
				}
				userslistHtml += '</tbody></table>';
				$("#divForUserListofProject").html(userslistHtml);

				$.ajax({
					url: 'ProjectServlet',
					type: 'GET',
					data: { action: "getProjectInfo", projName: projName },
					dataType: 'text',
					success: function(result, textStatus, jqXHR) {
						var resultObject = JSON.parse(result);
						if (resultObject.status == "success") {
							var creator = resultObject.creator;
							$("label[for='checkAdministrator_" + creator + "']").html('Creator');
							$("#checkAdministrator_" + creator).prop('disabled', true);
							$("#btnDelUser_" + creator).remove();

							const usernameCells = $("#userTable td:first-child");
							usernameCells.each(function() {
								if ($(this).text() === creator) {
									const targetRow = $(this).parent();
									targetRow.prependTo(targetRow.parent());
									return false;
								}
							});
						}
						else {
							alert('ERRORS: ' + ':' + resultObject.error);
						}
					},
					error: function(jqXHR, textStatus, errorThrown) {
						alert('ERRORS: ' + ':' + textStatus);
					}
				});
				currentProjName = projName;
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


$('#divForUserListofProject').on('click', 'button', function() {
	var $row = $(this).closest('tr');
	var username = $row.find('td:first').text();
	var roles = [];
	var projName = currentProjName;

	$row.find('td:eq(1) input[type="checkbox"]').each(function() {
		if ($(this).is(':checked') && !$(this).is(':disabled')) {
			roles.push($(this).val());
		}
	});

	if (updateUserList.indexOf(event.target.id) != -1) {
		$.ajax({
			url: 'ProjectServlet',
			type: 'GET',
			data: { action: "delUserOfProject", username: username, projName: projName },
			dataType: 'text',
			success: function(result, textStatus, jqXHR) {
				var resultObject = JSON.parse(result);
				if (resultObject.status == "success") {
					if (roles.length > 0) {
						for (var i = 0; i < roles.length; i++) {
							var updatedRolesNum = 0;
							$.ajax({
								url: 'ProjectServlet',
								type: 'GET',
								data: { action: "addUserToProject", username: username, role: roles[i], projName: projName },
								dataType: 'text',
								success: function(result, textStatus, jqXHR) {
									var resultObject = JSON.parse(result);
									if (resultObject.status == "success") {
										updatedRolesNum++;
										if (updatedRolesNum == roles.length) {
											$("#userManageModal").modal('hide');
											var modalUserRoleUpdateDelete = new bootstrap.Modal($("#modalUserRoleUpdateDelete"));
											modalUserRoleUpdateDelete.show();
											$('#modalBodyUserRoleUpdateDelete').html("<div class=\"col-12\" style=\"font-size: 1rem;\">The role(s) of this user has been successfully updated.</div>");
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
						}
					} else {
						$("#userManageModal").modal('hide');
						var modalUserRoleUpdateDelete = new bootstrap.Modal($("#modalUserRoleUpdateDelete"));
						modalUserRoleUpdateDelete.show();
						$('#modalBodyUserRoleUpdateDelete').html("<div class=\"col-12\" style=\"font-size: 1rem;\">The role(s) of this user has been successfully updated.</div>");
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
	}

	if (deleteUserList.indexOf(event.target.id) != -1) {
		$.ajax({
			url: 'ProjectServlet',
			type: 'GET',
			data: { action: "delUserOfProject", username: username, projName: projName },
			dataType: 'text',
			success: function(result, textStatus, jqXHR) {
				var resultObject = JSON.parse(result);
				if (resultObject.status == "success") {
					$("#userManageModal").modal('hide');
					var modalUserRoleUpdateDelete = new bootstrap.Modal($("#modalUserRoleUpdateDelete"));
					modalUserRoleUpdateDelete.show();
					$('#modalBodyUserRoleUpdateDelete').html("<div class=\"col-12\" style=\"font-size: 1rem;\">This user has been successfully removed from the user list of this project.</div>");
				}
				else {
					alert(resultObject.error);
				}
			},
			error: function(jqXHR, textStatus, errorThrown) {
				alert('ERRORS: ' + ':' + textStatus);
			}
		});
	}
});


$('#btnCloseUpdateDelete').click(function() {
	$("#modalUserRoleUpdateDelete").modal('hide');
	var userManageModal = new bootstrap.Modal($("#userManageModal"));
	userManageModal.show();
	var projName = currentProjName;
	loadUsers(projName);
})


$('#btnAddUser').click(function() {
	var username = $("#inputUsernameOfUser").val();
	var projName = currentProjName;
	var role = $("#selectRoleTypeForUser").val().toLowerCase();

	if (username == "" || $("#selectRoleTypeForUser").val() == "default") {
		alert("Please input the username you would like to add and select a role for this user.");
		return false;
	}

	var isExisted = false;

	var existingUsers = {};
	$('#divForUserListofProject table tr:not(:first)').each(function() {
		var username = $(this).find('td:first').text();
		var roles = [];

		$(this).find('td:eq(1) input[type="checkbox"]:checked').each(function() {
			roles.push($(this).val());
		});

		existingUsers[username] = roles;
	});

	for (var user in existingUsers) {
		var rolesOfUser = existingUsers[user];
		if (user == username && rolesOfUser.includes(role)) {
			isExisted = true;
			alert('This user has been an ' + role + ' of this project.');
		}
	}

	if (!isExisted) {
		$.ajax({
			url: 'ProjectServlet',
			type: 'GET',
			data: { action: "addUserToProject", username: username, role: role, projName: projName },
			dataType: 'text',
			success: function(result, textStatus, jqXHR) {
				var resultObject = JSON.parse(result);
				if (resultObject.status == "success") {
					loadUsers(projName);
				}
				else {
					alert(resultObject.error);
				}
			},
			error: function(jqXHR, textStatus, errorThrown) {
				alert('ERRORS: ' + ':' + textStatus);
			}
		});
		$("#inputUsernameOfUser").val('');
		$("#optionDefaultRoleType").prop('selected', true);
	}
})


function toggleCreatePage(isAnnotators) {
	$("#inputProjectName").prop('disabled', isAnnotators);
	$("#inputNewCategory").prop('disabled', isAnnotators);
	$("#radioDrawScope").prop('disabled', isAnnotators);
	$("#radioSelectState").prop('disabled', isAnnotators);
	$("#selectState").prop('disabled', isAnnotators);
	$("#selectAllCategoriesAdded").prop('disabled', isAnnotators);
	$("#inputNumAnnotator").prop('disabled', isAnnotators);
	$("#inputBatchNumber").prop('disabled', isAnnotators);
	$("#btnCategoryRemove").prop('disabled', isAnnotators);
	$("#addNewCategory").prop('disabled', isAnnotators);
	$('#btnShowModalForUploadData').prop('disabled', isAnnotators);
	$('#btnCancelCreateProjectAction').prop('disabled', isAnnotators);
	$('#btnCreateProjectAction').prop('disabled', isAnnotators);
}


divProjectList.on('click', 'button', function(event) {
	if (btnForDelProjectList.indexOf(event.target.id) != -1) {
		var projName = $(event.target).attr('id').split("_")[1];
		currentProjName = projName;
	}
});


$("#btnDelProject").click(function() {
	divForDelProject = $("#divForDelProject");

	$.ajax({
		url: 'ProjectServlet',
		type: 'GET',
		data: { action: "delProject", projName: currentProjName },
		dataType: 'text',
		success: function(result, textStatus, jqXHR) {
			var resultObject = JSON.parse(result);
			if (resultObject.status == "success") {
				$("#delProjectModal").modal('hide');
				var modalDeleteProject = new bootstrap.Modal($("#modalDeleteProject"));
				modalDeleteProject.show();
				$('#modalBodyDeleteProject').html("<div id=\"divAlertForDeletedProject\" class=\"col-12\" style=\"font-size: 1rem;\">" + resultObject.msg + "</div>");
				getProjectsList();
			}
			else {
				alertMessage = resultObject.error;
				divAlertForDelProject = $("<div id=\"divAlertForDelProject\" class=\"col-5\" style=\"color: red; font-size: 12px;\">" + alertMessage + "</div>");
				divForDelProject.after(divAlertForDelProject);
			}
		},
		error: function(jqXHR, textStatus, errorThrown) {
			alert('ERRORS: ' + ':' + textStatus);
		}
	});
})


divProjectList.on('click', 'button', function(event) {
	if (btnForDelProjectList.indexOf(event.target.id) != -1) {
		$("#modalFooterForDleProj").css("display", "flex");
		if ($("#divAlertForDelProject").length) {
			$("#divAlertForDelProject").remove();
		}
	}
});


divProjectList.on('click', 'button', function(event) {
	if (btnForUpdateDataList.indexOf(event.target.id) != -1) {
		/*if ($("#divAlertForUpdateData").length) {
			$("#divAlertForUpdateData").remove();
		};	*/
		var projName = $(event.target).attr('id').split("_")[1];
		updateDataModal(projName);
	}
});


function updateDataModal(projName) {
	$('#inputUpdateFile').val('');
	$.ajax({
		url: 'ProjectServlet',
		type: 'GET',
		data: { action: "isDataExists", projName: projName },
		dataType: 'text',
		success: function(result, textStatus, jqXHR) {
			var resultObject = JSON.parse(result);
			if (resultObject.status == "success") {
				if (resultObject.label == "Yes") {
					var modalMessage = resultObject.msg + " Do you want to replace or delete existing data, or add more data now?";
					$("#btnReplaceData").css("display", "block");
					$("#btnAddData").css("display", "block");
					$("#btnDeleteData").css("display", "block");
					$("#divUploadDataHome").css("display", "none");
				} else {
					var modalMessage = "The project currently has no data. Do you want to upload a data corpus now?";
					$("#btnReplaceData").css("display", "none");
					$("#btnAddData").css("display", "none");
					$("#btnDeleteData").css("display", "none");
					$("#divUploadDataHome").css("display", "block");
				}
				$("#labelForUpdateData").html(modalMessage);
				currentProjName = projName;
			}
			else {
				alert(resultObject.error);
			}
		},
		error: function(jqXHR, textStatus, errorThrown) {
			alert('ERRORS: ' + ':' + textStatus);
		}
	});
}


// Uploading data for a project.
$("#btnUploadDataHome").click(function() {
	var projName = currentProjName;
	var dataFile = $("#inputUpdateFile").get(0).files[0];

	const divUpdateData = $('#divUpdateData');

	if (dataFile == undefined || dataFile.length == 0) {
		alert("Please first select the file for data.");
		return false;
	}
	else {
		// disable the submit button to prevent the user clicking this button again during data uploading
		$("#btnUploadDataHome").prop('disabled', true);

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
					$("#projectUpdateDataModal").modal('hide');
					var modalUpdateData = new bootstrap.Modal($("#modalUpdateData"));
					modalUpdateData.show();
					$('#modalBodyUpdateDataProject').html("<div id=\"divAlertForUpdateData\" class=\"col-12\" style=\"font-size: 1rem;\">" + resultObject.message + "</div>");
					//doAsyncAnnotation(projName);
				}
				else if (resultObject.status == "incorrectFormat") {
					$("#projectUpdateDataModal").modal('hide');
					var modalIncorrectUploadingDataFormat = new bootstrap.Modal($("#modalIncorrectUploadingDataFormat"));
					modalIncorrectUploadingDataFormat.show();
					$('#modalBodyIncorrectUploadingDataFormat').html(resultObject.error + " You can check the format that GALLOC requires for the data of text messages in the page XXX of the Manual.");
				}
				else {
					alert(resultObject.error);
				}
				// re-enable the submit button 
				$("#btnUploadDataHome").prop('disabled', false);
			},
			error: function(jqXHR, textStatus, errorThrown) {
				alert('ERRORS: ' + ':' + textStatus);

				// re-enable the submit button 
				$("#btnUploadDataHome").prop('disabled', false);
			}
		});
	}
});


// add more data for a project.
$("#btnAddData").click(function() {
	var projName = currentProjName;
	var dataFile = $("#inputUpdateFile").get(0).files[0];

	var numExist = $("#labelForUpdateData").html().match(/\d+/g);
	numExist = numExist.map(function(numStr) {
		return parseFloat(numStr);
	});

	const divUpdateData = $('#divUpdateData');

	if (dataFile == undefined || dataFile.length == 0) {
		alert("Please first select the file for data.");
		return false;
	}
	else {
		// disable the submit button to prevent the user clicking this button again during data uploading
		$("#btnAddData").prop('disabled', true);
		$("#btnReplaceData").prop('disabled', true);
		$("#btnDeleteData").prop('disabled', true);

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
					var numNew = resultObject.message.match(/\d+/g);
					numNew = numNew.map(function(numStr) {
						return parseFloat(numStr);
					});
					var numTotal = numExist[0] + numNew[0];
					var totalMsg = "This project currently has " + numTotal + " text messages in total.";
					$("#projectUpdateDataModal").modal('hide');
					var modalUpdateData = new bootstrap.Modal($("#modalUpdateData"));
					modalUpdateData.show();
					$('#modalBodyUpdateDataProject').html("<div id=\"divAlertForUpdateData\" class=\"col-12\" style=\"font-size: 1rem;\">" + resultObject.message + " " + totalMsg + "</div>");
					//doAsyncAnnotation(projName);
				}
				else if (resultObject.status == "incorrectFormat") {
					$("#projectUpdateDataModal").modal('hide');
					var modalIncorrectUploadingDataFormat = new bootstrap.Modal($("#modalIncorrectUploadingDataFormat"));
					modalIncorrectUploadingDataFormat.show();
					$('#modalBodyIncorrectUploadingDataFormat').html(resultObject.error + " You can check the format that GALLOC requires for the data of text messages in the page XXX of the Manual.");
				}
				else {
					alert(resultObject.error);
				}
				// re-enable the submit button 
				$("#btnAddData").prop('disabled', false);
				$("#btnReplaceData").prop('disabled', false);
				$("#btnDeleteData").prop('disabled', false);
			},
			error: function(jqXHR, textStatus, errorThrown) {
				alert('ERRORS: ' + ':' + textStatus);

				// re-enable the submit button 
				$("#btnAddData").prop('disabled', false);
				$("#btnReplaceData").prop('disabled', false);
				$("#btnDeleteData").prop('disabled', false);
			}
		});
	}
});


// replace existing data for a project.
$("#btnReplaceData").click(function() {
	var dataFile = $("#inputUpdateFile").get(0).files[0];

	const divUpdateData = $('#divUpdateData');
	if (dataFile == undefined || dataFile.length == 0) {
		alert("Please first select the file for data.");
		return false;
	} else {
		$("#projectUpdateDataModal").modal('hide');
		var replaceProjectDataModal = new bootstrap.Modal($("#replaceProjectDataModal"));
		replaceProjectDataModal.show();
	}
});


$("#btnConfirmReplaceData").click(function() {
	var projName = currentProjName;
	var dataFile = $("#inputUpdateFile").get(0).files[0];
	// disable the submit button to prevent the user clicking this button again during data uploading
	$("#btnAddData").prop('disabled', true);
	$("#btnReplaceData").prop('disabled', true);
	$("#btnDeleteData").prop('disabled', true);
	// delete the existing data
	$.ajax({
		url: 'ProjectServlet',
		type: 'GET',
		data: { action: "deleteData", projName: projName },
		dataType: 'text',
		success: function(result, textStatus, jqXHR) {
			var resultObject = JSON.parse(result);
			if (resultObject.status == "success") {
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
							$("#replaceProjectDataModal").modal('hide');
							var modalUpdateData = new bootstrap.Modal($("#modalUpdateData"));
							modalUpdateData.show();
							$('#modalBodyUpdateDataProject').html("<div id=\"divAlertForUpdateData\" class=\"col-12\" style=\"font-size: 1rem;\">" + resultObject.message + "</div>");
							//doAsyncAnnotation(projName);
							//doAsyncAnnotation(projName);
						}
						else if (resultObject.status == "incorrectFormat") {
							$("#projectUpdateDataModal").modal('hide');
							var modalIncorrectUploadingDataFormat = new bootstrap.Modal($("#modalIncorrectUploadingDataFormat"));
							modalIncorrectUploadingDataFormat.show();
							$('#modalBodyIncorrectUploadingDataFormat').html(resultObject.error + " You can check the format that GALLOC requires for the data of text messages in the page XXX of the Manual.");
						}
						else {
							alert(resultObject.error);
						}
						// re-enable the submit button 
						$("#btnAddData").prop('disabled', false);
						$("#btnReplaceData").prop('disabled', false);
						$("#btnDeleteData").prop('disabled', false);
					},
					error: function(jqXHR, textStatus, errorThrown) {
						alert('ERRORS: ' + ':' + textStatus);
						// re-enable the submit button 
						$("#btnAddData").prop('disabled', false);
						$("#btnReplaceData").prop('disabled', false);
						$("#btnDeleteData").prop('disabled', false);
					}
				});
			}
			else {
				alert(resultObject.error);
			}
		},
		error: function(jqXHR, textStatus, errorThrown) {
			alert('ERRORS: ' + ':' + textStatus);
		}
	});
})


$("#btnCancelReplaceData").click(function() {
	$("#replaceProjectDataModal").modal('hide');
	var projectUpdateDataModal = new bootstrap.Modal($("#projectUpdateDataModal"));
	projectUpdateDataModal.show();
})


$("#btnDeleteData").click(function() {
	$("#projectUpdateDataModal").modal('hide');
	var delProjectDataModal = new bootstrap.Modal($("#delProjectDataModal"));
	delProjectDataModal.show();
});


$("#btnConfirmDelData").click(function() {
	var projName = currentProjName;
	const divUpdateData = $('#divUpdateData');

	// disable the submit button to prevent the user clicking this button again during data uploading
	$("#btnAddData").prop('disabled', true);
	$("#btnReplaceData").prop('disabled', true);
	$("#btnDeleteData").prop('disabled', true);
	// delete the existing data
	$.ajax({
		url: 'ProjectServlet',
		type: 'GET',
		data: { action: "deleteData", projName: projName },
		dataType: 'text',
		success: function(result, textStatus, jqXHR) {
			var resultObject = JSON.parse(result);
			if (resultObject.status == "success") {
				$("#delProjectDataModal").modal('hide');
				var modalUpdateData = new bootstrap.Modal($("#modalUpdateData"));
				modalUpdateData.show();
				$('#modalBodyUpdateDataProject').html("<div id=\"divAlertForUpdateData\" class=\"col-12\" style=\"font-size: 1rem;\">" + resultObject.success + "</div>");
				//doAsyncAnnotation(projName);
			}
			else {
				alert(resultObject.error);
			}
			$("#btnAddData").prop('disabled', false);
			$("#btnReplaceData").prop('disabled', false);
			$("#btnDeleteData").prop('disabled', false);
		},
		error: function(jqXHR, textStatus, errorThrown) {
			alert('ERRORS: ' + ':' + textStatus);
		}
	});
})


$("#btnCancelDelData").click(function() {
	$("#delProjectDataModal").modal('hide');
	var projectUpdateDataModal = new bootstrap.Modal($("#projectUpdateDataModal"));
	projectUpdateDataModal.show();
})


divProjectList.on('click', 'button', function(event) {
	if (btnForDownloadList.indexOf(event.target.id) != -1) {
		var modalDownloadCorpus = new bootstrap.Modal($("#modalDownloadCorpus"));
		modalDownloadCorpus.show();
		var alertMessage = 'GALLOC offers two annotation datasets. One contains only the consistent or resolved annotation for each message, and the other one contains all annotations. Which one do you want to download?';
		$('#modalBodyDownloadCorpus').html("<div class=\"col-12\" style=\"font-size: 1rem;\">" + alertMessage + "</div>");

		currentProjName = $(event.target).attr('id').split("_")[1];
	}
})


$("#btnDLCorpusAll").click(function() {
	$.ajax({
		url: 'AnnotationServlet',
		type: 'GET',
		data: { action: "downloadAnnotationsAll", projName: currentProjName },
		dataType: 'text',
		success: function(result, textStatus, jqXHR) {
			var resultObject = JSON.parse(result);
			if (resultObject.status == "success") {
				var jsonArrayAnnotations = resultObject.success;
				var fileContent = '';
				jsonArrayAnnotations.forEach(function(jsonObj) {
					var jsonString = JSON.stringify(jsonObj);
					fileContent += jsonString + '\n';
				});
				var blob = new Blob([fileContent], { type: 'application/json' });
				var link = document.createElement('a');
				link.href = URL.createObjectURL(blob);
				link.download = currentProjName + '_All.json';
				link.click();
				URL.revokeObjectURL(link.href);
			}
			else {
				alert(resultObject.error);
			}
		},
		error: function(jqXHR, textStatus, errorThrown) {
			alert('ERRORS: ' + ':' + textStatus);
		}
	});
})


$("#btnDLCorpusOnlyResolved").click(function() {
	$.ajax({
		url: 'AnnotationServlet',
		type: 'GET',
		data: { action: "downloadAnnotationsResolved", projName: currentProjName },
		dataType: 'text',
		success: function(result, textStatus, jqXHR) {
			var resultObject = JSON.parse(result);
			if (resultObject.status == "success") {
				var jsonArrayAnnotations = resultObject.success;
				var fileContent = '';
				jsonArrayAnnotations.forEach(function(jsonObj) {
					var jsonString = JSON.stringify(jsonObj);
					fileContent += jsonString + '\n';
				});
				var blob = new Blob([fileContent], { type: 'application/json' });
				var link = document.createElement('a');
				link.href = URL.createObjectURL(blob);
				link.download = currentProjName + '_Consistent.json';
				link.click();
				URL.revokeObjectURL(link.href);
			}
			else {
				alert(resultObject.error);
			}
		},
		error: function(jqXHR, textStatus, errorThrown) {
			alert('ERRORS: ' + ':' + textStatus);
		}
	});
})


divProjectList.on('click', 'button', function(event) {
	if (btnForCheckStatusList.indexOf(event.target.id) != -1) {
		var projName = $(event.target).attr('id').split("_")[1];
		$.ajax({
			url: 'AnnotationServlet',
			type: 'GET',
			data: { action: "checkStatus", projName: projName },
			dataType: 'text',
			success: function(result, textStatus, jqXHR) {
				var resultObject = JSON.parse(result);
				if (resultObject.status == "success") {
					var msgCount = resultObject.msgCount;
					var msgSufficientAnnotationCount = resultObject.msgSufficientAnnotationCount;
					var msgInSufficientAnnotationCount = resultObject.msgInSufficientAnnotationCount;
					var msgResolvedOrSame = resultObject.msgResolvedOrSame;
					var msgNeedingResolved = resultObject.msgNeedingResolved;
					var statusHtml = '<ul class="list-unstyled"><ul>';
					statusHtml += '<li>Total messages: ' + msgCount + '</li>';
					statusHtml += '<li>Messages with sufficient annotations: ' + msgSufficientAnnotationCount + '</li>';
					statusHtml += '<li>Messages that need more annotations: ' + msgInSufficientAnnotationCount + '</li>';
					statusHtml += '<li>Messages that need to be resolved: ' + msgNeedingResolved + '</li>';
					//statusHtml += '<li>The number of text messages with sufficient annotations which still need to be resolved is ' + msgNeedingResolved + '.</li>';
					statusHtml += '</ul></ul>';
					$('#modalBodyStatusProject').html(statusHtml);
				}
				else {
					alert(resultObject.error);
				}
			},
			error: function(jqXHR, textStatus, errorThrown) {
				alert('ERRORS: ' + ':' + textStatus);
			}
		});
	}
});


function disableMapControls() {
	$("a.leaflet-draw-draw-marker").each(function() {
		$(this).addClass("leaflet-disabled");
		$(this).attr("title", "Please first select the location description text.");
		$(this).css("pointer-events", "none");
	});

	$("a.leaflet-draw-draw-polyline").each(function() {
		$(this).addClass("leaflet-disabled");
		$(this).attr("title", "Please first select the location description text.");
		$(this).css("pointer-events", "none");
	});

	$("a.leaflet-draw-draw-polygon").each(function() {
		$(this).addClass("leaflet-disabled");
		$(this).attr("title", "Please first select the location description text.");
		$(this).css("pointer-events", "none");
	});
}


function enableMapControls() {
	$("a.leaflet-draw-draw-marker").each(function() {
		$(this).removeClass("leaflet-disabled");
		$(this).attr("title", "Draw a marker.");
		$(this).css("pointer-events", "auto");
	});

	$("a.leaflet-draw-draw-polyline").each(function() {
		$(this).removeClass("leaflet-disabled");
		$(this).attr("title", "Draw a polyline.");
		$(this).css("pointer-events", "auto");
	});

	$("a.leaflet-draw-draw-polygon").each(function() {
		$(this).removeClass("leaflet-disabled");
		$(this).attr("title", "Draw a polygon.");
		$(this).css("pointer-events", "auto");
	});
}
