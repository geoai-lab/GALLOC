/**
 * This is the JavaScript file for the "resolveAnnotation" page.
 */

var startIndexResolve = "";
var endIndexResolve = "";
var locationDescResolve = "";
var annotationsAndResolveMaps = [];
var currentResolveAnnotation = "";
var annotatedSpanIDIndex_resolve = [];
var selectedSpansIDIndex_resolve = [];
var currentWorkingSpanIDResolve = "";
var resolvedAnnotations = [];
var spatialTypeSelectedResolve = "Point";
var checkBoxPopoverForAnnotate = false;
var checkBoxModalForSubmit = false;
var checkBoxModalForAccept = false;
var currentViewPortResolve = '';
var btnForAcceptList = [];
var btnForReviseList = [];
var geocodingResultsResolve = [];
var geocodingResultsResolvePoint = [];
var acceptedAnnotation;


function resetResolveParameter() {
	startIndexResolve = "";
	endIndexResolve = "";
	locationDescResolve = "";
	annotationsAndResolveMaps = [];
	currentResolveAnnotation = "";
	annotatedSpanIDIndex_resolve = [];
	selectedSpansIDIndex_resolve = [];
	currentWorkingSpanIDResolve = "";
	resolvedAnnotations = [];
	spatialTypeSelectedResolve = "Point";
	btnForAcceptList = [];
	btnForReviseList = [];
	geocodingResultsResolve = [];
	acceptedAnnotation = "";
}


function getResolveAnnotations(projName) {
	return new Promise(function(resolve, reject) {
		$.ajax({
			url: 'AnnotationServlet',
			type: 'GET',
			data: { action: "retriveResolvingAnnotations", projName: projName },
			dataType: 'text',
			success: function(result, textStatus, jqXHR) {
				var resultObject = JSON.parse(result);
				if (resultObject.status === "success") {
					var diffAnnosForOneMsg = resultObject.success;
					resolve(diffAnnosForOneMsg);
				} else {
					reject(resultObject.error);
				}
			},
			error: function(jqXHR, textStatus, errorThrown) {
				reject(textStatus);
			}
		});
	});
}


function showDifferentAnnos(differentAnnos, projName) {
	currentResolveAnnotation = differentAnnos;
	annotationsAndResolveMaps.length = 0;
	var messageText = JSON.parse(differentAnnos.Message).text;
	var Annotations = differentAnnos.Annotation;

	for (var i = 0; i < Annotations.length; i++) {
		var annotator = Annotations[i].Annotator;
		var annotations = JSON.parse(Annotations[i].Annotation).Annotation;
		var currentMsgBox = $("#differentMsgAnnoation_" + annotator);
		if (annotations.length == 0) {
			$("#spanCategory_" + annotator).prev().remove();
			$("#spanCategory_" + annotator).remove();
			$("#spanSpatialFootprintType_" + annotator).prev().remove();
			$("#spanSpatialFootprintType_" + annotator).remove();
			var noLocationDescriptionSpan = $("<div>").text("There is no any location description.");
			noLocationDescriptionSpan.css("background-color", "#D35400");
			noLocationDescriptionSpan.css("color", "white");
			noLocationDescriptionSpan.css("text-align", "center");
			noLocationDescriptionSpan.insertAfter("#differentCard_" + annotator);
		}
		currentMsgBox.html(messageText);
		//$("#mapContainerForEach_" + annotator).html('<div id="mapForEach_' + annotator + '" style="width: 100%; height: 100%;"></div>');
		$("#mapForEach_" + annotator).height($("#mapForEach_" + annotator).width());
		var resolveMap = addMap('mapForEach_' + annotator, 'showSpatialFootprint');
		annotationsAndResolveMaps.push({ [annotator]: resolveMap });
		var mapForResolve = resolveMap[0];
		var drawnItemsForResolve = resolveMap[1];

		showAnnotationsOfAnnotatedMsg(annotations, "differentMsgAnnoation_" + annotator, drawnItemsForResolve, mapForResolve);
	}
}


$('div#divDiffAnnotations, div#resolveAnnotation').on('click', 'span[type="button"]', function() {
	var clickedSpan = $(this);
	var clickedSpanId = clickedSpan.attr("id");
	var parentP = clickedSpan.parent();
	var parentId = parentP.attr("id");
	var currentMap;
	var currentDrawnItems;
	var selectedCategoryCode = $(clickedSpan).children('span:first').html();

	var annotatedSpanIDList_resolve = annotatedSpanIDIndex_resolve.map(item => item.spanID);
	var selectedSpanIDList_resolve = selectedSpansIDIndex_resolve.map(item => item.spanID);

	parentP.find("span[type='button']").each(function() {
		$(this).css('border', 'none');
	});

	clickedSpan.css({
		'border': '1px dashed red',
		'border-width': '1px'
	});

	if (parentId == "resolveMsg") {
		currentWorkingSpanIDResolve = clickedSpanId;
		enableMapControls();
		var text = "";
		clickedSpan[0].childNodes.forEach(function(node) {
			if (node.nodeType === Node.TEXT_NODE) {
				text += node.textContent;
			}
		});
		locationDescResolve = text.trim();
		currentMap = annotationsAndResolveMaps.find(function(resolveMap) {
			return Object.keys(resolveMap)[0] === "resolve";
		})["resolve"];
		currentDrawnItems = currentMap[1];

		/*		parentP.find("span[type='button']").each(function() {
					if (selectedSpanIDList_resolve.includes($(this).attr('id'))) { //selected spans
						$(this).css("background-color", "#EDFB0B");
		
					}
					if (annotatedSpanIDList_resolve.includes($(this).attr('id'))) { //annnoated spans
						$(this).css("background-color", "#ABEBC6");
					}
				});*/

		if (selectedSpanIDList_resolve.includes(clickedSpanId)) {
			//$("#" + clickedSpanId).css("background-color", "#C6D121");
			for (var i = 0; i < selectedSpansIDIndex_resolve.length; i++) {
				if (selectedSpansIDIndex_resolve[i].spanID === clickedSpan.attr("id")) {
					startIndexResolve = selectedSpansIDIndex_resolve[i].startIdx;
					endIndexResolve = selectedSpansIDIndex_resolve[i].endIdx;
					break;
				}
			}
		}

		if (annotatedSpanIDList_resolve.includes(clickedSpanId)) {
			//$("#" + clickedSpanId).css("background-color", "#28B463");
			$("#selectCategoryForRevolve").find("option").each(function() {
				var option = $(this);
				if (option.val().split(":")[0] == selectedCategoryCode) {
					option.prop("selected", true);
				}
			});

			for (var i = 0; i < annotatedSpanIDIndex_resolve.length; i++) {
				if (annotatedSpanIDIndex_resolve[i].spanID == clickedSpan.attr("id")) {
					startIndexResolve = annotatedSpanIDIndex_resolve[i].startIdx;
					endIndexResolve = annotatedSpanIDIndex_resolve[i].endIdx;
				}
			}
		}
	} else {
		currentMap = annotationsAndResolveMaps.find(function(resolveMap) {
			return Object.keys(resolveMap)[0] === parentId.split("_")[1];
		})[parentId.split("_")[1]];
		currentDrawnItems = currentMap[1];

		/*parentP.find("span[type='button']").each(function() {
			$(this).css("background-color", "#ABEBC6");
		});*/

		//$("#" + clickedSpanId).css("background-color", "#28B463");

		var categorySpan = "spanCategory_" + parentId.split("_")[1];
		var projName = $("#spanResolveProjectName").html();
		$.ajax({
			url: 'ProjectServlet',
			type: 'GET',
			data: { action: "getProjectInfo", projName: projName },
			dataType: 'text',
			success: function(result, textStatus, jqXHR) {
				var resultObject = JSON.parse(result);
				if (resultObject.status == "success") {
					var categorySchema = JSON.parse(decodeURIComponent(resultObject.categorySchema));
					var categorySchemaKeys = Object.keys(categorySchema);
					var categorySchemaValues = Object.values(categorySchema);
					if (categorySchemaKeys.length > 0) {
						for (var j = 0; j < categorySchemaKeys.length; j++) {
							if (categorySchemaKeys[j] == selectedCategoryCode) {
								$("#" + categorySpan).html(categorySchemaKeys[j] + ": " + categorySchemaValues[j]);
							}
						}
					} else if (categorySchemaKeys.length == 0) {
						$("#" + categorySpan).html("C: Location");
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


		$("#selectCategoryForRevolve").find("option").each(function() {
			var option = $(this);
			if (option.val().split(":")[0] == selectedCategoryCode) {
				$("#" + categorySpan).html(option.val());
			}
		});

		var spatialFoorprintTypeSpan = "spanSpatialFootprintType_" + parentId.split("_")[1];
	}

	currentDrawnItems.eachLayer(function(layer) {
		if (layer instanceof L.Polyline || layer instanceof L.Polygon) {
			layer.setStyle({ color: "#3388ff" });
		} else if (layer instanceof L.Marker) {
			layer.disablePermanentHighlight();
		}
	});

	currentDrawnItems.eachLayer(function(layer) {
		var layerId = layer.options.id;
		if (layerId == clickedSpanId) {
			if (layer.toGeoJSON().geometry.type == "LineString" || layer.toGeoJSON().geometry.type == "Polygon") {
				layer.setStyle({ color: "#00FFFF", weight: 3 });
				if (parentId != "resolveMsg") {
					if (layer.toGeoJSON().geometry.type == "LineString") {
						$("#" + spatialFoorprintTypeSpan).html("Polyline");
					} else if (layer.toGeoJSON().geometry.type == "Polygon") {
						$("#" + spatialFoorprintTypeSpan).html("Polygon");
					}
				} else {
					if (layer.toGeoJSON().geometry.type == "LineString") {
						$('input[name="radioSpatialFootprintTypeResolve"][value="Polyline"]').prop('checked', true);
					} else if (layer.toGeoJSON().geometry.type == "Polygon") {
						$('input[name="radioSpatialFootprintTypeResolve"][value="Polygon"]').prop('checked', true);
					}
				}
			} else {
				layer.enablePermanentHighlight();
				if (parentId != "resolveMsg") {
					$("#" + spatialFoorprintTypeSpan).html("Point");
				} else {
					$('input[name="radioSpatialFootprintTypeResolve"][value="Point"]').prop('checked', true);
				}
			}
		}
	});
});


$('div#divDiffAnnotations').on('click', function() {
	if (btnForAcceptList.indexOf(event.target.id) != -1) {
		var selectedAnnotator = event.target.id.split("_")[1];
		var Annotations = currentResolveAnnotation.Annotation;
		for (var i = 0; i < Annotations.length; i++) {
			var annotator = Annotations[i].Annotator;
			if (annotator == selectedAnnotator) {
				acceptedAnnotation = JSON.parse(Annotations[i].Annotation);
				if (!checkBoxModalForAccept) {
					var modalAcceptOneAnnotation = new bootstrap.Modal($("#modalAcceptOneAnnotation"));
					modalAcceptOneAnnotation.show();
					var alertMessage = "Do you want to accept this annotation? If Yes, please click 'Continue', and you will submit it and go to the next message to be resolved. If No, please 'Return' to continue to resolve annotations of this message.";
					$('#modalBodyAcceptOneAnnotation').html("<div class=\"col-12\" style=\"font-size: 1rem;\">" + alertMessage + "</div>");
				} else {
					submitResolvedMsg(acceptedAnnotation);
				}
			}
		}
	}
})


$("#btnReturnCurrentAnnotations").click(function() {
	$("#modalAcceptOneAnnotation").modal('hide');
})


$("#btnAcceptOneAnnotation").click(function() {
	$("#modalAcceptOneAnnotation").modal('hide');
	submitResolvedMsg(acceptedAnnotation);
})


$(document).on('change', '#checkDisableModalAcceptOneAnnotation', function() {
	if ($(this).is(':checked')) {
		checkBoxModalForAccept = true;
	}
});


$('div#divDiffAnnotations').on('click', function() {
	if (btnForReviseList.indexOf(event.target.id) != -1) {
		var projName = $("#spanResolveProjectName").html();
		var currentAnnotator = event.target.id.split("_")[1];
		var Annotations = currentResolveAnnotation.Annotation;
		var messageText = JSON.parse(currentResolveAnnotation.Message).text;
		var messageID = currentResolveAnnotation.MessageID;
		for (var i = 0; i < Annotations.length; i++) {
			var annotator = Annotations[i].Annotator;
			var revisingAnnotation = JSON.parse(Annotations[i].Annotation);
			if (annotator == currentAnnotator) {
				$("#divDiffAnnotations").fadeOut(500);
				setTimeout(function() {
					$("#resolveAnnotation").css("display", "flex");
					$("#checkNoAnnotationResolve").prop('checked', false);
					//$("#mapForResolving").height($("#mapForResolving").width());
					var resolveMap = addMap('mapForResolving', 'resolve');
					disableMapControls();
					annotationsAndResolveMaps.push({ "resolve": resolveMap });
					var currentMap = annotationsAndResolveMaps.find(function(resolveMap) {
						return Object.keys(resolveMap)[0] === "resolve";
					})["resolve"];
					$("#resolveMsg").html(messageText);

					$.ajax({
						url: 'ProjectServlet',
						type: 'GET',
						data: { action: "getProjectInfo", projName: projName },
						dataType: 'text',
						success: function(result, textStatus, jqXHR) {
							var resultObject = JSON.parse(result);
							if (resultObject.status == "success") {
								var categorySchema = JSON.parse(decodeURIComponent(resultObject.categorySchema));
								var categorySchemaKeys = Object.keys(categorySchema);
								var categorySchemaValues = Object.values(categorySchema);
								var categorySchemaHtml = "";
								if (categorySchemaKeys.length > 0) {
									categorySchemaHtml = '<option id="optionCategoryDefaultForResolve" value="default" selected>Choose...</option>';
									for (var j = 0; j < categorySchemaKeys.length; j++) {
										var categoryWithKey = categorySchemaKeys[j] + ": " + categorySchemaValues[j];
										categorySchemaHtml += '<option value="' + categoryWithKey + '">' + categoryWithKey + '</option>';
									}
								} else if (categorySchemaKeys.length == 0) {
									categorySchemaHtml += '<option value="C: Location" selected>C: Location</option>';
								}
								$("#selectCategoryForRevolve").html(categorySchemaHtml);

								var geoScopeType = Object.keys(JSON.parse(decodeURIComponent(resultObject.GeoScope)))[0];
								var geoScopeValue = Object.values(JSON.parse(decodeURIComponent(resultObject.GeoScope)))[0];

								if (geoScopeType == "State") {
									var geocoder = L.Control.Geocoder.nominatim({ geocodingQueryParams: { "countrycodes": "us" } });
									geocoder.geocode(geoScopeValue, function(results) {
										var bbox = results[0].bbox;
										if (bbox) {
											resolveMap[0].fitBounds(bbox);
											currentViewPortResolve = bbox;
										}
										showAnnotationsOfAnnotatedMsg(revisingAnnotation.Annotation, "resolveMsg", currentMap[1], currentMap[0]);
									});
								} else {
									var geojsonLayer = L.geoJSON(geoScopeValue);
									currentViewPortResolve = geojsonLayer.getBounds();
									resolveMap[0].fitBounds(geojsonLayer.getBounds());
									showAnnotationsOfAnnotatedMsg(revisingAnnotation.Annotation, "resolveMsg", currentMap[1], currentMap[0]);
								}

								for (var j = 0; j < revisingAnnotation.Annotation.length; j++) {
									resolvedAnnotations.push(revisingAnnotation.Annotation[j]);
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
				}, 550);
				break;
			}
		}
		/*var btnForAcceptRevise = btnForAcceptList.concat(btnForReviseList);
		for (var i = 0; i < btnForAcceptRevise.length; i++) {
			$("#" + btnForAcceptRevise[i]).prop('disabled', true);
		}*/
	}
})


$("#resolveMsg").on('mouseup', function() {
	var annotatedSpanIDList = annotatedSpanIDIndex_resolve.map(item => item.spanID);
	var selectedSpanIDList = selectedSpansIDIndex_resolve.map(item => item.spanID);

	$("p#resolveMsg span[type='button']").each(function() {
		$(this).css('border', 'none');

		/*		if (selectedSpanIDList.includes($(this).attr('id'))) { //selected spans
					$(this).css("background-color", "#EDFB0B");
				}
				if (annotatedSpanIDList.includes($(this).attr('id'))) { //annnoated spans
					$(this).css("background-color", "#ABEBC6");
				}*/
	});

	var currentMap = annotationsAndResolveMaps.find(function(resolveMap) {
		return Object.keys(resolveMap)[0] === "resolve";
	})["resolve"];
	var currentDrawnItems = currentMap[1];

	currentDrawnItems.eachLayer(function(layer) {
		if (layer instanceof L.Polyline || layer instanceof L.Polygon) {
			layer.setStyle({ color: "#3388ff" });
		} else if (layer instanceof L.Marker) {
			layer.disablePermanentHighlight();
		}
	});

	$("#optionCategoryDefaultForResolve").prop('selected', true);

	var isTextColored = $(event.target).closest('.badge').length > 0;
	var selection = window.getSelection();
	var range = selection.getRangeAt(0);
	var selectedText = range.toString();
	locationDescResolve = selectedText.trim();

	if (locationDescResolve && locationDescResolve.length > 0 && !isTextColored) {
		var startContainer = range.startContainer;
		var cateGoryCodeLength = 0;
		var existingSpanLength = 0;
		var spanAllTextLength = 0;

		while (startContainer !== null && startContainer.parentNode !== null) {
			var prevSibling = startContainer.previousSibling;

			while (prevSibling !== null) {
				if (prevSibling.nodeType === Node.ELEMENT_NODE && prevSibling.tagName === "SPAN" && prevSibling.getAttribute("type") === "button") {
					existingSpanLength = existingSpanLength + he.decode(prevSibling.outerHTML.length);
					spanAllTextLength = spanAllTextLength + prevSibling.textContent.length;
					var childSpans = prevSibling.getElementsByTagName("span");
					for (var i = 0; i < childSpans.length; i++) {
						var childSpan = childSpans[i];
						if (childSpan.textContent.trim() !== "") {
							var childText = childSpan.textContent.trim();
							cateGoryCodeLength = cateGoryCodeLength + childText.length;
							break;
						}
					}
				}
				prevSibling = prevSibling.previousSibling;
			}
			startContainer = startContainer.parentNode;
		}

		startIndexResolve = getSelectedTextIndex(range, "resolveMsg") - cateGoryCodeLength;
		endIndexResolve = startIndexResolve + range.toString().length;

		startIndexResolve = startIndexResolve + (selectedText.length - selectedText.trimStart().length);
		endIndexResolve = endIndexResolve - (selectedText.length - selectedText.trimEnd().length);

		selectedHighLightText(startIndexResolve, endIndexResolve, existingSpanLength, spanAllTextLength, cateGoryCodeLength, locationDescResolve, "resolveMsg");
		if (currentWorkingSpanIDResolve != "") {
			enableMapControls();
		}
	}
});


/*$("#btnManagePreAnnotatorForResolve").click(function() {
	var modalPreAnnotator = new bootstrap.Modal($("#modalPreAnnotator"));
	modalPreAnnotator.show();
	$("#inputPreannotatorName").val("");
	$("#inputPreannotatorURL").val("");
	var projName = $("#spanResolveProjectName").html();
	getPreAnnotatorsList(projName, "selectPreAnnotatorForResolve");
})*/


$('#resolveMsg').on('click', '.bi-x-circle-fill', function(event) {
	var annotatedSpanIDList_resolve = annotatedSpanIDIndex_resolve.map(item => item.spanID);
	var selectedSpanIDList_resolve = selectedSpansIDIndex_resolve.map(item => item.spanID);

	event.stopPropagation();
	var highlightedElement = $(this).closest('.badge');
	var plainText = highlightedElement.contents().filter(function() {
		return this.nodeType === Node.TEXT_NODE;
	}).text();
	highlightedElement.replaceWith(plainText);
	var closingSpanID = highlightedElement.attr("id");

	var currentMap = annotationsAndResolveMaps.find(function(resolveMap) {
		return Object.keys(resolveMap)[0] === "resolve";
	})["resolve"];
	var currentDrawnItems = currentMap[1];

	if (annotatedSpanIDList_resolve.includes(closingSpanID)) {
		currentDrawnItems.eachLayer(function(layer) {
			var layerId = layer.options.id;
			if (layerId == closingSpanID) {
				currentDrawnItems.removeLayer(layer);
			}
		});

		for (var i = 0; i < annotatedSpanIDIndex_resolve.length; i++) {
			if (annotatedSpanIDIndex_resolve[i].spanID === closingSpanID) {
				for (var j = 0; j < resolvedAnnotations.length; j++) {
					if (annotatedSpanIDIndex_resolve[i].startIdx == resolvedAnnotations[j].startIdx && annotatedSpanIDIndex_resolve[i].endIdx == resolvedAnnotations[j].endIdx) {
						resolvedAnnotations.splice(j, 1);
					}
				}
				break;
			}
		}
	} else if (selectedSpanIDList_resolve.includes(closingSpanID)) {
		currentDrawnItems.eachLayer(function(layer) {
			var layerId = layer.options.id;
			if (layerId == closingSpanID) {
				currentDrawnItems.removeLayer(layer);
			}
		});

		selectedSpansIDIndex_resolve = selectedSpansIDIndex_resolve.filter(function(element) {
			return element.spanID !== closingSpanID;
		});
	}
	currentWorkingSpanIDResolve = "";
	disableMapControls();
});


$('input[name="radioSpatialFootprintTypeResolve"]').change(function() {
	spatialTypeSelectedResolve = $(this).val();
});


/*$("#btnUsePreAnnotatorResolve").click(function() {
	var selectedValue = $("#selectPreAnnotatorForResolve").val();
	if (selectedValue == "default") {
		alert("Please first select the pre-annotator you would like to use.");
	} else {
		var modalUsingPreannotator = new bootstrap.Modal($("#modalUsingPreannotator"));
		modalUsingPreannotator.show();
		setTimeout(function() { preAnnotateMsg(selectedValue, "spanResolveProjectName", "resolveMsg"); }, 600);
	}
});*/


$("#btnAddAnnotationResolve").click(function() {
	var currentMap = annotationsAndResolveMaps.find(function(resolveMap) {
		return Object.keys(resolveMap)[0] === "resolve";
	})["resolve"];
	var currentDrawnItems = currentMap[1];

	if (!(Number.isInteger(startIndexResolve)) || !(Number.isInteger(endIndexResolve)) || locationDescResolve == "") {
		popoverResolveWarning.enable();
		popoverResolveWarning._config.content = '<div class="custom-popover-content"><p>You haven\'t selected a location description.</p><a id="aClosePopoverResolveWarning" role="button" class="closePopover">&times;</a></div>';
		popoverResolveWarning.show();
		popoverResolveWarning.disable();
	} else if (obtainSpatialFootprint(currentDrawnItems, currentWorkingSpanIDResolve).length == 0 || $("#selectCategoryForRevolve").val() == "default") {
		popoverResolveWarning.enable();
		popoverResolveWarning._config.content = '<div class="custom-popover-content"><p>This description cannot be annotated. To annotate this description, category and spatial footprint are all required.</p><a id="aClosePopoverResolveWarning" role="button" class="closePopover">&times;</a></div>';
		popoverResolveWarning.show();
		popoverResolveWarning.disable();
	} else {
		var annotation = {};
		annotation["startIdx"] = startIndexResolve;
		annotation["endIdx"] = endIndexResolve;
		annotation["locationDesc"] = locationDescResolve;
		annotation["locationCate"] = $("#selectCategoryForRevolve").val();
		var categoryCode = $("#selectCategoryForRevolve").val().split(":")[0];
		annotation["spatialFootprint"] = obtainSpatialFootprint(currentDrawnItems, currentWorkingSpanIDResolve);

		for (var j = 0; j < resolvedAnnotations.length; j++) {
			if (startIndexResolve == resolvedAnnotations[j].startIdx && endIndexResolve == resolvedAnnotations[j].endIdx) {
				resolvedAnnotations.splice(j, 1);
			}
		}

		resolvedAnnotations.push(annotation);

		var allHtml = he.decode($("#resolveMsg").html());
		if (locationDescResolve && locationDescResolve.length > 0) {
			var textNodes = $("p#resolveMsg").contents().filter(function() {
				return this.nodeType === Node.TEXT_NODE;
			});

			var startIndexReplace = 0;
			var endIndexReplace = 0;

			var workingSpanHtml = he.decode($('#' + currentWorkingSpanIDResolve)[0].outerHTML);
			startIndexReplace = allHtml.indexOf(workingSpanHtml);
			endIndexReplace = startIndexReplace + workingSpanHtml.length;

			var allHtml = allHtml.substring(0, startIndexReplace) + locationDescResolve + allHtml.substring(endIndexReplace);
			startIndexHtml = startIndexReplace;
			endIndexHtml = startIndexReplace + locationDescResolve.length;
			annotatedSpanIDIndex_resolve.push({ "startIdx": startIndexResolve, "endIdx": endIndexResolve, "spanID": currentWorkingSpanIDResolve });

			var prefix = allHtml.substring(0, startIndexHtml);
			var suffix = allHtml.substring(endIndexHtml);
			var preHtml = '<span type="button" id="' + currentWorkingSpanIDResolve + '" class="badge position-relative" style="color: black; font-size: 1rem; font-weight: 400; background-color: #ABEBC6; padding: 0px;">';
			var categoryHtml = '<span class="position-absolute top-0 start-0 translate-middle rounded-circle" style="color: white;width:16px;height:16px;font-size:12px;background-color:#A569BD;">' + categoryCode + '</span>';
			var afterHtml = '<span class="position-absolute top-0 start-100 translate-middle"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#5D6D7E" class="bi bi-x-circle-fill" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/></svg></span></span>';

			var highlightedString = prefix + preHtml + categoryHtml + locationDescResolve + afterHtml + suffix;
			$("#resolveMsg").html(highlightedString);
		}

		if (!checkBoxPopoverForAnnotate) {
			popoverAnnotationResolve.enable();
			popoverAnnotationResolve._config.content = '<div id="divPopoverAnnotateResolve" class="custom-popover-content"></div>';
			var popover_html = '<p>The description has been annotated, and you can repeat this process to annotate other location descriptions in this message.</p><a id="aClosePopoverAnnotationResolve" role="button" class="closePopover">&times;</a><input class="form-check-input" type="checkbox" id="checkDisablePopoverAnnotationResolve"> <label class="form-check-label" for="checkDisablePopoverAnnotationResolve">Don\'t show this message later.</label>';

			popoverAnnotationResolve.show();
			$("#divPopoverAnnotateResolve").html(popover_html);
			popoverAnnotationResolve.disable();
		}

		$("#optionCategoryDefaultForResolve").prop('selected', true);
		startIndexResolve = "";
		endIndexResolve = "";
		locationDescResolve = "";
		currentWorkingSpanIDResolve = "";
		disableMapControls();
	}
})


var popoverResolveWarning = new bootstrap.Popover($('#btnAddAnnotationResolve')[0], {
	placement: 'top',
	html: true
});


$(document).on('click', '#aClosePopoverResolveWarning', function() {
	popoverResolveWarning.hide();
});


var popoverAnnotationResolve = new bootstrap.Popover($('#btnAddAnnotationResolve')[0], {
	placement: 'top',
	html: true
});


$(document).on('click', '#aClosePopoverAnnotationResolve', function() {
	popoverAnnotationResolve.hide();
});


$(document).on('change', '#checkDisablePopoverAnnotationResolve', function() {
	if ($(this).is(':checked')) {
		checkBoxPopoverForAnnotate = true;
	}
});


$(document).on('change', '#checkDisableModalNextMsg', function() {
	if ($(this).is(':checked')) {
		checkBoxModalForSubmit = true;
	}
});


$("#submitResolvedAnnotations").click(function() {
	// Whether this resolution has been finished.
	if (resolvedAnnotations.length == 0 && !$("#checkNoAnnotationResolve").prop("checked")) {
		var modalUnfinishingResolve = new bootstrap.Modal($("#modalUnfinishingResolve"));
		modalUnfinishingResolve.show();
		var alertMessage = "You have't resolved annotations of this message. Please finish resolving them before moving on to the next message with different annotations."
		$('#modalBodyUnfinishingResolve').html("<div class=\"col-12\" style=\"font-size: 1rem;\">" + alertMessage + "</div>");

		return false;
	}

	// Whether there are still some selected spans.
	var existingSelectedSpans = 0;
	$("p#resolveMsg span[type='button']").each(function() {
		if ($(this).css("background-color") === "rgb(237, 251, 11)") { //selected spans
			existingSelectedSpans++;
		}
	});

	if (existingSelectedSpans > 0) {
		var modalSelectedSpanExistResolve = new bootstrap.Modal($("#modalSelectedSpanExistResolve"));
		modalSelectedSpanExistResolve.show();
		var alertMessage = "There are some unannotated spans. Do you still want to go to the next message? If Yes, please click 'Continue', and these selected spans will be lost. If No, please 'Return' to continue to work on them.";
		$('#modalBodySelectedSpanExistResolve').html("<div class=\"col-12\" style=\"font-size: 1rem;\">" + alertMessage + "</div>");

		return false;
	}

	// Whether there is any conflict.
	var submitiResolvedAnnotations;
	if (resolvedAnnotations.length != 0 && !$("#checkNoAnnotationResolve").prop("checked")) {
		submitiResolvedAnnotations = { "Annotation": resolvedAnnotations };
	} else if (resolvedAnnotations.length == 0 && $("#checkNoAnnotationResolve").prop("checked")) {
		submitiResolvedAnnotations = { "Annotation": [] };
	} else if (resolvedAnnotations.length != 0 && $("#checkNoAnnotationResolve").prop("checked")) {
		var modalAnnotationsOrNo = new bootstrap.Modal($("#modalAnnotationsOrNo"));
		modalAnnotationsOrNo.show();
		var alertMessage = 'You annotated some location descriptions in this message, meanwhile you chose the option of "No location description". Please determine whether this message has annotations or not.';
		$('#modalBodyAnnotationsOrNo').html("<div class=\"col-12\" style=\"font-size: 1rem;\">" + alertMessage + "</div>");

		return false;
	}

	if (!checkBoxModalForSubmit) {
		var modalNextMsgResolve = new bootstrap.Modal($("#modalNextMsgResolve"));
		modalNextMsgResolve.show();
		var alertMessage = "Do you want to submit the resolved annotations of the current message and move on to the next message with annotations to be resolved now? If Yes, please click 'Continue', and you will be unable to revise annotations of the current message. If No, please 'Return' to revise the annotations.";
		$('#modalBodyNextMsgResolve').html("<div class=\"col-12\" style=\"font-size: 1rem;\">" + alertMessage + "</div>");
	} else {
		submitResolvedMsg(submitiResolvedAnnotations);
	}
})


$("#btnReturnCurrentMsgResolve").click(function() {
	$("#modalNextMsgResolve").modal('hide');
})


$("#btnNextMsgResolve").click(function() {
	$("#modalNextMsgResolve").modal('hide');
	var submitiResolvedAnnotations = { "Annotation": resolvedAnnotations };
	submitResolvedMsg(submitiResolvedAnnotations);
})


$("#btnSelectedSpanExistResolveReturn").click(function() {
	$("#modalSelectedSpanExistResolve").modal('hide');
})


$("#btnLostSelectedSpanExistResolve").click(function() {
	$("#modalSelectedSpanExistResolve").modal('hide');
	// Whether there is any conflict.
	var submitiResolvedAnnotations;
	if (resolvedAnnotations.length != 0 && !$("#checkNoAnnotationResolve").prop("checked")) {
		submitiResolvedAnnotations = { "Annotation": resolvedAnnotations };
	} else if (resolvedAnnotations.length == 0 && $("#checkNoAnnotationResolve").prop("checked")) {
		submitiResolvedAnnotations = { "Annotation": [] };
	} else if (resolvedAnnotations.length != 0 && $("#checkNoAnnotationResolve").prop("checked")) {
		var modalAnnotationsOrNo = new bootstrap.Modal($("#modalAnnotationsOrNo"));
		modalAnnotationsOrNo.show();
		var alertMessage = 'You annotated some location descriptions in this message, meanwhile you chose the option of "No location description". Please determine whether this message has annotations or not.';
		$('#modalBodyAnnotationsOrNo').html("<div class=\"col-12\" style=\"font-size: 1rem;\">" + alertMessage + "</div>");

		return false;
	}

	if (!checkBoxModalForSubmit) {
		var modalNextMsgResolve = new bootstrap.Modal($("#modalNextMsgResolve"));
		modalNextMsgResolve.show();
		var alertMessage = "Do you want to submit the resolved annotations of the current message and move on to the next message with annotations to be resolved now? If Yes, please click 'Continue', and you will be unable to revise annotations of the current message. If No, please 'Return' to revise the annotations.";
		$('#modalBodyNextMsgResolve').html("<div class=\"col-12\" style=\"font-size: 1rem;\">" + alertMessage + "</div>");
	} else {
		submitResolvedMsg(submitiResolvedAnnotations);
	}
})


$("#btnSaveAnnotationsResolve").click(function() {
	$("#modalAnnotationsOrNo").modal('hide');
	var submitiResolvedAnnotations = { "Annotation": resolvedAnnotations };
	submitResolvedMsg(submitiResolvedAnnotations);
})


$("#btnNoLocaDescResolve").click(function() {
	$("#modalAnnotationsOrNo").modal('hide');
	var submitiResolvedAnnotations = { "Annotation": [] };
	submitResolvedMsg(submitiResolvedAnnotations);
})


function submitResolvedMsg(submitiResolvedAnnotations) {
	var currentDate = new Date();
	var annotationTime = currentDate.toLocaleString();
	var messageID = currentResolveAnnotation.MessageID;
	$.ajax({
		url: 'AnnotationServlet',
		type: 'POST',
		data: { action: "submitAnnotation", messageID: messageID, annotator: currentUser, method: "Resolve", annotationTime: annotationTime, annotation: encodeURIComponent(JSON.stringify(submitiResolvedAnnotations)) },
		dataType: 'text',
		success: function(result, textStatus, jqXHR) {
			var resultObject = JSON.parse(result);
			if (resultObject.status == "success") {
				nextResolveMsg();
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


function nextResolveMsg() {
	var projName = $("#spanResolveProjectName").html();
	var modalIdentifyingResolution = new bootstrap.Modal($("#modalIdentifyingResolution"));
	modalIdentifyingResolution.show();
	$("#resolveAnnotation").fadeOut(500);
	setTimeout(function() {
		$("#divDiffAnnotations").css("display", "flex");
		getResolveAnnotations(projName)
			.then(function(diffAnnosForOneMsg) {
				$("#modalIdentifyingResolution").modal('hide');
				resetResolveParameter();
				var Annotations = diffAnnosForOneMsg.Annotation;
				var annotatorList = [];
				for (var i = 0; i < Annotations.length; i++) {
					annotatorList.push(Annotations[i].Annotator);
				}
				buildContainerForDifferentAnnos(annotatorList);
				showDifferentAnnos(diffAnnosForOneMsg, projName);
			})
			.catch(function(error) {
				$("#modalIdentifyingResolution").modal('hide');
				if (error == "noDisagreements") {
					var modalNoDisagreements = new bootstrap.Modal($("#modalNoDisagreements"));
					modalNoDisagreements.show();
					$('#modalBodyNoDisagreements').html("<div class=\"col-12\" style=\"font-size: 1rem;\">All disagreements in annotation have been resolved. Please return to the home page.</div>");
				} else {
					alert('ERROR: ' + error);
				}
			});
	}, 550);
}


$("#btnHomePageForNoDisagreements").click(function() {
	$("#modalNoDisagreements").modal('hide');
	$("#resolveAnnotationPage").fadeOut(500);
	setTimeout(loadStartProjectPage, 550);
})


function buildContainerForDifferentAnnos(annotatorList) {
	$("div[id^='mapForEach_']").each(function() {
		$(this).remove();
	});

	if ($('#mapForResolving').length != 0) {
		$('#mapForResolving').remove();
	}

	html = ""
	for (var i = 0; i < annotatorList.length; i++) {
		html += "<div class=\"col-4\">"
		//html += "<div style=\"height: 80px;\"></div>"
		html += "<div class=\"row d-flex justify-content-center\">"
		html += "<label style=\"font-weight: bold;\">Annotation from <span>" + annotatorList[i] + "</span></label>"
		html += "</div>"
		html += "<div id=\"mapForEach_" + annotatorList[i] + "\" class=\"col-12\"></div>"
		html += "<div id=differentCard_" + annotatorList[i] + " class=\"mb-2 d-flex align-items-center justify-content-center\">"
		html += "<div class=\"card col-12\">"
		html += "<div class=\"card-body\" style=\"height: 120px; overflow: auto;\">"
		//html += "<h5 class=\"card-title\">Message content</h5>"
		html += "<p id=differentMsgAnnoation_" + annotatorList[i] + " class=\"card-text\"></p>"
		html += "</div></div></div>"
		html += "<div class=\"mb-2 row d-flex align-items-center justify-content-center\"> <div class=\"col-12\"> <span style=\"font-weight: bold;\">Category: </span> <span id=spanCategory_" + annotatorList[i] + "></span> </div> </div>"
		html += "<div class=\"mb-4 row d-flex align-items-center justify-content-center\"> <div class=\"col-12\"> <span style=\"font-weight: bold;\">Spatial footprint type: </span> <span id=spanSpatialFootprintType_" + annotatorList[i] + "></span>	</div> </div>"
		html += "<div class=\"mb-2 row d-flex justify-content-center\"> <div class=\"d-grid col-10\"> <button class=\"btn btn-primary\" id=annotationRevise_" + annotatorList[i] + " style=\"font-size: 1rem;\">Revise based on this annotation</button> </div> </div>"
		html += "<div class=\"row d-flex justify-content-center\"> <div class=\"d-grid col-10\"> <button class=\"btn btn-primary\" id=annotationAccept_" + annotatorList[i] + " style=\"font-size: 1rem;\">Accept this annotation</button> </div> </div>"
		btnForAcceptList.push("annotationAccept_" + annotatorList[i]);
		btnForReviseList.push("annotationRevise_" + annotatorList[i]);
		html += "</div>";
	}
	$('#divDiffAnnotations').html(html);
	$('#mapForResolvingContainer').html("<div id='mapForResolving' style='width: 100%; height: 100%;'></div>");
}


$("#btnFindSpatialByWebResolve").click(function() {
	var selectedService = $("#selectWebserviceResolve").val();
	var currentMap = annotationsAndResolveMaps.find(function(resolveMap) {
		return Object.keys(resolveMap)[0] === "resolve";
	})["resolve"];

	selectedServiceResolvePublic = selectedService;
	currentWorkingSpanIDResolvePublic = currentWorkingSpanIDResolve;
	drawnItemsForResolvePublic = currentMap[1];
	mapForResolvePublic = currentMap[0];
	spatialTypeSelectedResolvePublic = spatialTypeSelectedResolve;

	findingSFUsingWS(selectedService, locationDescResolve, currentViewPortResolve, currentWorkingSpanIDResolve, currentMap[1], currentMap[0], spatialTypeSelectedResolve);
})