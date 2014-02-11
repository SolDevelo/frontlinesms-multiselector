var ms;

$(document).ready(function() {
    "use strict";

    var options = {
        contactItemDisplayLimit: 4,
        groupItemDisplayLimit: 1,
        smartgroupItemDisplayLimit: 1
    };
    var translations = {
        "en_US": {
            "common.item.limit.label": "Showing %s out of %s matches"
        }
    };
    ms = $("div#container").multiselect(options, translations);
});
