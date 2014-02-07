$(document).ready(function() {
    "use strict";
    var defaultResultsValue = ms.results;
    var helpers = ms.getHelperFunctions();

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
        var createdGroupElement = helpers.createGroupElement(helpers.getGroupingByName('contacts'));

        equal(createdGroupElement.html(), "<span>contacts</span><ul><li class=\"multiselector-list-item\">Alicia</li><li class=\"multiselector-list-item\">Dominic</li><li class=\"multiselector-list-item\">Emily</li><li class=\"multiselector-list-item\">Felix</li></ul>");
        equal(createdGroupElement[0].nodeName, "LI");
        notEqual(createdGroupElement.find("ul").html(), null);
    });

    helpers.clearList();
    test("clearList()", function() {
        equal($(".multiselector-results").html(), "<ul></ul>");
    });

    //Restore defualt value
    ms.results = defaultResultsValue;
});
