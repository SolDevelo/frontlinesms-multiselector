$(document).ready(function() {
    "use strict";
    var defaultResultsValue = ms.results;
    var helpers = ms.getHelperFunctions();

    //1
    test("getFilteredMatches(\"\",\"\") - whole database", function() {
        ms.results = contactServiceMaster.getFilteredMatches("","");

        equal((ms.results["contacts"].members.length > 0), true, "Found items in contacts");
        equal((ms.results["groups"].members.length > 0), true, "Found items in groups");
        equal((ms.results["smartgroups"].members.length > 0), true, "Found items in smartgroups");
    });

    //2
    test("getFilteredMatches(\"\", \'朴\') - non-latin characters", function() {
        ms.results = contactServiceMaster.getFilteredMatches("", '朴');

        equal((ms.results["contacts"].members.length > 0), true, "Found contact with 朴 character.");
        equal((ms.results["groups"].members.length > 0), false, "Found groups with 朴 character.");
        equal((ms.results["smartgroups"].members.length > 0), false, "Found smartgroups with 朴 character.");
    });

    //3
    test("getFilteredMatches(\"\", \'i\') - latin characters", function() {
        ms.results = contactServiceMaster.getFilteredMatches("", 'i');

        equal((ms.results["contacts"].members.length > 0), true, "Found contacts with 'i' character.");
        equal((ms.results["groups"].members.length > 0), true, "Found groups with 'i' character.");
        equal((ms.results["smartgroups"].members.length > 0), true, "Found smartgroups with 'i' character.");
    });

    //4
    test("createGroupChildElement({name: \"John Doe\", id: \"contact-700\", metadata: \"+123456789\"})", function() {
        equal(helpers.createGroupChildElement({name: "John Doe", id: "contact-700", metadata: "+123456789"})[0].nodeName, "A", "Proper node used");
        equal(helpers.createGroupChildElement({name: "John Doe", id: "contact-700", metadata: "+123456789"}).text(), "John Doe+123456789", "Proper element value");
    });

    //5
    test("createGroupElement('contacts')", function() {
        ms.results = contactServiceMaster.getFilteredMatches("", 'i');
        var createdGroupElement = helpers.createGroupElement("contacts", 4);

        equal(createdGroupElement[0].nodeName, "LI", "Proper node used");
    });

    //6
    test("clearList()", function() {
        helpers.clearList();
        equal($(".multiselector-results1").html(), "", "Test clearing matches list");
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
        equal(selectionList.html(), "<div class=\"input-group\">x<div class=\"input-group-btn input-group-btn-first\"></div></div>", "Proper class member and value");
        equal(selectionList[0].nodeName, "UL", "Proper node used");
    });

    //9
    test("createSelectedItem(\"Annie\", \"contacts\", true)", function() {
        helpers.createSelectedItem("Annie", "contacts", true);
        var selectedItem = $(".token.multiselector-selected-item1").eq(-1);
        equal(selectedItem.hasClass('contacts'), true, "Proper class member");
        equal($(selectedItem)[0].nodeName, "DIV", "Proper node used");
        equal(selectedItem.text(), "Annie×", "Proper value");
        selectedItem.find(".close").trigger("click").trigger("click");
    });

    //10
    //Commenting out, because there's no reliable way to test it
    //
    /*test("addSelectedItem() and deleteSelection()", function() {
        var input = $(".token-input");
        var keyEvent = jQuery.Event("keyup");

        input.val("alicia");

        keyEvent.which = 65;
        input.trigger(keyEvent);

        var tokenCount = $(".token").length;

        equal(($(".multiselector-list-item").length > 1), true, "Found elements for \"alicia\"");
        $(".multiselector-list-item").eq(0).trigger("click");
        equal($(".token").length, tokenCount + 1, "One element selected");
        equal(ms.selected.length, tokenCount + 1, "Check is it go to selected array");
        $(".token").eq(-1).find(".close").trigger("click").trigger("click");
        equal(ms.selected.length, tokenCount, "Check is it removed successfully deleted from selected array");
        equal($(".token").length, tokenCount, "Check if selection exist");

        input.val("");
        keyEvent.which = 8;
        input.trigger(keyEvent);
    });*/

    //11
    test("Adding phone number to the selection", function() {
        var tokenCount = $(".token.multiselector-selected-item1").length;

        helpers.addStringLiteral("+112");
        equal($(".token.multiselector-selected-item1").length, tokenCount + 1, "Adding number +112");
        equal($(".token.multiselector-selected-item1").eq(-1).text(), "+112×", "Proper number visible");
        equal(ms.selected.length, tokenCount + 1, "Is added to selected array?");
        $(".token.multiselector-selected-item1").eq(-1).find(".close").trigger("click").trigger("click");
        equal(ms.selected.length, tokenCount, "Is deleted from selected array?");
        equal($(".token.multiselector-selected-item1").length, tokenCount, "Check if number selection exist");
    });

    //12
    test("Loading selected users by given array of ID", function() {
        var exampleIdArray = ["contact-7", "contact-69", "hello", "group-2", "smartgroup-1", "112", "+113"];
        var selected = helpers.getSelectionByIDs(exampleIdArray);

        equal(selected.length, 3, "Check for size of returned array by getSelectionByIDs(...)");
        equal(ms.selected.length, $(".token.multiselector-selected-item1").length, "Check for real size of selected array is equal to count of elements representing selection.");
    });

    //13
    test("Testing global method addObject(...)", function() {
        var isAdded = ms.addObject("contact-4");
        var callbackResult = ms.options.objectAdded("contact-4");

        equal(isAdded, true, "Is addObject(...) working?");
        equal(callbackResult, "contact-4", "Does objectAdded(...) return a valid result?");
        $(".token").eq(-1).find(".close").trigger("click").trigger("click");
    });

    //14
    test("Testing global method removeObject(...)", function() {
        var callbackResult = ms.options.objectRemoved("110");
        var isRemoved = ms.removeObject("110");

        equal(isRemoved, true, "Is removeObject(...) working?");
        equal(callbackResult, "110", "Does objectRemoved(...) return a valid result?");
    });

    //15
    test("Testing addObject() with disabled parameter.", function() {
        var countOfDisabledObjects = $(".token.disabled").length;
        ms.addObject("123456", true);
        ms.addObject("contact-1", true);
        equal($(".token.disabled").length, countOfDisabledObjects + 2, "Check for existence disabled selection(123456, Alice).");
    });

    //Restore defualt value
    ms.results = defaultResultsValue;
});
