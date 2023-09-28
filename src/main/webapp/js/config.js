/**
 * This is the JavaScript file for switching the navigation bar.
 */

var naviForPage = "";

function dynamicalNaviBar(naviForPage) {
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
			/*if (naviItems[i] == "Account") {
				html += "<li class=\"nav-item dropdown\"><a class=\"nav-link dropdown-toggle\" role=\"button\" data-bs-toggle=\"dropdown\" aria-expanded=\"false\">Account</a> <ul class=\"dropdown-menu\"> <li><a class=\"dropdown-item\" role=\"button\" id=\"hyperResetpassword\">Reset password</a></li> <li><a class=\"dropdown-item\" role=\"button\" id=\"hyperSignup\">Signup a account</a></li> </ul></li>";
			}
			else {
				html += "<li class=\"nav-item\"><a class=\"nav-link active\" role=\"button\" aria-current=\"page\" id=\"" + "hyper" + naviItems[i] + "\" >" + naviItems[i] + "</a></li>"
			}*/
			html += "<li class=\"nav-item\"><a class=\"nav-link active\" role=\"button\" aria-current=\"page\" id=\"" + "hyper" + naviItems[i].trim().split(/\s+/).join('') + "\" >" + naviItems[i] + "</a></li>"
		}
		html += "</ul></div>"
	}
	$("#navBar").html(html);

	dicNaviBar_Page = {
		hyperHome: "loadStartProjectPage", hyperCreateaproject: "loadCreateProjectPage"
	}

	$("#hyperHome, #hyperCreateaproject").click(function() {
		if (naviForPage == "annotationPage") {
			if (annotationsOneBatch.length > 0) {
				var modalLeaveAnnotation = new bootstrap.Modal($("#modalLeaveAnnotation"));
				modalLeaveAnnotation.show();
				var alertMessage = 'You have finished annotating ' + annotationsOneBatch.length + ' message(s) in the current batch. If you leave this page, your annotation(s) will be lost. Or you can first finish annotating this batch and submit it.';
				$('#modalBodyLeaveAnnotation').html("<div class=\"col-12\" style=\"font-size: 1rem;\">" + alertMessage + "</div>");
				return false;
			} else {
				$("#" + naviForPage).fadeOut(500);
				if ($(this).attr("id") == "hyperHome") {
					setTimeout(loadStartProjectPage, 550);
				}
				else {
					setTimeout(loadCreateProjectPage, 550);
				}
			}
		} else {
			$("#" + naviForPage).fadeOut(500);
			if ($(this).attr("id") == "hyperHome") {
				setTimeout(loadStartProjectPage, 550);
			}
			else {
				setTimeout(loadCreateProjectPage, 550);
			}
		}
		/*$("#" + dicNaviBar_Page[$(this).attr("id")]).css("display", "flex");
		dynamicalNaviBar(dicNaviBar_Page[$(this).attr("id")]);*/
	});


	$("#hyperSignout").click(function() {
		$("#" + naviForPage).fadeOut(500);
		setTimeout(loadLoginPage, 550);
		currentPage = "loginPage";
		currentUser = "";
	});
}


function selectOptionOperation(btnAddID, btnRemoveID, listboxID, frameworkID, alterMeassage) {
	const btnAdd = document.querySelector(btnAddID);
	const btnRemove = document.querySelector(btnRemoveID);
	const listbox = document.querySelector(listboxID);
	const framework = document.querySelector(frameworkID);

	btnAdd.onclick = (e) => {
		e.preventDefault();

		// validate the option
		if (framework.value == '') {
			alert(alterMeassage);
			return;
		}
		// create a new option
		/*	numberCategory = $("#selectAllCategoriesAdded").children().length + 1;
			const option = new Option("C" + numberCategory + ": " + framework.value, "C" + numberCategory + ": " + framework.value);*/
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
	/*---the element for adding or removing options---*/
}