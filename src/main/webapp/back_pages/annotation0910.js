/**
 * This is the JavaScript file for the "annotation" page.
 */

var startIndex = "";
var endIndex = "";
var locationDesc = "";
var annotateOrResolve = "";
var annotationOneMessage = []; //All annotations of the current message.
var annotationsOneBatch = []; //Annotations for all the messages in the current batch.
var delPreAnnotators = [];
var currentPreAnnotator = "";
var spatialTypeSelected = "Point";
var selectedSpansIndex = [];
var oldAnnotatedSpanIDIndex = [];
var newAnnotatedSpanIDIndex = [];
var currentWorkingSpanID = "";
var geocodingResults = [];
var geocodingResultsPoint = [];
var currentViewPort = '';

var selectedServiceResolvePublic = '';
var currentWorkingSpanIDResolvePublic = '';
var drawnItemsForResolvePublic = '';
var mapForResolvePublic = '';
var spatialTypeSelectedResolvePublic = '';

function resetAnnotationVariable() {
	startIndex = "";
	endIndex = "";
	locationDesc = "";
	annotateOrResolve = "";
	annotationOneMessage = []; //All annotations of the current message.
	annotationsOneBatch = []; //Annotations for all the messages in the current batch.
	delPreAnnotators = [];
	currentPreAnnotator = "";
	spatialTypeSelected = "Point";
	selectedSpansIndex = [];
	oldAnnotatedSpanIDIndex = [];
	newAnnotatedSpanIDIndex = [];
	currentWorkingSpanID = "";
	geocodingResults = [];
	currentViewPort = '';

	selectedServiceResolvePublic = '';
	currentWorkingSpanIDResolvePublic = '';
	drawnItemsForResolvePublic = '';
	mapForResolvePublic = '';
	spatialTypeSelectedResolvePublic = '';
}


// create a random series code as ID
function generateRandomStringID() {
	const leftLimit = 97; // letter 'a'
	const rightLimit = 122; // letter 'z'
	const targetStringLength = 32;
	let generatedString = '';

	for (let i = 0; i < targetStringLength; i++) {
		const randomLimitedInt = leftLimit + Math.floor(Math.random() * (rightLimit - leftLimit + 1));
		generatedString += String.fromCharCode(randomLimitedInt);
	}
	return generatedString;
}


// Highlight the selected text in a message
$("#pMessageContent").on('mouseup', function() {
	var allAnnotatedSpanIDIndex = oldAnnotatedSpanIDIndex.concat(newAnnotatedSpanIDIndex);
	var annotatedSpanIDList = allAnnotatedSpanIDIndex.map(item => item.spanID);
	var selectedSpanIDList = selectedSpansIndex.map(item => item.spanID);

	//   
	$("p#pMessageContent span[type='button']").each(function() {
		$(this).css('border', 'none');
	});

	drawnItemsForAnnotations.eachLayer(function(layer) {
		if (layer instanceof L.Polyline || layer instanceof L.Polygon) {
			layer.setStyle({ color: "#3388ff" });
		} else if (layer instanceof L.Marker) {
			layer.disablePermanentHighlight();
		}
	});
	$("#optionCategoryDefaultForAnnotation").prop('selected', true);

	var isTextColored = $(event.target).closest('.badge').length > 0;
	var selection = window.getSelection();
	var range = selection.getRangeAt(0);
	var selectedText = range.toString();
	locationDesc = selectedText.trim();

	if (locationDesc && locationDesc.length > 0 && !isTextColored) {

		var startContainer = range.startContainer;
		var cateGoryCodeLength = 0;
		var existingSpanLength = 0;
		var spanAllTextLength = 0;

		while (startContainer !== null && startContainer.parentNode !== null) {
			var prevSibling = startContainer.previousSibling;

			while (prevSibling !== null) {
				if (prevSibling.nodeType === Node.ELEMENT_NODE && prevSibling.tagName === "SPAN" && prevSibling.getAttribute("type") === "button") {
					existingSpanLength = existingSpanLength + prevSibling.outerHTML.length;
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

		startIndex = getSelectedTextIndex(range, "pMessageContent") - cateGoryCodeLength;
		endIndex = startIndex + range.toString().length;

		startIndex = startIndex + (selectedText.length - selectedText.trimStart().length);
		endIndex = endIndex - (selectedText.length - selectedText.trimEnd().length);

		selectedHighLightText(startIndex, endIndex, existingSpanLength, spanAllTextLength, cateGoryCodeLength, locationDesc, "pMessageContent");
		if (currentWorkingSpanID != "") {
			enableMapControls();
		}
	}
});


function getSelectedTextIndex(range, msgBoxID) {
	var clonedRange = range.cloneRange();
	clonedRange.selectNodeContents($("#" + msgBoxID)[0]);
	clonedRange.setEnd(range.startContainer, range.startOffset);

	var precedingText = clonedRange.toString();
	return precedingText.length;
}


function selectedHighLightText(startIndex, endIndex, existingSpanLength, spanAllTextLength, cateGoryCodeLength, locationDesc, msgBoxID) {
	var spanID = generateRandomStringID();

	var allHtml = $("#" + msgBoxID).html();
	allHtml = he.decode(allHtml);

	startIndexHtml = startIndex + existingSpanLength - spanAllTextLength + cateGoryCodeLength;
	endIndexHtml = startIndexHtml + locationDesc.length;
	var prefix = allHtml.substring(0, startIndexHtml);
	var suffix = allHtml.substring(endIndexHtml);

	var preHtml = '<span type="button" id="' + spanID + '" class="badge position-relative" style="color: black; font-size: 1rem; font-weight: 400; background-color: #EDFB0B; padding: 0px; border: 1px dashed red; border-width: 1px">';
	var afterHtml = '<span class="position-absolute top-0 start-100 translate-middle"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#5D6D7E" class="bi bi-x-circle-fill" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/></svg></span></span>';

	var highlightedString = prefix + preHtml + locationDesc + afterHtml + suffix;
	$("#" + msgBoxID).html(highlightedString);

	if (annotateOrResolve == "Annotate") {
		selectedSpansIndex.push({ "startIdx": startIndex, "endIdx": endIndex, "spanID": spanID });
		currentWorkingSpanID = spanID;
	} else if (annotateOrResolve == "Resolve") {
		selectedSpansIDIndex_resolve.push({ "startIdx": startIndex, "endIdx": endIndex, "spanID": spanID });
		currentWorkingSpanIDResolve = spanID;
	}
}


$('#pMessageContent').on('click', '.bi-x-circle-fill', function(event) {
	event.stopPropagation();

	var highlightedElement = $(this).closest('.badge');
	var plainText = highlightedElement.contents().filter(function() {
		return this.nodeType === Node.TEXT_NODE;
	}).text();
	highlightedElement.replaceWith(plainText);
	var closingSpanID = highlightedElement.attr("id");

	var allAnnotatedSpanIDIndex = oldAnnotatedSpanIDIndex.concat(newAnnotatedSpanIDIndex);
	var annotatedSpanIDList = allAnnotatedSpanIDIndex.map(item => item.spanID);
	var selectedSpanIDList = selectedSpansIndex.map(item => item.spanID);
	if (annotatedSpanIDList.includes(closingSpanID)) {
		drawnItemsForAnnotations.eachLayer(function(layer) {
			var layerId = layer.options.id;
			if (layerId == closingSpanID) {
				drawnItemsForAnnotations.removeLayer(layer);
			}
		});

		for (var i = 0; i < newAnnotatedSpanIDIndex.length; i++) {
			if (newAnnotatedSpanIDIndex[i].spanID === closingSpanID) {
				for (var j = 0; j < annotationOneMessage.length; j++) {
					if (newAnnotatedSpanIDIndex[i].startIdx == annotationOneMessage[j].startIdx && newAnnotatedSpanIDIndex[i].endIdx == annotationOneMessage[j].endIdx) {
						annotationOneMessage.splice(j, 1);
					}
				}
				break;
			}
		}
	} else if (selectedSpanIDList.includes(closingSpanID)) {
		drawnItemsForAnnotations.eachLayer(function(layer) {
			var layerId = layer.options.id;
			if (layerId == closingSpanID) {
				drawnItemsForAnnotations.removeLayer(layer);
			}
		});

		selectedSpansIndex = selectedSpansIndex.filter(function(element) {
			return element.spanID !== closingSpanID;
		});
	}
	currentWorkingSpanID = "";
	disableMapControls();
});


$("#btnAddAnnotation").click(function() {
	if (!(Number.isInteger(startIndex)) || !(Number.isInteger(endIndex)) || locationDesc == "") {
		/*$('#divMsgsAnnotation').css("display", "block");
		$('#alertMsgsAnnotation').html("You haven't selected a location description.");*/
		popoverAnnotationWarning.enable();
		popoverAnnotationWarning._config.content = '<div class="custom-popover-content"><p>You haven\'t selected a location description.</p><a id="aClosePopoverAnnotationWarning" role="button" class="closePopover">&times;</a></div>';
		popoverAnnotationWarning.show();
		popoverAnnotationWarning.disable();
	} else if (obtainSpatialFootprint(drawnItemsForAnnotations, currentWorkingSpanID).length == 0 || $("#selectCategoryForAnnotation").val() == "default") {
		/*$('#divMsgsAnnotation').css("display", "block");
		$('#alertMsgsAnnotation').html("This description cannot be annotated. To annotate this description, spatial footprint and category are all required.");*/
		popoverAnnotationWarning.enable();
		popoverAnnotationWarning._config.content = '<div class="custom-popover-content"><p>This description cannot be annotated. To annotate this description, category and spatial footprint are all required.</p><a id="aClosePopoverAnnotationWarning" role="button" class="closePopover">&times;</a></div>';
		popoverAnnotationWarning.show();
		popoverAnnotationWarning.disable();
	} else {
		var annotation = {};
		annotation["startIdx"] = startIndex;
		annotation["endIdx"] = endIndex;
		annotation["locationDesc"] = locationDesc;
		annotation["locationCate"] = $("#selectCategoryForAnnotation").val();
		var categoryCode = $("#selectCategoryForAnnotation").val().split(":")[0];
		annotation["spatialFootprint"] = obtainSpatialFootprint(drawnItemsForAnnotations, currentWorkingSpanID);
		annotationOneMessage.push(annotation);

		var allHtml = $("#pMessageContent").html();
		if (locationDesc && locationDesc.length > 0) {
			var textNodes = $("p#pMessageContent").contents().filter(function() {
				return this.nodeType === Node.TEXT_NODE;
			});

			var startIndexReplace = 0;
			var endIndexReplace = 0;

			var workingSpanHtml = $('#' + currentWorkingSpanID)[0].outerHTML;
			startIndexReplace = allHtml.indexOf(workingSpanHtml);
			endIndexReplace = startIndexReplace + workingSpanHtml.length;

			var allHtml = allHtml.substring(0, startIndexReplace) + locationDesc + allHtml.substring(endIndexReplace);
			startIndexHtml = startIndexReplace;
			endIndexHtml = startIndexReplace + locationDesc.length;
			newAnnotatedSpanIDIndex.push({ "startIdx": startIndex, "endIdx": endIndex, "spanID": currentWorkingSpanID });

			var prefix = allHtml.substring(0, startIndexHtml);
			var suffix = allHtml.substring(endIndexHtml);
			var preHtml = '<span type="button" id="' + currentWorkingSpanID + '" class="badge position-relative" style="color: black; font-size: 1rem; font-weight: 400; background-color: #ABEBC6; padding: 0px;">';
			var categoryHtml = '<span class="position-absolute top-0 start-0 translate-middle rounded-circle" style="color: white;width:16px;height:16px;font-size:12px;background-color:#A569BD;">' + categoryCode + '</span>';
			var afterHtml = '<span class="position-absolute top-0 start-100 translate-middle"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#5D6D7E" class="bi bi-x-circle-fill" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/></svg></span></span>';

			var highlightedString = prefix + preHtml + categoryHtml + locationDesc + afterHtml + suffix;
			$("#pMessageContent").html(highlightedString);
		}
		/*$('#divMsgsAnnotation').css("display", "block");
		$('#alertMsgsAnnotation').html("The description has been annotated, and you can repeat this process to annotate other location descriptions in this message.");*/

		popoverAnnotation._config.content = '<div id="divPopoverAnnotate" class="custom-popover-content"></div>';
		var popover_html = '<p>The description has been annotated, and you can repeat this process to annotate other location descriptions in this message.</p><a id="aClosePopoverAnnotation" role="button" class="closePopover">&times;</a><input class="form-check-input" type="checkbox" id="checkDisablePopoverAnnotation"> <label class="form-check-label" for="checkDisablePopoverAnnotation">Don\'t show this message later.</label>';

		popoverAnnotation.show();
		$("#divPopoverAnnotate").html(popover_html);

		$("#optionCategoryDefaultForAnnotation").prop('selected', true);
		//drawnItemsForAnnotations.clearLayers();
		startIndex = "";
		endIndex = "";
		locationDesc = "";
		currentWorkingSpanID = "";
		disableMapControls();
	}
})


function obtainSpatialFootprint(drawnItems, currentSpanID) {
	var spatialFoorprintList = [];
	drawnItems.eachLayer(function(layer) {
		var layerId = layer.options.id;
		if (layerId == currentSpanID) {
			spatialFoorprintList.push(layer.toGeoJSON().geometry);
		}
	});
	return spatialFoorprintList;
}


$("#btnCloseAlertAnnotation").click(function() {
	$('#divMsgsAnnotation').css("display", "none");
})


$("#btnFinishAndNext").click(function() {
	var existingSelectedSpans = 0;
	$("p#pMessageContent span[type='button']").each(function() {
		if ($(this).css("background-color") === "rgb(237, 251, 11)") { //selected spans
			existingSelectedSpans++;
		}
	});

	if (existingSelectedSpans > 0) {
		var modalSaveAnnotateds = new bootstrap.Modal($("#modalSaveAnnotateds"));
		modalSaveAnnotateds.show();
		var alertMessage = "There are some unannotated spans. Do you still want to go to the next message? If Yes, please click 'Continue', and these selected spans will be lost. If No, please 'Return' to continue to work on them.";
		$('#modalBodySaveAnnotateds').html("<div class=\"col-12\" style=\"font-size: 1rem;\">" + alertMessage + "</div>");
	} else {
		if (annotationOneMessage.length != 0 && $("#checkNoAnnotation").prop("checked")) {
			var modalNoOrAnyAnnnotation = new bootstrap.Modal($("#modalNoOrAnyAnnnotation"));
			modalNoOrAnyAnnnotation.show();
			var alertMessage = 'You annotated some location descriptions in this message, meanwhile you also chose the option of "No location description". Please determine whether this message has annotations or not.';
			$('#modalBodyNoOrAnyAnnnotation').html("<div class=\"col-12\" style=\"font-size: 1rem;\">" + alertMessage + "</div>");
		} else {
			saveAnnotations();
			annotationOneMessage = [];
			newAnnotatedSpanIDIndex.length = 0;
			selectedSpansIndex.length = 0;
			nextMessages();
		}
	}
})


$("#btnSaveExistingAnnotations").click(function() {
	$("#modalNoOrAnyAnnnotation").modal('hide');
	$("#checkNoAnnotation").prop('checked', false);
	saveAnnotations();
	annotationOneMessage = [];
	newAnnotatedSpanIDIndex.length = 0;
	selectedSpansIndex.length = 0;
	nextMessages();
})


$("#btnKeepNoLocaDesc").click(function() {
	$("#modalNoOrAnyAnnnotation").modal('hide');
	annotationOneMessage = [];
	saveAnnotations();
	newAnnotatedSpanIDIndex.length = 0;
	selectedSpansIndex.length = 0;
	nextMessages();
})


$("#btnReturnCurrentMsg").click(function() {
	$("#modalSaveAnnotateds").modal('hide');
})


$("#btnSaveAnnotations").click(function() {
	$("#modalSaveAnnotateds").modal('hide');
	saveAnnotations();
	annotationOneMessage = [];
	newAnnotatedSpanIDIndex.length = 0;
	selectedSpansIndex.length = 0;
	nextMessages();
})


function saveAnnotations() {
	currentWorkingSpanID = "";
	disableMapControls();
	$("#optionCategoryDefaultForAnnotation").prop('selected', true);
	drawnItemsForAnnotations.clearLayers();
	var isAnnotated = false;
	$("#spanAnnotatedMessage").css("display", "none");

	for (var i = 0; i < annotationsOneBatch.length; i++) {
		if (annotationsOneBatch[i].messageID == currentMsgID) {
			isAnnotated = true;
			break;
		}
	}

	var oneSubmittedAnnotation = {};
	oneSubmittedAnnotation["messageID"] = currentMsgID;
	oneSubmittedAnnotation["annotator"] = currentUser;
	oneSubmittedAnnotation["method"] = "Annotate";
	var currentDate = new Date();
	var annotationTime = currentDate.toLocaleString();
	oneSubmittedAnnotation["annotationTime"] = annotationTime;
	var annotation = {};

	if (!isAnnotated) {
		if ($("#checkNoAnnotation").prop("checked") || annotationOneMessage.length != 0) {
			if ($("#checkNoAnnotation").prop("checked")) {
				annotation["Annotation"] = [];
				//$("#checkNoAnnotation").prop('checked', false);
			} else {
				annotation["Annotation"] = annotationOneMessage;
			}

			oneSubmittedAnnotation["Annotation"] = annotation;
			annotationsOneBatch.push(oneSubmittedAnnotation);
		}
	} else {
		if ($("#checkNoAnnotation").prop("checked")) {
			annotation["Annotation"] = [];
			annotationsOneBatch.splice(i, 1);
			oneSubmittedAnnotation["Annotation"] = annotation;
			annotationsOneBatch.push(oneSubmittedAnnotation);
		} else {
			var oldAnnotations = annotationsOneBatch[i].Annotation.Annotation;
			annotationOneMessage = updatingAnnotations(oldAnnotations, annotationOneMessage, oldAnnotatedSpanIDIndex);
			if (annotationOneMessage.length == 0) {
				annotationsOneBatch.splice(i, 1);
			} else {
				annotation["Annotation"] = annotationOneMessage;
				annotationsOneBatch.splice(i, 1);
				oneSubmittedAnnotation["Annotation"] = annotation;
				annotationsOneBatch.push(oneSubmittedAnnotation);
			}
		}
	}
}


// updating all the annotations
function updatingAnnotations(oldAnnotations, annotationOneMessage, oldAnnotatedSpanIDIndex) {
	// obtaining old annoations which haven't been removed.
	var allAnnotatedSpanIDIndex = oldAnnotatedSpanIDIndex.concat(newAnnotatedSpanIDIndex);
	var annotatedSpanIDList = allAnnotatedSpanIDIndex.map(item => item.spanID);
	var oldAnnotatedSpanIDList = oldAnnotatedSpanIDIndex.map(item => item.spanID);

	var allAnnotationSpans = $("p#pMessageContent span[type='button']").filter(function() {
		return annotatedSpanIDList.includes($(this).attr('id'));
	});
	var oldStillAnnotations = [];
	for (var m = 0; m < allAnnotationSpans.length; m++) {
		if (oldAnnotatedSpanIDList.includes(allAnnotationSpans[m].id)) {
			for (var i = 0; i < oldAnnotatedSpanIDIndex.length; i++) {
				if (oldAnnotatedSpanIDIndex[i].spanID === allAnnotationSpans[m].id) {
					for (var j = 0; j < oldAnnotations.length; j++) {
						if (oldAnnotatedSpanIDIndex[i].startIdx == oldAnnotations[j].startIdx && oldAnnotatedSpanIDIndex[i].endIdx == oldAnnotations[j].endIdx) {
							oldStillAnnotations.push(oldAnnotations[j]);
						}
					}
				}
			}
		}
	}

	// if one annotation is edited (such as the category or spatial footprint), using the new one replace the old one.
	for (var i = 0; i < oldStillAnnotations.length; i++) {
		for (var j = 0; j < annotationOneMessage.length; j++) {
			if (oldStillAnnotations[i].startIdx == annotationOneMessage[j].startIdx && oldStillAnnotations[i].endIdx == annotationOneMessage[j].endIdx) {
				oldStillAnnotations.splice(i, 1);
			}
		}
	}
	return oldStillAnnotations.concat(annotationOneMessage);
}


function nextMessages() {
	drawnItemsForAnnotations.clearLayers();
	$("#optionCategoryDefaultForAnnotation").prop('selected', true);
	$("#checkNoAnnotation").prop('checked', false);
	var submittedMsgID = new Set();
	for (var j = 0; j < annotationsOneBatch.length; j++) {
		submittedMsgID.add(annotationsOneBatch[j].messageID);
	}

	var unsubmittedMsgIDs = new Set();
	batchMsgIDs.forEach(function(msgID) {
		if (!submittedMsgID.has(msgID)) {
			unsubmittedMsgIDs.add(msgID);
		}
	});

	if (messagesOneBatch.length > 1) {
		previousMsgs.push(messagesOneBatch.shift());
		var fullString = messagesOneBatch[0].messageData.text;
		currentMsgText = messagesOneBatch[0].messageData.text;
		$("#pMessageContent").html(messagesOneBatch[0].messageData.text);
		currentMsgID = messagesOneBatch[0].messageID;

		if (batchMsgIDsForLabel.has(currentMsgID)) {
			batchMsgIDsForLabel.delete(currentMsgID);
		} else {
			var isAnnotated = loadAnnotations(currentMsgID);
			if (!isAnnotated) {
				$("#spanAnnotatedMessage").css("display", "block");
				$("#spanAnnotatedMessage").css("background-color", "#E74C3C");
				$("#spanAnnotatedMessage").html("This message is not annotated.");
			}
		}

	} else if (unsubmittedMsgIDs.size !== 0) {
		var modalRemainingMsgBatch = new bootstrap.Modal($("#modalRemainingMsgBatch"));
		modalRemainingMsgBatch.show();
		var alertMessage = "This is the end of the current batch of messages. There are still " + unsubmittedMsgIDs.size + " messages that haven't been annoatated. Please finish annotating them before moving on to the next batch."
		$('#modalBodyRemainingMsgBatch').html("<div id=\"divAlertRemainingMsgBatch\" class=\"col-12\" style=\"font-size: 1rem;\">" + alertMessage + "</div>");
		$("#btnSaveAndNext").prop('disabled', false);
		var isAnnotated = isMsgAnnotated(currentMsgID);
		if (!isAnnotated) {
			$("#spanAnnotatedMessage").css("display", "block");
			$("#spanAnnotatedMessage").css("background-color", "#E74C3C");
			$("#spanAnnotatedMessage").html("This message is not annotated.");
		}
	} else {
		loadAnnotations(currentMsgID);
		var modalSubmitMsgBatch = new bootstrap.Modal($("#modalSubmitMsgBatch"));
		modalSubmitMsgBatch.show();
		var alertMessage = "The current batch has been completely annotated. Do you want to submit the current batch and move on to the next batch now? If Yes, please click 'Submit', and you will be unable to revise annotations of the current batch. If No, please 'Return' to revise annotations in the current batch.";
		$('#modalBodySubmitMsgBatch').html("<div id=\"divAlertSubmitMsgBatch\" class=\"col-12\" style=\"font-size: 1rem;\">" + alertMessage + "</div>");
	}

	if (previousMsgs.length > 0) {
		$("#btnPrevMessage").prop('disabled', false);
	} else {
		$("#btnPrevMessage").prop('disabled', true);
	}
	$("#pMessageContent").css("display", "block");
}


$("#btnSubmitBatch").click(function() {
	$("#modalSubmitMsgBatch").modal('hide');

	$.ajax({
		url: 'AnnotationServlet',
		type: 'POST',
		data: { action: "submitBatchAnnotation", annotationOneBatch: encodeURIComponent(JSON.stringify(annotationsOneBatch)) },
		dataType: 'text',
		success: function(result, textStatus, jqXHR) {
			var resultObject = JSON.parse(result);
			if (resultObject.status == "success") {
				messagesOneBatch = [];
				annotationsOneBatch = [];
				previousMsgs = [];
				$("#btnPrevMessage").prop('disabled', true);
				var projName = $("#spanAnnoatationProjectName").html();
				var annotator = currentUser;
				batchMsgIDs.length = 0;
				batchMsgIDsForLabel.clear();
				$.ajax({
					url: 'AnnotationServlet',
					type: 'GET',
					data: { action: "getBatchMessages", projName: projName, annotator: annotator },
					dataType: 'text',
					success: function(result, textStatus, jqXHR) {
						var resultObject = JSON.parse(result);
						if (resultObject.status == "success") {
							var messages = resultObject.messages;
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

							$("#spanAnnotatedMessage").css("display", "none");
							$("#checkNoAnnotation").prop('checked', false);
						}
						else {
							alert(resultObject.error);
						}
					},
					error: function(jqXHR, textStatus, errorThrown) {
						alert('ERRORS: ' + ':' + textStatus);
					}
				})
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

$("#btnReturnCurrentBatch").click(function() {
	$("#modalSubmitMsgBatch").modal('hide');
})

$("#btnPrevMessage").click(function() {
	var existingSpans = 0;
	$("p#pMessageContent span[type='button']").each(function() {
		existingSpans++;
	});

	if (existingSpans > 0) {
		var modalPreviousMsgWarning = new bootstrap.Modal($("#modalPreviousMsgWarning"));
		modalPreviousMsgWarning.show();
		var alertMessage = "There are some selected or annotated spans. Do you still want to go to the previous message? If Yes, please click 'Continue', and these spans will be lost. If No, please 'Return' to continue to work on them.";
		$('#modalBodyPreviousMsgWarning').html("<div class=\"col-12\" style=\"font-size: 1rem;\">" + alertMessage + "</div>");
	} else {
		goToPrevious();
	}
})


$("#btnPreviousMsgWarningReturn").click(function() {
	$("#modalPreviousMsgWarning").modal('hide');
})


$("#btnPreviousMsgWarningContinue").click(function() {
	$("#modalPreviousMsgWarning").modal('hide');
	goToPrevious();
})


function goToPrevious() {
	annotationOneMessage = [];
	newAnnotatedSpanIDIndex.length = 0;
	selectedSpansIndex.length = 0;
	$("#checkNoAnnotation").prop('checked', false);
	$("#spanAnnotatedMessage").css("display", "block");
	$("#spanAnnotatedMessage").css("background-color", "#E74C3C");
	$("#spanAnnotatedMessage").html("This message is not annotated.");
	drawnItemsForAnnotations.clearLayers();
	$("#optionCategoryDefaultForAnnotation").prop('selected', true);
	$("#pMessageContent").css("display", "block");
	var fullString = previousMsgs[previousMsgs.length - 1].messageData.text;
	currentMsgText = previousMsgs[previousMsgs.length - 1].messageData.text;
	$("#pMessageContent").html(previousMsgs[previousMsgs.length - 1].messageData.text);
	currentMsgID = previousMsgs[previousMsgs.length - 1].messageID;
	messagesOneBatch.unshift(previousMsgs.pop());

	if (previousMsgs.length > 0) {
		$("#btnPrevMessage").prop('disabled', false);
	} else {
		$("#btnPrevMessage").prop('disabled', true);
	}

	if ($('#btnSaveAndNext').prop('disabled')) {
		$('#btnSaveAndNext').prop('disabled', false);
	}

	loadAnnotations(currentMsgID);
}


function isMsgAnnotated(currentMsgID) {
	var isAnnotated = false;
	for (var i = 0; i < annotationsOneBatch.length; i++) {
		if (annotationsOneBatch[i].messageID == currentMsgID) {
			$("#spanAnnotatedMessage").css("display", "block");
			$("#spanAnnotatedMessage").css("background-color", "#239B56");
			$("#spanAnnotatedMessage").html("This message was annotated.");
			isAnnotated = true;
		}
	}
	return isAnnotated;
}

function loadAnnotations(currentMsgID) {
	$("#pMessageContent").html(currentMsgText);
	var isAnnotated = false;

	oldAnnotatedSpanIDIndex.length = 0;
	for (var i = 0; i < annotationsOneBatch.length; i++) {
		if (annotationsOneBatch[i].messageID == currentMsgID) {
			$("#spanAnnotatedMessage").css("display", "block");
			$("#spanAnnotatedMessage").css("background-color", "#239B56");
			$("#spanAnnotatedMessage").html("This message was annotated.");
			isAnnotated = true;

			if (annotationsOneBatch[i].Annotation.Annotation.length == 0) {
				$("#checkNoAnnotation").prop('checked', true);
				oldAnnotatedSpanIDIndex.length = 0;
			} else {
				showAnnotationsOfAnnotatedMsg(annotationsOneBatch[i].Annotation.Annotation, "pMessageContent", drawnItemsForAnnotations, mapForAnnotations);
			}
		}

	}
	currentWorkingSpanID = "";
	disableMapControls();
	return isAnnotated;
}


function showAnnotationsOfAnnotatedMsg(annotations, msgBoxID, drawnItems, mapInParameter) {
	annotations.sort(function(a, b) {
		var startIdxA = a.startIdx;
		var startIdxB = b.startIdx;
		if (startIdxA < startIdxB) {
			return -1;
		}
		if (startIdxA > startIdxB) {
			return 1;
		}
		return 0;
	});

	for (var j = 0; j < annotations.length; j++) {
		var currentAnnotation = annotations[j];
		var startIndexAnnotated = currentAnnotation["startIdx"];
		var endIndexAnnotated = currentAnnotation["endIdx"];
		var locationDescAnnotated = currentAnnotation["locationDesc"];
		var locationCateAnnotated = currentAnnotation["locationCate"];
		var spatialFootprintAnnotated = currentAnnotation["spatialFootprint"];
		var categoryCode = locationCateAnnotated.split(":")[0];

		if (locationDescAnnotated && locationDescAnnotated.length > 0) {
			var spanID = generateRandomStringID();

			var startIndexReplace = 0;
			var endIndexReplace = 0;
			var cateGoryCodeLengthLA = 0;
			var existingSpanLengthLA = 0;
			var spanAllTextLengthLA = 0;

			var allHtml = $("#" + msgBoxID).html();

			$("#" + msgBoxID).find("span[type='button']").each(function() {
				var thisSpan = $(this);
				existingSpanLengthLA = existingSpanLengthLA + thisSpan.prop('outerHTML').length;
				spanAllTextLengthLA = spanAllTextLengthLA + thisSpan.prop('textContent').length;

				var childSpans = thisSpan.find('span');
				for (var m = 0; m < childSpans.length; m++) {
					cateGoryCodeLengthLA = cateGoryCodeLengthLA + $(childSpans[m]).text().trim().length;
				}
			});

			startIndexHtml = startIndexAnnotated + existingSpanLengthLA - spanAllTextLengthLA + cateGoryCodeLengthLA;
			endIndexHtml = startIndexHtml + locationDescAnnotated.length;

			var prefix = allHtml.substring(0, startIndexHtml);
			var suffix = allHtml.substring(endIndexHtml);
			var preHtml = '<span type="button" id="' + spanID + '" class="badge position-relative" style="color: black; font-size: 1rem; font-weight: 400; background-color: #ABEBC6; padding: 0px;">';
			var categoryHtml = '<span class="position-absolute top-0 start-0 translate-middle rounded-circle" style="color: white;width:16px;height:16px;font-size:12px;background-color:#A569BD;">' + categoryCode + '</span>';
			var afterHtml = '<span class="position-absolute top-0 start-100 translate-middle"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#5D6D7E" class="bi bi-x-circle-fill" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/></svg></span></span>';

			var highlightedString = prefix + preHtml + categoryHtml + locationDescAnnotated + afterHtml + suffix;
			$("#" + msgBoxID).html(highlightedString);

			if (annotateOrResolve == "Annotate") {
				oldAnnotatedSpanIDIndex.push({ "startIdx": startIndexAnnotated, "endIdx": endIndexAnnotated, "spanID": spanID });
			} else if (annotateOrResolve == "Resolve") {
				annotatedSpanIDIndex_resolve.push({ "startIdx": startIndexAnnotated, "endIdx": endIndexAnnotated, "spanID": spanID });
			}
		}

		if (spatialFootprintAnnotated[0].type == "LineString" || spatialFootprintAnnotated[0].type == "Polygon") {
			var allGeometryCoords = [];
			for (var m = 0; m < spatialFootprintAnnotated.length; m++) {
				var geometryFoundMap = L.GeoJSON.geometryToLayer(spatialFootprintAnnotated[m]);
				geometryFoundMap.options.id = spanID;
				geometryFoundMap.addTo(drawnItems);
				allGeometryCoords.push(spatialFootprintAnnotated[m].coordinates);
			}
			var bounds = L.latLngBounds();
			while (calculateArrayDimension(allGeometryCoords) > 2) {
				allGeometryCoords = allGeometryCoords.flat();
			}
			for (var n = 0; n < allGeometryCoords.length; n++) {
				var latLng = L.latLng([allGeometryCoords[n][1], allGeometryCoords[n][0]]);
				bounds.extend(latLng);
			}

			mapInParameter.fitBounds(bounds);
		} else if (spatialFootprintAnnotated[0].type == "Point") {
			multiGeometry = spatialFootprintAnnotated[0];
			var geometryFoundMap = L.GeoJSON.geometryToLayer(multiGeometry);
			geometryFoundMap.options.id = spanID;
			geometryFoundMap.addTo(drawnItems);
			mapInParameter.setView(geometryFoundMap.getLatLng(), 15);
		}
	}
}

var popoverAnnotation = new bootstrap.Popover($('#btnAddAnnotation')[0], {
	placement: 'top',
	html: true
});


var popoverAnnotationWarning = new bootstrap.Popover($('#btnAddAnnotation')[0], {
	placement: 'top',
	html: true
});


$(document).on('click', '#aClosePopoverAnnotation', function() {
	popoverAnnotation.hide();
});


$(document).on('change', '#checkDisablePopoverAnnotation', function() {
	if ($(this).is(':checked')) {
		popoverAnnotation.disable();
	}
});


$(document).on('click', '#aClosePopoverAnnotationWarning', function() {
	popoverAnnotationWarning.hide();
});


$("#btnAddPreannotator").click(function() {
	$("#btnAddPreannotator").prop('disabled', true);
	var namePreannotator = $("#inputPreannotatorName").val().trim();
	var uriPreannotator = $("#inputPreannotatorURL").val().trim();
	//var projName = $("#spanAnnoatationProjectName").html();
	var projName = currentProjName;

	if (namePreannotator == "" || uriPreannotator == "") {
		alert("Please input both the name and URI of your pre-annotator.");
		$("#btnAddPreannotator").prop('disabled', false);
		return false;
	}

	if (isPreAnnotatorExist(namePreannotator)) {
		alert("The pre-annotator name you specified already exists. Please choose a different name.");
		$("#btnAddPreannotator").prop('disabled', false);
		return false;
	}

	var strRegex = '(http?|https?)://[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]';
	var re = new RegExp(strRegex);
	if (!re.test(uriPreannotator)) {
		alert("Please input your URL in a correct format");
		$("#btnAddPreannotator").prop('disabled', false);
		return false;
	}

	$("#modalPreAnnotator").modal('hide');
	var modalTestingPreannotator = new bootstrap.Modal($("#modalTestingPreannotator"));
	modalTestingPreannotator.show();

	$.ajax({
		url: 'AnnotationServlet',
		type: 'GET',
		data: { action: "addPreannotator", projName: projName, preannotatorName: namePreannotator, preannotatorURI: uriPreannotator },
		dataType: 'text',
		success: function(result, textStatus, jqXHR) {
			var resultObject = JSON.parse(result);
			if (resultObject.status == "success") {
				setTimeout(function() {
					$("#modalTestingPreannotator").modal('hide');
					var modalAddPreannotator = new bootstrap.Modal($("#modalAddPreannotator"));
					modalAddPreannotator.show();
					$('#modalBodyAddPreannotator').html("<div class=\"col-12\" style=\"font-size: 1rem;\">" + resultObject.success + "</div>");
				}, 600);
				if (annotateOrResolve == "Annotate") {
					getPreAnnotatorsList(currentProjName, "selectPreAnnotator");
				} else if (annotateOrResolve == "Resolve") {
					getPreAnnotatorsList(currentProjName, "selectPreAnnotatorForResolve");
				}
				$("#inputPreannotatorName").val("");
				$("#inputPreannotatorURL").val("");
				currentProjName = projName;
			}
			else {
				alert(resultObject.error);
			}
			$("#btnAddPreannotator").prop('disabled', false);
		},
		error: function(jqXHR, textStatus, errorThrown) {
			alert('ERRORS: ' + ':' + textStatus);
			$("#btnAddPreannotator").prop('disabled', false);
		}
	});
})


function returnManageModal() {
	$("#modalAddPreannotator").modal('hide');
	var modalPreAnnotator = new bootstrap.Modal($("#modalPreAnnotator"));
	modalPreAnnotator.show();
}


function isPreAnnotatorExist(preannotatorName) {
	var preannotatorNameList = [];
	$("#divPreAnnotatorsTable tbody tr").each(function() {
		var firstColumn = $(this).find("td:first").text();
		preannotatorNameList.push(firstColumn);
	});

	if (preannotatorNameList.includes(preannotatorName)) {
		return true;
	} else {
		return false;
	}
}


$("#btnManagePreAnnotator").click(function() {
	var modalPreAnnotator = new bootstrap.Modal($("#modalPreAnnotator"));
	modalPreAnnotator.show();
	$("#inputPreannotatorName").val("");
	$("#inputPreannotatorURL").val("");
	var projName = $("#spanAnnoatationProjectName").html();
	getPreAnnotatorsList(projName, "selectPreAnnotator");
})


$('#divPreAnnotatorsTable').on('click', 'button', function(event) {
	if (delPreAnnotators.indexOf(event.target.id) != -1) {
		currentPreAnnotator = event.target.id;
		$("#modalPreAnnotator").modal('hide');
		var delPreAnnotatorModal = new bootstrap.Modal($("#delPreAnnotatorModal"));
		delPreAnnotatorModal.show();
	}
});


$("#btnDelPreAnnotator").click(function() {
	$.ajax({
		url: 'AnnotationServlet',
		type: 'GET',
		data: { action: "delPreannotator", projName: currentProjName, preannotatorName: currentPreAnnotator },
		dataType: 'text',
		success: function(result, textStatus, jqXHR) {
			var resultObject = JSON.parse(result);
			if (resultObject.status == "success") {
				$("#delPreAnnotatorModal").modal('hide');
				var modalPreAnnotator = new bootstrap.Modal($("#modalPreAnnotator"));
				modalPreAnnotator.show();
				if (annotateOrResolve == "Annotate") {
					getPreAnnotatorsList(currentProjName, "selectPreAnnotator");
				} else if (annotateOrResolve == "Resolve") {
					getPreAnnotatorsList(currentProjName, "selectPreAnnotatorForResolve");
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
})


$("#btnCancelDelPreAnnotator").click(function() {
	$("#delPreAnnotatorModal").modal('hide');
	var modalPreAnnotator = new bootstrap.Modal($("#modalPreAnnotator"));
	modalPreAnnotator.show();
	if (annotateOrResolve == "Annotate") {
		getPreAnnotatorsList(currentProjName, "selectPreAnnotator");
	} else if (annotateOrResolve == "Resolve") {
		getPreAnnotatorsList(currentProjName, "selectPreAnnotatorForResolve");
	}
})


function getPreAnnotatorsList(projName, selectBoxID) {
	$.ajax({
		url: 'AnnotationServlet',
		type: 'GET',
		data: { action: "getPreannotatorList", projName: projName },
		dataType: 'text',
		success: function(result, textStatus, jqXHR) {
			var resultObject = JSON.parse(result);
			if (resultObject.status == "success") {
				var preAnnotators = resultObject.preAnnotators;

				if (preAnnotators.length > 0) {
					$("#spanAlertNoPreAnnotators").css("display", "none");
					var html = '';
					var selectPreAnnotatorsHtml = '<option id="optionPreAnnotatorDefault" value="default" selected>Choose...</option>';
					html += '<table class="table table-success table-striped"> <thead> <tr> <th scope="col">Name</th> <th scope="col">URL</th> <th scope="col">Delete</th> </tr> </thead><tbody>';
					for (var i = 0; i < preAnnotators.length; i++) {
						html += '<tr><td>' + preAnnotators[i].name + '</td><td>' + preAnnotators[i].uri + '</td><td><button type="button" class="btn btn-secondary btn-sm" id="' + preAnnotators[i].name + '">Delete</button></td></tr>';
						delPreAnnotators.push(preAnnotators[i].name);
						selectPreAnnotatorsHtml += '<option value="' + preAnnotators[i].name + '">' + preAnnotators[i].name + '</option>';
					}
					html += '</tbody></table>';

				} else {
					var html = '';
					var selectPreAnnotatorsHtml = '<option id="optionPreAnnotatorDefault" value="default" selected>Choose...</option>';
					$("#spanAlertNoPreAnnotators").css("display", "block");
				}
				$('#divPreAnnotatorsTable').html(html);
				$("#" + selectBoxID).html(selectPreAnnotatorsHtml);
				currentProjName = projName;
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


$("#btnUsePreAnnotator").click(function() {
	var selectedValue = $("#selectPreAnnotator").val();
	var existingSpans = 0;
	$("p#pMessageContent span[type='button']").each(function() {
		existingSpans++;
	});

	if (selectedValue == "default") {
		alert("Please first select the pre-annotator you would like to use.");
	} else if (existingSpans > 0) {
		var modalPreAnnotatorWarning = new bootstrap.Modal($("#modalPreAnnotatorWarning"));
		modalPreAnnotatorWarning.show();
		var alertMessage = "There are some selected or annotated spans in the message. Do you still want to use the pre-annotator? If Yes, please click 'Continue', and these spans will be removed. If No, please 'Return' to continue to work on them.";
		$('#modalBodyPreAnnotatorWarning').html("<div class=\"col-12\" style=\"font-size: 1rem;\">" + alertMessage + "</div>");
	} else {
		var modalUsingPreannotator = new bootstrap.Modal($("#modalUsingPreannotator"));
		modalUsingPreannotator.show();
		setTimeout(function() { preAnnotateMsg(selectedValue, "spanAnnoatationProjectName", "pMessageContent"); }, 600);
	}
});


$("#btnPreAnnotatorReturn").click(function() {
	$("#modalPreAnnotatorWarning").modal('hide');
})


$("#btnPreAnnotatorContinue").click(function() {
	$("#modalPreAnnotatorWarning").modal('hide');
	$("#pMessageContent").html(currentMsgText);
	var selectedValue = $("#selectPreAnnotator").val();
	var modalUsingPreannotator = new bootstrap.Modal($("#modalUsingPreannotator"));
	modalUsingPreannotator.show();
	setTimeout(function() { preAnnotateMsg(selectedValue, "spanAnnoatationProjectName", "pMessageContent"); }, 600);
})


function preAnnotateMsg(selectedPreAnnoatator, projNameID, msgBoxID) {
	var projName = $("#" + projNameID).html();
	var currentMessage = $("#" + msgBoxID).text();

	getPreAnnotatorResult(projName, selectedPreAnnoatator, currentMessage)
		.then(function(annotationsList) {
			$("#modalUsingPreannotator").modal('hide');
			if (annotationsList.length > 0) {
				annotationsList.sort(function(a, b) {
					var startIdxA = a.startIdx;
					var startIdxB = b.startIdx;
					if (startIdxA < startIdxB) {
						return -1;
					}
					if (startIdxA > startIdxB) {
						return 1;
					}
					return 0;
				});

				for (var i = 0; i < annotationsList.length; i++) {
					var spanID = generateRandomStringID();

					var startIndexPreannotated = annotationsList[i]["startIdx"];
					var endIndexPreannotated = annotationsList[i]["endIdx"];
					var locationDescPreannotated = annotationsList[i]["locationDesc"];

					if (locationDescPreannotated && locationDescPreannotated.length > 0) {
						var startIndexReplace = 0;
						var endIndexReplace = 0;
						var existingSpanLengthPre = 0;
						var spanAllTextLengthPre = 0;

						var allHtml = $("#" + msgBoxID).html();

						$("#" + msgBoxID).find("span[type='button']").each(function() {
							var thisSpan = $(this);
							existingSpanLengthPre = existingSpanLengthPre + thisSpan.prop('outerHTML').length;
							spanAllTextLengthPre = spanAllTextLengthPre + thisSpan.prop('textContent').length;
						});

						startIndexHtml = startIndexPreannotated + existingSpanLengthPre - spanAllTextLengthPre;
						endIndexHtml = startIndexHtml + locationDescPreannotated.length;

						var prefix = allHtml.substring(0, startIndexHtml);
						var suffix = allHtml.substring(endIndexHtml);
						var preHtml = '<span type="button" id="' + spanID + '" class="badge position-relative" style="color: black; font-size: 1rem; font-weight: 400; background-color: #EDFB0B; padding: 0px;">';
						var afterHtml = '<span class="position-absolute top-0 start-100 translate-middle"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#5D6D7E" class="bi bi-x-circle-fill" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/></svg></span></span>';

						var highlightedString = prefix + preHtml + locationDescPreannotated + afterHtml + suffix;
						$("#" + msgBoxID).html(highlightedString);

						if (annotateOrResolve == "Annotate") {
							selectedSpansIndex.push({ "startIdx": startIndexPreannotated, "endIdx": endIndexPreannotated, "spanID": spanID });
						} /*else if (annotateOrResolve == "Resolve") {
							selectedSpansIDIndex_resolve.push({ "startIdx": startIndexPreannotated, "endIdx": endIndexPreannotated, "spanID": spanID });
						}*/
					}
				}
			} else {
				var modalNoPreannotatingResult = new bootstrap.Modal($("#modalNoPreannotatingResult"));
				modalNoPreannotatingResult.show();
				$('#modalBodyNoPreannotatingResult').html('<div class="col-12" style="font-size: 1rem;">There is no location description found in this message with this pre-annotator.</div>');
			}
		})
		.catch(function(error) {
			alert('ERROR: ' + error);
		});
}


function getPreAnnotatorResult(projName, preannotatorName, currentMessage) {
	return new Promise(function(resolve, reject) {
		$.ajax({
			url: 'AnnotationServlet',
			type: 'GET',
			data: { action: "extractLocationUsingPreannotator", projName: projName, preannotatorName: preannotatorName, message: currentMessage },
			dataType: 'text',
			success: function(result, textStatus, jqXHR) {
				var resultObject = JSON.parse(result);
				if (resultObject.status === "success") {
					var annotationsList = JSON.parse(resultObject.success).Annotation;
					resolve(annotationsList);
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


$('p#pMessageContent').on('click', 'span[type="button"]', function() {
	var clickedSpan = $(this);

	$("p#pMessageContent span[type='button']").each(function() {
		$(this).css('border', 'none');
	});

	clickedSpan.css({
		'border': '1px dashed red',
		'border-width': '1px'
	});

	var text = "";
	clickedSpan[0].childNodes.forEach(function(node) {
		if (node.nodeType === Node.TEXT_NODE) {
			text += node.textContent;
		}
	});
	locationDesc = text.trim();

	var clickedSpanId = clickedSpan.attr("id");
	currentWorkingSpanID = clickedSpanId;
	enableMapControls();
	var allAnnotatedSpanIDIndex = oldAnnotatedSpanIDIndex.concat(newAnnotatedSpanIDIndex);
	var annotatedSpanIDList = allAnnotatedSpanIDIndex.map(item => item.spanID);
	var selectedSpanIDList = selectedSpansIndex.map(item => item.spanID);

	/*$("p#pMessageContent span[type='button']").each(function() {
		if (selectedSpanIDList.includes($(this).attr('id'))) { //selected spans
			$(this).css("background-color", "#EDFB0B");
		}
		if (annotatedSpanIDList.includes($(this).attr('id'))) { //annnoated spans
			$(this).css("background-color", "#ABEBC6");
		}
	});*/

	drawnItemsForAnnotations.eachLayer(function(layer) {
		if (layer instanceof L.Polyline || layer instanceof L.Polygon) {
			layer.setStyle({ color: "#3388ff" });
		} else if (layer instanceof L.Marker) {
			layer.disablePermanentHighlight();
		}
	});

	if (selectedSpanIDList.includes(clickedSpanId)) {
		//$("#" + clickedSpanId).css("background-color", "#C6D121");
		for (var i = 0; i < selectedSpansIndex.length; i++) {
			var span = selectedSpansIndex[i];
			if (span.spanID === clickedSpan.attr("id")) {
				startIndex = span.startIdx;
				endIndex = span.endIdx;
				break;
			}
		}

		drawnItemsForAnnotations.eachLayer(function(layer) {
			var layerId = layer.options.id;
			if (layerId == clickedSpan.attr("id")) {
				if (layer.toGeoJSON().geometry.type == "LineString") {
					layer.setStyle({ color: "#00FFFF", weight: 3 });
					$('input[name="radioSpatialFootprintType"][value="Polyline"]').prop('checked', true).trigger('change');
				} else if (layer.toGeoJSON().geometry.type == "Polygon") {
					layer.setStyle({ color: "#00FFFF", weight: 3 });
					$('input[name="radioSpatialFootprintType"][value="Polygon"]').prop('checked', true).trigger('change');
				} else {
					layer.enablePermanentHighlight();
					$('input[name="radioSpatialFootprintType"][value="Point"]').prop('checked', true).trigger('change');
				}
			}
		});
	}

	if (annotatedSpanIDList.includes(clickedSpanId)) {
		//$("#" + clickedSpanId).css("background-color", "#28B463");
		var selectedCategoryCode = $(clickedSpan).children('span:first').html();
		$("#selectCategoryForAnnotation").find("option").each(function() {
			var option = $(this);
			if (option.val().split(":")[0] == selectedCategoryCode) {
				option.prop("selected", true);
			}
		});

		for (var i = 0; i < allAnnotatedSpanIDIndex.length; i++) {
			if (allAnnotatedSpanIDIndex[i].spanID == clickedSpan.attr("id")) {
				startIndex = allAnnotatedSpanIDIndex[i].startIdx;
				endIndex = allAnnotatedSpanIDIndex[i].endIdx;
			}
		}

		drawnItemsForAnnotations.eachLayer(function(layer) {
			var layerId = layer.options.id;
			if (layerId == clickedSpan.attr("id")) {
				if (layer.toGeoJSON().geometry.type == "LineString") {
					layer.setStyle({ color: "#00FFFF", weight: 3 });
					$('input[name="radioSpatialFootprintType"][value="Polyline"]').prop('checked', true).trigger('change');
				} else if (layer.toGeoJSON().geometry.type == "Polygon") {
					layer.setStyle({ color: "#00FFFF", weight: 3 });
					$('input[name="radioSpatialFootprintType"][value="Polygon"]').prop('checked', true).trigger('change');
				} else {
					layer.enablePermanentHighlight();
					$('input[name="radioSpatialFootprintType"][value="Point"]').prop('checked', true).trigger('change');
				}
			}
		});
	}
});


$('#btnFindSpatialByWeb').click(function() {
	var selectedService = $("#selectWebservice").val();
	findingSFUsingWS(selectedService, locationDesc, currentViewPort, currentWorkingSpanID, drawnItemsForAnnotations, mapForAnnotations, spatialTypeSelected);
})


function findingSFUsingWS(selectedServiceIF, locationDescIF, currentViewPortIF, currentWorkingSpanIDIF, drawnItemsIF, mapIF, spatialTypeSelectedIF) {
	if (selectedServiceIF == "default") {
		alert("Please first select a Web service for finding the spatial footprint.");
	} else {
		if (locationDescIF == '') {
			alert("Please first select the location description text.");
		} else {
			var modalUsingWebservice = new bootstrap.Modal($("#modalUsingWebservice"));
			modalUsingWebservice.show();
			if (selectedServiceIF == "Nominatim") {
				var viewbox = encodeURIComponent(currentViewPortIF.toBBoxString());
				var searchWord = encodeURIComponent(locationDescIF);
				var requestUrl = 'https://geoai.geog.buffalo.edu/nominatim/search?q=' + searchWord + '&limit=10000&format=json&addressdetails=1&polygon_geojson=1&viewbox=' + viewbox + '&bounded=1&dedupe=0';
				$.getJSON(requestUrl, function(results) {
					if (results.length == 0) {
						setTimeout(function() {
							$("#modalUsingWebservice").modal('hide');
							var modalNoGeocodingResult = new bootstrap.Modal($("#modalNoGeocodingResult"));
							modalNoGeocodingResult.show();
							$("#modalBodyNoGeocodingResult").html('There is no spatial footprint found for this location description using Nominatim. Please try other geocoding web services or draw the spatial footprint by yourself.')
						}, 600);
					} else {
						for (var i = 0; i < results.length; i++) {
							if (results[i].geojson.type == "GeometryCollection") {
								setTimeout(function() {
									$("#modalUsingWebservice").modal('hide');
									var modalNoGeocodingResult = new bootstrap.Modal($("#modalNoGeocodingResult"));
									modalNoGeocodingResult.show();
									$("#modalBodyNoGeocodingResult").html('Nominatim did not find a valid spatial footprint for this location description. Please try other geocoding web services or draw the spatial footprint by yourself.')
								}, 600);
								return false;
							}
						}

						let minDistance = Infinity;
						let indexWithMinDistance = null;
						for (var i = 0; i < results.length; i++) {
							const distance = calculateDistance([results[i].lon, results[i].lat], [mapIF.getCenter().lng, mapIF.getCenter().lat]);
							if (distance < minDistance) {
								minDistance = distance;
								indexWithMinDistance = i;
							}
						}
						if (annotateOrResolve == "Annotate") {
							geocodingResultsPoint = [results[indexWithMinDistance].lon, results[indexWithMinDistance].lat];
						} else if (annotateOrResolve == "Resolve") {
							geocodingResultsResolvePoint = [results[indexWithMinDistance].lon, results[indexWithMinDistance].lat];
						}

						var processedCoorsResults = processNominatimResults(results);
						var flattedCoorsList = processedCoorsResults[0];
						var onlyOneType = processedCoorsResults[1];

						if (onlyOneType) {
							if (flattedCoorsList[0].type == "LineString") {
								var selectedIndex = fingdingClosetPolyline(flattedCoorsList, mapIF.getCenter());
								const selectedResults = [];
								for (const index of selectedIndex) {
									if (index >= 0 && index < flattedCoorsList.length) {
										selectedResults.push(flattedCoorsList[index]);
									}
								}
								results = selectedResults;
							} else if (flattedCoorsList[0].type == "Point") {
								for (var i = 0; i < flattedCoorsList.length; i++) {
									const distance = calculateDistance(flattedResults[i].coordinates, [mapIF.getCenter().lng, mapIF.getCenter().lat]);
									if (distance < minDistance) {
										minDistance = distance;
										indexWithMinDistance = i;
									}
								}
								if (annotateOrResolve == "Annotate") {
									geocodingResultsPoint = flattedResults[indexWithMinDistance].coordinates;
								} else if (annotateOrResolve == "Resolve") {
									geocodingResultsResolvePoint = flattedResults[indexWithMinDistance].coordinates;
								}
							} else if (flattedCoorsList[0].type == "Polygon") {
								var selectedIndex = fingdingClosetPolygon(flattedCoorsList, mapIF.getCenter());
								const selectedResults = [];
								if (selectedIndex >= 0 && selectedIndex < flattedCoorsList.length) {
									selectedResults.push(flattedCoorsList[selectedIndex]);
								}
								results = selectedResults;
							}
						}

						if (!onlyOneType) {
							setTimeout(function() {
								$("#modalUsingWebservice").modal('hide');
								var modalNoGeocodingResult = new bootstrap.Modal($("#modalNoGeocodingResult"));
								modalNoGeocodingResult.show();
								$("#modalBodyNoGeocodingResult").html('Nominatim did not find a valid spatial footprint for this location description. Please try other geocoding web services or draw the spatial footprint by yourself.')
							}, 600);
							return false;
						}

						if (annotateOrResolve == "Annotate") {
							geocodingResults = results;
						} else if (annotateOrResolve == "Resolve") {
							geocodingResultsResolve = results;
						}

						var existingLayerNum = 0;
						drawnItemsIF.eachLayer(function(layer) {
							var layerId = layer.options.id;
							if (layerId == currentWorkingSpanIDIF) {
								existingLayerNum++;
							}
						});

						setTimeout(function() {
							$("#modalUsingWebservice").modal('hide');
							if (existingLayerNum > 0) {
								var replaceExistingSFModal = new bootstrap.Modal($("#replaceExistingSFModal"));
								replaceExistingSFModal.show();
							} else {
								showingReturnedSF(selectedServiceIF, results, currentWorkingSpanIDIF, drawnItemsIF, mapIF, spatialTypeSelectedIF);
							}
						}, 600);
					}
				})
					.fail(function(error) {
						alert(error);
					});
			} else if (selectedServiceIF == "Google Maps") {
				var boundsBox = currentViewPortIF.getSouthWest().lat + ',' + currentViewPortIF.getSouthWest().lng + '|' + currentViewPortIF.getNorthEast().lat + ',' + currentViewPortIF.getNorthEast().lng;
				var geocoder = L.Control.Geocoder.google({ apiKey: 'AIzaSyAOMBkZ6XpE0U45B86LTRpBsZ4gPBNs0dg', geocodingQueryParams: { "bounds": boundsBox } });
				geocoder.geocode(locationDescIF, function(results) {
					if (results.length == 0) {
						setTimeout(function() {
							$("#modalUsingWebservice").modal('hide');
							var modalNoGeocodingResult = new bootstrap.Modal($("#modalNoGeocodingResult"));
							modalNoGeocodingResult.show();
							$("#modalBodyNoGeocodingResult").html('There is no spatial footprint found for this location description using Google Maps. Please try other geocoding web services or draw the spatial footprint by yourself.')
						}, 600);
					} else {
						let minDistance = Infinity;
						let indexWithMinDistance = null;
						for (var i = 0; i < results.length; i++) {
							const distance = calculateDistance([results[i].center.lng, results[i].center.lat], [mapIF.getCenter().lng, mapIF.getCenter().lat]);
							if (distance < minDistance) {
								minDistance = distance;
								indexWithMinDistance = i;
							}
						}

						if (annotateOrResolve == "Annotate") {
							geocodingResults = [results[indexWithMinDistance]];
						} else if (annotateOrResolve == "Resolve") {
							geocodingResultsResolve = [results[indexWithMinDistance]];
						}

						var existingLayerNum = 0;
						drawnItemsIF.eachLayer(function(layer) {
							var layerId = layer.options.id;
							if (layerId == currentWorkingSpanIDIF) {
								existingLayerNum++;
							}
						});

						setTimeout(function() {
							$("#modalUsingWebservice").modal('hide');
							if (existingLayerNum > 0) {
								var replaceExistingSFModal = new bootstrap.Modal($("#replaceExistingSFModal"));
								replaceExistingSFModal.show();
							} else {
								showingReturnedSF(selectedServiceIF, [results[indexWithMinDistance]], currentWorkingSpanIDIF, drawnItemsIF, mapIF, spatialTypeSelectedIF);
							}
						}, 600);
					}
				});
			}
		}
	}
}


function showingReturnedSF(selectedServiceIF, returnedSFResults, currentWorkingSpanIDIF, drawnItemsIF, mapIF, spatialTypeSelectedIF) {
	if (selectedServiceIF == "Nominatim") {
		//var processedCoorsResults = processNominatimResults(returnedSFResults);
		//var flattedCoorsList = processedCoorsResults[0];
		var flattedCoorsList = returnedSFResults;
		var returnedGeometryType;
		if (flattedCoorsList[0].type == "LineString") {
			returnedGeometryType = "Polyline";
		} else {
			returnedGeometryType = flattedCoorsList[0].type;
		}

		if (spatialTypeSelectedIF == returnedGeometryType) {
			if (returnedGeometryType == "Point") {
				var geometryFoundMap = L.GeoJSON.geometryToLayer({ type: "Point", coordinates: [returnedSFResults[0].lon, returnedSFResults[0].lat] });
				geometryFoundMap.options.id = currentWorkingSpanIDIF;
				geometryFoundMap.addTo(drawnItemsIF);
				mapIF.setView(geometryFoundMap.getLatLng(), 15);
			} else {
				var allGeometryCoords = [];
				for (var i = 0; i < flattedCoorsList.length; i++) {
					var geometryFoundMap = L.GeoJSON.geometryToLayer(flattedCoorsList[i]);
					geometryFoundMap.options.id = currentWorkingSpanIDIF;
					geometryFoundMap.addTo(drawnItemsIF);
					allGeometryCoords.push(flattedCoorsList[i].coordinates);
				}
				while (calculateArrayDimension(allGeometryCoords) > 2) {
					allGeometryCoords = allGeometryCoords.flat();
				}
				var bounds = L.latLngBounds();
				for (var i = 0; i < allGeometryCoords.length; i++) {
					var latLng = L.latLng([allGeometryCoords[i][1], allGeometryCoords[i][0]]);
					bounds.extend(latLng);
				}
				mapIF.fitBounds(bounds);
			}
		} else {
			var modalDifferentGeoType = new bootstrap.Modal($("#modalDifferentGeoType"));
			modalDifferentGeoType.show();
			$("#modalBodyDifferentGeoType").html('You selected a spatial footprint of "' + spatialTypeSelectedIF + '" for this location description, but Nominatim can return a spatial footprint of "Point" and "' + returnedGeometryType + '". Which one would you like?');
			$("#btnPointType").html("Point");
			$("#btnReturnedType").html(returnedGeometryType);
		}
	} else if (selectedServiceIF == "Google Maps") {
		if (spatialTypeSelectedIF == "Point") {
			var geometryFound = {};
			geometryFound["type"] = "Point";
			geometryFound["coordinates"] = [returnedSFResults[0].center.lng, returnedSFResults[0].center.lat];
			var geometryFoundMap = L.GeoJSON.geometryToLayer(geometryFound);
			geometryFoundMap.options.id = currentWorkingSpanIDIF;
			geometryFoundMap.addTo(drawnItemsIF);
			mapIF.setView(geometryFoundMap.getLatLng(), 15);
		} else {
			var modalGoogleMap = new bootstrap.Modal($("#modalGoogleMap"));
			modalGoogleMap.show();
			$("#modalBodyGoogleMap").html('You selected a spatial footprint of "' + spatialTypeSelectedIF + '" for this location description, but Google Maps can only return a spatial footprint of "Point". You can use this point geometry or change to other ways to extract spatial footprint.');
		}
	}
}


$('#btnCancelReplaceSF').click(function() {
	$("#replaceExistingSFModal").modal('hide');
})


$('#btnConfirmReplaceSF').click(function() {
	$("#replaceExistingSFModal").modal('hide');

	if (annotateOrResolve == "Annotate") {
		drawnItemsForAnnotations.eachLayer(function(layer) {
			var layerId = layer.options.id;
			if (layerId == currentWorkingSpanID) {
				drawnItemsForAnnotations.removeLayer(layer);
			}
		});

		var selectedService = $("#selectWebservice").val();
		showingReturnedSF(selectedService, geocodingResults, currentWorkingSpanID, drawnItemsForAnnotations, mapForAnnotations, spatialTypeSelected);
	} else if (annotateOrResolve == "Resolve") {
		drawnItemsForResolvePublic.eachLayer(function(layer) {
			var layerId = layer.options.id;
			if (layerId == currentWorkingSpanIDResolvePublic) {
				drawnItemsForResolvePublic.removeLayer(layer);
			}
		});

		showingReturnedSF(selectedServiceResolvePublic, geocodingResultsResolve, currentWorkingSpanIDResolvePublic, drawnItemsForResolvePublic, mapForResolvePublic, spatialTypeSelectedResolvePublic);
	}
})


/*function processNominatimResults(nominatimResults) {
	var processedResults = [];
	if (nominatimResults[0].geojson.type == "Point" || nominatimResults[0].geojson.type == "Polygon") {
		processedResults.push(nominatimResults[0].geojson);
	} else if (nominatimResults[0].geojson.type == "MultiPoint") {
		Array.prototype.push.apply(processedResults, flattingCoordinates(nominatimResults[0].geojson.coordinates, "MultiPoint"));
	} else if (nominatimResults[0].geojson.type == "MultiPolygon") {
		Array.prototype.push.apply(processedResults, flattingCoordinates(nominatimResults[0].geojson.coordinates, "MultiPolygon"));
	} else if (nominatimResults[0].geojson.type == "LineString" || nominatimResults[0].geojson.type == "MultiLineString") {
		for (var i = 0; i < nominatimResults.length; i++) {
			var currentGeojson = nominatimResults[i].geojson;
			if (currentGeojson.type == "Point" || currentGeojson.type == "LineString" || currentGeojson.type == "Polygon") {
				processedResults.push(currentGeojson);
			} else if (currentGeojson.type == "MultiPolygon") {
				Array.prototype.push.apply(processedResults, flattingCoordinates(currentGeojson.coordinates, "MultiPolygon"));
			} else if (currentGeojson.type == "MultiLineString") {
				Array.prototype.push.apply(processedResults, flattingCoordinates(currentGeojson.coordinates, "MultiLineString"));
			} else if (currentGeojson.type == "MultiPoint") {
				Array.prototype.push.apply(processedResults, flattingCoordinates(currentGeojson.coordinates, "MultiPoint"));
			}
		}
	}

	var onlyOneType = true;
	const firstType = processedResults[0].type;
	for (let i = 1; i < processedResults.length; i++) {
		if (processedResults[i].type !== firstType) {
			onlyOneType = false;
			break;
		}
	}

	return [processedResults, onlyOneType];
}*/


function processNominatimResults(nominatimResults) {
	var processedResults = [];
	for (var i = 0; i < nominatimResults.length; i++) {
		var currentGeojson = nominatimResults[i].geojson;
		if (currentGeojson.type == "Point" || currentGeojson.type == "LineString" || currentGeojson.type == "Polygon") {
			processedResults.push(currentGeojson);
		} else if (currentGeojson.type == "MultiPolygon") {
			Array.prototype.push.apply(processedResults, flattingCoordinates(currentGeojson.coordinates, "MultiPolygon"));
		} else if (currentGeojson.type == "MultiLineString") {
			Array.prototype.push.apply(processedResults, flattingCoordinates(currentGeojson.coordinates, "MultiLineString"));
		} else if (currentGeojson.type == "MultiPoint") {
			Array.prototype.push.apply(processedResults, flattingCoordinates(currentGeojson.coordinates, "MultiPoint"));
		}
	}

	var onlyOneType = true;
	const firstType = processedResults[0].type;
	for (let i = 1; i < processedResults.length; i++) {
		if (processedResults[i].type !== firstType) {
			onlyOneType = false;
			break;
		}
	}

	return [processedResults, onlyOneType];
}


function flattingCoordinates(coordinates, geometryType, flattedList = []) {
	if (geometryType == "MultiPolygon") {
		for (let i = 0; i < coordinates.length; i++) {
			const geometry = coordinates[i];
			var dimension = calculateArrayDimension(geometry);
			if (dimension > 2) {
				flattingCoordinates(geometry, "MultiPolygon", flattedList);
			} else {
				const polygon = {
					type: 'Polygon',
					coordinates: [geometry]
				};
				flattedList.push(polygon);
			}
		}
	} else if (geometryType == "MultiLineString") {
		for (let i = 0; i < coordinates.length; i++) {
			const geometry = coordinates[i];
			var dimension = calculateArrayDimension(geometry);
			if (dimension > 2) {
				flattingCoordinates(geometry, "MultiLineString", flattedList);
			} else {
				const lineString = {
					type: 'LineString',
					coordinates: geometry
				};
				flattedList.push(lineString);
			}
		}
	} else if (geometryType == "MultiPoint") {
		for (let i = 0; i < coordinates.length; i++) {
			const geometry = coordinates[i];
			var dimension = calculateArrayDimension(geometry);
			if (dimension > 1) {
				flattingCoordinates(geometry, "MultiPoint", flattedList);
			} else {
				const point = {
					type: 'Point',
					coordinates: geometry
				};
				flattedList.push(point);
			}
		}
	}

	return flattedList;
}


/*function isDimensionGreaterThanTwo(arr) {
	if (!Array.isArray(arr)) {
		return false;
	}

	function checkDimension(array, dimension) {
		if (dimension > 2) {
			return true;
		}

		for (var i = 0; i < array.length; i++) {
			if (Array.isArray(array[i])) {
				if (checkDimension(array[i], dimension + 1)) {
					return true;
				}
			}
		}

		return false;
	}

	return checkDimension(arr, 1);
}*/


function calculateArrayDimension(arr) {
	function calculateDimension(array) {
		if (!Array.isArray(array)) {
			return 0;
		}

		let maxSubDimension = 0;

		for (let i = 0; i < array.length; i++) {
			const subArrayDimension = calculateDimension(array[i]);
			maxSubDimension = Math.max(maxSubDimension, subArrayDimension);
		}

		return maxSubDimension + 1;
	}

	return calculateDimension(arr);
}


function isArrayOneDimensional(arr) {
	for (let i = 0; i < arr.length; i++) {
		if (Array.isArray(arr[i])) {
			return false;
		}
	}
	return true;
}


$('#btnPointType').click(function() {
	$("#modalDifferentGeoType").modal('hide');
	$('input[name="radioSpatialFootprintType"][value="Point"]').prop('checked', true).trigger('change');
	var geocodingResultsUsing;
	var drawnItemsUsing;
	var mapUsing;
	var spanIDUsing;

	if (annotateOrResolve == "Annotate") {
		geocodingResultsUsing = geocodingResultsPoint;
		drawnItemsUsing = drawnItemsForAnnotations;
		mapUsing = mapForAnnotations;
		spanIDUsing = currentWorkingSpanID;
	} else if (annotateOrResolve == "Resolve") {
		geocodingResultsUsing = geocodingResultsResolvePoint;
		var currentMap = annotationsAndResolveMaps.find(function(resolveMap) {
			return Object.keys(resolveMap)[0] === "resolve";
		})["resolve"];
		drawnItemsUsing = currentMap[1];
		mapUsing = currentMap[0];
		spanIDUsing = currentWorkingSpanIDResolve;
	}

	var geometryFoundMap = L.GeoJSON.geometryToLayer({ type: "Point", coordinates: geocodingResultsUsing });
	geometryFoundMap.options.id = spanIDUsing;
	geometryFoundMap.addTo(drawnItemsUsing);
	mapUsing.setView(geometryFoundMap.getLatLng(), 15);
})


$('#btnReturnedType').click(function() {
	var clickedGeoType = $(this).html();
	$("#modalDifferentGeoType").modal('hide');
	$('input[name="radioSpatialFootprintType"][value="' + clickedGeoType + '"]').prop('checked', true).trigger('change');
	var geocodingResultsUsing;
	var drawnItemsUsing;
	var mapUsing;
	var spanIDUsing;

	if (annotateOrResolve == "Annotate") {
		geocodingResultsUsing = geocodingResults;
		drawnItemsUsing = drawnItemsForAnnotations;
		mapUsing = mapForAnnotations;
		spanIDUsing = currentWorkingSpanID;
	} else if (annotateOrResolve == "Resolve") {
		geocodingResultsUsing = geocodingResultsResolve;
		var currentMap = annotationsAndResolveMaps.find(function(resolveMap) {
			return Object.keys(resolveMap)[0] === "resolve";
		})["resolve"];
		drawnItemsUsing = currentMap[1];
		mapUsing = currentMap[0];
		spanIDUsing = currentWorkingSpanIDResolve;
	}

	//var flattedResults = processNominatimResults(geocodingResultsUsing)[0];
	var flattedResults = geocodingResultsUsing;
	var allGeometryCoords = [];
	for (var i = 0; i < flattedResults.length; i++) {
		var dimensionNumber = calculateArrayDimension(flattedResults[i].coordinates);
		var geometryFoundMap = L.GeoJSON.geometryToLayer(flattedResults[i]);
		geometryFoundMap.options.id = spanIDUsing;
		geometryFoundMap.addTo(drawnItemsUsing);
		allGeometryCoords.push(flattedResults[i].coordinates);
	}

	while (calculateArrayDimension(allGeometryCoords) > 2) {
		allGeometryCoords = allGeometryCoords.flat();
	}
	var bounds = L.latLngBounds();
	for (var i = 0; i < allGeometryCoords.length; i++) {
		var latLng = L.latLng([allGeometryCoords[i][1], allGeometryCoords[i][0]]);
		bounds.extend(latLng);
	}
	mapUsing.fitBounds(bounds);
})


$('#btnContinue2Leave').click(function() {
	$("#modalLeaveAnnotation").modal('hide');
	$("#annotationPage").fadeOut(500);
	setTimeout(loadStartProjectPage, 550);
})


$('input[name="radioSpatialFootprintType"]').change(function() {
	spatialTypeSelected = $(this).val();
});


$('#btnGooglePoint').click(function() {
	$("#modalGoogleMap").modal('hide');
	$('input[name="radioSpatialFootprintType"][value="Point"]').prop('checked', true).trigger('change');
	var geocodingResultsUsing;
	var drawnItemsUsing;
	var mapUsing;
	var spanIDUsing;

	if (annotateOrResolve == "Annotate") {
		geocodingResultsUsing = geocodingResults;
		drawnItemsUsing = drawnItemsForAnnotations;
		mapUsing = mapForAnnotations;
		spanIDUsing = currentWorkingSpanID;
	} else if (annotateOrResolve == "Resolve") {
		geocodingResultsUsing = geocodingResultsResolve;
		var currentMap = annotationsAndResolveMaps.find(function(resolveMap) {
			return Object.keys(resolveMap)[0] === "resolve";
		})["resolve"];
		drawnItemsUsing = currentMap[1];
		mapUsing = currentMap[0];
		spanIDUsing = currentWorkingSpanIDResolve;
	}

	var geometryFound = {};
	geometryFound["type"] = "Point";
	geometryFound["coordinates"] = [geocodingResultsUsing[0].center.lng, geocodingResultsUsing[0].center.lat];
	var geometryFoundMap = L.GeoJSON.geometryToLayer(geometryFound);
	geometryFoundMap.options.id = spanIDUsing;
	geometryFoundMap.addTo(drawnItemsUsing);
	mapUsing.setView(geometryFoundMap.getLatLng(), 15);
})


$('input[name="radioSpatialFootprintWay"]').change(function() {
	var spatialFootprintWay = $(this).val();

	if (spatialFootprintWay == "DrawItMyself") {
		$('#btnFindSpatialByWeb').prop('disabled', true);
	} else {
		$('#btnFindSpatialByWeb').prop('disabled', false);
	}
});


function fingdingClosetPolyline(flattedSpatialFoorprint, currentViewPoint) {
	const coordinatesWithSource = [];
	const coordinatesWithoutSource = [];
	for (var i = 0; i < flattedSpatialFoorprint.length; i++) {
		for (const coord of flattedSpatialFoorprint[i].coordinates) {
			const coordWithSource = [...coord, i];
			coordinatesWithSource.push(coordWithSource);
			coordinatesWithoutSource.push(coord);
		}
	}

	/*var segmentDistances = [];
	for (var i = 0; i < flattedSpatialFoorprint.length; i++) {
		for (var j = 0; j < flattedSpatialFoorprint[i].coordinates.length-1; j++) {
			var currentPoint = flattedSpatialFoorprint[i].coordinates[j];
			var nextPoint = flattedSpatialFoorprint[i].coordinates[j+1];
			segmentDistances.push(calculateDistance(currentPoint, nextPoint));
		}
	}
	var distanceMean = ss.mean(segmentDistances);
	var distanceSD = ss.standardDeviation(segmentDistances);
	var neighRadius = distanceMean + 2*distanceSD;*/

	var dbscan = new DBSCAN();
	var clusters = dbscan.run(coordinatesWithoutSource, 0.05, 2);

	const clusertsWithSegmentIndex = [];
	for (const cluster of clusters) {
		const clusertWithSegmentIndex = [];
		for (const coord_index of cluster) {
			clusertWithSegmentIndex.push(coordinatesWithSource[coord_index][2]);
		}
		clusertsWithSegmentIndex.push(clusertWithSegmentIndex);
	}

	const clusterUniqueSegmentIndex = clusertsWithSegmentIndex.map((subList) => {
		const uniqueSubList = [...new Set(subList)];
		return uniqueSubList;
	});

	let minMaxDistance = Infinity;
	let clusterSegmentIndexWithMinMaxDistance = null;
	for (const clusterSegmentIndex of clusterUniqueSegmentIndex) {
		let maxDistance = -Infinity;

		for (const segmentIndex of clusterSegmentIndex) {
			const distance = calculateSegmentCenterDistance(flattedSpatialFoorprint[segmentIndex].coordinates, [currentViewPoint.lng, currentViewPoint.lat]);
			if (distance > maxDistance) {
				maxDistance = distance;
			}
		}

		if (maxDistance < minMaxDistance) {
			minMaxDistance = maxDistance;
			clusterSegmentIndexWithMinMaxDistance = clusterSegmentIndex;
		}
	}

	/*	let returnedSpatialFootprint = [];
		for (const segmentIndex of clusterSegmentIndexWithMinMaxDistance) {
			returnedSpatialFootprint.push(flattedSpatialFoorprint[segmentIndex]);
		}*/

	return clusterSegmentIndexWithMinMaxDistance;
}


function calculateSegmentCenterDistance(segmentCoordinate, pointCoordinate) {
	let minDistance = Infinity;
	for (const segmentPoint of segmentCoordinate) {
		const distance = calculateDistance(segmentPoint, pointCoordinate);
		if (distance < minDistance) {
			minDistance = distance;
		}
	}

	return minDistance;
}


function calculateDistance(point1, point2) {
	const [x1, y1] = point1;
	const [x2, y2] = point2;
	return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}


function fingdingClosetPolygon(flattedSpatialFoorprint, currentViewPoint) {
	let minDistance = Infinity;
	let indexWithMinDistance = null;
	for (var i = 0; i < flattedSpatialFoorprint.length; i++) {
		const coordinates = flattedSpatialFoorprint[i].coordinates[0];
		const coordGeolibFormat = coordinates.map(coord => ({
			latitude: coord[1],
			longitude: coord[0],
		}));
		const centroid = geolib.getCenter(coordGeolibFormat);
		const distance = calculateDistance([centroid.longitude, centroid.latitude], [currentViewPoint.lng, currentViewPoint.lat]);
		if (distance < minDistance) {
			minDistance = distance;
			indexWithMinDistance = i;
		}
	}
	return indexWithMinDistance;
}
