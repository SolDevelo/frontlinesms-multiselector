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
        equal(helpers.createGroupChildElement("42", {name: "John Doe", id: "contact-700", metadata: "+123456789"})[0].nodeName, "A", "Proper node used");
        equal(helpers.createGroupChildElement("42", {name: "John Doe", id: "contact-700", metadata: "+123456789"}).text(), "John Doe+123456789", "Proper element value");
    });

    //5
    test("createGroupElement('contacts')", function() {
        ms.results = contactService.getFilteredMatches("", 'i');
        var createdGroupElement = helpers.createGroupElement(helpers.getGroupingByName('Contacts'), 4);

        equal(createdGroupElement.find("a").attr("role"), "menuitem");
        equal(createdGroupElement[0].nodeName, "LI", "Proper node used");
        notEqual(createdGroupElement.find("li").html(), null, "List should be filled");
    });

    //6
    test("clearList()", function() {
        helpers.clearList();
        equal($(".multiselector-results").html(), "", "Test clearing matches list");
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
        equal(selectionList.html(), "<div class=\"input-group\">x<div class=\"input-group-btn\"></div></div>", "Proper class member and value");
        equal(selectionList[0].nodeName, "UL", "Proper node used");
    });

    //9
    test("createSelectedItem(\"Annie\", \"contacts\", true)", function() {
        helpers.createSelectedItem("Annie", "contacts", true);
        var selectedItem = $(".token").eq(-1);
        equal(selectedItem.hasClass('contacts'), true, "Proper class member");
        equal($(selectedItem)[0].nodeName, "DIV", "Proper node used");
        equal(selectedItem.text(), "Annie×", "Proper value");
        selectedItem.find(".close").trigger("click").trigger("click");
    });

    //10
    test("addSelectedItem() and deleteSelection()", function() {
        var input = $(".token-input");
        var keyEvent = jQuery.Event("keyup");

        input.val("alicia");

        keyEvent.which = 65;
        input.trigger(keyEvent);

        equal($(".multiselector-list-item").length, 2, "One element found for \"alicia\"");
        $(".multiselector-list-item").trigger("click");
        equal($(".token").length, 5, "One element selected");
        equal(ms.selected.length, 5, "Check is it go to selected array");
        $(".token").eq(-1).find(".close").trigger("click").trigger("click");
        equal(ms.selected.length, 4, "Check is it removed successfully deleted from selected array");
        equal($(".token").length, 4, "Check if selection exist");

        input.val("");
        keyEvent.which = 8;
        input.trigger(keyEvent);
    });

    //11
    test("Adding phone number to the selection", function() {
        helpers.addPhoneNumber("+112");
        equal($(".token").length, 5, "Adding number +112");
        equal($(".token").eq(-1).text(), "+112×", "Proper number visible");
        equal(ms.selected.length, 5, "Is added to selected array?");
        $(".token").eq(-1).find(".close").trigger("click").trigger("click");
        equal(ms.selected.length, 4, "Is deleted from selected array?");
        equal($(".token").length, 4, "Check if number selection exist");
    });

    //12
    test("Loading selected users by given array of ID", function() {
        var exampleIdArray = ["contact-7", "contact-69", "hello", "group-2", "smartgroup-1", "112", "+113"];
        var selected = helpers.getSelectionByIDs(exampleIdArray);

        equal(selected.length, 3, "Check for size of returned array by getSelectionByIDs(...)");
        equal(ms.selected.length, 4, "Check for real size of selected array");
        equal($(".token").length, 4, "Check selection for being available for user");
    });

    //13
    test("Testing global method addObject(...)", function() {
        var isAdded = ms.addObject("contact-4");
        var callbackResult = ms.options.objectAdded("contact-4");

        equal(isAdded, true, "Is addObject(...) working?");
        equal(callbackResult, "contact-4");
        $(".token").eq(-1).find(".close").trigger("click").trigger("click");
    });

    //Restore defualt value
    ms.results = defaultResultsValue;
});
