var ms;

$(document).ready(function() {
    "use strict";

    var options = {
        contactItemDisplayLimit: 4,
        groupItemDisplayLimit: 1,
        smartgroupItemDisplayLimit: 1,
        objectAdded: function(objectId) {
            $("#lastId").text("Last added id: " + objectId);
            return objectId;
        }
    };
    var translations = {
        "en_US": {
            "common.item.limit.label": "Showing %s out of %s matches",
            "common.group.select.disabled": "This group is disabled and you can not select it."
        }
    };
    var preloadedIDs = ["contact-6", "contact-10", "110", "+48987654321", "smartgroup-2"];

    ms = $("div#container").multiselect(options, translations, preloadedIDs, contactService);

    var changeScript = function(pathToScript, onErrorText){
        ms.deepClean();

        $("body").prepend($(document.createElement("img")).attr("src", "images/ajax-loader.gif")
            .addClass("img-reload-contactservice"));

        $.getScript(pathToScript, function( data, textStatus, jqxhr ) {
            ms.contactServiceObject = new ContactService();
            $(".img-reload-contactservice").eq(0).remove();
        }).fail(function( jqxhr, settings, exception ) {
            $(".img-reload-contactservice").eq(0).remove();
            alert(onErrorText);
        });
    };

    $("select.choose-contactservice").change(function(e){
        changeScript($(e.currentTarget).val(), "An error has occurred while changing contact database!");
    });
});
