var ms;

$(document).ready(function() {
    "use strict";

    var options = {
        contactItemDisplayLimit: 4,
        groupItemDisplayLimit: 1,
        smartgroupItemDisplayLimit: 1,
        objectAdded: function(id) { return id; }
    };
    var translations = {
        "en_US": {
            "common.item.limit.label": "Showing %s out of %s matches",
            "common.group.select.disabled": "This group is disabled and you can not select it."
        }
    };
    var preloadedIDs = ["contact-6", "contact-10", "110", "+48987654321"];
    ms = $("div#container").multiselect(options, translations, preloadedIDs);
});
