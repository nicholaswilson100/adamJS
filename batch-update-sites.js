/**********************************************************************************
 * $URL: $
 * $Id: $
 ***********************************************************************************
 *
 * Copyright (c) 2003, 2004, 2005, 2006, 2007 The Sakai Foundation
 *
 * Licensed under the Educational Community License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *       http://www.opensource.org/licenses/ECL-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 **********************************************************************************/
(function() {
	"use strict";

	/*******************************************************************/
	/* Utility functions                                                                       */
	/*******************************************************************/

	function initialise() {
		sitesToUpdate = [];
		siteObjects = {};
		userIds = [];
		userObjects = {};
		//replacementUsers = [];
		membershipObjects = {};
		targetUsers = [];
		adminSiteTitles = {};
		adminSitesPresent = false;
		numAdminSites = 0;
		removeUser = 'false';
	}

	function validateEmail(email) {
		var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		return re.test(email);
	}

	function getPath(absoluteUrl) {
		return absoluteUrl.replace(window.location.origin, "");
	}

	//
	// empty the dialog div then fill with the element (argument)
	//
	function replaceHtmlPageDiv(element) {
		$(document).ready(function() {
			var div = $("#dialog");
			div.empty();
			div.append(element);
		});
	}

	function spaceSeparatedList(array) {
		var list = "";
		for (var i = 0; i < array.length; i++) {
			list += array[i] + ' ';
		}
		return list;
	}

	function membershipEntity(userId, siteId) {
		var SITE = "site";
		return userId + "::" + SITE + ":" + siteId;
	}

	//
	// return the string of inout (which may contain, spaces new lines and line feeds)
	//
	function trimmedValuesAsArray(input) {

		if ( typeof input == "undefined") {
			return [""];
		} else {

			// replace return and new line with +
			var values = input.replace(new RegExp('\r?\n', 'g'), ' ');
			// collapse multiple spaces into
			values = values.replace(/ +/g, ' ').trim();
			// return as array
			var trimmedValues = values.split(' ');

			for (var i = 0; i < trimmedValues.length; i++) {
				trimmedValues[i] = trimmedValues[i].trim();
			}
			return trimmedValues;
		}
	}

	function getContactName(data) {
		if (null == data.props) {
			return "Not set";
		} else {
			return data.props["contact-name"];
		}
	}

	function getContactEmail(data) {
		if (null == data.props) {
			return "Not set";
		} else {
			return data.props["contact-email"];
		}
	}

	function getDepartment(data) {
		if (null == data.props) {
			return "";
		} else {
			var department = data.props["department"];
			if ( typeof department == 'undefined') {
				return "";
			} else {
				return department;
			}
		}
	}

	function getBanner(data) {

		var backgroundColour = "";
		var backgroundImage = "";
		var imageSource = "";
		var imageLink = "";
		var message = "";
		var fontColour = "";

		if (null != data.props) {

			if (data.type == 'admin') {

				backgroundColour = data.props["banner.override.backgroundColour"];
				backgroundImage = data.props["banner.override.backgroundImage"];
				imageSource = data.props["banner.override.imageSource"];
				imageLink = data.props["banner.override.imageLink"];
				message = data.props["banner.override.message"];
				fontColour = data.props["banner.override.fontColour"];

			} else {

				backgroundColour = data.props["banner.backgroundColor"];
				backgroundImage = data.props["banner.backgroundImage"];
				imageSource = data.props["banner.imageSource"];
				imageLink = data.props["banner.imageLink"];
				message = data.props["banner.message"];
				fontColour = data.props["banner.fontColour"];

			}

			if (backgroundColour == null)
				backgroundColour = "";

			if (backgroundImage == null)
				backgroundImage = "";

			if (imageSource == null)
				imageSource = "";

			if (imageLink == null)
				imageLink = "";

			if (fontColour == null)
				fontColour = "";

			if (message == null)
				message = "";
		}

		/*
		 console.log("Banner BG " + backgroundColour);
		 console.log("Banner IMG " + backgroundImage);
		 console.log("Banner SRC " + imageSource);
		 console.log("Banner LINK " + imageLink);
		 console.log("Banner MSG " + message);
		 console.log("Banner COL " + fontColour);
		 */
		return {
			backgroundColour : backgroundColour,
			backgroundImage : backgroundImage,
			imageSource : imageSource,
			imageLink : imageLink,
			message : message,
			fontColour : fontColour
		};
	}

	function summariseBanner(banner) {
		var summary = "";

		if (banner.backgroundColour != "") {
			summary += "<code>backgroundColour</code>: '" + banner.backgroundColour + "'<br/>";
		}

		if (banner.backgroundImage != "") {
			summary += "<code>backgroundImage</code>: '<a target='_blank' href='" + banner.backgroundImage + "'>" + banner.backgroundImage + "</a>' <span class='fa fa-external-link'/><br/>";
		}

		if (banner.imageSource != "") {
			summary += "<code>imageSource</code>: '<a target='_blank' href='" + banner.imageSource + "'>" + banner.imageSource + "</a>' <span class='fa fa-external-link'/><br/>";
		}

		if (banner.imageLink != "") {
			summary += "<code>imageLink</code>: '<a target='_blank' href='" + banner.imageLink + "'>" + banner.imageLink + "</a>' <span class='fa fa-external-link'/><br/>";
		}

		if (banner.fontColour != "") {
			summary += "<code>fontColour</code>: '" + banner.fontColour + "'<br/>";
		}

		if (banner.message != "") {
			summary += "<code>message</code>: '" + banner.message + "'<br/>";
		}

		if (summary.length == 0) {
			return "";
		} else {
			return summary;
		}

	}

	/*
	 * saves the site into siteObjects and logs the id in adminSiteTitles if it's an admin site
	 */
	function stashSiteObject(data) {

		// note admin sites
		if (data.type == 'admin') {

			if ( typeof adminSiteTitles[data.title] == 'undefined') {
				adminSiteTitles[data.title] = data.id;
				adminSitesPresent = true;
				numAdminSites++;
			}
		}

		console.log("stashing site " + data.title);

		siteObjects[data.id] = {
			id : data.id,
			title : data.title,
			entityReference : data.entityReference,
			type : data.type,
			banner : getBanner(data),
			department : getDepartment(data),
			contactName : getContactName(data),
			contactEmail : getContactEmail(data),
			createdDate : new Date(data.createdDate),
			lastModified : new Date(data.lastModified),
			siteGroups : data.siteGroups, // currently null => BUG?
			joinable : new Boolean(data.joinable == "true"),
			pubView : new Boolean(data.pubView == "true"),
			published : new Boolean(data.published == "true"),
			softlyDeleted : new Boolean(data.softlyDeleted == "true"),
			users : {},
			pages : {},
			titleAsHyperlink : "<a href='/portal/site/" + data.id + "' target='_blank'>" + data.title + "</a> <span class='fa fa-external-link'/>"
		};

	}

	// is the user a member of !admin, as a shortcut we'll skip checking the role theadmin site
	function userIsAdmin() {
		if ( typeof siteObjects["!admin"] == 'undefined') {
			return false;
		} else {
			return true;
		}
	}

	/*function getUserObject(data) {
	 return {
	 displayId : data.displayId,
	 displayName : data.displayName.toLowerCase(),
	 eid : data.eid,
	 email : data.email,
	 id : data.id
	 };
	 }*/

	function fudgeUserObject(id) {
		return {
			displayId : id,
			displayName : id,
			eid : id,
			email : id,
			id : id
		};
	}

	function stashUserObject(id, data) {
		userObjects[id] = {
			displayId : data.displayId,
			displayName : data.displayName,
			eid : data.eid,
			email : data.email,
			id : data.id
		};
	}

	/*function stashUserObject(data) {
	 stashUserObject(data.id, data);
	 }*/

	function stashMembershipObject(siteId, data) {
		membershipObjects[siteId] = {
			entityId : data.entityId,
			memberRole : data.memberRole,
			active : data.active,
			provided : data.provided,
			isProvided : function() {
				return (data.provided);
			}
		};
	}

	function addSlectableListOfSitesInTable(checkboxClass) {
		// from https://datatables.net/examples/basic_init/table_sorting.html
		var table = $("<table id='list-of-sites' border='1' cellspacing='0' width='100%'>");

		// header, for column headings
		var thead = $("<thead>");
		var theadTr = $("<tr>");
		theadTr.append("<th style='text-align:center'>Select<br/><input type='checkbox' id='select_all'/></th>");
		theadTr.append("<th>Title</th>");
		theadTr.append("<th>Type</th>");
		theadTr.append("<th>Department</th>");
		theadTr.append("<th>ID</th>");
		theadTr.append("<th>Contact name</th>");
		theadTr.append("<th>Contact email</th>");
		theadTr.append("<th>Banner overrides (if blank then not set)</th>");
		thead.append(theadTr);
		table.append(thead);

		var tbody = $("<tbody>");
		table.append(tbody);

		for (var siteId in siteObjects) {
			var tbodyTr = $("<tr>");
			tbody.append(tbodyTr);
			tbodyTr.append("<td style='text-align:center'><input class='" + checkboxClass + "' type='checkbox' name='id' value='" + siteObjects[siteId].id + "'/></td>");
			tbodyTr.append("<td>" + siteObjects[siteId].titleAsHyperlink + "</td>");
			tbodyTr.append("<td>" + siteObjects[siteId].type + "</td>");
			tbodyTr.append("<td>" + siteObjects[siteId].department + "</td>");
			tbodyTr.append("<td>" + siteObjects[siteId].id + "</td>");
			tbodyTr.append("<td>" + siteObjects[siteId].contactName + "</td>");
			tbodyTr.append("<td>" + siteObjects[siteId].contactEmail + "</td>");

			var bannerFromAdminSite = "";
			if (siteObjects[siteId].type != 'admin') {

				if (siteObjects[siteId].department.length > 0) {// site is managed by an admin site

					//
					// if user isnt a member of siteIds' admin site then we cant tell what the admin site's Id is
					// meaning the admin site wont be in the list of siteObjects, thus there's no way to
					// tell whether a banner is inherited.
					//

					// Check whether we've got the admin site in siteObjects, if not
					// We should give a vague message that the banner may be inherited
					if ( typeof adminSiteTitles[siteObjects[siteId].department] == 'undefined') {
						bannerFromAdminSite = "<i>May inherit from '" + siteObjects[siteId].department + "'</i>";
					} else {
						bannerFromAdminSite = summariseBanner(siteObjects[adminSiteTitles[siteObjects[siteId].department]].banner);
						if (bannerFromAdminSite.length > 0) {
							bannerFromAdminSite = "<b>Inherits:</b> " + bannerFromAdminSite + "<br/>";
						}
					}
				}
			}
			tbodyTr.append("<td>" + summariseBanner(siteObjects[siteId].banner) + bannerFromAdminSite + "</td>");
		}

		// add button click & save guff & table controls
		$(document).ready(function() {

			// now make the select all checkbox, er, select all
			$("input#select_all").click((function() {
				$('input.site-select').prop('checked', true);
			}));

			// now add the sorting controls
			$('table#list-of-sites').dataTable({
				"paging" : false,
				"order" : [[1, "asc"]],
				"info" : false
			});

		});
		return table;
	}

	function getSitesAndSaveData(dialogDiv, nextScreen) {

		var div = $("<div id='get-site-ids-div'></div>");
		dialogDiv.append(div);
		div.append("<p>You can choose sites to update from the list of sites where you have update rights and sites managed by your administration sites.</p>");

		// get first 10000 sites where user has site.upd & store as siteObjects
		$.getJSON("/direct/site/withPerm/.json?permission=site.upd&_limit=10000", function(data) {

			var sites = data.site_collection;

			// save all sites user has site.upd
			$.each(sites, function(key, data) {
				stashSiteObject(data);
			});

			if (userIsAdmin()) {
				div.append("<p>You may also add individual sites (including administration sites) by entering their site ID (super administrators only)</p>");
				div.append("<p><label>Site IDs:<br/><textarea rows='4' cols='30' id='collect-site-ids'/></label></p>");
			}

			// now get extra sites and stash, then get managed sites
			$(document).ready(function() {

				div.append("<button type='button' id='save-site-ids'>Next</button>");
				div.append("<input type='reset' value='Reset'/>");

				// when save is clicked, save the sites given in the textarea,
				// add sites user manages plus any managed sites if user wants it
				$("#save-site-ids").click(function() {

					// change label to 'processing'
					$("#save-site-ids").html("<span class='fa fa-spinner fa-spin fa-spin fa-spin fa-spin '></span> Processing");

					// get all managed sites & extra sites & stash in siteObjects

					var numberOfSitesProcessed = 0;

					var extraSiteIds = trimmedValuesAsArray($("#collect-site-ids").val());

					// are there any extra sites given in the textarea, if ot, nexttScreen?
					if (extraSiteIds.length == 1 && extraSiteIds[0] == "") {
						getManagedSites(nextScreen);
					} else {

						// save the extra sites in siteObjects
						for (var i = 0; i < extraSiteIds.length; i++) {

							(function() {
								var siteId = extraSiteIds[i];
								var siteJsonUrl = "/direct/site/" + siteId + ".json";
								$.getJSON(siteJsonUrl, function(data) {

									stashSiteObject(data);

								}).fail(function(xhr, textStatus, errorThrown) {
									console.log("Calling: " + siteJsonUrl + "FAIL: textStatus = " + textStatus);
								}).always(function() {

									numberOfSitesProcessed++;
									if (numberOfSitesProcessed == extraSiteIds.length) {// we've done every ajax request
										getManagedSites(nextScreen);
									}

								});
								// end JSON

							})();
							// end anonymous function
						} //end for
					}

				});
				// end click function
			});
			// end doc ready

		});

	}

	function getManagedSites(nextScreen) {

		var numberOfSitesProcessed = 0;

		// are there any admin sites to process?

		if (!adminSitesPresent) {
			nextScreen();
		} else {

			for (var j in adminSiteTitles) {
				(function() {

					var adminSiteId = adminSiteTitles[j];

					console.log("looking at admin site: " + adminSiteId);

					//var managedSitesJsonUrl = "/direct/managed-sites/sites.json?adminSite="+adminSiteId;
					var managedSitesJsonUrl = "/direct/managed-sites/" + adminSiteId + "/sites.json";
					$.getJSON(managedSitesJsonUrl, function(data) {

						$.each(data["managed-sites_collection"], function(key, val) {
							console.log(" - For admin site: " + adminSiteId + " stashing site object " + val);
							stashSiteObject(val);

						});

					}).fail(function(xhr, textStatus, errorThrown) {
						console.log("Calling: " + managedSitesJsonUrl + "FAIL: textStatus = " + textStatus);
					}).always(function() {

						numberOfSitesProcessed++;
						if (numberOfSitesProcessed == numAdminSites) {// we've done every ajax request
							nextScreen();
							return;
						}

					});

				})();
				// end anonymous function
			}
			// end for
		}// end if there are admin sites
	}

	/******************************************************************
	 *
	 * "Screen", ie, the different 'dialog' pages
	 *
	 ******************************************************************/

	function chooseRouteScreen() {
		initialise();
		var dialogDiv = $("<form id='get-route-div'></div>");
		replaceHtmlPageDiv(dialogDiv);
		var ul = $("<ul id='routes' style='list-style:none;font-size:x-large;'>");
		dialogDiv.append("<p>Click on the icon to choose what you want to do:</p>");
		dialogDiv.append(ul);
		ul.append("<li id='batch-update-sites'><span class='fa fa-edit '> </span> Batch update site contact details over multiple sites.</li>");
		ul.append("<li id='set-banner-via-admin-site'><span class='fa fa-desktop '> </span> Customise top banner via an administration site. Not finished (actulally not started yet).</li>");
		//ul.append("<li id='set-banner-on-sites'><span class='fa fa-desktop '> </span> Customise top banner on one or more sites. Super admin only.</li>");
		ul.append("<li id='modify-users-in-sites'><span class='fa fa-user-plus '> </span> Add or modify users over multiple sites</li>");
		ul.append("<li id='delete-user-from-sites'><span class='fa fa-user-times '> </span> Locate and (optionally) delete and / or replace a user over multiple sites</li>");
		$(document).ready(function() {

			$("#batch-update-sites").click(function() {
				collectSitesToUpdateScreen();
			});
			$("#batch-update-sites").hover(function() {
				$(this).css('background-color', '#eeeeee');
				$(this).css('cursor', 'pointer');
			}, function() {
				$(this).css('background-color', 'transparent');
			});

			$("#set-banner-via-admin-site").click(function() {
				collectExtraAdminSitesToSetBannerOnScreen();
			});
			$("#set-banner-via-admin-site").hover(function() {
				$(this).css('background-color', '#eeeeee');
				$(this).css('cursor', 'pointer');
			}, function() {
				$(this).css('background-color', 'transparent');
			});

			$("#set-banner-on-sites").click(function() {
				collectExtraSitesToSetBannerOnScreen();
			});
			$("#set-banner-on-sites").hover(function() {
				$(this).css('background-color', '#eeeeee');
				$(this).css('cursor', 'pointer');
			}, function() {
				$(this).css('background-color', 'transparent');
			});

			$("#modify-users-in-sites").click(function() {
				collectUsersToUpdateScreen();
			});
			$("#modify-users-in-sites").hover(function() {
				$(this).css('background-color', '#eeeeee');
				$(this).css('cursor', 'pointer');
			}, function() {
				$(this).css('background-color', 'transparent');
			});

			$("#delete-user-from-sites").click(function() {
				deleteOrReplaceUserScreen();
			});
			$("#delete-user-from-sites").hover(function() {
				$(this).css('background-color', '#eeeeee');
				$(this).css('cursor', 'pointer');
			}, function() {
				$(this).css('background-color', 'transparent');
			});

		});
	}

	//
	// get site ids where user can update, these are
	// + sites where user is maintainer
	// + managedSites in admin site where iser is admin or coordinator
	// + any sites entered into a text box
	//
	function collectSitesToUpdateScreen() {

		var dialogDiv = $("<form id='get-site-ids-div'></div>");
		replaceHtmlPageDiv(dialogDiv);

		getSitesAndSaveData(dialogDiv, collectAttributesToUpdateScreen);

	}

	//
	// get the new site contact and email details
	//
	function collectAttributesToUpdateScreen() {

		// get all sites & display
		// present all attributes that could be changed
		var dialogDiv = $("<form id='get-attributes-div'></div>");
		replaceHtmlPageDiv(dialogDiv);

		var div = $("<div id='get-attributes-div'></div>");
		dialogDiv.append(div);

		div.append("<p>Update the following (leave to field blank to skip an update)</p>");

		div.append("<p id='collect-contact-name'><label>Site contact: <input id='contact-name' type='text' name='contactName' size='35'/></label></p>");
		div.append("<p id='collect-contact-email'><label>Site contact email: <input id='contact-email' type='email' name='contactEmail' size='35'/></label></p>");

		div.append("<p>Select the site(s) to update.</p>");

		div.append(addSlectableListOfSitesInTable("site-select"));

		// add submit buttons
		$(document).ready(function() {

			div.append("<button type='button' id='save-attributes'>Update</button>");
			div.append("<input type='reset' value='Reset'/>");
			$(document).ready(function() {

				$("#save-attributes").click(function() {

					// get all sites that were selected
					// initialise list of sites in case there have been chnages
					sitesToUpdate = [];
					$.each($("input[name='id']:checked"), function() {

						sitesToUpdate.push($(this).val());
					});
					if (sitesToUpdate.length == 0) {
						alert("Please select one or more sites to update.");
						return;
					}

					// get the things to update
					newContactName = $("#contact-name").val().trim();
					newContactEmail = $("#contact-email").val().trim();

					// new new new

					if (newContactName.length == 0 && newContactEmail.length == 0) {
						alert("Neither the 'contactName' nor 'contactEmail' have been set so there is nothing to update");
						// nothing to change - inform people and return to page
						return;
					} else {

						if (newContactEmail.length > 0) {
							if (!validateEmail(newContactEmail)) {// email address not valid
								$("#collect-contact-email").css("color", "red");
								$("#contact-email").val("");
								alert("Email address not valid, please try again.");
								// collect email address again
								return;
							}
						}

						verifySitesToUpdateScreen();

					} // end if contact name and email are not set
				});
			});
		});

	}

	function verifySitesToUpdateScreen() {
		var dialogDiv = $("<form id='update-sites'/>");

		replaceHtmlPageDiv(dialogDiv);
		dialogDiv.append("<p>Site(s) to be updated:</p>");
		var ul = $("<ul>");
		dialogDiv.append(ul);

		var titlesOfSitesToUpdate = [];
		for (var j = 0; j < sitesToUpdate.length; j++) {
			ul.append("<li>" + siteObjects[sitesToUpdate[j]].titleAsHyperlink + "</li>");
		}

		dialogDiv.append("<p>With:</p>");

		var ulv = $("<ul>");
		dialogDiv.append(ulv);

		if (newContactName.length > 0) {
			ulv.append("<li>contactName = '" + newContactName + "'</li>");
		}
		if (newContactEmail.length > 0) {
			ulv.append("<li>contactEmail = '" + newContactEmail + "'</li>");
		}

		dialogDiv.append("<input type='button' id='confirm-updates' value='Update'> ");

		$(document).ready(function() {

			$("#confirm-updates").click(function() {
				updateSitesScreen();
			});

			$("#reselect-updates").click(function() {
				collectAttributesToUpdateScreen();
			});
		});

	}

	//
	// update the details
	//
	function updateSitesScreen() {

		var dialogDiv = $("<form id='updated-sites'/>");

		replaceHtmlPageDiv(dialogDiv);

		var valuesToUpdate = {};

		var ulu = $("<ul id='updated-fields'/>");

		// email is to be updated
		if (newContactEmail.length > 0) {
			ulu.append("<li>Contact email: " + newContactEmail + "</li>");
			valuesToUpdate["contact-email"] = newContactEmail;
		}

		dialogDiv.append("<p>Setting:</p>");

		dialogDiv.append(ulu);

		// name is to be updated
		if (newContactName.length > 0) {
			ulu.append("<li>Contact name: " + newContactName + "</li>");
			valuesToUpdate["contact-name"] = newContactName;
		}

		// build json to put updates in site
		var jsonToPut = {};
		jsonToPut["props"] = valuesToUpdate;

		console.log("JSON to send " + JSON.stringify(jsonToPut));

		dialogDiv.append("<p>on these sites:</p>");
		var ul = $("<ul id='updated-sites'/>");
		dialogDiv.append(ul);

		// do updates
		for (var i = 0; i < sitesToUpdate.length; i++) {

			(function() {
				var siteId = sitesToUpdate[i];
				var updateUrl = "/direct/site/" + siteId + ".json";

				console.log("Url: " + updateUrl);
				var siteTitle = siteObjects[siteId].title;
				if (doUpdates) {
					$.ajax({
						url : updateUrl,
						type : 'PUT',
						data : JSON.stringify(jsonToPut),
					}).done(function(data) {

						ul.append("<li>'" + siteTitle + "' has been updated.</li>");

						// update site stash
						if (newContactName.length > 0) {
							siteObjects[siteId].contactName = newContactName;
						}
						if (newContactEmail.length > 0) {
							siteObjects[siteId].contactEmail = newContactEmail;
						}

					}).fail(function(xhr, textStatus, errorThrown) {

						console.log("Posting to: " + updateUrl + "FAIL: textStatus = " + textStatus);
						ul.append("<li style='text: red;'>'" + siteTitle + "' (" + siteId + ") has NOT been updated, textStatus = " + textStatus + "</li>");
					});
				} else {
					ul.append("<li>Would have updated '" + siteTitle + "' if updates werent disabled.</li>");
				}

			})();
		}

		dialogDiv.append("<button type='button' id='update-more'>Update more sites</button>");
		$(document).ready(function() {
			$("#update-more").click(function() {
				// not needed now we initialise on chooseRoute screen initialise();
				location.reload();

			});
		});

	}

	function collectExtraAdminSitesToSetBannerOnScreen() {
		var dialogDiv = $("<form/>");
		replaceHtmlPageDiv(dialogDiv);
		dialogDiv.append("<p>Setting a 'banner override' on an administration site will alter the look of its managed sites.</p>");

		getSitesAndSaveData(dialogDiv, collectAdminSitesToUpdateBannerOn);

	}

	function collectAdminSitesToUpdateBannerOn() {
		var dialogDiv = $("<form/>");
		replaceHtmlPageDiv(dialogDiv);

		if (!adminSitesPresent) {
			dialogDiv.append("<p>Sorry, but you cannot update any administration sites.</p>");
			dialogDiv.append("<button type='button' id='update-more'>Do something else instead</button>");
			$(document).ready(function() {
				$("#update-more").click(function() {
					// not needed now we initialise on chooseRoute screen initialise();
					location.reload();

				});
			});

		} else {
			dialogDiv.append("<p>Select an administration site on which to set the 'banner override' (which will alter the look of its managed sites).</p>");
			var ul = $("<ul>");
			dialogDiv.append(ul);

			for (var i in adminSiteTitles) {

				console.log("Admin site Id is " + adminSiteTitles[i]);

				ul.append("<li><label><input type='radio' name='adminSiteId' value='" + siteObjects[adminSiteTitles[i]].id + "'/>&nbsp;" + siteObjects[adminSiteTitles[i]].title + "</label></li>");
			}

			dialogDiv.append("<input type='button' value='Next' id='select-admin-site'/>&nbsp;");
			dialogDiv.append("<input type='reset' value='Reset'/>&nbsp;");
			$(document).ready(function() {
				$("#select-admin-site").click(function() {
					adminSiteIdOnWhichToSetBannerOverride = $("input:radio[name='adminSiteId']:checked").val().trim();

					if ( typeof adminSiteIdOnWhichToSetBannerOverride == 'undefined') {
						alert("You must select a site.");
					} else {
						collectBannerAttributes();
					}
				});
			});
		}

	}

	function collectBannerAttributes() {
		var dialogDiv = $("<form/>");
		replaceHtmlPageDiv(dialogDiv);

		dialogDiv.append("<p>Please supply the values you wish to update. Remember to preceed colours with #, eg, '#FF00AAA'.</p>");

		var backgroundColourValue = siteObjects[adminSiteIdOnWhichToSetBannerOverride].banner.backgroundColour;
		dialogDiv.append("<label>backgroundColour <input type='textbox' style='width: 500px;' id='backgroundColour' value='" + backgroundColourValue + "'></label></br>");

		var backgroundImageValue = siteObjects[adminSiteIdOnWhichToSetBannerOverride].banner.backgroundImage;
		dialogDiv.append("<label>backgroundImage <input type='textbox' style='width: 500px;' id='backgroundImage' value='" + backgroundImageValue + "'></label></br>");

		var imageSourceValue = siteObjects[adminSiteIdOnWhichToSetBannerOverride].banner.imageSource;
		dialogDiv.append("<label>imageSource <input type='textbox' style='width: 500px;' id='imageSource' value='" + imageSourceValue + "'></label></br>");

		var imageLinkValue = siteObjects[adminSiteIdOnWhichToSetBannerOverride].banner.imageLink;
		dialogDiv.append("<label>imageLink <input type='textbox' style='width: 500px;' id='imageLink' value='" + imageLinkValue + "'></label></br>");

		var messageValue = siteObjects[adminSiteIdOnWhichToSetBannerOverride].banner.message;
		dialogDiv.append("<label>message <input type='textbox' style='width: 500px;' id='message' value='" + messageValue + "'></label></br>");

		var fontColourValue = siteObjects[adminSiteIdOnWhichToSetBannerOverride].banner.fontColour;
		dialogDiv.append("<label>fontColour <input type='textbox' style='width: 500px;' id='fontColour' value='" + fontColourValue + "'></label></br>");

		dialogDiv.append("<input type='button' value='Next' id='save-banner-attributes'/>&nbsp;");
		dialogDiv.append("<input type='reset' value='Reset'/>&nbsp;");

		$(document).ready(function() {
			$("#save-banner-attributes").click(function() {
				backgroundColourValue = $("#backgroundColour").val().trim();
				console.log("BG col = " + backgroundColourValue);

				// make relative link
				backgroundImageValue = getPath($("#backgroundImage").val().trim());
				imageSourceValue = getPath($("#imageSource").val().trim());
				imageLinkValue = $("#imageLink").val().trim();
				messageValue = $("#message").val().trim();
				fontColourValue = $("#fontColour").val().trim();
				console.log("font col = " + fontColourValue);

				// build json to put updates in site
				var valuesToUpdate = {};

				valuesToUpdate["banner.override.backgroundColour"] = backgroundColourValue;
				valuesToUpdate["banner.override.backgroundImage"] = backgroundImageValue;
				valuesToUpdate["banner.override.imageSource"] = imageSourceValue;
				valuesToUpdate["banner.override.imageLink"] = imageLinkValue;
				valuesToUpdate["banner.override.message"] = messageValue;
				valuesToUpdate["banner.override.fontColour"] = fontColourValue;

				var jsonToPut = {};
				jsonToPut["props"] = valuesToUpdate;

				var updateUrl = "/direct/site/" + adminSiteIdOnWhichToSetBannerOverride + ".json";

				console.log("JSON to send " + JSON.stringify(jsonToPut));
				console.log("url: " + updateUrl);
				if (doUpdates) {
					$.ajax({
						url : updateUrl,
						type : 'PUT',
						data : JSON.stringify(jsonToPut),
					}).done(function(data) {
						var dialogDiv = $("<form/>");
						replaceHtmlPageDiv(dialogDiv);
						dialogDiv.append("<p>Site update successfully completed.</p>");
						dialogDiv.append("<button type='button' id='update-more'>Update more sites</button>");

						// update stashed banner details
						siteObjects[adminSiteIdOnWhichToSetBannerOverride].banner.backgroundColour = backgroundColourValue;
						siteObjects[adminSiteIdOnWhichToSetBannerOverride].banner.backgroundImage = backgroundImageValue;
						siteObjects[adminSiteIdOnWhichToSetBannerOverride].banner.imageSource = imageSourceValue;
						siteObjects[adminSiteIdOnWhichToSetBannerOverride].banner.imageLink = imageLinkValue;
						siteObjects[adminSiteIdOnWhichToSetBannerOverride].banner.message = messageValue;
						siteObjects[adminSiteIdOnWhichToSetBannerOverride].banner.fontColour = fontColourValue;

						$(document).ready(function() {
							$("#update-more").click(function() {
								// not needed now we initialise on chooseRoute screen initialise();
								location.reload();

							});
						});
					}).fail(function(xhr, textStatus, errorThrown) {
						console.log("Posting to: " + updateUrl + "FAIL: textStatus = " + textStatus);

						var dialogDiv = $("<form/>");
						replaceHtmlPageDiv(dialogDiv);
						dialogDiv.append("<p style='text: red;'>Site has NOT been updated, textStatus = " + textStatus + "</p>");
						dialogDiv.append("<button type='button' id='update-more'>Update more sites</button>");
						$(document).ready(function() {
							$("#update-more").click(function() {
								// not needed now we initialise on chooseRoute screen initialise();
								location.reload();

							});
						});
					});
				} else {
					var dialogDiv = $("<form/>");
					replaceHtmlPageDiv(dialogDiv);
					dialogDiv.append("<p>Site would have been updated with:</p>");
					dialogDiv.append("<p>banner.override.backgroundColour = '" + backgroundColourValue + "'</p>");
					dialogDiv.append("<p>banner.override.backgroundImage = '" + backgroundImageValue + "'</p>");
					dialogDiv.append("<p>banner.override.imageSource = '" + imageSourceValue + "'</p>");
					dialogDiv.append("<p>banner.override.imageLink = '" + imageLinkValue + "'</p>");
					dialogDiv.append("<p>banner.override.message = '" + messageValue + "'</p>");
					dialogDiv.append("<p>banner.override.fontColour = '" + fontColourValue + "'</p>");
					dialogDiv.append("<button type='button' id='update-more'>Update more sites</button>");
					$(document).ready(function() {
						$("#update-more").click(function() {
							// not needed now we initialise on chooseRoute screen initialise();
							location.reload();

						});
					});
				}

			});
		});

	}

	//
	//
	// update banner n individual sites
	//
	//
	function collectExtraSitesToSetBannerOnScreen() {
		var dialogDiv = $("<form/>");
		replaceHtmlPageDiv(dialogDiv);
		dialogDiv.append("<p>This will set the banner on individual sites, if you want to set a 'banner override' on an administration site (which will alter the look of all of its managed sites) then this is not the correct option.</p>");

		getSitesAndSaveData(dialogDiv, collectSitesToUpdateBannerOn);

	}

	function collectSitesToUpdateBannerOn() {
		var dialogDiv = $("<form/>");
		replaceHtmlPageDiv(dialogDiv);
		if (siteObjects.length == 1 && siteObjects[0] == "") {
			dialogDiv.append("<p>Sorry, but you cannot update any sites.</p>");
			dialogDiv.append("<button type='button' id='update-more'>Do something else instead</button>");
			$(document).ready(function() {
				$("#update-more").click(function() {
					// not needed now we initialise on chooseRoute screen initialise();
					location.reload();

				});
			});

		} else {
			dialogDiv.append("<p>Please supply the values you wish to update. Remember to preceed colours with #, eg, '#FF00AA'.</p>");

			dialogDiv.append("<label>backgroundColour <input type='textbox' style='width: 500px;' id='backgroundColour'></label></br>");
			dialogDiv.append("<label>backgroundImage <input type='textbox' style='width: 500px;' id='backgroundImage'></label></br>");
			dialogDiv.append("<label>imageSource <input type='textbox' style='width: 500px;' id='imageSource'></label></br>");
			dialogDiv.append("<label>imageLink <input type='textbox' style='width: 500px;' id='imageLink'></label></br>");
			dialogDiv.append("<label>message <input type='textbox' style='width: 500px;' id='message'></label></br>");
			dialogDiv.append("<label>fontColour <input type='textbox' style='width: 500px;' id='fontColour'></label></br>");

			dialogDiv.append("<p>Select one or more sites on which to set the 'banner' (NB setting a banner on an administration site will NOT alter the look of its managed sites - use a different option to do this).</p>");

			dialogDiv.append(addSlectableListOfSitesInTable("site-select"));

			dialogDiv.append("<button type='button' id='save-attributes'>Update</button>");
			dialogDiv.append("<input type='reset' value='Reset'/>");
			$(document).ready(function() {

				$("#save-attributes").click(function() {

					// get all sites that were selected
					// initialise list of sites in case there have been chnages
					sitesToUpdate = [];
					$.each($("input[name='id']:checked"), function() {
						sitesToUpdate.push($(this).val());
					});
					if (sitesToUpdate.length == 0) {
						alert("Please select one or more sites to update.");
						return;
					}

					// get the things to update
					var backgroundColourValue = $("#backgroundColour").val().trim();
					// make relative link
					var backgroundImageValue = getPath($("#backgroundImage").val().trim());
					var imageSourceValue = getPath($("#imageSource").val().trim());
					var imageLinkValue = $("#imageLink").val().trim();
					var messageValue = $("#message").val().trim();
					var fontColourValue = $("#fontColour").val().trim();

					verifySitesToUpdateBannerOnScreen();

				});
			});

		}

	}

	function verifySitesToUpdateBannerOnScreen() {
		var dialogDiv = $("<form/>");
		replaceHtmlPageDiv(dialogDiv);
		dialogDiv.append("<p>Not finished.</p>");
	}

	/*function verifySitesToUpdateBannerOnScreen() {
	var dialogDiv = $("<form/>");
	replaceHtmlPageDiv(dialogDiv);

	dialogDiv.append("<p>Please supply the values you wish to update. Remember to preceed colours with #, eg, '#FF00AAA'.</p>");

	var backgroundColourValue = siteObjects[adminSiteIdOnWhichToSetBannerOverride].banner.backgroundColour;
	dialogDiv.append("<label>backgroundColour <input type='textbox' style='width: 500px;' id='backgroundColour' value='" + backgroundColourValue + "'></label></br>");

	var backgroundImageValue = siteObjects[adminSiteIdOnWhichToSetBannerOverride].banner.backgroundImage;
	dialogDiv.append("<label>backgroundImage <input type='textbox' style='width: 500px;' id='backgroundImage' value='" + backgroundImageValue + "'></label></br>");

	var imageSourceValue = siteObjects[adminSiteIdOnWhichToSetBannerOverride].banner.imageSource;
	dialogDiv.append("<label>imageSource <input type='textbox' style='width: 500px;' id='imageSource' value='" + imageSourceValue + "'></label></br>");

	var imageLinkValue = siteObjects[adminSiteIdOnWhichToSetBannerOverride].banner.imageLink;
	dialogDiv.append("<label>imageLink <input type='textbox' style='width: 500px;' id='imageLink' value='" + imageLinkValue + "'></label></br>");

	var messageValue = siteObjects[adminSiteIdOnWhichToSetBannerOverride].banner.message;
	dialogDiv.append("<label>message <input type='textbox' style='width: 500px;' id='message' value='" + messageValue + "'></label></br>");

	var fontColourValue = siteObjects[adminSiteIdOnWhichToSetBannerOverride].banner.fontColour;
	dialogDiv.append("<label>fontColour <input type='textbox' style='width: 500px;' id='fontColour' value='" + fontColourValue + "'></label></br>");

	dialogDiv.append("<input type='button' value='Next' id='save-banner-attributes'/>&nbsp;");
	dialogDiv.append("<input type='reset' value='Reset'/>&nbsp;");

	$(document).ready(function() {
	$("#save-banner-attributes").click(function() {
	backgroundColourValue = $("#backgroundColour").val().trim();
	// make relative link
	backgroundImageValue = getPath($("#backgroundImage").val().trim());
	imageSourceValue = getPath($("#imageSource").val().trim());
	imageLinkValue = $("#imageLink").val().trim();
	messageValue = $("#message").val().trim();
	fontColourValue = $("#fontColour").val().trim();

	// build json to put updates in site
	var valuesToUpdate = [];

	valuesToUpdate["banner.override.backgroundColour"] = backgroundColourValue;
	valuesToUpdate["banner.override.backgroundImage"] = backgroundImageValue;
	valuesToUpdate["banner.override.imageSource"] = imageSourceValue;
	valuesToUpdate["banner.override.imageLink"] = imageLinkValue;
	valuesToUpdate["banner.override.message"] = messageValue;
	valuesToUpdate["banner.override.fontColour"] = fontColourValue;

	var jsonToPut = {};
	jsonToPut["props"] = valuesToUpdate;

	console.log("JSON to send " + JSON.stringify(jsonToPut));
	if (doUpdates) {
	$.ajax({
	url : updateUrl,
	type : 'PUT',
	data : JSON.stringify(jsonToPut),
	}).done(function(data) {
	var dialogDiv = $("<form/>");
	replaceHtmlPageDiv(dialogDiv);
	dialogDiv.append("<p>Site update successfully completed.</p>");
	dialogDiv.append("<button type='button' id='update-more'>Update more sites</button>");
	$(document).ready(function() {
	$("#update-more").click(function() {
	initialise();
	location.reload();

	});
	});
	}).fail(function(xhr, textStatus, errorThrown) {
	var dialogDiv = $("<form/>");
	replaceHtmlPageDiv(dialogDiv);
	dialogDiv.append("<p style='text: red;'>Site has NOT been updated, textStatus = " + textStatus + "</p>");
	dialogDiv.append("<button type='button' id='update-more'>Update more sites</button>");
	$(document).ready(function() {
	$("#update-more").click(function() {
	initialise();
	location.reload();

	});
	});
	});
	} else {
	var dialogDiv = $("<form/>");
	replaceHtmlPageDiv(dialogDiv);
	dialogDiv.append("<p>Site would have been updated with:</p>");
	dialogDiv.append("<p>banner.override.backgroundColour = '" + backgroundColourValue + "'</p>");
	dialogDiv.append("<p>banner.override.backgroundImage = '" + backgroundImageValue + "'</p>");
	dialogDiv.append("<p>banner.override.imageSource = '" + imageSourceValue + "'</p>");
	dialogDiv.append("<p>banner.override.imageLink = '" + imageLinkValue + "'</p>");
	dialogDiv.append("<p>banner.override.message = '" + messageValue + "'</p>");
	dialogDiv.append("<p>banner.override.fontColour = '" + fontColourValue + "'</p>");
	dialogDiv.append("<button type='button' id='update-more'>Update more sites</button>");
	$(document).ready(function() {
	$("#update-more").click(function() {
	initialise();
	location.reload();

	});
	});
	}

	});
	});

	}*/

	//
	//
	// Update Users, add or modify multiple users
	//
	//
	function collectUsersToUpdateScreen() {

		var dialogDiv = $("<form id='get-userid' />");
		replaceHtmlPageDiv(dialogDiv);

		// add a texarea to collect userIds
		dialogDiv.append("<p>Please supply a list of users who will be added to or updated on sites you select later.</p>");
		dialogDiv.append("<label>Users:<br/><textarea rows='10' cols='40' name='userId' id='user-ids'/></label><br/>");
		dialogDiv.append("Role:<br/><label>access&nbsp;<input type='radio' checked='true' name='memberRole' value='access'/></label> <label>contribute&nbsp;<input type='radio' name='memberRole' value='contribute'/></label> <label>maintain&nbsp;<input type='radio' name='memberRole' value='maintain'/></label><br/>");
		dialogDiv.append("Active?:<br/><label>active&nbsp;<input type='radio' value='true' checked='true' name='active'/></label> <label>inactive&nbsp;<input type='radio' value='false' name='active'/></label><br/>");

		dialogDiv.append("<input type='button' value='Next' id='save-attributes'/>&nbsp;");
		dialogDiv.append("<input type='reset' value='Reset'/>&nbsp;");

		$(document).ready(function() {

			$("#save-attributes").click(function() {

				// now unpick and store in array
				userIds = trimmedValuesAsArray($("#user-ids").val().toLowerCase());
				if (userIds.length == 1 && userIds[0] == "") {
					alert("You have not supplied any users to be updated.");
					return;
				}

				role = $("input:radio[name='memberRole']:checked").val();
				active = $("input:radio[name='active']:checked").val();
				activeStr = 'active';
				if ('false' == active) {
					activeStr = 'inactive';
				}

				var numUsersProcessed = 0;
				for (var i = 0; i < userIds.length; i++) {

					// temp

					//if admin user
					(function() {
						var userId = userIds[i];
						// get username via /direct/user/<ID>.json
						$.getJSON("/direct/user/" + userId + ".json", function(data) {

							var id = data.id;
							// stash user in userObjects
							stashUserObject(id, data);

						}).fail(function(xhr, textStatus, errorThrown) {

							console.log("/direct/user/" + userId + ".json FAILED. textStatus = " + textStatus);

						}).always(function() {
							numUsersProcessed++;
							if (numUsersProcessed == userIds.length) {

								if ($.isEmptyObject(userObjects)) {
									alert("No valid users have been supplied, try again.");
									$("#user-ids").val("");
									return;
								} else {
									collectSitesToUpdateUsersOnScreen();
								}
							}
						});

					})();
					// } else {
					// regular user use IDs
					// fudge user objects using ID in all fields
					// collectSitesToUpdateUsersOnScreen();
					//}
				}

			});
		});

	}

	function collectSitesToUpdateUsersOnScreen() {
		var dialogDiv = $("<form id='get-siteid' />");
		replaceHtmlPageDiv(dialogDiv);
		dialogDiv.append("<p>The following user(s) will be added with or updated to the '" + role + "' (" + activeStr + ") role to the sites where you have update rights:</p>");

		var ul = $("<ul/>");
		dialogDiv.append(ul);

		for (var id in userObjects) {

			ul.append("<li>" + userObjects[id].displayName + " (" + userObjects[id].displayId + ")" + "</li>");

		}

		getSitesAndSaveData(dialogDiv, getSitesToUpdateUsersOnScreen);

	}

	function getSitesToUpdateUsersOnScreen() {

		// get all sites & display
		// present all attributes that could be changed
		var dialogDiv = $("<form>");
		replaceHtmlPageDiv(dialogDiv);

		dialogDiv.append("<p>Update the following user(s) on the sites selected below.</p>");
		var ul = $("<ul>");
		dialogDiv.append(ul);

		for (var id in userObjects) {
			ul.append("<li>" + userObjects[id].displayName + " (" + userObjects[id].displayId + ")</li>");
		}

		dialogDiv.append("<p>Select the site(s) to update.</p>");

		dialogDiv.append(addSlectableListOfSitesInTable("site-select"));

		// add submit buttons
		$(document).ready(function() {

			dialogDiv.append("<button type='button' id='save-attributes'>Update</button>");
			dialogDiv.append("<input type='reset' value='Reset'/>");
			$(document).ready(function() {

				$("#save-attributes").click(function() {

					// get all sites that were selected
					// initialise list of sites in case there have been chnages
					sitesToUpdate = [];
					$.each($("input[name='id']:checked"), function() {
						sitesToUpdate.push($(this).val());
					});
					if (sitesToUpdate.length == 0) {
						alert("Please select one or more sites to update.");
						return;
					}

					verifySitesToUpdateUsersOnScreen();

				});
			});
		});

	}

	function verifySitesToUpdateUsersOnScreen() {

		var dialogDiv = $("<form id='confirm'/>");
		replaceHtmlPageDiv(dialogDiv);
		var summary = $("<div id='summary'/>");
		dialogDiv.append(summary);

		var ulu = $("<ul>");
		summary.append("<p>These users:</p>");
		summary.append(ulu);

		for (var id in userObjects) {
			ulu.append("<li>" + userObjects[id].displayName + " (" + userObjects[id].displayId + ")" + "</li>");
		}

		summary.append("<p>Will be added with or updated to the '" + role + "' (" + activeStr + ") role to these sites:</p>");

		var uls = $("<ul>");
		summary.append(uls);

		for (var i = 0; i < sitesToUpdate.length; i++) {
			var id = sitesToUpdate[i];
			uls.append("<li>" + siteObjects[id].titleAsHyperlink + " (" + id + ")</li>");
		}

		summary.append("<input  type='button' id='update-users-on-site' value='Add or update users'/> ");

		$(document).ready(function() {

			$("#update-users-on-site").click(function() {
				updateUsersOnSitesScreen();
			});
		});
	}

	function updateUsersOnSitesScreen() {

		var dialogDiv = $("<form id='updated-users'/>");
		replaceHtmlPageDiv(dialogDiv);
		dialogDiv.append($("<p>The following operations have been successfully completed.</p>"));

		var ul = $("<ul>");
		dialogDiv.append(ul);

		// this could be a common
		dialogDiv.append("<button type='button' id='update-more'>Update more sites</button>");
		$(document).ready(function() {
			$("#update-more").click(function() {
				// not needed now we initialise on chooseRoute screen initialise();
				location.reload();

			});
		});

		// this should be done using an array of userids

		var userIdArray = [];

		var usernamesLi = "";
		var userIdsString = "";
		for (var userId in userObjects) {
			userIdArray.push(userId);
			usernamesLi += "<li>" + userObjects[userId].displayName + "</li>";

			userIdsString += "&userIds=" + userId;
		}

		for (var i = 0; i < sitesToUpdate.length; i++) {
			console.log(" site to update " + sitesToUpdate[i]);
			(function() {
				console.log("In F site to update " + sitesToUpdate[i]);
				// local copies
				var id = sitesToUpdate[i];

				console.log("In F id = " + id);
				var site = "/site/" + id;

				var url = "/direct/membership?memberRole=" + role + "&locationReference=" + site + userIdsString + "&active=" + active;
				console.log("Posting " + url);
				if (doUpdates) {
					$.post(url).done(function(data) {
						ul.append("<li>The following users have been added to site '" + siteObjects[id].title + "' with role '" + role + "' (" + activeStr + ")<ul>" + usernamesLi + "</ul></li>");

					}).fail(function(xhr, textStatus, errorThrown) {
						ul.append("<li style='color:red;'>User '<ul>" + usernamesLi + "</ul>' could not be added to site '" + siteObjects[id].title + " with role '" + role + "' (" + activeStr + ") " + textStatus + ": request response: " + xhr.status + " (" + xhr.statusText + ")" + "</li>");

						console.log(textStatus + ": request response: " + xhr.status + " (" + xhr.statusText + ")");

					});
				} else {
					ul.append("<li>Would have added users '<ul>" + usernamesLi + "</ul>' to site: " + siteObjects[id].title + " mit memberRole=" + role + " und active=" + active + " if updates weren't disabled.</li>");

				}
			})();

		} // end j loop

	}

	function deleteOrReplaceUserScreen() {
		var dialogDiv = $("<form id='get-userid'/>");
		replaceHtmlPageDiv(dialogDiv);

		// add a text box to collect userId
		dialogDiv.append("<p>Please supply the username to locate.</p>");
		dialogDiv.append("<label>User to locate <input type='textbox' name='userId' id='user-id'></label><br/>");
		dialogDiv.append("<label>Delete this user? <input type='checkbox' name='remove' value='true'></label>");
		dialogDiv.append("<p>Please supply the username(s) to replace or be added to the same sites as the above user. Leave blank to skip.</p>");
		dialogDiv.append("<label>Replacement username(s) <textarea rows='10' cols='30' name='replacementUserIds' id='replacement-user-ids'/></label><br/>");

		//
		// load all sites where user has site.upd
		//

		dialogDiv.append("<input  type='button' value='Next' id='collect-users'/> ");
		dialogDiv.append("<input type='reset' value='Reset'/> ");

		$(document).ready(function() {

			$("#collect-users").click(function() {
				sourceUser = $("#user-id").val().trim().toLowerCase();
				if (sourceUser == "") {
					alert("You must supply a user to locate or replace");
					return;
				}

				// are we to delete the source user?
				removeUser = $("input:checkbox[name='remove']:checked").val();

				var deleteUser;
				if ( typeof removeUser == 'undefined') {
					removeUser = 'false';
					deleteUser = false;
				} else {
					deleteUser = true;
				}

				var replaceUser;
				var replacementUsers = trimmedValuesAsArray($("#replacement-user-ids").val().toLowerCase());
				if (replacementUsers.length == 1 && replacementUsers[0] == "") {
					replaceUser = false;
				} else {
					replaceUser = true;
				}

				// get userObject for sourceUser via /direct/user/<ID>.json
				$.getJSON("/direct/user/" + sourceUser + ".json", function(data) {
					stashUserObject(sourceUser, data);

					var numReplacementUsersDone = 0;
					if (!replaceUser) {
						// getSitesOnWhichToDeleteOrReplaceUserScreen(deleteUser, replaceUser);
						if (!deleteUser) {
							// so we're just looking at the details of the given user
							getSitesOnWhichToDeleteOrReplaceUserScreen();

						} else {
							// just deletig user
							getSitesOnWhichToDeleteOrReplaceUserScreen();
						}
					} else {

						for (var i = 0; i < replacementUsers.length; i++) {
							(function() {

								var targetUser = replacementUsers[i];

								// get userObject for all replacemant users via /direct/user/<ID>.json
								$.getJSON("/direct/user/" + targetUser + ".json", function(data) {
									stashUserObject(targetUser, data);

									targetUsers.push(targetUser);

									numReplacementUsersDone++;
									if (numReplacementUsersDone == replacementUsers.length) {
										getSitesOnWhichToDeleteOrReplaceUserScreen();
									}

								}).fail(function(xhr, textStatus, errorThrown) {
									console.log("Calling: " + "/direct/user/" + targetUser + ".json" + " FAIL: textStatus = " + textStatus);

									numReplacementUsersDone++;
									// do ID stuff instead
									alert("Replacement user '" + targetUser + "' not found, either correct or delete user.");

									//if (numReplacementUsersDone == replacementUsers.length) {
									//getSitesOnWhichToDeleteOrReplaceUserScreen();
									//}

								});
							})();
						};

					}
				}).fail(function(xhr, textStatus, errorThrown) {
					console.log("Calling: " + "/direct/user/" + sourceUser + ".json" + " FAIL: textStatus = " + textStatus);

					// do ID stuff instead

					alert("User not found, please try again.");
					$("#user-id").val("");
				});

			});
		});

	}

	function getSitesOnWhichToDeleteOrReplaceUserScreen() {

		var dialogDiv = $("<form id='list-o-sites'/>");
		replaceHtmlPageDiv(dialogDiv);

		var username = userObjects[sourceUser].displayId;
		var userId = userObjects[sourceUser].id;

		var deleteUser;
		if (removeUser == 'false') {
			deleteUser = false;
		} else {
			deleteUser = true;
		}

		var replaceUser;
		if (targetUsers.length > 0) {
			replaceUser = true;
		} else {
			replaceUser = false;
		}

		if (deleteUser) {
			dialogDiv.append("<p>Delete user: <ul><li>" + userObjects[sourceUser].displayName + " (" + username + ").</li></ul></p>");

		} else {
			dialogDiv.append("<p>User: <ul><li>" + userObjects[sourceUser].displayName + " (" + username + ").</li></ul></p>");
		}

		if (replaceUser) {

			dialogDiv.append("<p>Add these users with the same role etc. as '" + userObjects[sourceUser].displayName + "':</p>");
			var ulr = $("<ul>");
			dialogDiv.append(ulr);
			for (var i = 0; i < targetUsers.length; i++) {
				var targetUser = targetUsers[i];
				ulr.append("<li>" + userObjects[targetUser].displayName + " (" + userObjects[targetUser].displayId + ")</li>");
			}
		}

		if (deleteUser || replaceUser) {
			dialogDiv.append("<p>on the following selected sites:</p>");

		} else {
			dialogDiv.append("<p>is a member of the following sites:</p>");
		}

		var ul = $("<ul>");
		dialogDiv.append(ul);
		var listOfSiteIds = $("<pre><code>");

		if (deleteUser || replaceUser) {
			// add select all checkbox
			ul.append("<li><label><input type='checkbox' id='select-all'/>&nbsp;Select All</label></li>");

		} else {
			dialogDiv.append("<h2>Site IDs</h2>");

			dialogDiv.append(listOfSiteIds);

		}

		$.getJSON("/direct/membership.json?userId=" + userId, function(data) {

			var mems = data.membership_collection;

			$.each(mems, function(key, val) {

				var siteId = val.locationReference.substr(6);
				// If there's a siteId of "info" then this is the guidance site, NB, '/direct/site/info.json' is a reserved URL
				if ("info" == siteId) {
					var siteTitle = "Guidance Site";
					ul.append("<li>Guidance Site (cannot update)</li>");
					listOfSiteIds.append("info\n");
				} else {

					stashMembershipObject(siteId, val);

					var siteJsonUrl = "/direct/site/" + siteId + ".json";
					(function() {
						var providedStr = "";
						if (membershipObjects[siteId].isProvided()) {
							providedStr = " (user is member of a participant group)";
						}

						$.getJSON(siteJsonUrl, function(data) {
							var id = data.id;
							stashSiteObject(data);
							if (deleteUser || replaceUser) {// add select checkbox
								ul.append("<li><label><input class='site-select' type='checkbox' name='locationReference' value='" + id + "'>&nbsp;'" + siteObjects[id].title + "' </label> role: '" + membershipObjects[siteId].memberRole + "'" + providedStr + ".</li>");
							} else {// we're just displaing info, nothing to select
								listOfSiteIds.append(id + "\n");
								ul.append("<li>'" + siteObjects[id].titleAsHyperlink + "' role: '" + membershipObjects[siteId].memberRole + "'" + providedStr + ".</li>");
							}
						});
						// end get siteJsonUrl
					})();

				} // end if siteId = info

			});
			// end each
			$(document).ready(function() {
				$("#select-all").click(function() {
					$(':checkbox.site-select').prop('checked', true);
				});
			});

		});
		// end getJSON membership

		if (deleteUser || replaceUser) {
			dialogDiv.append("<input type='button' value='Next' id='collect-sites'/> ");
			dialogDiv.append("<input type='reset' value='Reset'/> ");
		} else {
			dialogDiv.append("<button type='button' id='main-menu'>Back to main menu</button>");
			$(document).ready(function() {
				$("#main-menu").click(function() {
					// not needed now we initialise on chooseRoute screen initialise();
					location.reload();
					return;
				});
			});
		}

		$(document).ready(function() {

			$("#collect-sites").click(function() {
				sitesToUpdate = [];
				$.each($("input[name='locationReference']:checked"), function() {
					sitesToUpdate.push($(this).val());
				});

				if (sitesToUpdate == "") {
					alert("You must supply at least one site ");
					return;
				}
				verifySitesToDeleteOrReplaceUserScreen();
			});
		});

	}

	function verifySitesToDeleteOrReplaceUserScreen() {

		var dialogDiv = $("<form id='confirm-list-o-sites' />");
		replaceHtmlPageDiv(dialogDiv);
		var deleteOrLocateStr = "Locate";
		if (removeUser == 'true') {
			deleteOrLocateStr = "Delete";
		}
		dialogDiv.append("<p>" + deleteOrLocateStr + " user <ul><li>" + userObjects[sourceUser].displayName + " (" + userObjects[sourceUser].displayId + ")</li></ul></p>");

		if (targetUsers.length > 0) {
			dialogDiv.append("<p>Add the following user(s) (with same role as '" + userObjects[sourceUser].displayName + "'):</p>");

			var ult = $("<ul>");
			dialogDiv.append(ult);

			for (var i = 0; i < targetUsers.length; i++) {
				var targetUser = targetUsers[i];
				ult.append("<li>" + userObjects[targetUser].displayName + " (" + userObjects[targetUser].displayId + ")</li>");
			}

		}
		dialogDiv.append("<p>to these sites:</p>");
		var ul = $("<ul/>");
		for (var i = 0; i < sitesToUpdate.length; i++) {
			var location = sitesToUpdate[i];

			ul.append("<li>" + siteObjects[location].titleAsHyperlink + "</li>");

		}// end for
		dialogDiv.append(ul);

		dialogDiv.append("<input type='button' value='Update sites' id='do-delete-and-replace'/> ");

		$(document).ready(function() {

			$("#do-delete-and-replace").click(function() {

				doDeleteOrReplaceUserScreen();
			});
		});

	}

	function doDeleteOrReplaceUserScreen() {
		var dialogDiv = $("<form id='finish'/>");
		replaceHtmlPageDiv(dialogDiv);

		dialogDiv.append($("<p>Summary:</p>"));
		var ul = $("<ul/>");
		dialogDiv.append(ul);
		console.log("There are this num of sites to update " + sitesToUpdate.length);
		for (var i = 0; i < sitesToUpdate.length; i++) {
			console.log("1 Update site " + sitesToUpdate[i]);

			var siteId = sitesToUpdate[i];
			var site = "/site/" + siteId;
			var siteTitle = siteObjects[siteId].title;

			if (removeUser == 'true') {
				var url = "/direct/membership/" + membershipEntity(userObjects[sourceUser].id, sitesToUpdate[i]) + ".json";

				if (doUpdates) {
					(function() {

						var title = siteTitle;

						$.ajax({
							url : url,
							type : 'DELETE'
						}).done(function(data) {
							ul.append("<li>User '" + userObjects[sourceUser].displayId + "' deleted from site '" + title + "'</li>");
						}).fail(function(xhr, textStatus, errorThrown) {
							console.log("Calling: " + url + " FAIL: textStatus = " + textStatus);

							ul.append("<li style='text: red;'>User '" + userObjects[sourceUser].displayId + "' NOT deleted from '" + title + "' textStatus = " + textStatus + "</li>");
						});
					}
					)();

				} else {
					console.log("Delete user URL is: " + url);
					ul.append("<li>Would have deleted user " + userObjects[sourceUser].displayId + " from: " + title + " if updates weren't disabled</li>");
				}
			}

			if (targetUsers.length > 0) {

				var userIdsArray = "";
				var usernameLi = "";
				// add targetUsers to location

				for (var j = 0; j < targetUsers.length; j++) {

					usernameLi += "<li>" + userObjects[targetUsers[j]].displayName + " (" + userObjects[targetUsers[j]].displayId + ")</li>";
					userIdsArray += "&userIds=" + userObjects[targetUsers[j]].id;
				}

				(function() {
					//var targetUser = targetUsers[j];
					var memberRole = membershipObjects[siteId].memberRole;
					var active = membershipObjects[siteId].active;
					var activeStr = 'active';
					if ('false' == active) {
						activeStr = 'inactive';
					}

					var title = siteObjects[siteId].title;

					var url = "/direct/membership?memberRole=" + memberRole + "&locationReference=" + site + userIdsArray + "&active=" + active;
					console.log(url);
					if (doUpdates) {

						$.post(url).done(function(data) {
							ul.append("<li>The following users have been added to site '" + title + "' with role '" + memberRole + "' (" + activeStr + ")<ul>" + usernameLi + "</ul></li>");

						}).fail(function(xhr, textStatus, errorThrown) {
							ul.append("<li style='color:red;'>The following users could not be added to site '" + title + " with role '" + memberRole + "' (" + activeStr + ") " + textStatus + ": request response: " + xhr.status + " (" + xhr.statusText + ")<ul>" + usernameLi + "</ul></li>");

							console.log(textStatus + ": request response: " + xhr.status + " (" + xhr.statusText + ")");

						});

					} else {
						ul.append("<li>Would have added the following users " + " to: " + siteTitle + " if updates weren't disabled <ul>" + usernameLi + "</ul></li>");
					}
				})();
			}

		}
		dialogDiv.append("<button type='button' id='update-more'>Update more sites</button>");
		$(document).ready(function() {
			$("#update-more").click(function() {
				// not needed now we initialise on chooseRoute screen initialise();
				location.reload();

			});
		});
	}

	/*******************************************************************/
	/* BEGIN                                                           */
	/*******************************************************************/

	//
	// Global variables
	//

	// these are the sites selected from all possible sites by the user
	var sitesToUpdate = [];

	// a table of all sites used in this page
	var siteObjects = {};

	// a table of a given user's memberships
	var membershipObjects = {};

	// new values to update, if blank then dont update
	var newContactName;
	var newContactEmail;

	// for update users
	var role;
	var userIds = [];
	var userObjects = {};
	var active;
	var activeStr;
	var locations;
	var sourceUser;

	// NB will be a string!!
	var removeUser = 'false';

	var targetUsers = [];

	// quick look-ups for admin sites, NB, we need the title look-up 'cos Sites only contain the
	// Department attribute (set to the title of the admin site, and not the admin site ID)

	var adminSiteTitles = {};
	var adminSiteIdOnWhichToSetBannerOverride;
	var adminSitesPresent = false;
	var numAdminSites = 0;

	var doUpdates = true;

	chooseRouteScreen();

})();

// TO DO

// * "You may also add individual sites (including administration sites) by entering their site ID (super administrators only)" - still shows for non admins
// when adding users, report if any supplied dont exist

// 

// * set banner on site

// * when details are updated via EB PUT / DELETE / POST- update the stashed sites / user objects then remove initialise

// * when replacing a site member, list sub groups and all new user(s) to be added to them