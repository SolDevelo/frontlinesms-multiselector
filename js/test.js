$(document).ready(function() {
    "use strict";
    var defaultResultsValue = ms.results;
    var helpers = ms.getHelperFunctions();
    var defaultTranslation = ms.translations;

    //1
    test("getFilteredMatches(\"\",\"\") - whole database", function() {
        ms.results = contactService.getFilteredMatches("","");

        equal(helpers.getGroupingByName('Contacts').members.length , 13, "Found proper number of matching items in contacts");
        equal(helpers.getGroupingByName('Groups').members.length, 3, "Found proper number of matching items in groups");
        equal(helpers.getGroupingByName('Smart Groups').members.length, 2, "Found proper number of matching items in smartgroups");
    });

    //2
    test("getFilteredMatches(\"\", \'朴\') - non-latin characters", function() {
        ms.results = contactService.getFilteredMatches("", '朴');

        equal(helpers.getGroupingByName('Contacts').members.length , 1, "Found proper number of matching items in contacts");
        equal(helpers.getGroupingByName('Groups'), null, "Found proper number of matching items in groups");
        equal(helpers.getGroupingByName('Smart Groups'), null, "Found proper number of matching items in smartgroups");
    });

    //3
    test("getFilteredMatches(\"\", \'i\') - latin characters", function() {
        ms.results = contactService.getFilteredMatches("", 'i');

        equal(helpers.getGroupingByName('Contacts').members.length , 9, "Found proper number of matching items in contacts");
        equal(helpers.getGroupingByName('Groups').members.length, 2, "Found proper number of matching items in groups");
        equal(helpers.getGroupingByName('Smart Groups').members.length, 1, "Found proper number of matching items in smartgroups");
    });

    //4
    test("createGroupChildElement(\"42\", {name: \"John Doe\", id: \"contact-700\", metadata: \"+123456789\"})", function() {
        equal(helpers.createGroupChildElement("42", {name: "John Doe", id: "contact-700", metadata: "+123456789"})[0].nodeName, "LI", "Proper node used");
        equal(helpers.createGroupChildElement("42", {name: "John Doe", id: "contact-700", metadata: "+123456789"}).text(), "John Doe", "Proper element value");
    });

    //5
    test("createGroupElement('contacts')", function() {
        ms.results = contactService.getFilteredMatches("", 'i');
        var createdGroupElement = helpers.createGroupElement(helpers.getGroupingByName('Contacts'), 4);

        equal(createdGroupElement.html(), "<span>Contacts</span><ul><li class=\"multiselector-list-item\">Alicia</li><li class=\"multiselector-list-item\">Dominic</li><li class=\"multiselector-list-item\">Emily</li><li class=\"multiselector-list-item\">Felix</li><li class=\"multiselector-item-limit-info multiselector-list-item\">Showing 4 out of 9 matches</li></ul>");
        equal(createdGroupElement[0].nodeName, "LI", "Proper node used");
        notEqual(createdGroupElement.find("ul").html(), null, "List should be filled");
    });

    //6
    test("clearList()", function() {
        helpers.clearList();
        equal($(".multiselector-results").html(), "<ul></ul>", "Test clearing matches list");
    });

    //7
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

    //8
    test("createSelectionList(\"x\")", function() {
        var selectionList = helpers.createSelectionList("x");
        equal(selectionList.html(), "<li class=\"multiselector-new-item\">x</li>", "Proper class member and value");
        equal(selectionList[0].nodeName, "UL", "Proper node used");
    });

    //9
    test("createSelectedItem(\"Annie\")", function() {
        var selectedItem = helpers.createSelectedItem("Annie");
        equal(selectedItem.hasClass('multiselector-selected-item'), true, "Proper class member");
        equal($(selectedItem)[0].nodeName, "LI", "Proper node used");
        equal(selectedItem.text(), "Annie", "Proper value");
    });

    //10
    test("addSelectedItem() and deleteClickedSelection()", function() {
        var input = $(".multiselector-input");
        var keyEvent = jQuery.Event("keyup");

        input.val("alicia");

        keyEvent.which = 65;
        input.trigger(keyEvent);

        equal($(".multiselector-list-item").length, 1, "One element found for \"alicia\"");
        $(".multiselector-list-item").trigger("click");
        equal($(".multiselector-selected-item").length, 5, "One element selected");
        equal(ms.selected.length, 5, "Check is it go to selected array");
        $(".multiselector-selected-item").eq(-1).trigger("click");
        equal(ms.selected.length, 4, "Check is it removed successfully deleted from selected array");
        equal($(".multiselector-selected-item").length, 4, "Check if selection exist");

        input.val("");
        keyEvent.which = 8;
        input.trigger(keyEvent);
    });

    //11
    test("Adding phone number to the selection", function() {
        helpers.addPhoneNumber("+112");
        equal($(".multiselector-selected-item").length, 5, "Adding number +112");
        equal($(".multiselector-selected-item").eq(-1).text(), "+112", "Proper number visible");
        equal(ms.selected.length, 5, "Is added to selected array?");
        $(".multiselector-selected-item").eq(-1).trigger("click");
        equal(ms.selected.length, 4, "Is deleted from selected array?");
        equal($(".multiselector-selected-item").length, 4, "Check if number selection exist");
    });

    //12
    test("Loading selected users by given array of ID", function() {
        var exampleIdArray = ["contact-7", "contact-69", "hello", "group-2", "smartgroup-1", "112", "+113"];
        var selected = helpers.getSelectionByIDs(exampleIdArray);

        equal(selected.length, 3, "Check for size of returned array by getSelectionByIDs(...)");
        equal(ms.selected.length, 4, "Check for real size of selected array");
        equal($(".multiselector-selected-item").length, 4, "Check selection for being available for user")
    });


    //13
    test("Testing global method addObject(...)", function() {
        var newContact = ms.addObject("{\"name\": \"Darth Lech\",\"id\": \"contact-12345\",\"metadata\": \"+88230987654\"}");
        var callbackResult = ms.options.objectAdded("contact-12345");

        equal(newContact.text(), "Darth Lech", "Is addObject(...) working?");
        equal(callbackResult, "contact-12345");

        newContact.click();
    });

    //Restore defualt value
    ms.results = defaultResultsValue;
});
