var ms;

$(document).ready(function() {
    "use strict";

    /* Default options:
    {
        "minResultsHeight": 300,
        "displayLimit": {
            "contacts": 15,
            "groups": 5,
            "smartgroups": 5
        },
        "displayNames": {
            "contacts": "Contacts",
            "groups": "Groups",
            "smartgroups": "Smart Groups"
        },
        "objectAdded": null,
        "objectRemoved": null,
        "language": "en_US",
        "icons": {
            "contacts": "fa fa-user",
            "groups": "fa fa-group",
            "smartgroups": "fa fa-cog",
            "phone-number": "fa fa-mobile-phone"
        },
        "contactLoading": {
            // milliseconds between loading a batch of contacts
            "intervalMs": 5,
            "batchSize": 10
        }
    }*/

    /*Default translations
    {
        "en_US": {
            "common.item.limit.label": "Showing %s out of %s matches",
            "common.item.selected": "Selected",
            "common.item.show.all": "Show all contacts",
            "common.item.show.all.button": "Show all",
            "common.item.select.selected": "This item is already selected.",
            "common.group.select.disabled": "This group is disabled and you can not select it.",
            "common.item.add.number": "Add this phone number",
            "common.progressbar.label": "Loading, please wait..."
        }
    }*/

    var options = {
        "displayLimit": {
            "contacts": 4,
            "groups": 1,
            "smartgroups": 1
        },
        objectAdded: function(objectId) {
            $("#lastAddedId").text("Last added id: " + objectId);
            return objectId;
        },
        objectRemoved: function(objectId) {
            $("#lastRemovedId").text("Last removed id: " + objectId);
            return objectId;
        },
        "icons": {
            "contacts": "fa fa-user",
            "groups": "fa fa-group",
            "smartgroups": "fa fa-cog",
            "phone-number": "fa fa-mobile-phone"
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

        $.getScript(pathToScript, function() {
            ms.contactServiceObject = new ContactService();
            $(".img-reload-contactservice").eq(0).remove();
        }).fail(function() {
            $(".img-reload-contactservice").eq(0).remove();
            alert(onErrorText);
        });
    };

    $("select.choose-contactservice").change(function(e){
        changeScript($(e.currentTarget).val(), "An error has occurred while changing contact database!");
    });
});
