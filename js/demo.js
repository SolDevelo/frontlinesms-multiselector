var ms;

$(document).ready(function() {
    "use strict";

    ms = $("div#container").multiselect({contactItemDisplayLimit: 4, groupItemDisplayLimit: 1, smartgroupItemDisplayLimit: 1}, {"en_US": {"common.item.limit.label": "Showing %s out of %s matches"}});
});
