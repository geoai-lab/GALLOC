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
var selectedSpanTemplateLength = 585;
var annotatedSpanTemplateLength = 754;
var annotatedSpanIDLength = 7;

$("#btnManagePreAnnotator").click(function() {
	var modalPreAnnotator = new bootstrap.Modal($("#modalPreAnnotator"));
	modalPreAnnotator.show();
})


/*$("#pMessageContent").on("mousedown", function() {
	$('#divMsgsAnnotation').css("display", "none");
});*/


$("#pMessageContent").on('mouseup', function() {
	var isTextColored = $(event.target).closest('.badge').length > 0;
	var selection = window.getSelection();
	var range = selection.getRangeAt(0);
	var selectedText = range.toString();
	locationDesc = selectedText.trim();

	if (locationDesc && locationDesc.length > 0 && !isTextColored) {

		var startContainer = range.startContainer;
		var selectedSpanCount = 0;
		var annotatedSpanCount = 0;
		var adjustedIndex = 0;
		var adjustIDIndex = 0;

		while (startContainer !== null && startContainer.parentNode !== null) {
			var prevSibling = startContainer.previousSibling;

			while (prevSibling !== null) {
				if (prevSibling.nodeType === Node.ELEMENT_NODE && prevSibling.tagName === "SPAN" && prevSibling.getAttribute("type") === "button" && $(prevSibling).css("background-color") === "rgb(174, 214, 241)") {
					selectedSpanCount++;
				}
				if (prevSibling.nodeType === Node.ELEMENT_NODE && prevSibling.tagName === "SPAN" && prevSibling.getAttribute("type") === "button" && $(prevSibling).css("background-color") === "rgb(171, 235, 198)") {
					if (prevSibling.hasAttribute('id')) {
						adjustIDIndex = adjustIDIndex + (prevSibling.getAttribute("id").length + annotatedSpanIDLength);
					}

					var childSpans = prevSibling.getElementsByTagName("span");
					for (var i = 0; i < childSpans.length; i++) {
						var childSpan = childSpans[i];
						if (childSpan.textContent.trim() !== "") {
							var childText = childSpan.textContent.trim();
							adjustedIndex = adjustedIndex + childText.length;
							break;
						}
					}

					annotatedSpanCount++;
				}
				prevSibling = prevSibling.previousSibling;
			}
			startContainer = startContainer.parentNode;
		}

		startIndex = getSelectedTextIndex(range) - adjustedIndex;
		endIndex = startIndex + range.toString().length;

		startIndex = startIndex + (selectedText.length - selectedText.trimStart().length);
		endIndex = endIndex - (selectedText.length - selectedText.trimEnd().length);

		selectedHighLightText(startIndex, endIndex, selectedSpanCount, annotatedSpanCount, adjustedIndex, adjustIDIndex, locationDesc);
	}
});


function getSelectedTextIndex(range) {
	var clonedRange = range.cloneRange();
	clonedRange.selectNodeContents($("#pMessageContent")[0]);
	clonedRange.setEnd(range.startContainer, range.startOffset);

	var precedingText = clonedRange.toString();
	return precedingText.length;
}


function selectedHighLightText(startIndex, endIndex, selectedSpanCount, annotatedSpanCount, adjustedIndex, adjustIDIndex, locationDesc) {
	var allHtml = $("#pMessageContent").html();
	allHtml = he.decode(allHtml);

	startIndexHtml = startIndex + selectedSpanTemplateLength * selectedSpanCount + annotatedSpanTemplateLength * annotatedSpanCount + adjustedIndex + adjustIDIndex;
	endIndexHtml = startIndexHtml + locationDesc.length;
	var prefix = allHtml.substring(0, startIndexHtml);
	var suffix = allHtml.substring(endIndexHtml);

	var preHtml = '<span type="button" class="badge position-relative" style="color: black;font-size: 1rem;font-weight: 400;background-color:#AED6F1;padding: 0px;">';
	var afterHtml = '<span class="position-absolute top-0 start-100 translate-middle"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#5D6D7E" class="bi bi-x-circle-fill" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/></svg></span></span>';

	var highlightedString = prefix + preHtml + locationDesc + afterHtml + suffix;
	$("#pMessageContent").html(highlightedString);
}


$('#pMessageContent').on('click', '.bi-x-circle-fill', function(event) {
	event.stopPropagation();

	var highlightedElement = $(this).closest('.badge');
	//var plainText = highlightedElement.find("span:eq(1)").text();
	var plainText = highlightedElement.contents().filter(function() {
		return this.nodeType === Node.TEXT_NODE;
	}).text();
	highlightedElement.replaceWith(plainText);

	if (highlightedElement.css("background-color") == "rgb(171, 235, 198)") {
		annotationOneMessage = annotationOneMessage.filter(function(element) {
			if (element.locationDesc === plainText) {
				return false;
			} else {
				return true;
			}
		});
	}
});


/*$('#btnUnhighlight').on('click', function() {
	var selection = window.getSelection();
	var selectedText = selection.toString();

	if (selectedText && selectedText.length > 0) {
		var range = selection.getRangeAt(0);
		var selectedNode = range.commonAncestorContainer;

		var parentNode = selectedNode.parentNode;
		if ($(parentNode).hasClass('badge') && $(parentNode).hasClass('text-bg-warning')) {
			var text = selectedNode.textContent;
			var newNode = document.createTextNode(text);
			parentNode.parentNode.replaceChild(newNode, parentNode);
		}
	}
});*/


$("#btnAddAnnotation").click(function() {
	if (!(Number.isInteger(startIndex)) || !(Number.isInteger(endIndex)) || locationDesc == "") {
		/*$('#divMsgsAnnotation').css("display", "block");
		$('#alertMsgsAnnotation').html("You haven't selected a location description.");*/
		popoverAnnotationWarning.enable();
		popoverAnnotationWarning._config.content = '<div class="custom-popover-content"><p>You haven\'t selected a location description.</p><a id="aClosePopoverAnnotationWarning" role="button" class="closePopover">&times;</a></div>';
		popoverAnnotationWarning.show();
		popoverAnnotationWarning.disable();
	} else if (mapGeoCoords == undefined || $("#selectCategoryForAnnotation").val() == "Choose...") {
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
		var spatialFootprint = {};
		spatialFootprint["type"] = mapGeoCoords.features[0].geometry.type;
		spatialFootprint["coordinates"] = mapGeoCoords.features[0].geometry.coordinates;
		annotation["spatialFootprint"] = spatialFootprint;
		annotationOneMessage.push(annotation);

		var allHtml = $("#pMessageContent").html();
		if (locationDesc && locationDesc.length > 0) {
			/*var existingSpanNum = $("p#pMessageContent span[type='button']").length;
			if (existingSpanNum == 1 && $("p#pMessageContent span[type='button']").css("background-color") == "rgb(174, 214, 241)") {
				var buttonSpan = $("p#pMessageContent span[type='button']");
				var previousText = buttonSpan.parent().contents().filter(function() {
					return this.nodeType === Node.TEXT_NODE && this.nodeValue.trim() !== "";
				}).first().text();

				if (previousText.length == startIndex && (previousText.length + locationDesc.length == endIndex)) {
					startIndexReplace = startIndex;
					endIndexReplace = startIndexHtml + 585 + locationDesc.length;
				}
				var allHtml = allHtml.substring(0, startIndexReplace) + locationDesc + allHtml.substring(endIndexReplace);
				startIndexHtml = startIndex;
				endIndexHtml = endIndex;
			}*/

			/*var allText = $("p#pMessageContent").contents().filter(function() {
				return this.nodeType === Node.TEXT_NODE && this.nodeValue.trim() !== "";
			}).text();
			var lastText = $("p#pMessageContent").contents().filter(function() {
				return this.nodeType === Node.TEXT_NODE && this.nodeValue.trim() !== "";
			}).last().text();

			var lastTextIndex = textNodes.length - 1;
			var desiredTextNodes = textNodes.slice(0, lastTextIndex);
			var concatenatedText = desiredTextNodes.map(function() {
				return $(this).text();
			}).get().join("");*/

			var textNodes = $("p#pMessageContent").contents().filter(function() {
				return this.nodeType === Node.TEXT_NODE;
			});

			var startIndexReplace = 0;
			var endIndexReplace = 0;
			var selectedSpanNum = 0;
			var selectedSpanTextLength = 0; //text already selected without the current selected one
			var annotatedSpanNum = 0;
			var annotatedSpanTextLength = 0; //text already annotated
			var textNodesNumber = 0;
			var adjustedLength = 0;
			var adjustIDIndex = 0;

			$("p#pMessageContent span[type='button']").each(function() {
				if (startIndex == 0) {
					var concatenatedText = "";
				} else {
					textNodesNumber++;
					var desiredTextNodes = textNodes.slice(0, textNodesNumber);
					var concatenatedText = desiredTextNodes.map(function() {
						return $(this).text();
					}).get().join("");
				}

				var thisSpan = $(this);

				if (thisSpan.css("background-color") == "rgb(174, 214, 241)") {
					selectedSpanNum++;
					if (thisSpan.text() != locationDesc) {
						selectedSpanTextLength = selectedSpanTextLength + thisSpan.text().length;
					}
				} else if (thisSpan.css("background-color") == "rgb(171, 235, 198)") {
					annotatedSpanNum++;
					var annotatedSpanText = "";
					thisSpan[0].childNodes.forEach(function(node) {
						if (node.nodeType === Node.TEXT_NODE) {
							annotatedSpanText += node.textContent;
						}
					});

					if (thisSpan.attr('id')) {
						adjustIDIndex = adjustIDIndex + (thisSpan.attr('id').length + annotatedSpanIDLength);
					}

					var childSpans = thisSpan.find('span');
					for (var i = 0; i < childSpans.length; i++) {
						if ($(childSpans[i]).text().trim() !== "") {
							var childText = $(childSpans[i]).text().trim();
							adjustedLength = adjustedLength + childText.length;
							break;
						}
					}
					annotatedSpanTextLength = annotatedSpanTextLength + annotatedSpanText.length;
				}
				if ((concatenatedText.length + selectedSpanTextLength + annotatedSpanTextLength == startIndex) && (concatenatedText.length + selectedSpanTextLength + annotatedSpanTextLength + locationDesc.length == endIndex)) {
					var firstNode = $("p#pMessageContent").contents().first();

					if (firstNode.is("span[type='button']") && firstNode.css("background-color") === "rgb(171, 235, 198)") {
						startIndexReplace = startIndex + selectedSpanTemplateLength * selectedSpanNum + annotatedSpanTemplateLength * annotatedSpanNum + adjustedLength + adjustIDIndex;
						endIndexReplace = startIndexReplace + selectedSpanTemplateLength + locationDesc.length;
					} else if (firstNode.is("span[type='button']") && firstNode.css("background-color") === "rgb(174, 214, 241)" && startIndex != 0) {
						startIndexReplace = startIndex + selectedSpanTemplateLength * selectedSpanNum + annotatedSpanTemplateLength * annotatedSpanNum + adjustedLength + adjustIDIndex;
						endIndexReplace = startIndexReplace + selectedSpanTemplateLength + locationDesc.length;
					} else {
						startIndexReplace = startIndex + selectedSpanTemplateLength * (selectedSpanNum - 1) + annotatedSpanTemplateLength * annotatedSpanNum + adjustedLength + adjustIDIndex;
						endIndexReplace = startIndexReplace + selectedSpanTemplateLength + locationDesc.length;
					}

					return false;
				}
			});

			var allHtml = allHtml.substring(0, startIndexReplace) + locationDesc + allHtml.substring(endIndexReplace);
			startIndexHtml = startIndexReplace;
			endIndexHtml = startIndexReplace + locationDesc.length;

			/*var allHtml = $("#pMessageContent").html();
			var $wrapper = $("<div>").html(allHtml);
			var $targetSpan = $wrapper.find("span.badge:contains(" + locationDesc + ")");
			$targetSpan.each(function() {
				$(this).replaceWith(locationDesc);
			});
			var allHtml = $wrapper.html();*/

			var prefix = allHtml.substring(0, startIndexHtml);
			var suffix = allHtml.substring(endIndexHtml);
			var preHtml = '<span type="button" class="badge position-relative" style="color: black;font-size: 1rem;font-weight: 400;background-color:#ABEBC6;padding: 0px;">';
			var categoryHtml = '<span class="position-absolute top-0 start-0 translate-middle rounded-circle" style="color: white;width:16px;height:16px;font-size:12px;background-color:#A569BD">' + categoryCode + '</span>';
			var afterHtml = '<span class="position-absolute top-0 start-100 translate-middle"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#5D6D7E" class="bi bi-x-circle-fill" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/></svg></span></span>';

			var highlightedString = prefix + preHtml + categoryHtml + locationDesc + afterHtml + suffix;
			$("#pMessageContent").html(highlightedString);
		}
		/*$('#divMsgsAnnotation').css("display", "block");
		$('#alertMsgsAnnotation').html("The description has been annotated, and you can repeat this process to annotate other location descriptions in this message.");*/

		//popoverAnnotation._config.content = '<div class="custom-popover-content"><p>The description has been annotated, and you can repeat this process to annotate other location descriptions in this message.</p><a id="aClosePopoverAnnotation" role="button" class="closePopover">&times;</a><a role="button" id="aDisablePopoverAnnotation" class="hyperlinkStyle">Don\'t show this message later.</a></div>';
		//popoverAnnotation._config.content = '<div class="custom-popover-content"><p>The description has been annotated, and you can repeat this process to annotate other location descriptions in this message.</p><a id="aClosePopoverAnnotation" role="button" class="closePopover">&times;</a><input class="form-check-input" type="checkbox" id="checkDisablePopoverAnnotation"><label class="form-check-label" for="checkDisablePopoverAnnotation">Don\'t show this message later.</label></div>';
		popoverAnnotation._config.content = '<div id="divPopoverAnnotate" class="custom-popover-content"></div>';
		var popover_html = '<p>The description has been annotated, and you can repeat this process to annotate other location descriptions in this message.</p><a id="aClosePopoverAnnotation" role="button" class="closePopover">&times;</a><input class="form-check-input" type="checkbox" id="checkDisablePopoverAnnotation"> <label class="form-check-label" for="checkDisablePopoverAnnotation">Don\'t show this message later.</label>';

		popoverAnnotation.show();
		$("#divPopoverAnnotate").html(popover_html);

		$("#optionCategoryDefaultForAnnotation").prop('selected', true);
		//drawnItemsForAnnotations.clearLayers();
		startIndex = "";
		endIndex = "";
		locationDesc = "";
		mapGeoCoords = undefined;
	}
})


/*$("#btnRemoveAnnotation").click(function() {
	var $highlightedSpans = $('p span.badge.text-bg-warning');
	$highlightedSpans.each(function() {
		var $span = $(this);
		var spanText = $span.text();
		if (spanText === selectText) {
			$span.replaceWith(spanText);
		}
	});

	annotationOneMessage = annotationOneMessage.filter(function(element) {
		if (element.locationDesc === selectText) {
			return false;
		} else {
			return true;
		}
	});
})*/


$("#btnCloseAlertAnnotation").click(function() {
	$('#divMsgsAnnotation').css("display", "none");
})


$("#btnNextMessage").click(function() {
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

		} else {
			var oldAnnotations = annotationsOneBatch[i].Annotation.Annotation;
			var allAnnotations = $("p#pMessageContent span[type='button']");
			var oldStillAnnotations = [];
			for (var m = 0; m < allAnnotations.length; m++) {
				if (allAnnotations[m].id) {
					oldStillAnnotations.push(allAnnotations[m].innertext);
				}
			}

			if (oldAnnotations.length != oldStillAnnotations.length) {
				for (var n = 0; n < oldAnnotations.length; n++) {
					if (!(oldStillAnnotations.includes(oldAnnotations[n]["locationDesc"]))) {
						oldAnnotations.splice(n, 1);
					}
				}
			}

			for (var p = 0; p < annotationOneMessage.length; p++) {
				if (oldStillAnnotations.includes(annotationOneMessage[p]["locationDesc"])) {
					for (var q = 0; q < oldAnnotations.length; q++) {
						if (oldAnnotations[q]["locationDesc"] == annotationOneMessage[p]["locationDesc"]) {
							oldAnnotations.splice(q, 1);
						}
					}
				}
			}
			annotationOneMessage = oldAnnotations.concat(annotationOneMessage);
			annotationsOneBatch.splice(i, 1);
			annotation["Annotation"] = annotationOneMessage;
		}

		for (var j = 0; j < annotationsOneBatch.length; j++) {
			if (annotationsOneBatch[j].messageID == currentMsgID) {
				annotationsOneBatch.splice(j, 1);
			}
		}
		oneSubmittedAnnotation["Annotation"] = annotation;
		annotationsOneBatch.push(oneSubmittedAnnotation);
	}

	nextMessages();
	annotationOneMessage = [];
})


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
		$("#pMessageContent").html(messagesOneBatch[0].messageData.text);
		currentMsgID = messagesOneBatch[0].messageID;

		if (batchMsgIDsForLabel.has(currentMsgID)) {
			batchMsgIDsForLabel.delete(currentMsgID);
		} else {
			var isAnnotated = loadAnnotations(currentMsgID, $("#pMessageContent").text());
			if (!isAnnotated) {
				$("#spanAnnotatedMessage").css("display", "block");
				$("#spanAnnotatedMessage").css("background-color", "#E74C3C");
				$("#spanAnnotatedMessage").html("This message hasn't been annotated.");
			}
		}

	} else if (unsubmittedMsgIDs.size !== 0) {
		var modalRemainingMsgBatch = new bootstrap.Modal($("#modalRemainingMsgBatch"));
		modalRemainingMsgBatch.show();
		var alertMessage = "This is the end of the current batch of messages. There are still " + unsubmittedMsgIDs.size + " messages that haven't been annoatated. Please finish annotating them before moving on to the next batch."
		$('#modalBodyRemainingMsgBatch').html("<div id=\"divAlertRemainingMsgBatch\" class=\"col-12\" style=\"font-size: 1rem;\">" + alertMessage + "</div>");
		$("#btnNextMessage").prop('disabled', true);
		var isAnnotated = loadAnnotations(currentMsgID, $("#pMessageContent").text());
		if (!isAnnotated) {
			$("#spanAnnotatedMessage").css("display", "block");
			$("#spanAnnotatedMessage").css("background-color", "#E74C3C");
			$("#spanAnnotatedMessage").html("This message hasn't been annotated.");
		}
	} else {
		var modalSubmitMsgBatch = new bootstrap.Modal($("#modalSubmitMsgBatch"));
		modalSubmitMsgBatch.show();
		var alertMessage = "The current batch has been completely annotated. Do you want to submit the current batch and move on to the next batch now? If Yes, please click 'Submit', and you will be unable to revise annotations of the current batch. If No, please 'Return' to revise annotations in the current batch.";
		$('#modalBodySubmitMsgBatch').html("<div id=\"divAlertSubmitMsgBatch\" class=\"col-12\" style=\"font-size: 1rem;\">" + alertMessage + "</div>");
		loadAnnotations(currentMsgID, $("#pMessageContent").text());

		/*var modalRemainingMsgBatch = new bootstrap.Modal($("#modalRemainingMsgBatch"));
		modalRemainingMsgBatch.show();
		var alertMessage = "All messages in the current batch have been annotated. Please submit it before moving on to the next batch."
		$('#modalBodyRemainingMsgBatch').html("<div id=\"divAlertRemainingMsgBatch\" class=\"col-12\" style=\"font-size: 1rem;\">" + alertMessage + "</div>");*/
		//$("#btnNextMessage").prop('disabled', true);
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
	//$("#pMessageContent").fadeOut(500);

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
							//setTimeout(function() { $("#pMessageContent").css("display", "block"); }, 500);
							//setTimeout(function() { $("#pMessageContent").html(messagesOneBatch[0].messageData.text); }, 550);
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
	//$('#btnNextMessage').prop('disabled', true);
})


/*$("#btnNextMessage").click(function() {
	nextMessages();
})*/


$("#btnPrevMessage").click(function() {
	$("#checkNoAnnotation").prop('checked', false);
	$("#spanAnnotatedMessage").css("display", "block");
	$("#spanAnnotatedMessage").css("background-color", "#E74C3C");
	$("#spanAnnotatedMessage").html("This message hasn't been annotated.");
	drawnItemsForAnnotations.clearLayers();
	$("#optionCategoryDefaultForAnnotation").prop('selected', true);
	$("#pMessageContent").css("display", "block");
	var fullString = previousMsgs[previousMsgs.length - 1].messageData.text;
	$("#pMessageContent").html(previousMsgs[previousMsgs.length - 1].messageData.text);
	currentMsgID = previousMsgs[previousMsgs.length - 1].messageID;
	messagesOneBatch.unshift(previousMsgs.pop());

	if (previousMsgs.length > 0) {
		$("#btnPrevMessage").prop('disabled', false);
	} else {
		$("#btnPrevMessage").prop('disabled', true);
	}

	if ($('#btnNextMessage').prop('disabled')) {
		$('#btnNextMessage').prop('disabled', false);
	}

	loadAnnotations(currentMsgID, fullString);
})


function loadAnnotations(currentMsgID, fullString) {

	var isAnnotated = false;
	for (var i = 0; i < annotationsOneBatch.length; i++) {
		if (annotationsOneBatch[i].messageID == currentMsgID) {
			/*var annotatedHtml = '<span style="color:#2E86C1">This message has been annotated.</span>';
			$(annotatedHtml).insertAfter("#spanMessage");*/
			$("#spanAnnotatedMessage").css("display", "block");
			$("#spanAnnotatedMessage").css("background-color", "#239B56");
			$("#spanAnnotatedMessage").html("This message has been annotated.");
			isAnnotated = true;

			if (annotationsOneBatch[i].Annotation.Annotation.length == 0) {
				$("#checkNoAnnotation").prop('checked', true);
			} else {
				var spanNumber = 0;
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
					var spatialTypeAnnotated = currentAnnotation["spatialFootprint"].type;
					var spatialFootprintAnnotated = currentAnnotation["spatialFootprint"].coordinates;
					var categoryCode = locationCateAnnotated.split(":")[0];

					if (locationDescAnnotated && locationDescAnnotated.length > 0) {
						spanNumber++;
						var spanID = "spanAnnotation" + spanNumber;

						var startIndexReplace = 0;
						var endIndexReplace = 0;
						var annotatedSpanNum = 0;
						var annotatedSpanTextLength = 0; //text already annotated
						var textNodesNumber = 0;
						var adjustedCategoryCodeLength = 0;
						var adjustedIDLength = 0;

						var textNodes = $("p#pMessageContent").contents().filter(function() {
							return this.nodeType === Node.TEXT_NODE;
						});
						var allHtml = $("#pMessageContent").html();

						$("p#pMessageContent span[type='button']").each(function() {
							if (startIndexAnnotated == 0) {
								var concatenatedText = "";
							} else {
								textNodesNumber++;
								var desiredTextNodes = textNodes.slice(0, textNodesNumber);
								var concatenatedText = desiredTextNodes.map(function() {
									return $(this).text();
								}).get().join("");
							}

							var thisSpan = $(this);
							adjustedIDLength = adjustedIDLength + (thisSpan.attr('id').length + annotatedSpanIDLength);

							annotatedSpanNum++;
							var annotatedSpanText = "";
							thisSpan[0].childNodes.forEach(function(node) {
								if (node.nodeType === Node.TEXT_NODE) {
									annotatedSpanText += node.textContent;
								}
							});

							var childSpans = thisSpan.find('span');
							for (var i = 0; i < childSpans.length; i++) {
								adjustedCategoryCodeLength = adjustedCategoryCodeLength + $(childSpans[i]).text().trim().length;
							}
							annotatedSpanTextLength = annotatedSpanTextLength + annotatedSpanText.length;
						});

						startIndexHtml = startIndexAnnotated + annotatedSpanTemplateLength * annotatedSpanNum + adjustedCategoryCodeLength + adjustedIDLength;
						endIndexHtml = startIndexHtml + locationDescAnnotated.length;

						var prefix = allHtml.substring(0, startIndexHtml);
						var suffix = allHtml.substring(endIndexHtml);
						var preHtml = '<span type="button" id="' + spanID + '" class="badge position-relative" style="color: black;font-size: 1rem;font-weight: 400;background-color:#ABEBC6;padding: 0px;">';
						var categoryHtml = '<span class="position-absolute top-0 start-0 translate-middle rounded-circle" style="color: white;width:16px;height:16px;font-size:12px;background-color:#A569BD;">' + categoryCode + '</span>';
						var afterHtml = '<span class="position-absolute top-0 start-100 translate-middle"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#5D6D7E" class="bi bi-x-circle-fill" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/></svg></span></span>';

						var highlightedString = prefix + preHtml + categoryHtml + locationDescAnnotated + afterHtml + suffix;
						$("#pMessageContent").html(highlightedString);
					}

					var geometryAnnotated = {}
					geometryAnnotated["type"] = spatialTypeAnnotated;
					geometryAnnotated["coordinates"] = spatialFootprintAnnotated;
					mapGeoCoords = { type: "FeatureCollection", features: [{ type: "Feature", geometry: geometryAnnotated, properties: {} }] };
					var spatialFootprintMap = L.GeoJSON.geometryToLayer(geometryAnnotated);
					spatialFootprintMap.addTo(drawnItemsForAnnotations);
					if (geometryAnnotated.type === 'Point') {
						mapForAnnotations.setView(spatialFootprintMap.getLatLng(), 12);
					} else {
						mapForAnnotations.fitBounds(spatialFootprintMap.getBounds());
					}
				}
			}
		}

	}
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


var popoverNext = new bootstrap.Popover(document.getElementById('btnNextMessage'), {
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
				/*var modalDeletedPreannotator = new bootstrap.Modal($("#modalDeletedPreannotator"));
				modalDeletedPreannotator.show();
				$('#modalBodyDeletedPreannotator').html("<div class=\"col-12\" style=\"font-size: 1rem;\">" + resultObject.success + "</div>");*/
				//getProjectsList();
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
	var modalUsingPreannotator = new bootstrap.Modal($("#modalUsingPreannotator"));
	modalUsingPreannotator.show();
	setTimeout(function() { preAnnotateMsg(); }, 600);
});


function preAnnotateMsg() {
	var projName = $("#spanAnnoatationProjectName").html();
	var selectedValue = $("#selectPreAnnotator").val();
	var currentMessage = $("#pMessageContent").text();

	if (selectedValue == "default") {
		alert("Please first select the pre-annotator you would like to use.");
	} else {
		getPreAnnotatorResult(projName, selectedValue, currentMessage)
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
						var startIndexPreannotated = annotationsList[i]["startIdx"];
						var endIndexPreannotated = annotationsList[i]["endIdx"];
						var locationDescPreannotated = annotationsList[i]["locationDesc"];

						if (locationDescPreannotated && locationDescPreannotated.length > 0) {
							var startIndexReplace = 0;
							var endIndexReplace = 0;
							var preannotatedSpanNum = 0;
							var preannotatedSpanTextLength = 0;
							var textNodesNumber = 0;

							var textNodes = $("p#pMessageContent").contents().filter(function() {
								return this.nodeType === Node.TEXT_NODE;
							});
							var allHtml = $("#pMessageContent").html();

							$("p#pMessageContent span[type='button']").each(function() {
								if (startIndexPreannotated == 0) {
									var concatenatedText = "";
								} else {
									textNodesNumber++;
									var desiredTextNodes = textNodes.slice(0, textNodesNumber);
									var concatenatedText = desiredTextNodes.map(function() {
										return $(this).text();
									}).get().join("");
								}

								var thisSpan = $(this);

								preannotatedSpanNum++;
								var preannotatedSpanText = "";
								thisSpan[0].childNodes.forEach(function(node) {
									if (node.nodeType === Node.TEXT_NODE) {
										preannotatedSpanText += node.textContent;
									}
								});
								preannotatedSpanTextLength = preannotatedSpanTextLength + preannotatedSpanText.length;
							});

							startIndexHtml = startIndexPreannotated + selectedSpanTemplateLength * preannotatedSpanNum;
							endIndexHtml = startIndexHtml + locationDescPreannotated.length;

							var prefix = allHtml.substring(0, startIndexHtml);
							var suffix = allHtml.substring(endIndexHtml);
							var preHtml = '<span type="button" class="badge position-relative" style="color: black;font-size: 1rem;font-weight: 400;background-color:#AED6F1;padding: 0px;">';
							var afterHtml = '<span class="position-absolute top-0 start-100 translate-middle"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#5D6D7E" class="bi bi-x-circle-fill" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/></svg></span></span>';

							var highlightedString = prefix + preHtml + locationDescPreannotated + afterHtml + suffix;
							$("#pMessageContent").html(highlightedString);
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

	$("p#pMessageContent span[type='button']").each(function() {
		if ($(this).css("background-color") == "rgb(52, 152, 219)") {
			$(this).css("background-color", "#AED6F1");
		}
		if ($(this).css("background-color") == "rgb(29, 131, 72)") {
			$(this).css("background-color", "#ABEBC6");
		} 
	});

	if (clickedSpan.css("background-color") == "rgb(174, 214, 241)") {
		clickedSpan.css("background-color", "#3498DB");
	}

	if (clickedSpan.css("background-color") == "rgb(171, 235, 198)") {
		clickedSpan.css("background-color", "#1D8348");
		var selectedCategoryCode = $(clickedSpan).children('span:first').html();
		$("#selectCategoryForAnnotation").find("option").each(function() {
			var option = $(this);
			if (option.val().split(":")[0] == selectedCategoryCode) {
				option.prop("selected", true);
			}
		});

		var currentMessage;
		if (locationDesc && locationDesc.length > 0) {
			currentMessage = $("#pMessageContent").text();
			startIndex = currentMessage.indexOf(locationDesc);
			endIndex = startIndex + locationDesc.length;
		}

		drawnItemsForAnnotations.eachLayer(function(layer) {
			if (layer instanceof L.Polyline || layer instanceof L.Polygon) {
				layer.setStyle({ color: "#3388ff" });
			} else if (layer instanceof L.Marker) {
				layer.disablePermanentHighlight();
			}
		});

		var isMessageAnnotated = false;
		for (var i = 0; i < annotationsOneBatch.length; i++) {
			if (annotationsOneBatch[i].messageID == currentMsgID) {
				isMessageAnnotated = true;
				for (var j = 0; j < annotationsOneBatch[i].Annotation.Annotation.length; j++) {
					var currentAnnotation = annotationsOneBatch[i].Annotation.Annotation[j];
					var locationDescAnnotated = currentAnnotation["locationDesc"];
					var spatialTypeAnnotated = currentAnnotation["spatialFootprint"].type;
					var spatialFootprintAnnotated = currentAnnotation["spatialFootprint"].coordinates;

					if (locationDesc == locationDescAnnotated) {
						var geometryAnnotated = {}
						geometryAnnotated["type"] = spatialTypeAnnotated;
						geometryAnnotated["coordinates"] = spatialFootprintAnnotated;

						var targetLayer = null;
						drawnItemsForAnnotations.eachLayer(function(layer) {
							var layerCoordinates;
							if (layer instanceof L.Polyline || layer instanceof L.Polygon) {
								layerCoordinates = layer.getLatLngs();
								if (coordinatesMatch(layerCoordinates, spatialFootprintAnnotated)) {
									targetLayer = layer;
								}
							} else if (layer instanceof L.Marker) {
								layerCoordinates = layer.getLatLng();
								if (coordinatesMatch(layerCoordinates, spatialFootprintAnnotated)) {
									targetLayer = layer;
								}
							}
						});

						if (targetLayer !== null) {
							if (targetLayer instanceof L.Polyline || targetLayer instanceof L.Polygon) {
								targetLayer.setStyle({ color: "#00FFFF", weight: 3 });
							} else {
								targetLayer.enablePermanentHighlight();
							}
						}
					}
				}
			}
		}

		if (targetLayer == null) {
			for (var i = 0; i < annotationOneMessage.length; i++) {
				if (annotationOneMessage[i].locationDesc == locationDesc) {
					var spatialTypeAnnotated = annotationOneMessage[i]["spatialFootprint"].type;
					var spatialFootprintAnnotated = annotationOneMessage[i]["spatialFootprint"].coordinates;
					var geometryAnnotated = {}
					geometryAnnotated["type"] = spatialTypeAnnotated;
					geometryAnnotated["coordinates"] = spatialFootprintAnnotated;
					mapGeoCoords = { type: "FeatureCollection", features: [{ type: "Feature", geometry: geometryAnnotated, properties: {} }] };

					var targetLayer = null;
					drawnItemsForAnnotations.eachLayer(function(layer) {
						var layerCoordinates;
						if (layer instanceof L.Polyline || layer instanceof L.Polygon) {
							layerCoordinates = layer.getLatLngs();
							if (coordinatesMatch(layerCoordinates, spatialFootprintAnnotated)) {
								targetLayer = layer;
							}
						} else if (layer instanceof L.Marker) {
							layerCoordinates = layer.getLatLng();
							if (coordinatesMatch(layerCoordinates, spatialFootprintAnnotated)) {
								targetLayer = layer;
							}
						}
					});

					if (targetLayer !== null) {
						if (targetLayer instanceof L.Polyline || targetLayer instanceof L.Polygon) {
							targetLayer.setStyle({ color: "#00FFFF", weight: 3 });
						} else {
							targetLayer.enablePermanentHighlight();
						}
					}
				}
			}
		}
	}
});


function coordinatesMatch(sequence1, sequence2) {
	if (sequence1.lat != undefined & sequence1.lng != undefined & sequence2.length == 2) {
		if (Number(sequence1.lat.toFixed(6)) != sequence2[1] || Number(sequence1.lng.toFixed(6)) != sequence2[0]) {
			return false;
		}
	} else {
		if (sequence1.length !== sequence2.length) {
			return false;
		}
		for (var i = 0; i < sequence1.length; i++) {
			var point_lat = sequence1[i].lat;
			var point_lng = sequence1[i].lng;
			if (point_lat != sequence2[i][1] || point_lng != sequence2[i][0]) {
				return false;
			}
		}
	}
	return true;
}


$('#btnFindSpatialByWeb').click(function() {
	var selectedService = $("#selectWebservice").val();

	if (selectedService == "default") {
		alert("Please first select a Web service for finding the spatial footprint.");
	} else {
		if (locationDesc == '') {
			alert("Please first select the location description whose spatial footprint needs to be found.");
		} else {
			if (selectedService == "Nominatim") {
				var geocoder = L.Control.Geocoder.nominatim({ geocodingQueryParams: { "polygon_geojson": 1, "viewbox": currentViewPort.toBBoxString(), "bounded": 1 } });
				//var geocoder = L.Control.Geocoder.nominatim();
				geocoder.geocode(locationDesc, function(results) {
					var geometryFoundMap = L.GeoJSON.geometryToLayer(results[0].properties.geojson);
					/*geometryFoundMap.addTo(drawnItemsForAnnotations);
					mapForAnnotations.fitBounds(geometryFoundMap.getBounds());
					mapGeoCoords = { type: "FeatureCollection", features: [{ type: "Feature", geometry: results[0].properties.geojson, properties: {} }] };*/

					var returnedGeometryType;
					if (results[0].properties.geojson.type == "LineString") {
						returnedGeometryType = "Polyline";
					} else {
						returnedGeometryType = results[0].properties.geojson.type;
					}
					if (spatialTypeSelected == returnedGeometryType) {
						geometryFoundMap.addTo(drawnItemsForAnnotations);
						mapForAnnotations.fitBounds(geometryFoundMap.getBounds());
						mapGeoCoords = { type: "FeatureCollection", features: [{ type: "Feature", geometry: results[0].properties.geojson, properties: {} }] };
					} else {
						var modalDifferentGeoType = new bootstrap.Modal($("#modalDifferentGeoType"));
						modalDifferentGeoType.show();
						$("#modalBodyDifferentGeoType").html('You selected a spatial footprint of "' + spatialTypeSelected + '" for this location description, but Nominatim can return a spatial footprint of "Point" and "' + returnedGeometryType + '". Which one would you like?')
						$("#btnSelectedType").html(spatialTypeSelected);
						$("#btnReturnedType").html(returnedGeometryType);
					}
				});
			} else if (selectedService == "Google Maps") {
				var boundsBox = currentViewPort.getSouthWest().lat + ',' + currentViewPort.getSouthWest().lng + '|' + currentViewPort.getNorthEast().lat + ',' + currentViewPort.getNorthEast().lng;
				var geocoder = L.Control.Geocoder.google({ apiKey: 'AIzaSyAOMBkZ6XpE0U45B86LTRpBsZ4gPBNs0dg', geocodingQueryParams: { "bounds": boundsBox } });
				geocoder.geocode(locationDesc, function(results) {
					var geometryFound = {};
					geometryFound["type"] = "Point";
					geometryFound["coordinates"] = [results[0].center.lng, results[0].center.lat];
					var geometryFoundMap = L.GeoJSON.geometryToLayer(geometryFound);
					mapGeoCoords = { type: "FeatureCollection", features: [{ type: "Feature", geometry: geometryFound, properties: {} }] };
					geometryFoundMap.addTo(drawnItemsForAnnotations);
					mapForAnnotations.setView(geometryFoundMap.getLatLng(), 15);
				});
			}
		}
	}
})


$('#btnContinue2Leave').click(function() {
	$("#modalLeaveAnnotation").modal('hide');
	$("#annotationPage").fadeOut(500);
	setTimeout(loadStartProjectPage, 550);
})


$('input[name="radioSpatialFootprintType"]').change(function() {
	spatialTypeSelected = $(this).val();
	console.log(spatialTypeSelected);
});