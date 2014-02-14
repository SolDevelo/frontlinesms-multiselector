$(document).ready(function() {
    "use strict";
    var defaultResultsValue = ms.results;
    var helpers = ms.getHelperFunctions();
    var defaultTranslation = ms.translations;

    test("getFilteredMatches(\"\", \'\') - whole database", function() {
        ms.results = contactService.getFilteredMatches("", '');

        equal(helpers.getGroupingByName('contacts').members.length , 10, "Found proper number of matching items in contacts");
        equal(helpers.getGroupingByName('groups').members.length, 2, "Found proper number of matching items in groups");
        equal(helpers.getGroupingByName('smartgroups').members.length, 2, "Found proper number of matching items in smartgroups");
    });

    test("getFilteredMatches(\"\", \'朴\') - non-latin characters", function() {
        ms.results = contactService.getFilteredMatches("", '朴');

        equal(helpers.getGroupingByName('contacts').members.length , 1, "Found proper number of matching items in contacts");
        equal(helpers.getGroupingByName('groups'), null, "Found proper number of matching items in groups");
        equal(helpers.getGroupingByName('smartgroups'), null, "Found proper number of matching items in smartgroups");
    });

    test("getFilteredMatches(\"\", \'i\') - latin characters", function() {
        ms.results = contactService.getFilteredMatches("", 'i');

        equal(helpers.getGroupingByName('contacts').members.length , 7, "Found proper number of matching items in contacts");
        equal(helpers.getGroupingByName('groups').members.length, 1, "Found proper number of matching items in groups");
        equal(helpers.getGroupingByName('smartgroups').members.length, 1, "Found proper number of matching items in smartgroups");
    });

    test("createGroupChildElement(\"42\", {name: \"John Doe\"})", function() {
        equal(helpers.createGroupChildElement("42", {name: "John Doe"})[0].nodeName, "LI", "Proper node used");
        equal(helpers.createGroupChildElement("42", {name: "John Doe"}).text(), "John Doe", "Proper element value");
    });

    test("createGroupElement('contacts')", function() {
        ms.results = contactService.getFilteredMatches("", 'i');
        var createdGroupElement = helpers.createGroupElement(helpers.getGroupingByName('contacts'), 4);

        equal(createdGroupElement.html(), "<span>contacts</span><ul><li class=\"multiselector-list-item\">Alicia</li><li class=\"multiselector-list-item\">Dominic</li><li class=\"multiselector-list-item\">Emily</li><li class=\"multiselector-list-item\">Felix</li><li class=\"multiselector-item-limit-info\">Showing 4 out of 7 matches</li></ul>");
        equal(createdGroupElement[0].nodeName, "LI", "Proper node used");
        notEqual(createdGroupElement.find("ul").html(), null, "List should be filled");
    });

    test("clearList()", function() {
        helpers.clearList();
        equal($(".multiselector-results").html(), "<ul></ul><div class=\"showAllContacts\">Show all contacts</div>", "Test clearing matches list");
    });

    test("Translation test", function() {
        //lack of user defined translation
        var translationBackup = ms.translations;
        ms.translations = null;
        equal(helpers.getMessage("common.item.limit.label"), "Showing %s out of %s matches","Test default translation");

        //non-existing item in user-defined translation
        ms.translations = {"en_US":{"label":"non-exist"}};
        equal(helpers.getMessage("common.item.limit.label"), "Showing %s out of %s matches",
            "If not found in custom translation");

        //using user-defined translation
        ms.translations = {"en_US":{"common.item.limit.label":"My Translation"}};
        equal(helpers.getMessage("common.item.limit.label"), "My Translation", "Proper custom translation");

        ms.translations = translationBackup;
    });

    test("createSelectionList(\"x\")", function() {
        var selectionList = helpers.createSelectionList("x");
        equal(selectionList.html(), "<li class=\"multiselector-new-item\">x</li>", "Proper class member and value");
        equal(selectionList[0].nodeName, "UL", "Proper node used");
    });

    test("createSelectedItem(\"Annie\")", function() {
        var selectedItem = helpers.createSelectedItem("Annie");
        equal(selectedItem.hasClass('multiselector-selected-item'), true, "Proper class member");
        equal($(selectedItem)[0].nodeName, "LI", "Proper node used");
        equal(selectedItem.text(), "Annie", "Proper value");
    });

    test("addSelectedItem() and deleteClickedSelection()", function() {
        var input = $(".multiselector-input");
        var keyEvent = jQuery.Event("keyup");

        input.val("alicia");

        keyEvent.which = 65;
        input.trigger(keyEvent);

        equal($(".multiselector-list-item").length, 1, "One element found for \"alicia\"");
        $(".multiselector-list-item").trigger("click");
        equal($(".multiselector-selected-item").length, 1, "One element selected");
        equal(ms.selected.length, 1, "Check is it go to selected array");
        $(".multiselector-selected-item").trigger("click");
        equal(ms.selected.length, 0, "Check is it removed successfully deleted from selected array");
        equal($(".multiselector-selected-item").length, 0, "Check if selection exist");

        input.val("");
        keyEvent.which = 8;
        input.trigger(keyEvent);
    });

    test("Adding phone number to the selection", function() {
        helpers.addPhoneNumber("+112");
        equal($(".multiselector-selected-item").length, 1, "Adding number +112");
        equal($(".multiselector-selected-item").text(), "+112", "Proper number visible");
        equal(ms.selected.length, 1, "Is added to selected array?");
        $(".multiselector-selected-item").trigger("click");
        equal(ms.selected.length, 0, "Is deleted from selected array?");
        equal($(".multiselector-selected-item").length, 0, "Check if number selection exist");
    });

    //Restore defualt value
    ms.results = defaultResultsValue;
});
