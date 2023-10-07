/**
 * This is the JavaScript file for the "annotation" page.
 */


// global variables in the annotation page 
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


// reset all global variables in the annotation page
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


// highlight the selected text as a span in a message
$("#pMessageContent").on('mouseup', function() {
	// get the ID attribute of all existing annotated spans and selected spans
	var allAnnotatedSpanIDIndex = oldAnnotatedSpanIDIndex.concat(newAnnotatedSpanIDIndex);
	var annotatedSpanIDList = allAnnotatedSpanIDIndex.map(item => item.spanID);
	var selectedSpanIDList = selectedSpansIndex.map(item => item.spanID);

	// remove the border of all the spans
	$("p#pMessageContent span[type='button']").each(function() {
		$(this).css('border', 'none');
	});
	
	// unhighlight all spatial footprints
	drawnItemsForAnnotations.eachLayer(function(layer) {
		if (layer instanceof L.Polyline || layer instanceof L.Polygon) {
			layer.setStyle({ color: "#3388ff" });
		} else if (layer instanceof L.Marker) {
			layer.disablePermanentHighlight();
		}
	});
	$("#optionCategoryDefaultForAnnotation").prop('selected', true);
	
	// compute start index and end index, and highlight the selected text
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
		
		// compute the character length of existing span html, location text, and category code, which will be used for computing the location of newly selected spans and creating its span
		while (startContainer !== null && startContainer.parentNode !== null) {
			var prevSibling = startContainer.previousSibling;
			while (prevSibling !== null) {
				if (prevSibling.nodeType === Node.ELEMENT_NODE && prevSibling.tagName === "SPAN" && prevSibling.getAttribute("type") === "button") {
					existingSpanLength = existingSpanLength + he.decode(prevSibling.outerHTML).length;
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
		
		// compute start index and end index of the selected location description
		startIndex = getSelectedTextIndex(range, "pMessageContent") - cateGoryCodeLength;
		endIndex = startIndex + range.toString().length;
		startIndex = startIndex + (selectedText.length - selectedText.trimStart().length);
		endIndex = endIndex - (selectedText.length - selectedText.trimEnd().length);
		
		// highlight the selected spans based on all the computed indexes
		selectedHighLightText(startIndex, endIndex, existingSpanLength, spanAllTextLength, cateGoryCodeLength, locationDesc, "pMessageContent");
		
		// enable map controls
		if (currentWorkingSpanID != "") {
			enableMapControls();
		}
	}
});


// compute the start index of selected text
function getSelectedTextIndex(range, msgBoxID) {
	var clonedRange = range.cloneRange();
	clonedRange.selectNodeContents($("#" + msgBoxID)[0]);
	clonedRange.setEnd(range.startContainer, range.startOffset);

	var precedingText = clonedRange.toString();
	return precedingText.length;
}


// highlight the selected text based on its start index and end index 
function selectedHighLightText(startIndex, endIndex, existingSpanLength, spanAllTextLength, cateGoryCodeLength, locationDesc, msgBoxID) {
	var spanID = generateRandomStringID();

	var allHtml = $("#" + msgBoxID).html();
	allHtml = he.decode(allHtml);
	
	// compute start index and end index in HTML
	startIndexHtml = startIndex + existingSpanLength - spanAllTextLength + cateGoryCodeLength;
	endIndexHtml = startIndexHtml + locationDesc.length;
	var prefix = allHtml.substring(0, startIndexHtml);
	var suffix = allHtml.substring(endIndexHtml);
	var preHtml = '<span type="button" id="' + spanID + '" class="badge position-relative" style="color: black; font-size: 1rem; font-weight: 400; background-color: #EDFB0B; padding: 0px; border: 1px dashed red; border-width: 1px">';
	var afterHtml = '<span class="position-absolute top-0 start-100 translate-middle"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#5D6D7E" class="bi bi-x-circle-fill" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/></svg></span></span>';
	
	// highlight selected text
	var highlightedString = prefix + preHtml + locationDesc + afterHtml + suffix;
	$("#" + msgBoxID).html(highlightedString);
	
	// record the ID attribute of a selected span
	if (annotateOrResolve == "Annotate") {
		selectedSpansIndex.push({ "startIdx": startIndex, "endIdx": endIndex, "spanID": spanID });
		currentWorkingSpanID = spanID;
	} else if (annotateOrResolve == "Resolve") {
		selectedSpansIDIndex_resolve.push({ "startIdx": startIndex, "endIdx": endIndex, "spanID": spanID });
		currentWorkingSpanIDResolve = spanID;
	}
}


// remove a selected or annotated span by clicking the close icon in the right top corner
$('#pMessageContent').on('click', '.bi-x-circle-fill', function(event) {
	event.stopPropagation();
	// replace the html of the span with plain text
	var highlightedElement = $(this).closest('.badge');
	var plainText = highlightedElement.contents().filter(function() {
		return this.nodeType === Node.TEXT_NODE;
	}).text();
	highlightedElement.replaceWith(plainText);
	var closingSpanID = highlightedElement.attr("id");

	var allAnnotatedSpanIDIndex = oldAnnotatedSpanIDIndex.concat(newAnnotatedSpanIDIndex);
	var annotatedSpanIDList = allAnnotatedSpanIDIndex.map(item => item.spanID);
	var selectedSpanIDList = selectedSpansIndex.map(item => item.spanID);
	
	// if an annotated span, remove relevant spatial footprints and remove this annotation from all the annotation of the current message
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
	// if a selected span, remove relevant spatial footprints and remove the ID attribute from the list of all selected spans
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


// annotate a location description for this message
$("#btnAddAnnotation").click(function() {
	// check whether this location description is complete. if no, show a pop over window to remind the user
	if (!(Number.isInteger(startIndex)) || !(Number.isInteger(endIndex)) || locationDesc == "") {
		popoverAnnotationWarning.enable();
		popoverAnnotationWarning._config.content = '<div class="custom-popover-content"><p>You haven\'t selected a location description.</p><a id="aClosePopoverAnnotationWarning" role="button" class="closePopover">&times;</a></div>';
		popoverAnnotationWarning.show();
		popoverAnnotationWarning.disable();
	} else if (obtainSpatialFootprint(drawnItemsForAnnotations, currentWorkingSpanID).length == 0 || $("#selectCategoryForAnnotation").val() == "default") {
		popoverAnnotationWarning.enable();
		popoverAnnotationWarning._config.content = '<div class="custom-popover-content"><p>This description cannot be annotated. To annotate this description, category and spatial footprint are all required.</p><a id="aClosePopoverAnnotationWarning" role="button" class="closePopover">&times;</a></div>';
		popoverAnnotationWarning.show();
		popoverAnnotationWarning.disable();
	} else {
		// if complete, add this annotation
		var annotation = {};
		annotation["startIdx"] = startIndex;
		annotation["endIdx"] = endIndex;
		annotation["locationDesc"] = locationDesc;
		annotation["locationCate"] = $("#selectCategoryForAnnotation").val();
		var categoryCode = $("#selectCategoryForAnnotation").val().split(":")[0];
		annotation["spatialFootprint"] = obtainSpatialFootprint(drawnItemsForAnnotations, currentWorkingSpanID);		
		
		// if an annotated location description is edited, it is necessary to remove it from the list and use the new one
		for (var j = 0; j < annotationOneMessage.length; j++) {
			if (startIndex == annotationOneMessage[j].startIdx && endIndex == annotationOneMessage[j].endIdx) {
				annotationOneMessage.splice(j, 1);
			}
		}
		annotationOneMessage.push(annotation);
		
		// highlight this location description in a different color
		var allHtml = he.decode($("#pMessageContent").html());
		if (locationDesc && locationDesc.length > 0) {
			var textNodes = $("p#pMessageContent").contents().filter(function() {
				return this.nodeType === Node.TEXT_NODE;
			});
			
			// compute start index and end index for replacing the selected span
			var startIndexReplace = 0;
			var endIndexReplace = 0;
			var workingSpanHtml = he.decode($('#' + currentWorkingSpanID)[0].outerHTML);
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
			
			// replace selected span with an annotated span
			var highlightedString = prefix + preHtml + categoryHtml + locationDesc + afterHtml + suffix;
			$("#pMessageContent").html(highlightedString);
		}
		
		// show a pop over window to remind the user that they can repeatedly annotate more location descriptions in this message
		popoverAnnotation._config.content = '<div id="divPopoverAnnotate" class="custom-popover-content"></div>';
		var popover_html = '<p>The description has been annotated, and you can repeat this process to annotate other location descriptions in this message.</p><a id="aClosePopoverAnnotation" role="button" class="closePopover">&times;</a><input class="form-check-input" type="checkbox" id="checkDisablePopoverAnnotation"> <label class="form-check-label" for="checkDisablePopoverAnnotation">Don\'t show this message later.</label>';
		popoverAnnotation.show();
		$("#divPopoverAnnotate").html(popover_html);
		
		// reset some parameters
		$("#optionCategoryDefaultForAnnotation").prop('selected', true);
		startIndex = "";
		endIndex = "";
		locationDesc = "";
		currentWorkingSpanID = "";
		disableMapControls();
	}
})


// get all spatial footprints with a specific ID and organize them into a list of json objects based on types of spatial footprints 
function obtainSpatialFootprint(drawnItems, currentSpanID) {
	var spatialFoorprintList = [];
	drawnItems.eachLayer(function(layer) {
		var layerId = layer.options.id;
		if (layerId == currentSpanID) {
			var typeValues = spatialFoorprintList.map(item => item.type);
			if (typeValues.includes(layer.toGeoJSON().geometry.type)) {
				for (var i = 0; i < spatialFoorprintList.length; i++) {
					if (spatialFoorprintList[i].type == layer.toGeoJSON().geometry.type) {
						spatialFoorprintList[i].geometry.push(layer.toGeoJSON().geometry);
					}
				}
			} else {
				var newTypeGeometry = { "type": layer.toGeoJSON().geometry.type, "geometry": [layer.toGeoJSON().geometry] };
				spatialFoorprintList.push(newTypeGeometry);
			}
		}
	});
	return spatialFoorprintList;
}


// finish annotating the current message and go to the next
$("#btnFinishAndNext").click(function() {
	// check whether there is any selected span
	var existingSelectedSpans = 0;
	$("p#pMessageContent span[type='button']").each(function() {
		if ($(this).css("background-color") === "rgb(237, 251, 11)") { //selected spans
			existingSelectedSpans++;
		}
	});
	
	// if there is any selected span, show a modal to remind the user
	if (existingSelectedSpans > 0) {
		var modalPrensentSelectedSpans = new bootstrap.Modal($("#modalPrensentSelectedSpans"));
		modalPrensentSelectedSpans.show();
		var alertMessage = "There are some unannotated spans. Do you still want to go to the next message? If Yes, please click 'Continue', and these selected spans will be lost. If No, please 'Return' to continue to work on them.";
		$('#modalBodyPrensentSelectedSpans').html("<div class=\"col-12\" style=\"font-size: 1rem;\">" + alertMessage + "</div>");
	} else {
		// check whether there is any conflict, namely there are some annotated location descriptions, but check box for no location description is also clicked.
		// if yes, show a modal to ask the user to make decisions
		if (annotationOneMessage.length != 0 && $("#checkNoAnnotation").prop("checked")) {
			var modalNoOrAnyAnnnotation = new bootstrap.Modal($("#modalNoOrAnyAnnnotation"));
			modalNoOrAnyAnnnotation.show();
			var alertMessage = 'You annotated some location descriptions in this message, meanwhile you also chose the option of "No location description". Please determine whether this message has annotations or not.';
			$('#modalBodyNoOrAnyAnnnotation').html("<div class=\"col-12\" style=\"font-size: 1rem;\">" + alertMessage + "</div>");
		} else {
			// save annotations and go to the next message 
			saveAnnotations();
			annotationOneMessage = [];
			newAnnotatedSpanIDIndex.length = 0;
			selectedSpansIndex.length = 0;
			nextMessages();
		}
	}
})


// if the user choose to save existing annotations
$("#btnSaveExistingAnnotations").click(function() {
	$("#modalNoOrAnyAnnnotation").modal('hide');
	$("#checkNoAnnotation").prop('checked', false);
	saveAnnotations();
	annotationOneMessage = [];
	newAnnotatedSpanIDIndex.length = 0;
	selectedSpansIndex.length = 0;
	nextMessages();
})


// if the user chooses to confirm that there is no any location description in this message 
$("#btnKeepNoLocaDesc").click(function() {
	$("#modalNoOrAnyAnnnotation").modal('hide');
	annotationOneMessage = [];
	saveAnnotations();
	newAnnotatedSpanIDIndex.length = 0;
	selectedSpansIndex.length = 0;
	nextMessages();
})


// return to the current message
$("#btnReturnCurrentMsg").click(function() {
	$("#modalPrensentSelectedSpans").modal('hide');
})


// if the user chooses to discard existing selected spans
$("#btnDisregardSelected").click(function() {
	$("#modalPrensentSelectedSpans").modal('hide');
	saveAnnotations();
	annotationOneMessage = [];
	newAnnotatedSpanIDIndex.length = 0;
	selectedSpansIndex.length = 0;
	nextMessages();
})


// save annotations of the current message
function saveAnnotations() {
	currentWorkingSpanID = "";
	disableMapControls();
	$("#optionCategoryDefaultForAnnotation").prop('selected', true);
	drawnItemsForAnnotations.clearLayers();
	var isAnnotated = false;
	$("#spanAnnotatedMessage").css("display", "none");
	
	// check whether this message has been annotated previously
	for (var i = 0; i < annotationsOneBatch.length; i++) {
		if (annotationsOneBatch[i].messageID == currentMsgID) {
			isAnnotated = true;
			break;
		}
	}
	
	// build a complete annotation object 
	var oneSubmittedAnnotation = {};
	oneSubmittedAnnotation["messageID"] = currentMsgID;
	oneSubmittedAnnotation["annotator"] = currentUser;
	oneSubmittedAnnotation["method"] = "Annotate";
	var currentDate = new Date();
	var annotationTime = currentDate.toLocaleString();
	oneSubmittedAnnotation["annotationTime"] = annotationTime;
	var annotation = {};
	
	// if this message was not annotated previously
	if (!isAnnotated) {
		// add existing annotations for this message, and add this annotated message to this batch
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
	// if this message was annotated previously
	} else {
		// update the annotation of this message
		if ($("#checkNoAnnotation").prop("checked")) {
			annotation["Annotation"] = [];
			annotationsOneBatch.splice(i, 1);
			oneSubmittedAnnotation["Annotation"] = annotation;
			annotationsOneBatch.push(oneSubmittedAnnotation);
		} else {
			var oldAnnotations = annotationsOneBatch[i].Annotation.Annotation;
			annotationOneMessage = updatingAnnotations(oldAnnotations, annotationOneMessage, oldAnnotatedSpanIDIndex);
			// if all location descriptions are removed, label this message as not annotated
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


// updating annotations of a message
function updatingAnnotations(oldAnnotations, annotationOneMessage, oldAnnotatedSpanIDIndex) {
	// get ID attribute of all annotated spans (namely new and old) and old annotated spans
	var allAnnotatedSpanIDIndex = oldAnnotatedSpanIDIndex.concat(newAnnotatedSpanIDIndex);
	var annotatedSpanIDList = allAnnotatedSpanIDIndex.map(item => item.spanID);
	var oldAnnotatedSpanIDList = oldAnnotatedSpanIDIndex.map(item => item.spanID);
	
	// get all existing annotated spans in the current message
	var allAnnotationSpans = $("p#pMessageContent span[type='button']").filter(function() {
		return annotatedSpanIDList.includes($(this).attr('id'));
	});
	
	// find annotations which still exist
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

	// if one annotation still exists but is edited (such as the category or spatial footprint), remove the existing one
	for (var i = 0; i < oldStillAnnotations.length; i++) {
		for (var j = 0; j < annotationOneMessage.length; j++) {
			if (oldStillAnnotations[i].startIdx == annotationOneMessage[j].startIdx && oldStillAnnotations[i].endIdx == annotationOneMessage[j].endIdx) {
				oldStillAnnotations.splice(i, 1);
			}
		}
	}
	
	// return old annotations which are not changed and new annotations
	return oldStillAnnotations.concat(annotationOneMessage);
}


// go to the next message
function nextMessages() {
	drawnItemsForAnnotations.clearLayers();
	$("#optionCategoryDefaultForAnnotation").prop('selected', true);
	$("#checkNoAnnotation").prop('checked', false);
	// check which messages have been annotated
	var submittedMsgID = new Set();
	for (var j = 0; j < annotationsOneBatch.length; j++) {
		submittedMsgID.add(annotationsOneBatch[j].messageID);
	}
	
	// check which messages have not been annotated
	var unsubmittedMsgIDs = new Set();
	batchMsgIDs.forEach(function(msgID) {
		if (!submittedMsgID.has(msgID)) {
			unsubmittedMsgIDs.add(msgID);
		}
	});
	
	// if the current batch still has some messages, show the next one 
	if (messagesOneBatch.length > 1) {
		// add the current message to the end of list for previous messages
		previousMsgs.push(messagesOneBatch.shift());
		// show the next one
		currentMsgText = messagesOneBatch[0].messageData.text;
		$("#pMessageContent").html(messagesOneBatch[0].messageData.text);
		currentMsgID = messagesOneBatch[0].messageID;

		// show whether this message is annotated or not
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
	// if this batch does not have any message and there are still some messages which are not annotated, show a modal to remind the user
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
	// this is already the end of this batch and all messages have been annotated. Show a modal to allow the user to submit this batch
	} else {
		loadAnnotations(currentMsgID);
		var modalSubmitMsgBatch = new bootstrap.Modal($("#modalSubmitMsgBatch"));
		modalSubmitMsgBatch.show();
		var alertMessage = "The current batch has been completely annotated. Do you want to submit the current batch and move on to the next batch now? If Yes, please click 'Submit', and you will be unable to revise annotations of the current batch. If No, please 'Return' to revise annotations in the current batch.";
		$('#modalBodySubmitMsgBatch').html("<div id=\"divAlertSubmitMsgBatch\" class=\"col-12\" style=\"font-size: 1rem;\">" + alertMessage + "</div>");
	}

	// disable or enable the button for going to the previous message
	if (previousMsgs.length > 0) {
		$("#btnPrevMessage").prop('disabled', false);
	} else {
		$("#btnPrevMessage").prop('disabled', true);
	}
	$("#pMessageContent").css("display", "block");
}


// submit the current batch
$("#btnSubmitBatch").click(function() {
	drawnItemsForAnnotations.clearLayers();
	$("#modalSubmitMsgBatch").modal('hide');
	$.ajax({
		url: 'AnnotationServlet',
		type: 'POST',
		data: { action: "submitBatchAnnotation", annotationOneBatch: encodeURIComponent(JSON.stringify(annotationsOneBatch)) },
		dataType: 'text',
		success: function(result, textStatus, jqXHR) {
			var resultObject = JSON.parse(result);
			if (resultObject.status == "success") {
				// if submitted successfully, reset variables and request the next batch
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
							// get the next batch of messages from the result and show the first one
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
							// examine whether all messages have been annotated. If yes, show a modal to remind the user and ask the user to go to the home page
							if (resultObject.status == "noRemainingMsg") {
								var modalNoRemainingMsg = new bootstrap.Modal($("#modalNoRemainingMsg"));
								modalNoRemainingMsg.show();
								$('#modalBodyNoRemainingMsg').html("<div class=\"col-12\" style=\"font-size: 1rem;\">All messages in the data of this project have been annotated. Please return to the home page.</div>");
								$("#pMessageContent").html("");
								$("#spanAnnotatedMessage").css("display", "none");
								$("#checkNoAnnotation").prop('checked', false);
								$("#selectWebservice").val("default");
								$("#selectPreAnnotator").val("default");
								$('input[name="radioSpatialFootprintType"][value="Point"]').prop('checked', true);
								var $defaultCategory = $('#selectCategoryForAnnotation').find('option[value="default"]');
								if ($defaultCategory.length > 0) {
									$defaultCategory.prop('selected', true);
								}
							} else {						
								alert(resultObject.error);
							}
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


// go to the home page after all messages have been annotated
$("#btnHomePageForNoRemainingMsg").click(function() {
	$("#modalNoRemainingMsg").modal('hide');
	$("#annotationPage").fadeOut(500);
	setTimeout(loadStartProjectPage, 550);
})


// choose to return to the current batch and not submit 
$("#btnReturnCurrentBatch").click(function() {
	$("#modalSubmitMsgBatch").modal('hide');
})


// go to the previous one message
$("#btnPrevMessage").click(function() {
	var existingSpans = 0;
	$("p#pMessageContent span[type='button']").each(function() {
		if ($(this).css("background-color") === "rgb(237, 251, 11)") { //selected spans
			existingSpans++;
		}
	});
	// examine whether there are some selected spans. If yes, show a modal to remind the user
	if (existingSpans > 0) {
		var modalPreviousMsgWarning = new bootstrap.Modal($("#modalPreviousMsgWarning"));
		modalPreviousMsgWarning.show();
		var alertMessage = "There are some unannotated spans. Do you still want to go to the previous message? If Yes, please click 'Continue', and these spans will be lost. If No, please 'Return' to continue to work on them.";
		$('#modalBodyPreviousMsgWarning').html("<div class=\"col-12\" style=\"font-size: 1rem;\">" + alertMessage + "</div>");
	} else {
		goToPrevious();
	}
})


// return the current message
$("#btnPreviousMsgWarningReturn").click(function() {
	$("#modalPreviousMsgWarning").modal('hide');
})


// discard those selected spans and go to the previous message
$("#btnPreviousMsgWarningContinue").click(function() {
	$("#modalPreviousMsgWarning").modal('hide');
	goToPrevious();
})


// go to the previous message
function goToPrevious() {
	// reset some variables
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
	
	// show the last message in the list of previous messages
	var fullString = previousMsgs[previousMsgs.length - 1].messageData.text;
	currentMsgText = previousMsgs[previousMsgs.length - 1].messageData.text;
	$("#pMessageContent").html(previousMsgs[previousMsgs.length - 1].messageData.text);
	currentMsgID = previousMsgs[previousMsgs.length - 1].messageID;
	messagesOneBatch.unshift(previousMsgs.pop());
	
	// disable or enable the button for going to the previous message
	if (previousMsgs.length > 0) {
		$("#btnPrevMessage").prop('disabled', false);
	} else {
		$("#btnPrevMessage").prop('disabled', true);
	}
	
	// enable the button for going to next message
	if ($('#btnSaveAndNext').prop('disabled')) {
		$('#btnSaveAndNext').prop('disabled', false);
	}
	
	// show the annotated location descriptions if this message has already been annotated
	loadAnnotations(currentMsgID);
}


// check whether one message is annotated or not
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


// 
function loadAnnotations(currentMsgID) {
	$("#pMessageContent").html(currentMsgText);
	var isAnnotated = false;
	
	// check whether this message is annotated or not
	oldAnnotatedSpanIDIndex.length = 0;
	for (var i = 0; i < annotationsOneBatch.length; i++) {
		if (annotationsOneBatch[i].messageID == currentMsgID) {
			$("#spanAnnotatedMessage").css("display", "block");
			$("#spanAnnotatedMessage").css("background-color", "#239B56");
			$("#spanAnnotatedMessage").html("This message was annotated.");
			isAnnotated = true;
			
			// check whether this annotated message has any location description
			if (annotationsOneBatch[i].Annotation.Annotation.length == 0) {
				$("#checkNoAnnotation").prop('checked', true);
				oldAnnotatedSpanIDIndex.length = 0;
			} else {
				// if yes, highlight those location descriptions in this message
				showAnnotationsOfAnnotatedMsg(annotationsOneBatch[i].Annotation.Annotation, "pMessageContent", drawnItemsForAnnotations, mapForAnnotations);
			}
		}

	}
	currentWorkingSpanID = "";
	disableMapControls();
	return isAnnotated;
}


// show annotated location descriptions on a message and their spatial footprints
function showAnnotationsOfAnnotatedMsg(annotations, msgBoxID, drawnItems, mapInParameter) {
	// rank annotated location descriptions based on their start index
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
	
	// show annotations one by one
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
			var cateGoryCodeLengthLA = 0;
			var existingSpanLengthLA = 0;
			var spanAllTextLengthLA = 0;
			
			// compute start index and end index in HTML to highlight a location description
			var allHtml = he.decode($("#" + msgBoxID).html());

			$("#" + msgBoxID).find("span[type='button']").each(function() {
				var thisSpan = $(this);
				existingSpanLengthLA = existingSpanLengthLA + he.decode(thisSpan.prop('outerHTML')).length;
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
			
			// record the start index, end index, and ID attribute of an annotated span
			if (annotateOrResolve == "Annotate") {
				oldAnnotatedSpanIDIndex.push({ "startIdx": startIndexAnnotated, "endIdx": endIndexAnnotated, "spanID": spanID });
			} else if (annotateOrResolve == "Resolve") {
				annotatedSpanIDIndex_resolve.push({ "startIdx": startIndexAnnotated, "endIdx": endIndexAnnotated, "spanID": spanID });
			}
		}
		
		// show spatial footprints on the map based on their types
		var pointGeometryCoords = [];
		var polylineGeometryCoords = [];
		var polygonGeometryCoords = [];
		for (var p = 0; p < spatialFootprintAnnotated.length; p++) {
			var currentGeometry = spatialFootprintAnnotated[p].geometry;
			if (spatialFootprintAnnotated[p].type == "Point") {
				for (var m = 0; m < currentGeometry.length; m++) {
					var geometryFoundMap = L.GeoJSON.geometryToLayer(currentGeometry[m]);
					geometryFoundMap.options.id = spanID;
					geometryFoundMap.addTo(drawnItems);
					pointGeometryCoords.push(currentGeometry[m].coordinates);					
				}
			} else if (spatialFootprintAnnotated[p].type == "LineString") {
				for (var m = 0; m < currentGeometry.length; m++) {
					var geometryFoundMap = L.GeoJSON.geometryToLayer(currentGeometry[m]);
					geometryFoundMap.options.id = spanID;
					geometryFoundMap.addTo(drawnItems);
					polylineGeometryCoords.push(currentGeometry[m].coordinates);
				}
				while (calculateArrayDimension(polylineGeometryCoords) > 2) {
					polylineGeometryCoords = polylineGeometryCoords.flat();
				}
			} else if (spatialFootprintAnnotated[p].type == "Polygon") {
				for (var m = 0; m < currentGeometry.length; m++) {
					var geometryFoundMap = L.GeoJSON.geometryToLayer(currentGeometry[m]);
					geometryFoundMap.options.id = spanID;
					geometryFoundMap.addTo(drawnItems);
					polygonGeometryCoords.push(currentGeometry[m].coordinates);
				}
				while (calculateArrayDimension(polygonGeometryCoords) > 2) {
					polygonGeometryCoords = polygonGeometryCoords.flat();
				}
			}
		}
		var allGeometryCoords = pointGeometryCoords.concat(polylineGeometryCoords, polygonGeometryCoords);
		
		// set the map view
		if (allGeometryCoords.length == 1) {
			mapInParameter.setView(L.latLng(allGeometryCoords[0][1], allGeometryCoords[0][0]), 15);
		} else {
			var bounds = L.latLngBounds();
			for (var n = 0; n < allGeometryCoords.length; n++) {
				var latLng = L.latLng([allGeometryCoords[n][1], allGeometryCoords[n][0]]);
				bounds.extend(latLng);
			}
			mapInParameter.fitBounds(bounds);
		}
	}
}


// a pop over window for reminding the user they can repeatedly add more location descriptions in a message
var popoverAnnotation = new bootstrap.Popover($('#btnAddAnnotation')[0], {
	placement: 'top',
	html: true
});


// a pop over window for reminding the user the current location description is not complete 
var popoverAnnotationWarning = new bootstrap.Popover($('#btnAddAnnotation')[0], {
	placement: 'top',
	html: true
});


// close a pop over window
$(document).on('click', '#aClosePopoverAnnotation', function() {
	popoverAnnotation.hide();
});


// disable a pop over window
$(document).on('change', '#checkDisablePopoverAnnotation', function() {
	if ($(this).is(':checked')) {
		popoverAnnotation.disable();
	}
});


// close a pop over window
$(document).on('click', '#aClosePopoverAnnotationWarning', function() {
	popoverAnnotationWarning.hide();
});


// add a pre-annotator
$("#btnAddPreannotator").click(function() {
	$("#btnAddPreannotator").prop('disabled', true);
	var namePreannotator = $("#inputPreannotatorName").val().trim();
	var uriPreannotator = $("#inputPreannotatorURL").val().trim();
	var projName = currentProjName;
	
	// check whether name and url are input
	if (namePreannotator == "" || uriPreannotator == "") {
		alert("Please input both the name and URI of your pre-annotator.");
		$("#btnAddPreannotator").prop('disabled', false);
		return false;
	}
	
	// check whether the name has been occupied
	if (isPreAnnotatorExist(namePreannotator)) {
		alert("The pre-annotator name you specified already exists. Please choose a different name.");
		$("#btnAddPreannotator").prop('disabled', false);
		return false;
	}
	
	// check whether the URL is in a correct format
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
	
	// connecting and testing a pre-annotator
	$.ajax({
		url: 'AnnotationServlet',
		type: 'GET',
		data: { action: "addPreannotator", projName: projName, preannotatorName: namePreannotator, preannotatorURI: uriPreannotator },
		dataType: 'text',
		success: function(result, textStatus, jqXHR) {
			var resultObject = JSON.parse(result);
			if (resultObject.status == "success") {
				// show a modal to tell the user this annotator has been added successfully
				setTimeout(function() {
					$("#modalTestingPreannotator").modal('hide');
					var modalAddPreannotator = new bootstrap.Modal($("#modalAddPreannotator"));
					modalAddPreannotator.show();
					$('#modalBodyAddPreannotator').html("<div class=\"col-12\" style=\"font-size: 1rem;\">" + resultObject.success + "</div>");
				}, 600);
				// update the pre-annotator list
				getPreAnnotatorsList(currentProjName, "selectPreAnnotator");
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


// return to the pre-annotator management modal
function returnManageModal() {
	$("#modalAddPreannotator").modal('hide');
	var modalPreAnnotator = new bootstrap.Modal($("#modalPreAnnotator"));
	modalPreAnnotator.show();
}


// check whether the preannotator name has been used
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


// show the modal to manage pre-annotators
$("#btnManagePreAnnotator").click(function() {
	var modalPreAnnotator = new bootstrap.Modal($("#modalPreAnnotator"));
	modalPreAnnotator.show();
	$("#inputPreannotatorName").val("");
	$("#inputPreannotatorURL").val("");
	var projName = $("#spanAnnoatationProjectName").html();
	getPreAnnotatorsList(projName, "selectPreAnnotator");
})


// show a modal to allow the user to delete a pre-annotator
$('#divPreAnnotatorsTable').on('click', 'button', function(event) {
	if (delPreAnnotators.indexOf(event.target.id) != -1) {
		currentPreAnnotator = event.target.id;
		$("#modalPreAnnotator").modal('hide');
		var delPreAnnotatorModal = new bootstrap.Modal($("#delPreAnnotatorModal"));
		delPreAnnotatorModal.show();
	}
});


// delete a pre-annotator
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
				// reload the pre-annotator list
				getPreAnnotatorsList(currentProjName, "selectPreAnnotator");
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


// choose to not delete this pre-annotator and return to the pre-annotator management modal
$("#btnCancelDelPreAnnotator").click(function() {
	$("#delPreAnnotatorModal").modal('hide');
	var modalPreAnnotator = new bootstrap.Modal($("#modalPreAnnotator"));
	modalPreAnnotator.show();
	getPreAnnotatorsList(currentProjName, "selectPreAnnotator");
})


// get the list of existing pre-annotators
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
				// organize all pre-annotators in a table
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


// apply a pre-annotator to the current message
$("#btnUsePreAnnotator").click(function() {
	var selectedValue = $("#selectPreAnnotator").val();
	// check whether there are some selected or annotated spans
	var existingSpans = 0;
	$("p#pMessageContent span[type='button']").each(function() {
		existingSpans++;
	});

	if (selectedValue == "default") {
		alert("Please first select the pre-annotator you would like to use.");
	// if there are some selected or annotated spans, show a modal to remind the user that these spans will be removed if using a pre-annotator
	} else if (existingSpans > 0) {
		var modalPreAnnotatorWarning = new bootstrap.Modal($("#modalPreAnnotatorWarning"));
		modalPreAnnotatorWarning.show();
		var alertMessage = "There are some selected or annotated spans in the message. Do you still want to use the pre-annotator? If Yes, please click 'Continue', and these spans will be removed. If No, please 'Return' to continue to work on them.";
		$('#modalBodyPreAnnotatorWarning').html("<div class=\"col-12\" style=\"font-size: 1rem;\">" + alertMessage + "</div>");
	} else {
		// pre-annotate this message
		var modalUsingPreannotator = new bootstrap.Modal($("#modalUsingPreannotator"));
		modalUsingPreannotator.show();
		setTimeout(function() { preAnnotateMsg(selectedValue, "spanAnnoatationProjectName", "pMessageContent"); }, 600);
	}
});


// choose to not use the pre-annotator
$("#btnPreAnnotatorReturn").click(function() {
	$("#modalPreAnnotatorWarning").modal('hide');
})


// choose to use the pre-annotator on this message
$("#btnPreAnnotatorContinue").click(function() {
	$("#modalPreAnnotatorWarning").modal('hide');
	$("#pMessageContent").html(currentMsgText);
	var selectedValue = $("#selectPreAnnotator").val();
	var modalUsingPreannotator = new bootstrap.Modal($("#modalUsingPreannotator"));
	modalUsingPreannotator.show();
	setTimeout(function() { preAnnotateMsg(selectedValue, "spanAnnoatationProjectName", "pMessageContent"); }, 600);
})


// pre-annotate the current message using the selected pre-annotator
function preAnnotateMsg(selectedPreAnnoatator, projNameID, msgBoxID) {
	var projName = $("#" + projNameID).html();
	var currentMessage = $("#" + msgBoxID).text();

	getPreAnnotatorResult(projName, selectedPreAnnoatator, currentMessage)
		.then(function(annotationsList) {
			$("#modalUsingPreannotator").modal('hide');
			if (annotationsList.length > 0) {
				// sort the annotations returned from a pre-annotator based on their start index
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
				
				// highlight these annotations one by one
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
						
						// compute start index and end index of a location description in html for highlight
						var allHtml = he.decode($("#" + msgBoxID).html());
						$("#" + msgBoxID).find("span[type='button']").each(function() {
							var thisSpan = $(this);
							existingSpanLengthPre = existingSpanLengthPre + he.decode(thisSpan.prop('outerHTML')).length;
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
						
						// record them in the selected spans	
						selectedSpansIndex.push({ "startIdx": startIndexPreannotated, "endIdx": endIndexPreannotated, "spanID": spanID });
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


// get the pre-annotation results of a pre-annotator on a message
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


// highlight a span which is clicked
$('p#pMessageContent').on('click', 'span[type="button"]', function() {
	var clickedSpan = $(this);
	
	// remove the border of all spans
	$("p#pMessageContent span[type='button']").each(function() {
		$(this).css('border', 'none');
	});
	
	// add border to the clicked span
	clickedSpan.css({
		'border': '1px dashed red',
		'border-width': '1px'
	});
	
	// get the location description text of clicked span
	var text = "";
	clickedSpan[0].childNodes.forEach(function(node) {
		if (node.nodeType === Node.TEXT_NODE) {
			text += node.textContent;
		}
	});
	locationDesc = text.trim();
	
	// ID attribute of spans
	var clickedSpanId = clickedSpan.attr("id");
	currentWorkingSpanID = clickedSpanId;
	enableMapControls();
	var allAnnotatedSpanIDIndex = oldAnnotatedSpanIDIndex.concat(newAnnotatedSpanIDIndex);
	var annotatedSpanIDList = allAnnotatedSpanIDIndex.map(item => item.spanID);
	var selectedSpanIDList = selectedSpansIndex.map(item => item.spanID);
	
	// unhighlight all spatial footprints
	drawnItemsForAnnotations.eachLayer(function(layer) {
		if (layer instanceof L.Polyline || layer instanceof L.Polygon) {
			layer.setStyle({ color: "#3388ff" });
		} else if (layer instanceof L.Marker) {
			layer.disablePermanentHighlight();
		}
	});
	
	// if the clicked span is a selected span
	if (selectedSpanIDList.includes(clickedSpanId)) {
		// record its start index and end index
		for (var i = 0; i < selectedSpansIndex.length; i++) {
			var span = selectedSpansIndex[i];
			if (span.spanID === clickedSpan.attr("id")) {
				startIndex = span.startIdx;
				endIndex = span.endIdx;
				break;
			}
		}
		
		// highlight its spatial footprint
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
	
	// if the clicked span is an annotated span
	if (annotatedSpanIDList.includes(clickedSpanId)) {
		// show its category
		var selectedCategoryCode = $(clickedSpan).children('span:first').html();
		$("#selectCategoryForAnnotation").find("option").each(function() {
			var option = $(this);
			if (option.val().split(":")[0] == selectedCategoryCode) {
				option.prop("selected", true);
			}
		});
		
		// record its start index and end index
		for (var i = 0; i < allAnnotatedSpanIDIndex.length; i++) {
			if (allAnnotatedSpanIDIndex[i].spanID == clickedSpan.attr("id")) {
				startIndex = allAnnotatedSpanIDIndex[i].startIdx;
				endIndex = allAnnotatedSpanIDIndex[i].endIdx;
			}
		}
		
		// highlight its spatial footprint
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


// using a web service for finding spatial footprint
$('#btnFindSpatialByWeb').click(function() {
	var selectedService = $("#selectWebservice").val();
	findingSFUsingWS(selectedService, locationDesc, currentViewPort, currentWorkingSpanID, drawnItemsForAnnotations, mapForAnnotations, spatialTypeSelected);
})


// finding the spatial footprint for the current location description
function findingSFUsingWS(selectedServiceIF, locationDescIF, currentViewPortIF, currentWorkingSpanIDIF, drawnItemsIF, mapIF, spatialTypeSelectedIF) {
	if (selectedServiceIF == "default") {
		alert("Please first select a Web service for finding the spatial footprint.");
	} else {
		if (locationDescIF == '') {
			alert("Please first select the location description text.");
		} else {
			// a loading icon for waiting for the results of a web service
			var modalUsingWebservice = new bootstrap.Modal($("#modalUsingWebservice"));
			modalUsingWebservice.show();
			// if the user selects Nominatim
			if (selectedServiceIF == "Nominatim") {
				// construct the url for requesting
				var viewbox = encodeURIComponent(currentViewPortIF.toBBoxString());
				var searchWord = encodeURIComponent(locationDescIF);
				var requestUrl = nominatim_url + 'search?q=' + searchWord + '&limit=10000&format=json&addressdetails=1&polygon_geojson=1&viewbox=' + viewbox + '&bounded=1&dedupe=0';
				$.getJSON(requestUrl, function(results) {
					// if there is no any results, show a modal to tell the user
					if (results.length == 0) {
						setTimeout(function() {
							$("#modalUsingWebservice").modal('hide');
							var modalNoGeocodingResult = new bootstrap.Modal($("#modalNoGeocodingResult"));
							modalNoGeocodingResult.show();
							$("#modalBodyNoGeocodingResult").html('There is no spatial footprint found for this location description using Nominatim. Please try other geocoding web services or draw the spatial footprint by yourself.')
						}, 600);
					} else {
						// if there is a spatial footprint of "GeometryCollection", show a modal to tell the user
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
						
						// flatting results into point, polyline, and polygon
						var original_Results = results;
						var processedResults = processNominatimResults(results);
						var flattedCoorsList = processedResults[0];
						var place_ID = processedResults[1];
						
						// compute number of polylines in the results
						var flattedCoorsList_polyline = [];
						var place_ID_polyline = [];
						for (var i = 0; i < flattedCoorsList.length; i++) {
							if (flattedCoorsList[i].type == "LineString") {
								flattedCoorsList_polyline.push(flattedCoorsList[i]);
								place_ID_polyline.push(place_ID[i]);
							}
						}

						// check whether the location description match with any type
						var polylineTypes = ['street', 'st', 'avenue', 'ave', 'road', 'rd', 'lane', 'ln', 'court', 'ct', 'drive', 'dr', 'boulevard', 'bld', 'blvd', 'highway', 'hwy', 'freeway', 'fwy', 'route', 'tollway', 'interstate', 'way', 'walk', 'passage', 'parkway', 'pkwy', 'bayou', 'river', 'creek']
						var reTypes = new RegExp('\\b(' + polylineTypes.join('|') + ')\\b', 'i');
						var locationDescIFProcessed = locationDescIF.toLowerCase();
						locationDescIFProcessed = locationDescIFProcessed.replace(/[.,;:!?()[\]{}<>\/\\'"\-_…%#=|^~£€¥©®]+$/g, '');
						var matches = locationDescIFProcessed.match(reTypes);
						// if there is a match or 80% of the spatial footprints are polylines, this location description should be a polyline-based object 
						if ((matches && flattedCoorsList_polyline.length > 0) || (flattedCoorsList_polyline.length > flattedCoorsList.length * 0.8)) {
							// cluster polyline geometries and find which one is closet to the current view point
							var selectedIndex = fingdingClosetPolyline(flattedCoorsList_polyline, mapIF.getCenter());
							var selectedPolylines = [];
							var selectedOriginalResults = [];
							for (const index of selectedIndex) {
								if (index >= 0 && index < flattedCoorsList_polyline.length) {
									selectedPolylines.push(flattedCoorsList_polyline[index]);
									for (var j = 0; j < original_Results.length; j++) {
										if (original_Results[j].place_id == place_ID_polyline[index]) {
											selectedOriginalResults.push(original_Results[j]);
										}
									}
								}
							}
							results = selectedPolylines;
							// get relevant point of the selected polylines
							let minDistance = Infinity;
							let indexWithMinDistance = null;
							for (var i = 0; i < selectedOriginalResults.length; i++) {
								const distance = calculateDistance([selectedOriginalResults[i].lon, selectedOriginalResults[i].lat], [mapIF.getCenter().lng, mapIF.getCenter().lat]);
								if (distance < minDistance) {
									minDistance = distance;
									indexWithMinDistance = i;
								}
							}
							if (annotateOrResolve == "Annotate") {
								geocodingResultsPoint = [selectedOriginalResults[indexWithMinDistance].lon, selectedOriginalResults[indexWithMinDistance].lat];
							} else if (annotateOrResolve == "Resolve") {
								geocodingResultsResolvePoint = [selectedOriginalResults[indexWithMinDistance].lon, selectedOriginalResults[indexWithMinDistance].lat];
							}
						} else {
							// for point or polygons, directly choose the first one
							if (flattedCoorsList[0].type == "Point") {
								results = [flattedCoorsList[0]];
								if (annotateOrResolve == "Annotate") {
									geocodingResultsPoint = flattedCoorsList[0].coordinates;
								} else if (annotateOrResolve == "Resolve") {
									geocodingResultsResolvePoint = flattedCoorsList[0].coordinates;
								}
							} else {
								results = [flattedCoorsList[0]];
								for (var j = 0; j < original_Results.length; j++) {
									if (original_Results[j].place_id == place_ID[0]) {
										if (annotateOrResolve == "Annotate") {
											geocodingResultsPoint = [original_Results[j].lon, original_Results[j].lat];
										} else if (annotateOrResolve == "Resolve") {
											geocodingResultsResolvePoint = [original_Results[j].lon, original_Results[j].lat];
										}
									}
								}
							}
						}
						
						// record the results for later use
						if (annotateOrResolve == "Annotate") {
							geocodingResults = results;
						} else if (annotateOrResolve == "Resolve") {
							geocodingResultsResolve = results;
						}

						// check whether there are already any spatial footprints on the map 
						var existingLayerNum = 0;
						drawnItemsIF.eachLayer(function(layer) {
							var layerId = layer.options.id;
							if (layerId == currentWorkingSpanIDIF) {
								existingLayerNum++;
							}
						});

						setTimeout(function() {
							$("#modalUsingWebservice").modal('hide');
							// if there are already any spatial footprints, show a modal to remind the user they will be removed
							if (existingLayerNum > 0) {
								var replaceExistingSFModal = new bootstrap.Modal($("#replaceExistingSFModal"));
								replaceExistingSFModal.show();
							} else {
								// show the found spatial footprints on the map
								showingReturnedSF(selectedServiceIF, results, currentWorkingSpanIDIF, drawnItemsIF, mapIF, spatialTypeSelectedIF);
							}
						}, 600);
					}
				})
					.fail(function(error) {
						alert(error);
					});
			// if the user selects Google Maps
			} else if (selectedServiceIF == "Google Maps") {
				var boundsBox = currentViewPortIF.getSouthWest().lat + ',' + currentViewPortIF.getSouthWest().lng + '|' + currentViewPortIF.getNorthEast().lat + ',' + currentViewPortIF.getNorthEast().lng;
				var geocoder = L.Control.Geocoder.google({ apiKey: googlemaps_key, geocodingQueryParams: { "bounds": boundsBox } });
				geocoder.geocode(locationDescIF, function(results) {
					// if there is no any results, show a modal to tell the user
					if (results.length == 0) {
						setTimeout(function() {
							$("#modalUsingWebservice").modal('hide');
							var modalNoGeocodingResult = new bootstrap.Modal($("#modalNoGeocodingResult"));
							modalNoGeocodingResult.show();
							$("#modalBodyNoGeocodingResult").html('There is no spatial footprint found for this location description using Google Maps. Please try other geocoding web services or draw the spatial footprint by yourself.')
						}, 600);
					} else {
						// choose the one which is closet to the current view point
						let minDistance = Infinity;
						let indexWithMinDistance = null;
						for (var i = 0; i < results.length; i++) {
							const distance = calculateDistance([results[i].center.lng, results[i].center.lat], [mapIF.getCenter().lng, mapIF.getCenter().lat]);
							if (distance < minDistance) {
								minDistance = distance;
								indexWithMinDistance = i;
							}
						}

						// record the results for later use
						if (annotateOrResolve == "Annotate") {
							geocodingResults = [results[indexWithMinDistance]];
						} else if (annotateOrResolve == "Resolve") {
							geocodingResultsResolve = [results[indexWithMinDistance]];
						}

						// check whether there are already any spatial footprints on the map
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


// show the found spatial footprints on the map
function showingReturnedSF(selectedServiceIF, returnedSFResults, currentWorkingSpanIDIF, drawnItemsIF, mapIF, spatialTypeSelectedIF) {
	// if the selected service is Nominatim
	if (selectedServiceIF == "Nominatim") {
		var flattedCoorsList = returnedSFResults;
		var returnedGeometryType;
		if (flattedCoorsList[0].type == "LineString") {
			returnedGeometryType = "Polyline";
		} else {
			returnedGeometryType = flattedCoorsList[0].type;
		}
		
		// if the type of returned spatial footprint is the same with the type that the user selected 
		if (spatialTypeSelectedIF == returnedGeometryType) {
			// show spatial footprints based on different types
			if (returnedGeometryType == "Point") {
				var geometryFoundMap = L.GeoJSON.geometryToLayer(flattedCoorsList[0]);
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
				// show the bounding box of spatial footprints
				var bounds = L.latLngBounds();
				for (var i = 0; i < allGeometryCoords.length; i++) {
					var latLng = L.latLng([allGeometryCoords[i][1], allGeometryCoords[i][0]]);
					bounds.extend(latLng);
				}
				mapIF.fitBounds(bounds);
			}
		} else {
			// if different, show a modal to allow the user to decide
			if (returnedGeometryType == "Point") {
				var modalOnlyPointNominatim = new bootstrap.Modal($("#modalOnlyPointNominatim"));
				modalOnlyPointNominatim.show();
				$("#modalBodyOnlyPointNominatim").html('You selected a spatial footprint of "' + spatialTypeSelectedIF + '" for this location description, but Nominatim can only return a spatial footprint of "Point". You can use this point geometry or change to other ways to extract spatial footprint.');
			} else {
				var modalDifferentGeoType = new bootstrap.Modal($("#modalDifferentGeoType"));
				modalDifferentGeoType.show();
				$("#modalBodyDifferentGeoType").html('You selected a spatial footprint of "' + spatialTypeSelectedIF + '" for this location description, but Nominatim can return a spatial footprint of "Point" and "' + returnedGeometryType + '". Which one would you like?');
				$("#btnPointType").html("Point");
				$("#btnReturnedType").html(returnedGeometryType);
			}
		}
	// if the selected service is Google Maps
	} else if (selectedServiceIF == "Google Maps") {
		// if the user selected "Point", show the point spatial footprint on the map
		if (spatialTypeSelectedIF == "Point") {
			var geometryFound = {};
			geometryFound["type"] = "Point";
			geometryFound["coordinates"] = [returnedSFResults[0].center.lng, returnedSFResults[0].center.lat];
			var geometryFoundMap = L.GeoJSON.geometryToLayer(geometryFound);
			geometryFoundMap.options.id = currentWorkingSpanIDIF;
			geometryFoundMap.addTo(drawnItemsIF);
			mapIF.setView(geometryFoundMap.getLatLng(), 15);
		// if other types, show a modal to allow the user to decide
		} else {
			var modalGoogleMap = new bootstrap.Modal($("#modalGoogleMap"));
			modalGoogleMap.show();
			$("#modalBodyGoogleMap").html('You selected a spatial footprint of "' + spatialTypeSelectedIF + '" for this location description, but Google Maps can only return a spatial footprint of "Point". You can use this point geometry or change to other ways to extract spatial footprint.');
		}
	}
}


// if the user chooses to use existing spatial footprints
$('#btnCancelReplaceSF').click(function() {
	$("#replaceExistingSFModal").modal('hide');
})


// if the user chooses to use new spatial footprints
$('#btnConfirmReplaceSF').click(function() {
	$("#replaceExistingSFModal").modal('hide');
	
	// remove existing and use new
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


// process the results from Nominatim to transform them into simple types (point, polyline, and polygon)
function processNominatimResults(nominatimResults) {
	var processedResults = [];
	var place_id_same = [];
	for (var i = 0; i < nominatimResults.length; i++) {
		var currentGeojson = nominatimResults[i].geojson;
		var place_id = nominatimResults[i].place_id;
		if (currentGeojson.type == "Point" || currentGeojson.type == "LineString" || currentGeojson.type == "Polygon") {
			processedResults.push(currentGeojson);
			place_id_same.push(place_id);
		} else if (currentGeojson.type == "MultiPolygon") {
			var flattedPolygons = flattingCoordinates(currentGeojson.coordinates, "MultiPolygon");
			Array.prototype.push.apply(processedResults, flattedPolygons);
			Array.prototype.push.apply(place_id_same, new Array(flattedPolygons.length).fill(place_id));
		} else if (currentGeojson.type == "MultiLineString") {
			var flattedLineString = flattingCoordinates(currentGeojson.coordinates, "MultiLineString");
			Array.prototype.push.apply(processedResults, flattedLineString);
			Array.prototype.push.apply(place_id_same, new Array(flattedLineString.length).fill(place_id));
		} else if (currentGeojson.type == "MultiPoint") {
			var flattedPoint = flattingCoordinates(currentGeojson.coordinates, "MultiPoint");
			Array.prototype.push.apply(processedResults, flattedPoint);
			Array.prototype.push.apply(place_id_same, new Array(flattedPoint.length).fill(place_id));
		}
	}

	return [processedResults, place_id_same];
}


// flat spatial footprints with complex types into ones with simple types (point, polyline, and polygon)
function flattingCoordinates(coordinates, geometryType, flattedList = []) {
	// if MultiPolygon, transform into Polygon
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
	// if MultiLineString, transform into LineString
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
	// if MultiPoint, transform into Point
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


// calculate the number of dimensions of an array
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


// if Nominatim can only return point spatial footprint and the user chooses to use it 
$('#btnOnlyPointType').click(function() {
	$("#modalOnlyPointNominatim").modal('hide');
	$('input[name="radioSpatialFootprintType"][value="Point"]').prop('checked', true).trigger('change');
	var geocodingResultsUsing;
	var drawnItemsUsing;
	var mapUsing;
	var spanIDUsing;
	
	// show the returned point on the map
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


// if Nominatim can return both point and other types of spatial footprint and the user chooses to use the point
$('#btnPointType').click(function() {
	$("#modalDifferentGeoType").modal('hide');
	$('input[name="radioSpatialFootprintType"][value="Point"]').prop('checked', true).trigger('change');
	var geocodingResultsUsing;
	var drawnItemsUsing;
	var mapUsing;
	var spanIDUsing;
	
	// show the point on the map
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


// if Nominatim can return both point and other types of spatial footprint and the user chooses to use a more complete one
$('#btnReturnedType').click(function() {
	var clickedGeoType = $(this).html();
	$("#modalDifferentGeoType").modal('hide');
	$('input[name="radioSpatialFootprintType"][value="' + clickedGeoType + '"]').prop('checked', true).trigger('change');
	var geocodingResultsUsing;
	var drawnItemsUsing;
	var mapUsing;
	var spanIDUsing;
	
	// show the spatial footprint on the map
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

	var flattedResults = geocodingResultsUsing;
	var allGeometryCoords = [];
	for (var i = 0; i < flattedResults.length; i++) {
		var dimensionNumber = calculateArrayDimension(flattedResults[i].coordinates);
		var geometryFoundMap = L.GeoJSON.geometryToLayer(flattedResults[i]);
		geometryFoundMap.options.id = spanIDUsing;
		geometryFoundMap.addTo(drawnItemsUsing);
		allGeometryCoords.push(flattedResults[i].coordinates);
	}
	
	// construct bounding box of the spatial footprint
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


// if there are annotations in the annotation page and the users choose to leave this page, there will be a modal to remind the user
// if the user chooses to continue to leave this page
$('#btnContinue2Leave').click(function() {
	$("#modalLeaveAnnotation").modal('hide');
	$("#annotationPage").fadeOut(500);
	setTimeout(loadStartProjectPage, 550);
})


// the user switches the type for spatial footprint
$('input[name="radioSpatialFootprintType"]').change(function() {
	spatialTypeSelected = $(this).val();
});


// if the user chooses to use the point returned from Google Maps
$('#btnGooglePoint').click(function() {
	$("#modalGoogleMap").modal('hide');
	$('input[name="radioSpatialFootprintType"][value="Point"]').prop('checked', true).trigger('change');
	var geocodingResultsUsing;
	var drawnItemsUsing;
	var mapUsing;
	var spanIDUsing;
	
	// show the point on the map
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


// switch between two ways for finding spatial footprint
$('input[name="radioSpatialFootprintWay"]').change(function() {
	var spatialFootprintWay = $(this).val();

	if (spatialFootprintWay == "DrawItMyself") {
		$('#btnFindSpatialByWeb').prop('disabled', true);
	} else {
		$('#btnFindSpatialByWeb').prop('disabled', false);
	}
});


// cluster polylines and choose one cluster which is closest to the current view center
function fingdingClosetPolyline(flattedSpatialFoorprint, currentViewPoint) {
	// get all the points of polylines
	const coordinatesWithSource = [];
	const coordinatesWithoutSource = [];
	for (var i = 0; i < flattedSpatialFoorprint.length; i++) {
		for (const coord of flattedSpatialFoorprint[i].coordinates) {
			const coordWithSource = [...coord, i];
			coordinatesWithSource.push(coordWithSource);
			coordinatesWithoutSource.push(coord);
		}
	}
	
	// cluster them using dbscan algorithm
	var dbscan = new DBSCAN();
	var clusters = dbscan.run(coordinatesWithoutSource, 0.05, 2);
	
	// record the polyline index of each cluster
	const clustersWithSegmentIndex = [];
	for (const cluster of clusters) {
		const clusterWithSegmentIndex = [];
		for (const coord_index of cluster) {
			clusterWithSegmentIndex.push(coordinatesWithSource[coord_index][2]);
		}
		clustersWithSegmentIndex.push(clusterWithSegmentIndex);
	}
	const clusterUniqueSegmentIndex = clustersWithSegmentIndex.map((subList) => {
		const uniqueSubList = [...new Set(subList)];
		return uniqueSubList;
	});
	
	// find the one which is closet to the center point
	let minDistance_All = Infinity;
	let clusterSegmentIndex_minDistance_All = null;
	for (const clusterSegmentIndex of clusterUniqueSegmentIndex) {
		let minDistance_Cluster = Infinity;
		for (const segmentIndex of clusterSegmentIndex) {
			const distance = calculateSegmentCenterDistance(flattedSpatialFoorprint[segmentIndex].coordinates, [currentViewPoint.lng, currentViewPoint.lat]);
			if (distance < minDistance_Cluster) {
				minDistance_Cluster = distance;
			}
		}
		if (minDistance_Cluster < minDistance_All) {
			minDistance_All = minDistance_Cluster;
			clusterSegmentIndex_minDistance_All = clusterSegmentIndex;
		}
	}
	return clusterSegmentIndex_minDistance_All;
}


// calculate the distance between a polyline segment and a point
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


// calculate disatance between two points
function calculateDistance(point1, point2) {
	const [x1, y1] = point1;
	const [x2, y2] = point2;
	return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}
