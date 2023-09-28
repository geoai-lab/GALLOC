/**
 * This is the JavaScript file for the "annotation" page.
 */

var startIndex = "";
var endIndex = "";
var locationDesc = "";
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


$("#pMessageContent").on('mouseup', function() {
	var allAnnotatedSpanIDIndex = oldAnnotatedSpanIDIndex.concat(newAnnotatedSpanIDIndex);
	var annotatedSpanIDList = allAnnotatedSpanIDIndex.map(item => item.spanID);
	var selectedSpanIDList = selectedSpansIndex.map(item => item.spanID);

	$("p#pMessageContent span[type='button']").each(function() {
		if (selectedSpanIDList.includes($(this).attr('id'))) { //selected spans
			$(this).css("background-color", "#EDFB0B");
		}
		if (annotatedSpanIDList.includes($(this).attr('id'))) { //annnoated spans
			$(this).css("background-color", "#ABEBC6");
		}
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

		startIndex = getSelectedTextIndex(range) - cateGoryCodeLength;
		endIndex = startIndex + range.toString().length;

		startIndex = startIndex + (selectedText.length - selectedText.trimStart().length);
		endIndex = endIndex - (selectedText.length - selectedText.trimEnd().length);

		selectedHighLightText(startIndex, endIndex, existingSpanLength, spanAllTextLength, cateGoryCodeLength, locationDesc);
	}
});


function getSelectedTextIndex(range) {
	var clonedRange = range.cloneRange();
	clonedRange.selectNodeContents($("#pMessageContent")[0]);
	clonedRange.setEnd(range.startContainer, range.startOffset);

	var precedingText = clonedRange.toString();
	return precedingText.length;
}


function selectedHighLightText(startIndex, endIndex, existingSpanLength, spanAllTextLength, cateGoryCodeLength, locationDesc) {
	var spanID = generateRandomStringID();

	var allHtml = $("#pMessageContent").html();
	allHtml = he.decode(allHtml);

	startIndexHtml = startIndex + existingSpanLength - spanAllTextLength + cateGoryCodeLength;
	endIndexHtml = startIndexHtml + locationDesc.length;
	var prefix = allHtml.substring(0, startIndexHtml);
	var suffix = allHtml.substring(endIndexHtml);

	var preHtml = '<span type="button" id="' + spanID + '" class="badge position-relative" style="color: black; font-size: 1rem; font-weight: 400; background-color: #EDFB0B; padding: 0px;">';
	var afterHtml = '<span class="position-absolute top-0 start-100 translate-middle"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#5D6D7E" class="bi bi-x-circle-fill" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/></svg></span></span>';

	var highlightedString = prefix + preHtml + locationDesc + afterHtml + suffix;
	$("#pMessageContent").html(highlightedString);

	selectedSpansIndex.push({ "startIdx": startIndex, "endIdx": endIndex, "spanID": spanID });
	currentWorkingSpanID = spanID;
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
		selectedSpansIndex = selectedSpansIndex.filter(function(element) {
			return element.spanID !== closingSpanID;
		});
	}
});


$("#btnAddAnnotation").click(function() {
	if (!(Number.isInteger(startIndex)) || !(Number.isInteger(endIndex)) || locationDesc == "") {
		/*$('#divMsgsAnnotation').css("display", "block");
		$('#alertMsgsAnnotation').html("You haven't selected a location description.");*/
		popoverAnnotationWarning.enable();
		popoverAnnotationWarning._config.content = '<div class="custom-popover-content"><p>You haven\'t selected a location description.</p><a id="aClosePopoverAnnotationWarning" role="button" class="closePopover">&times;</a></div>';
		popoverAnnotationWarning.show();
		popoverAnnotationWarning.disable();
	} else if (obtainSpatialFootprint().length == 0 || $("#selectCategoryForAnnotation").val() == "Choose...") {
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
		annotation["spatialFootprint"] = obtainSpatialFootprint();
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
	}
})


function obtainSpatialFootprint() {
	var spatialFoorprintList = [];
	drawnItemsForAnnotations.eachLayer(function(layer) {
		var layerId = layer.options.id;
		if (layerId == currentWorkingSpanID) {
			spatialFoorprintList.push(layer.toGeoJSON().geometry);
		}
	});
	return spatialFoorprintList;
}


$("#btnCloseAlertAnnotation").click(function() {
	$('#divMsgsAnnotation').css("display", "none");
})


$("#btnSaveAndNext").click(function() {
	var existingSelectedSpans = 0;
	$("p#pMessageContent span[type='button']").each(function() {
		if ($(this).css("background-color") === "rgb(198, 209, 33)" || $(this).css("background-color") === "rgb(237, 251, 11)") { //selected spans
			existingSelectedSpans++;
		}
	});

	if (existingSelectedSpans > 0) {
		var modalSaveAnnotateds = new bootstrap.Modal($("#modalSaveAnnotateds"));
		modalSaveAnnotateds.show();
		var alertMessage = "There are some unannotated spans. Do you still want to go to the next message? If Yes, please click 'Continue', and these selected spans will be lost. If No, please 'Return' to continue to work on them.";
		$('#modalBodySaveAnnotateds').html("<div class=\"col-12\" style=\"font-size: 1rem;\">" + alertMessage + "</div>");
	} else {
		saveAnnotations();
	}
})


$("#btnReturnCurrentMsg").click(function() {
	$("#modalSaveAnnotateds").modal('hide');
})


$("#btnSaveAnnotations").click(function() {
	$("#modalSaveAnnotateds").modal('hide');
	saveAnnotations();
})


function saveAnnotations() {
	currentWorkingSpanID = "";
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

	nextMessages();
	annotationOneMessage = [];
	newAnnotatedSpanIDIndex.length = 0;
	selectedSpansIndex.length = 0;
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
			var isAnnotated = loadAnnotations(currentMsgID, $("#pMessageContent").text());
			if (!isAnnotated) {
				$("#spanAnnotatedMessage").css("display", "block");
				$("#spanAnnotatedMessage").css("background-color", "#E74C3C");
				$("#spanAnnotatedMessage").html("This message is unannotated.");
			}
		}

	} else if (unsubmittedMsgIDs.size !== 0) {
		var modalRemainingMsgBatch = new bootstrap.Modal($("#modalRemainingMsgBatch"));
		modalRemainingMsgBatch.show();
		var alertMessage = "This is the end of the current batch of messages. There are still " + unsubmittedMsgIDs.size + " messages that haven't been annoatated. Please finish annotating them before moving on to the next batch."
		$('#modalBodyRemainingMsgBatch').html("<div id=\"divAlertRemainingMsgBatch\" class=\"col-12\" style=\"font-size: 1rem;\">" + alertMessage + "</div>");
		$("#btnSaveAndNext").prop('disabled', true);
		var isAnnotated = isMsgAnnotated(currentMsgID);
		if (!isAnnotated) {
			$("#spanAnnotatedMessage").css("display", "block");
			$("#spanAnnotatedMessage").css("background-color", "#E74C3C");
			$("#spanAnnotatedMessage").html("This message is unannotated.");
		}
	} else {
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
	$("#spanAnnotatedMessage").css("display", "none");
	$("#checkNoAnnotation").prop('checked', false);

	$.ajax({
		url: 'AnnotationServlet',
		type: 'GET',
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
	$("#checkNoAnnotation").prop('checked', false);
	$("#spanAnnotatedMessage").css("display", "block");
	$("#spanAnnotatedMessage").css("background-color", "#E74C3C");
	$("#spanAnnotatedMessage").html("This message is unannotated.");
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

	loadAnnotations(currentMsgID, fullString);
})

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

function loadAnnotations(currentMsgID, fullString) {
	$("#pMessageContent").html(currentMsgText);
	var isAnnotated = false;

	oldAnnotatedSpanIDIndex.length = 0;
	for (var i = 0; i < annotationsOneBatch.length; i++) {
		if (annotationsOneBatch[i].messageID == currentMsgID) {
			/*var annotatedHtml = '<span style="color:#2E86C1">This message has been annotated.</span>';
			$(annotatedHtml).insertAfter("#spanMessage");*/
			$("#spanAnnotatedMessage").css("display", "block");
			$("#spanAnnotatedMessage").css("background-color", "#239B56");
			$("#spanAnnotatedMessage").html("This message was annotated.");
			isAnnotated = true;

			if (annotationsOneBatch[i].Annotation.Annotation.length == 0) {
				$("#checkNoAnnotation").prop('checked', true);
				oldAnnotatedSpanIDIndex.length = 0;
			} else {
				annotationsOneBatch[i].Annotation.Annotation.sort(function(a, b) {
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

				for (var j = 0; j < annotationsOneBatch[i].Annotation.Annotation.length; j++) {
					var currentAnnotation = annotationsOneBatch[i].Annotation.Annotation[j];
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

						var allHtml = $("#pMessageContent").html();

						$("p#pMessageContent span[type='button']").each(function() {
							var thisSpan = $(this);
							existingSpanLengthLA = existingSpanLengthLA + thisSpan.prop('outerHTML').length;
							spanAllTextLengthLA = spanAllTextLengthLA + thisSpan.prop('textContent').length;

							var childSpans = thisSpan.find('span');
							for (var i = 0; i < childSpans.length; i++) {
								cateGoryCodeLengthLA = cateGoryCodeLengthLA + $(childSpans[i]).text().trim().length;
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
						$("#pMessageContent").html(highlightedString);

						oldAnnotatedSpanIDIndex.push({ "startIdx": startIndexAnnotated, "endIdx": endIndexAnnotated, "spanID": spanID });
					}

					if (spatialFootprintAnnotated[0].type == "LineString") {
						var multiGeometryCoords = [];
						for (var m = 0; m < spatialFootprintAnnotated.length; m++) {
							var geometryFoundMap = L.GeoJSON.geometryToLayer(spatialFootprintAnnotated[m]);
							geometryFoundMap.options.id = spanID;
							geometryFoundMap.addTo(drawnItemsForAnnotations);
							multiGeometryCoords.push(spatialFootprintAnnotated[m].coordinates);
						}
						multiGeometry = {
							type: "MultiLineString",
							coordinates: multiGeometryCoords
						};
						mapForAnnotations.fitBounds(L.GeoJSON.geometryToLayer(multiGeometry).getBounds());
					} else if (spatialFootprintAnnotated[0].type == "Polygon") {
						multiGeometry = spatialFootprintAnnotated[0];
						var geometryFoundMap = L.GeoJSON.geometryToLayer(multiGeometry);
						geometryFoundMap.options.id = spanID;
						geometryFoundMap.addTo(drawnItemsForAnnotations);
						mapForAnnotations.fitBounds(L.GeoJSON.geometryToLayer(multiGeometry).getBounds());
					} else if (spatialFootprintAnnotated[0].type == "Point") {
						multiGeometry = spatialFootprintAnnotated[0];
						var geometryFoundMap = L.GeoJSON.geometryToLayer(multiGeometry);
						geometryFoundMap.options.id = spanID;
						geometryFoundMap.addTo(drawnItemsForAnnotations);
						mapForAnnotations.setView(geometryFoundMap.getLatLng(), 15);
					}
				}
			}
		}

	}
	currentWorkingSpanID = "";
	return isAnnotated;
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


var popoverNext = new bootstrap.Popover(document.getElementById('btnSaveAndNext'), {
	placement: 'top',
	html: true
});


$(document).on('change', '#checkDisablePopoverAnnotation', function() {
	if ($(this).is(':checked')) {
		popoverAnnotation.disable();
	}
});


$(document).on('click', '#aClosePopoverAnnotationWarning', function() {
	popoverAnnotationWarning.hide();
});


$(document).on('click', '#aClosePopoverNext', function() {
	popoverNext.hide();
});


$("#btnAddPreannotator").click(function() {
	$("#btnAddPreannotator").prop('disabled', true);
	var namePreannotator = $("#inputPreannotatorName").val().trim();
	var uriPreannotator = $("#inputPreannotatorURL").val().trim();
	var projName = $("#spanAnnoatationProjectName").html();

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
				getPreAnnotatorsList(projName);
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
	getPreAnnotatorsList(projName);
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
				getPreAnnotatorsList(currentProjName);
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
	getPreAnnotatorsList(currentProjName);
})


function getPreAnnotatorsList(projName) {
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
				$("#selectPreAnnotator").html(selectPreAnnotatorsHtml);
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
	if (selectedValue == "default") {
		alert("Please first select the pre-annotator you would like to use.");
	} else {
		var modalUsingPreannotator = new bootstrap.Modal($("#modalUsingPreannotator"));
		modalUsingPreannotator.show();
		setTimeout(function() { preAnnotateMsg(selectedValue); }, 600);
	}
});


function preAnnotateMsg(selectedPreAnnoatator) {
	var projName = $("#spanAnnoatationProjectName").html();
	var currentMessage = $("#pMessageContent").text();

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

						var allHtml = $("#pMessageContent").html();

						$("p#pMessageContent span[type='button']").each(function() {
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
						$("#pMessageContent").html(highlightedString);
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
	var text = "";
	clickedSpan[0].childNodes.forEach(function(node) {
		if (node.nodeType === Node.TEXT_NODE) {
			text += node.textContent;
		}
	});
	locationDesc = text.trim();

	var clickedSpanId = clickedSpan.attr("id");
	currentWorkingSpanID = clickedSpanId;
	var allAnnotatedSpanIDIndex = oldAnnotatedSpanIDIndex.concat(newAnnotatedSpanIDIndex);
	var annotatedSpanIDList = allAnnotatedSpanIDIndex.map(item => item.spanID);
	var selectedSpanIDList = selectedSpansIndex.map(item => item.spanID);

	$("p#pMessageContent span[type='button']").each(function() {
		if (selectedSpanIDList.includes($(this).attr('id'))) { //selected spans
			$(this).css("background-color", "#EDFB0B");

		}
		if (annotatedSpanIDList.includes($(this).attr('id'))) { //annnoated spans
			$(this).css("background-color", "#ABEBC6");
		}
	});

	drawnItemsForAnnotations.eachLayer(function(layer) {
		if (layer instanceof L.Polyline || layer instanceof L.Polygon) {
			layer.setStyle({ color: "#3388ff" });
		} else if (layer instanceof L.Marker) {
			layer.disablePermanentHighlight();
		}
	});

	if (selectedSpanIDList.includes(clickedSpanId)) {
		$("#" + clickedSpanId).css("background-color", "#C6D121");
		for (var i = 0; i < selectedSpansIndex.length; i++) {
			var span = selectedSpansIndex[i];
			if (span.spanID === clickedSpan.attr("id")) {
				startIndex = span.startIdx;
				endIndex = span.endIdx;
				break;
			}
		}
	}

	if (annotatedSpanIDList.includes(clickedSpanId)) {
		$("#" + clickedSpanId).css("background-color", "#28B463");
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
			if (layerId == currentWorkingSpanID) {
				if (layer instanceof L.Polyline || layer instanceof L.Polygon) {
					layer.setStyle({ color: "#00FFFF", weight: 3 });
				} else {
					layer.enablePermanentHighlight();
				}
			}
		});
	}
});


$('#btnFindSpatialByWeb').click(function() {
	var selectedService = $("#selectWebservice").val();

	if (selectedService == "default") {
		alert("Please first select a Web service for finding the spatial footprint.");
	} else {
		if (locationDesc == '') {
			alert("Please first select the location description whose spatial footprint needs to be found.");
		} else {
			if (selectedService == "Nominatim") {
				var viewbox = encodeURIComponent(currentViewPort.toBBoxString());
				var searchWord = encodeURIComponent(locationDesc);
				var requestUrl = 'https://geoai.geog.buffalo.edu/nominatim/search?q=' + searchWord + '&limit=10000&format=json&addressdetails=1&polygon_geojson=1&viewbox=' + viewbox + '&bounded=1&dedupe=0';
				$.getJSON(requestUrl, function(results) {
					if (results.length == 0) {
						var modalNoGeocodingResult = new bootstrap.Modal($("#modalNoGeocodingResult"));
						modalNoGeocodingResult.show();
						$("#modalBodyNoGeocodingResult").html('There is no spatial footprint found for this location description using Nominatim. Please try other geocoding web services or draw the spatial footprint by yourself.')
					} else {
						geocodingResults = results;
						processedResults = processNominatimResults(results);
						var returnedGeometryType;

						if (processedResults[0].type == "LineString") {
							returnedGeometryType = "Polyline";
						} else {
							returnedGeometryType = processedResults[0].type;
						}

						if (spatialTypeSelected == returnedGeometryType) {
							var multiGeometry = {};
							if (processedResults[0].type == "LineString") {
								var multiGeometryCoords = [];
								for (var i = 0; i < processedResults.length; i++) {
									var geometryFoundMap = L.GeoJSON.geometryToLayer(processedResults[i]);
									geometryFoundMap.options.id = currentWorkingSpanID;
									geometryFoundMap.addTo(drawnItemsForAnnotations);
									multiGeometryCoords.push(processedResults[i].coordinates);
								}
								multiGeometry = {
									type: "MultiLineString",
									coordinates: multiGeometryCoords
								};
							} else if (processedResults[0].type == "Polygon") {
								multiGeometry = processedResults[0];
								var geometryFoundMap = L.GeoJSON.geometryToLayer(multiGeometry);
								geometryFoundMap.options.id = currentWorkingSpanID;
								geometryFoundMap.addTo(drawnItemsForAnnotations);
							}
							mapForAnnotations.fitBounds(L.GeoJSON.geometryToLayer(multiGeometry).getBounds());
						} else {
							var modalDifferentGeoType = new bootstrap.Modal($("#modalDifferentGeoType"));
							modalDifferentGeoType.show();
							$("#modalBodyDifferentGeoType").html('You selected a spatial footprint of "' + spatialTypeSelected + '" for this location description, but Nominatim can return a spatial footprint of "Point" and "' + returnedGeometryType + '". Which one would you like?');
							$("#btnPointType").html("Point");
							$("#btnReturnedType").html(returnedGeometryType);
						}
					}
				})
					.fail(function(error) {
						alert(error);
					});
			} else if (selectedService == "Google Maps") {
				var boundsBox = currentViewPort.getSouthWest().lat + ',' + currentViewPort.getSouthWest().lng + '|' + currentViewPort.getNorthEast().lat + ',' + currentViewPort.getNorthEast().lng;
				var geocoder = L.Control.Geocoder.google({ apiKey: 'AIzaSyAOMBkZ6XpE0U45B86LTRpBsZ4gPBNs0dg', geocodingQueryParams: { "bounds": boundsBox } });
				geocoder.geocode(locationDesc, function(results) {
					if (results.length == 0) {
						var modalNoGeocodingResult = new bootstrap.Modal($("#modalNoGeocodingResult"));
						modalNoGeocodingResult.show();
						$("#modalBodyNoGeocodingResult").html('There is no spatial footprint found for this location description using Google Maps. Please try other geocoding web services or draw the spatial footprint by yourself.')
					} else {
						geocodingResults = results;
						if (spatialTypeSelected == "Point") {
							var geometryFound = {};
							geometryFound["type"] = "Point";
							geometryFound["coordinates"] = [results[0].center.lng, results[0].center.lat];
							var geometryFoundMap = L.GeoJSON.geometryToLayer(geometryFound);
							geometryFoundMap.options.id = currentWorkingSpanID;
							geometryFoundMap.addTo(drawnItemsForAnnotations);
							mapForAnnotations.setView(geometryFoundMap.getLatLng(), 15);
						} else {
							var modalGoogleMap = new bootstrap.Modal($("#modalGoogleMap"));
							modalGoogleMap.show();
							$("#modalBodyGoogleMap").html('You selected a spatial footprint of "' + spatialTypeSelected + '" for this location description, but Google Maps can only return a spatial footprint of "Point". You can use this point geometry or change to other ways to extract spatial footprint.');
						}
					}
				});
			}
		}
	}
})


function processNominatimResults(nominatimResults) {
	var processResults = [];
	for (var i = 0; i < nominatimResults.length; i++) {
		if (nominatimResults[i].geojson.type == "Point" || nominatimResults[i].geojson.type == "LineString" || nominatimResults[i].geojson.type == "Polygon") {
			processResults.push(nominatimResults[i].geojson);
		} else {
			for (var j = 0; j < nominatimResults[i].geojson.coordinates.length; j++) {
				if (isArrayOneDimensional(nominatimResults[i].geojson.coordinates[j])) {
					processResults.push({ "type": "Point", "coordinates": nominatimResults[i].geojson.coordinates[j] });
				} else if (nominatimResults[i].geojson.coordinates[j][0][0]==nominatimResults[i].geojson.coordinates[j][nominatimResults[i].geojson.coordinates[j].length-1][0]&&nominatimResults[i].geojson.coordinates[j][0][1]==nominatimResults[i].geojson.coordinates[j][nominatimResults[i].geojson.coordinates[j].length-1][1]) {
					processResults.push({ "type": "Polygon", "coordinates": nominatimResults[i].geojson.coordinates[j] });
				} else {
					processResults.push({ "type": "LineString", "coordinates": nominatimResults[i].geojson.coordinates[j] });
				}				
			}
		}
	}
	return processResults
}


function isArrayOneDimensional(arr) {
  for (let i = 0; i < arr.length; i++) {
    if (Array.isArray(arr[i])) {
      return false;
    }
  }
  return true;
}


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
	var geometryFound = {};
	geometryFound["type"] = "Point";
	geometryFound["coordinates"] = [geocodingResults[0].center.lng, geocodingResults[0].center.lat];
	var geometryFoundMap = L.GeoJSON.geometryToLayer(geometryFound);
	geometryFoundMap.options.id = currentWorkingSpanID;
	geometryFoundMap.addTo(drawnItemsForAnnotations);
	mapForAnnotations.setView(geometryFoundMap.getLatLng(), 15);
})


$('#btnPointType').click(function() {
	$("#modalDifferentGeoType").modal('hide');
	var geometryFoundMap = L.GeoJSON.geometryToLayer({ type: "Point", coordinates: [geocodingResults[0].lon, geocodingResults[0].lat] });
	geometryFoundMap.options.id = currentWorkingSpanID;
	geometryFoundMap.addTo(drawnItemsForAnnotations);
	mapForAnnotations.setView(geometryFoundMap.getLatLng(), 15);
})


$('#btnReturnedType').click(function() {
	$("#modalDifferentGeoType").modal('hide');
	var multiGeometry = {};
	processedResults = processNominatimResults(geocodingResults);
	if (processedResults[0].type == "LineString") {
		var multiGeometryCoords = [];
		for (var i = 0; i < geocodingResults.length; i++) {
			var geometryFoundMap = L.GeoJSON.geometryToLayer(processedResults[i]);
			geometryFoundMap.options.id = currentWorkingSpanID;
			geometryFoundMap.addTo(drawnItemsForAnnotations);
			multiGeometryCoords.push(processedResults[i].coordinates);
		}

		multiGeometry = {
			type: "MultiLineString",
			coordinates: multiGeometryCoords
		};
	} else if (processedResults[0].type == "Polygon") {
		multiGeometry = processedResults[0];
		var geometryFoundMap = L.GeoJSON.geometryToLayer(multiGeometry);
		geometryFoundMap.options.id = currentWorkingSpanID;
		geometryFoundMap.addTo(drawnItemsForAnnotations);
	}
	mapForAnnotations.fitBounds(L.GeoJSON.geometryToLayer(multiGeometry).getBounds());
})