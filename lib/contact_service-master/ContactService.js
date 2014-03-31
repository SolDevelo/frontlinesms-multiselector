var contactService, ContactService;
$(function() {
	contactService = new ContactService();
});

ContactService = function() {
	var
	fullContactDatabase,
	getObject = function(objectType, index) {
		return fullContactDatabase[objectType][index];
	},
	getObjectCount = function(objectType){
		return fullContactDatabase[objectType].length;
	},
	getAll = function() {
		return getFilteredMatches();
	},
	getAllMatches = function(searchString) {
		return getFilteredMatches("", searchString);
	},
	getFilteredMatches = function(selectedIds, searchString) {
		var groupingName,
		groupingDisplayNames = {
			"contacts" : "Contacts",
			"groups" : "Groups",
			"smartgroups" : "Smart Groups"
		},
		groupingResult,
		currentEntry,
		overallResult = [];
		if(searchString === undefined) {
			searchString = "";
		}
		if(selectedIds) {
			selectedIds = selectedIds.replace(/ /g,'');
		}
		// 1. Get all matches
		["contacts", "groups", "smartgroups"].forEach(function(groupingName) {
			groupingResult = {
				"displayName" : groupingDisplayNames[groupingName],
				"customCssClass" : groupingName,
				"members" : []
			};
			fullContactDatabase[groupingName].forEach(function(currentEntry) {
				if(currentEntry.name.toUpperCase().indexOf(searchString.toUpperCase()) !== -1 || currentEntry.metadata.toUpperCase().indexOf(searchString.toUpperCase()) !== -1) {
					if(!selectedIds || $.inArray(currentEntry.id, selectedIds.split(",")) === -1) {
						groupingResult.members.push(currentEntry);
					}
				}
			});
			if(groupingResult.members.length) {
				overallResult.push(groupingResult);
			}
		});
		return overallResult;
	};

	// init
	fullContactDatabase = {
		"contacts" : [
			{
				"name" : "Alicia",
				"id" : "contact-1",
				"metadata" : "+447943419787"
			},
			{
				"name" : "Barry",
				"id" : "contact-2",
				"metadata" : "+254701004454"
			},
			{
				"name" : "Charles",
				"id" : "contact-3",
				"metadata" : "+22345004454"
			},
			{
				"name" : "Dominic",
				"id" : "contact-4",
				"metadata" : "+4471224253"
			},
			{
				"name" : "Emily",
				"id" : "contact-5",
				"metadata" : "+12352351234"
			},
			{
				"name" : "Felix",
				"id" : "contact-6",
				"metadata" : "+2546283042"
			},
			{
				"name" : "Hilda",
				"id" : "contact-7",
				"metadata" : "+12158031508"
			},
			{
				"name" : "Iinigo",
				"id" : "contact-8",
				"metadata" : "+1215154153"
			},
			{
				"name" : "Jaramogi",
				"id" : "contact-9",
				"metadata" : "+25491851515"
			},
			{
				"name" : "朴智星",
				"id" : "contact-10",
				"metadata" : "+135135135135"
			},
			{
				"name" : "Ali Shaheed Mohammed",
				"id" : "contact-11",
				"metadata" : "+133523692082"
			},
			{
				"name" : "James Yancey",
				"id" : "contact-12",
				"metadata" : "+139528692082"
			},
			{
				"name" : "Kamaal Ibn John Fareed",
				"id" : "contact-13",
				"metadata" : "+1987634253426"
			},
			{
				"name" : "Juman Khamis",
				"id" : "contact-14",
				"metadata" : "khamis@united.com"
			},
			{
				"name" : "Mai Zena",
				"id" : "contact-15",
				"metadata" : "mai2001@live.com"
			},
			{
				"name" : "Sturridge Mwakule",
				"id" : "contact-16",
				"metadata" : "I play for Cheldam"
			}
		],
		"groups" : [
			{
				"name" : "Support Staff",
				"id" : "group-1",
				"metadata" : "4 members",
				"memberCount" : 4
			},
			{
				"name" : "Windows Users",
				"id" : "group-2",
				"metadata" : "0 members",
				"memberCount" : 0,
				"disabled" : true
			},
			{
				"name" : "Android Owners",
				"id" : "group-3",
				"metadata" : "9 members",
				"memberCount" : 9
			}
		],
		"smartgroups" : [
			{
				"name" : "Heores",
				"id" : "smartgroup-1",
				"metadata" : "9 members",
				"memberCount" : 9
			},
			{
				"name" : "Villains",
				"id" : "smartgroup-2",
				"metadata" : "12 members",
				"memberCount" : 12
			}
		]
	};

	// Expose public functions
	this.getAll = getAll;
	this.getAllMatches = getAllMatches;
	this.getFilteredMatches = getFilteredMatches;
	this.getObject = getObject;
	this.getObjectCount = getObjectCount;
};
