var contactService, ContactService;
$(function() {
	contactServiceSportsTeams = new ContactServiceSportsTeams();
});

ContactServiceSportsTeams = function() {
	var 
    getAll = function() {
        return getFilteredMatches();
    },
    getTypes = function() {
		return types;
    },
    getObjectCount = function(objectType){
        return fullContactDatabase[objectType].length;
    },
    getFilteredMatches = function(selectedIds, searchString) {
		var overallResult = {};
		if(searchString === undefined) {
			searchString = "";
		}
		if(selectedIds) {
			selectedIds = selectedIds.replace(/ /g,'');
		}
		// 1. Get all matches
		for (var key in types) {
			var type = types[key],
                groupingResult = {
                    "displayName": type.displayName,
                    "customCssClass": type.customCssClass,
                    "members": []
                };
			fullContactDatabase[type.name].forEach(function (currentEntry) {
				if (currentEntry.name.toUpperCase().indexOf(searchString.toUpperCase()) !== -1 || currentEntry.metadata.toUpperCase().indexOf(searchString.toUpperCase()) !== -1) {
					if (!selectedIds || $.inArray(currentEntry.id, selectedIds.split(",")) === -1) {
						groupingResult.members.push(currentEntry);
					}
				}
			});
			overallResult[type.name] = groupingResult;
		}
		return overallResult;
    },
    types = {
        "basketballTeams": {
            "name" : "basketballTeams",
            "displayName" : "Basketball Teams",
            "customCssClass" : "basketballTeams"
        },
        "footballTeams": {
            "name" : "footballTeams",
            "displayName" : "Football Teams",
            "customCssClass" : "footballTeams"
        },
        "handballTeams": {
            "name" : "handballTeams",
            "displayName" : "Handball Teams",
            "customCssClass" : "handballTeams"
        },
        "rugbyTeams": {
            "name" : "rugbyTeams",
            "displayName" : "Rugby Teams",
            "customCssClass" : "rugbyTeams"
        }
    },
	fullContactDatabase = {
		"basketballTeams" : [
			{
				"name" : "London Towers",
				"id" : "basketball-1",
				"metadata" : "30 members",
				"memberCount" : 30
			},
			{
				"name" : "London United",
				"id" : "basketball-2",
				"metadata" : "29 members",
				"memberCount" : 29
			},
			{
				"name" : "London Capital",
				"id" : "basketball-3",
				"metadata" : "31 members",
				"memberCount" : 31
			},
			{
				"name" : "Essex Leopards",
				"id" : "basketball-4",
				"metadata" : "32 members",
				"memberCount" : 32
			}
		],
		"footballTeams" : [
			{
				"name" : "Arsenal",
				"id" : "football-1",
				"metadata" : "26 members",
				"memberCount" : 26
			},
			{
				"name" : "Chelsea",
				"id" : "football-2",
				"metadata" : "38 members",
				"memberCount" : 38
			},
			{
				"name" : "Crystal Palace",
				"id" : "football-3",
				"metadata" : "24 members",
				"memberCount" : 24
			},
			{
				"name" : "Queens Park Rangers",
				"id" : "football-4",
				"metadata" : "25 members",
				"memberCount" : 25
			},
			{
				"name" : "Tottenham Hotspur",
				"id" : "football-5",
				"metadata" : "31 members",
				"memberCount" : 31
			},
			{
				"name" : "West Ham United",
				"id" : "football-6",
				"metadata" : "27 members",
				"memberCount" : 27
			}
		],
		"handballTeams" : [
			{
				"name" : "London GD",
				"id" : "handball-1",
				"metadata" : "24 members",
				"memberCount" : 24 
			},
			{
				"name" : "Olympia London H.C.",
				"id" : "handball-2",
				"metadata" : "23 members",
				"memberCount" : 23 
			},
			{
				"name" : "Ruislip Eagles",
				"id" : "handball-3",
				"metadata" : "20 members",
				"memberCount" : 20 
			}
		],
		"rugbyTeams" : [
			{
				"name" : "Harlequin",
				"id" : "rugby-1",
				"metadata" : "35 members",
				"memberCount" : 35 
			},
			{
				"name" : "Saracens",
				"id" : "rugby-2",
				"metadata" : "40 members",
				"memberCount" : 40 
			}
		]
	};

	// Expose public functions
	this.getAll = getAll;
	this.getFilteredMatches = getFilteredMatches;
	this.getObjectCount = getObjectCount;
	this.getTypes = getTypes;
};