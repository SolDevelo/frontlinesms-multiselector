$(document).ready(function() {
    "use strict";
    var defaultResultsValue=ms.results;

    test("getFilteredMatches(\"\", \'\') - whole database", function() {
        ms.results = contactService.getFilteredMatches("", '');
        equal(ms.getGroupingByName('contacts').members.length , 10);
        equal(ms.getGroupingByName('groups').members.length, 2);
        equal(ms.getGroupingByName('smartgroups').members.length, 2);
    });

    test("getFilteredMatches(\"\", \'朴\') - non-latin characters", function() {
        ms.results = contactService.getFilteredMatches("", '朴');
        equal(ms.getGroupingByName('contacts').members.length , 1);
        equal(ms.getGroupingByName('groups'), null);
        equal(ms.getGroupingByName('smartgroups'), null);
    });

    test("getFilteredMatches(\"\", \'i\') - latin characters", function() {
        ms.results = contactService.getFilteredMatches("", 'i');
//        alert(ms.getGroupingByName('contacts'));
        equal(ms.getGroupingByName('contacts').members.length , 7);
        equal(ms.getGroupingByName('groups').members.length, 1);
        equal(ms.getGroupingByName('smartgroups').members.length, 1);
    });

    test("createGroupChildElement(\"42\", {name: \"John Doe\"})", function() {
        equal(ms.createGroupChildElement("42", {name: "John Doe"})[0].nodeName, "LI");
        equal(ms.createGroupChildElement("42", {name: "John Doe"}).html(), "John Doe");
    });

    test("createGroupElement('contacts')", function() {
        ms.results = contactService.getFilteredMatches("", 'i');
        var createdGroupElement = ms.createGroupElement(ms.getGroupingByName('contacts'));
        equal(createdGroupElement.html(), "<span>contacts</span><ul><li class=\"multiselector-list-item\">Alicia</li><li class=\"multiselector-list-item\">Dominic</li><li class=\"multiselector-list-item\">Emily</li><li class=\"multiselector-list-item\">Felix</li></ul>");
        equal(createdGroupElement[0].nodeName, "LI");
        notEqual(createdGroupElement.find("ul").html(), null);
    });

    ms.clearList();
    test("clearList()", function() {
        equal($(".multiselector-results").html(), "<ul></ul>");
    });

    //Restore defualt value
    ms.results=defaultResultsValue;
});
