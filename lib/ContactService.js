var contactService, ContactService;
$(function() {
    contactService = new ContactService();
});

ContactService = function() {
    var
        fullContactDatabase,
        getAll = function() {
            return getFilteredMatches();
        },
        getAllMatches = function(searchString) {
            return getFilteredMatches("", searchString);
        },
        getFilteredMatches = function(selectedIds, searchString) {
            var groupingName,
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
                    "displayName" : groupingName,
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
            }
        ],
        "groups" : [
            {
                "name" : "Support Staff",
                "id" : "group-1",
                "metadata" : "0 members"
            },
            {
                "name" : "Android Owners",
                "id" : "group-2",
                "metadata" : "9 members"
            }
        ],
        "smartgroups" : [
            {
                "name" : "Heores",
                "id" : "smartgroup-1",
                "metadata" : "9 members"
            },
            {
                "name" : "Villains",
                "id" : "smartgroup-2",
                "metadata" : "12 members"
            }
        ]
    };

    // Expose public functions
    this.getAll = getAll;
    this.getAllMatches = getAllMatches;
    this.getFilteredMatches = getFilteredMatches;
};
