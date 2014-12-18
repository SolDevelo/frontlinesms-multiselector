$(document).ready(function() {
    "use strict";

    var options = {
        "displayLimit": {
            "contacts": 4,
            "groups": 1,
            "smartgroups": 1
        },
        "icons": {
            "contacts": "fa fa-user",
            "groups": "fa fa-group",
            "smartgroups": "fa fa-cog",
            "phone-number": "fa fa-mobile-phone"
        }
    };

    var optionsWithAddedAndRemoved = {
        "displayLimit": {
            "contacts": 4,
            "groups": 1,
            "smartgroups": 1
        },
        "icons": {
            "contacts": "fa fa-user",
            "groups": "fa fa-group",
            "smartgroups": "fa fa-cog",
            "phone-number": "fa fa-mobile-phone"
        },
        "language": "en_US",
        objectAdded: function(objectId) {
            $("#lastAddedId").text("Last added id: " + objectId);
            return objectId;
        },
        objectRemoved: function(objectId) {
            $("#lastRemovedId").text("Last removed id: " + objectId);
            return objectId;
        }
    };

    var optionsSport = {
        "displayLimit": {
            "basketballTeams": 2,
            "footballTeams": 2,
            "handballTeams": 2,
            "rugbyTeams":2
        },
        "icons": {
            "basketballTeams": "fa fa-dribbble",
            "footballTeams": "fa fa-circle",
            "handballTeams": "fa fa-thumbs-up",
            "rugbyTeams": "fa fa-eye",
            "phone-number": "fa fa-mobile-phone"
        }
    };

    var translations = {
        "en_US": {
            "common.item.limit.label": "Showing %s out of %s matches",
            "common.item.selected": "Selected",
            "common.item.show.all": "Show all contacts",
            "common.item.show.all.button": "Show all",
            "common.item.select.selected": "This item is already selected.",
            "common.group.select.disabled": "This group is disabled and you can not select it.",
            "common.item.add.number": "Add this phone number",
            "common.progressbar.label": "Loading, please wait..."
        },

        "pl": {
            "common.item.limit.label": "Pokazano %s z %s dopasowań",
            "common.item.selected": "Wybrano",
            "common.item.show.all": "Pokaż wszystkie kontakty",
            "common.item.show.all.button": "Pokaż wszystko",
            "common.item.select.selected": "Ta pozycja jest już wybrana,",
            "common.group.select.disabled": "Ta grupa jest nieaktywna, nie możesz jej wybrać.",
            "common.item.add.number": "Dodaj ten numer telefonu",
            "common.progressbar.label": "Ładowanie, proszę czekać..."
        }
    };

    var preloadedIDs = ["contact-6", "contact-10", "110", "+48987654321", "smartgroup-2"];

    $("div#containerMaster").multiselect(options, translations, null, contactServiceMaster, "1");
    var msPreloaded = $("div#containerPreloaded").multiselect(options, translations, preloadedIDs, contactServiceMaster, "2");
    msPreloaded.addObject("123456", true);
    msPreloaded.addObject("777888999", false);
    msPreloaded.addObject("contact-1", true);
    $("div#containerAddedAndRemoved").multiselect(optionsWithAddedAndRemoved, translations, null, contactServiceMaster, "3");
    $("div#containerBigger").multiselect(options, translations, preloadedIDs, contactService10k, "4");
    $("div#containerSports").multiselect(optionsSport, translations, null, contactServiceSportsTeams, "5");

    /*
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
    */
});
