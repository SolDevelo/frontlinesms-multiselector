var ms;

$(document).ready(function() {
    "use strict";

    ms = $("div#container").multiselect({ itemDisplayLimit: 4 }, {"en_US": {"common.item.limit.label": "Showing %s out of %s matches"}});
});
