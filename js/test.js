$(document).ready(function() {
    "use strict";
    var defaultResultsValue = ms.results;
    var helpers = ms.getHelperFunctions();
    var defaultTranslation = ms.translations;

    test("getFilteredMatches(\"\", \'\') - whole database", function() {
        ms.results = contactService.getFilteredMatches("", '');

        equal(helpers.getGroupingByName('contacts').members.length , 10);
        equal(helpers.getGroupingByName('groups').members.length, 2);
        equal(helpers.getGroupingByName('smartgroups').members.length, 2);
    });

    test("getFilteredMatches(\"\", \'朴\') - non-latin characters", function() {
        ms.results = contactService.getFilteredMatches("", '朴');

        equal(helpers.getGroupingByName('contacts').members.length , 1);
        equal(helpers.getGroupingByName('groups'), null);
        equal(helpers.getGroupingByName('smartgroups'), null);
    });

    test("getFilteredMatches(\"\", \'i\') - latin characters", function() {
        ms.results = contactService.getFilteredMatches("", 'i');

        equal(helpers.getGroupingByName('contacts').members.length , 7);
        equal(helpers.getGroupingByName('groups').members.length, 1);
        equal(helpers.getGroupingByName('smartgroups').members.length, 1);
    });

    test("createGroupChildElement(\"42\", {name: \"John Doe\"})", function() {
        equal(helpers.createGroupChildElement("42", {name: "John Doe"})[0].nodeName, "LI");
        equal(helpers.createGroupChildElement("42", {name: "John Doe"}).html(), "John Doe");
    });

    test("createGroupElement('contacts')", function() {
        ms.results = contactService.getFilteredMatches("", 'i');
        var createdGroupElement = helpers.createGroupElement(helpers.getGroupingByName('contacts'), 4);

        equal(createdGroupElement.html(), "<span>contacts</span><ul><li class=\"multiselector-list-item\">Alicia</li><li class=\"multiselector-list-item\">Dominic</li><li class=\"multiselector-list-item\">Emily</li><li class=\"multiselector-list-item\">Felix</li><li class=\"multiselector-item-limit-info\">Showing 4 out of 7 matches</li></ul>");
        equal(createdGroupElement[0].nodeName, "LI");
        notEqual(createdGroupElement.find("ul").html(), null);
    });

    test("clearList()", function() {
        helpers.clearList();
        equal($(".multiselector-results").html(), "<ul></ul>");
    });

    test("Translation test", function() {
        //lack of user defined translation
        var translationBackup = ms.translations;
        ms.translations = null;
        equal(helpers.getMessage("common.item.limit.label"), "Showing %s out of %s matches");

        //non-existing item in user-defined translation
        ms.translations = {"en_US":{"label":"non-exist"}};
        equal(helpers.getMessage("common.item.limit.label"), "Showing %s out of %s matches");

        //using user-defined translation
        ms.translations = {"en_US":{"common.item.limit.label":"My Translation"}};
        equal(helpers.getMessage("common.item.limit.label"), "My Translation");
        
        ms.translations = translationBackup;
    });

    //Restore defualt value
    ms.results = defaultResultsValue;
});
