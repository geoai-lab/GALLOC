/**
 * This is the JavaScript file for switching the navigation bar.
 */


// dynamically changing the navigation bar according to the current page
var naviForPage = "";
function dynamicalNaviBar(naviForPage) {
	// dynamically showing different navigation bars according to the current page
	dicNaviBar = {
		loginPage: ["A GeoAnnotator for Labeling LOCation descriptions from disaster-related text messages"],
		startProjectPage: ["Sign out"], createProjectPage: ["Home", "Sign out"],
		annotationPage: ["Home", "Sign out"],
		resolveAnnotationPage: ["Home", "Sign out"]
	}
	naviItems = dicNaviBar[naviForPage]
	var html = "";
	html += "<a class=\"navbar-brand\" role=\"button\" id=\"hyperGALLOC\" style=\"font-size: 28px;\">GALLOC</a>";
	if (naviForPage == "loginPage") {
		html += naviItems[0]
	}
	else {
		html += "<div class=\"float-end\" id=\"navbarNavDropdown\">";
		html += "<ul class=\"navbar-nav\">";
		for (var i = 0; i < naviItems.length; i++) {
			html += "<li class=\"nav-item\"><a class=\"nav-link active\" role=\"button\" aria-current=\"page\" id=\"" + "hyper" + naviItems[i].trim().split(/\s+/).join('') + "\" >" + naviItems[i] + "</a></li>"
		}
		html += "</ul></div>"
	}
	$("#navBar").html(html);

	// response function for clicking "Home" in the navigation bar
	$("#hyperHome").click(function() {
		// if in the annotation page, check whether there are some annotations
		if (naviForPage == "annotationPage") {
			if (annotationsOneBatch.length > 0) {
				var modalLeaveAnnotation = new bootstrap.Modal($("#modalLeaveAnnotation"));
				modalLeaveAnnotation.show();
				var alertMessage = 'You have finished annotating ' + annotationsOneBatch.length + ' message(s) in the current batch. If you leave this page, your annotation(s) will be lost. Or you can first finish annotating this batch and submit it.';
				$('#modalBodyLeaveAnnotation').html("<div class=\"col-12\" style=\"font-size: 1rem;\">" + alertMessage + "</div>");
				return false;
			} else {
				$("#" + naviForPage).fadeOut(500);
				setTimeout(loadStartProjectPage, 550);
			}
		// fade out the current page and enter the next page
		} else {
			$("#" + naviForPage).fadeOut(500);
			setTimeout(loadStartProjectPage, 550);
		}
	});
	
	// fade out the current page and enter the login page when the "Signout" tab is clicked in the navigation bar 
	$("#hyperSignout").click(function() {
		$("#" + naviForPage).fadeOut(500);
		setTimeout(loadLoginPage, 550);
		currentPage = "loginPage";
		currentUser = "";
	});
}


// add and remove options in a select box
function selectOptionOperation(btnAddID, btnRemoveID, listboxID, frameworkID, alterMeassage) {
	const btnAdd = document.querySelector(btnAddID);
	const btnRemove = document.querySelector(btnRemoveID);
	const listbox = document.querySelector(listboxID);
	const framework = document.querySelector(frameworkID);
	
	// add an option
	btnAdd.onclick = (e) => {
		e.preventDefault();

		// validate the option
		if (framework.value == '') {
			alert(alterMeassage);
			return;
		}
		// create a new option
		const option = new Option(framework.value, framework.value);
		// add it to the list
		listbox.add(option, undefined);

		// reset the value of the input
		framework.value = '';
		framework.focus();
	};

	// remove selected option
	btnRemove.onclick = (e) => {
		e.preventDefault();

		// save the selected options
		let selected = [];

		for (let i = 0; i < listbox.options.length; i++) {
			selected[i] = listbox.options[i].selected;
		}

		// remove all selected option
		let index = listbox.options.length;
		while (index--) {
			if (selected[index]) {
				listbox.remove(index);
			}
		}
	};
}