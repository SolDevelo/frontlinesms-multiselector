/*

 The MIT License (MIT)

 Copyright (c) 2014 SolDevelo

 Permission is hereby granted, free of charge, to any person obtaining a copy of
 this software and associated documentation files (the "Software"), to deal in
 the Software without restriction, including without limitation the rights to
 use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 the Software, and to permit persons to whom the Software is furnished to do so,
 subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 */

(function($) {
    "use strict";

    $.fn.multiselect = function(options, translations, defaultSelection, contactServiceObj) {
        // currently selected element === this
        // assigning it to a variable for use in inline functions
        var currentElement = this;
        var defaultOptions = {
            minResultsHeight: 300,
            contactItemDisplayLimit: 15,
            groupItemDisplayLimit: 5,
            smartgroupItemDisplayLimit: 5,
            objectAdded: null,
            objectRemoved: null,
            language: "en_US",
            icons: {
                "contacts": "fa fa-user",
                "groups": "fa fa-group",
                "smartgroups": "fa fa-filter",
                "phone-number": "fa fa-mobile-phone"
            }
        };

        var constants = {
            groupingNames: {
                contacts: 'Contacts',
                groups: 'Groups',
                smartgroups: 'Smart Groups'
            },
            regExPatterns: {
                phoneNumber: /^\+?\d+$/g
            }
        };

        var properties = {
            "showAll": {
                "contacts": false,
                "groups": false,
                "smartgroups": false,
                "selected": false
            }
        };

        var duplicatePolicy = null;

        var multiSelector = {
            version: "0.5-SNAPSHOT",
            targetElement: currentElement,
            options: {},
            selected: {},
            results: {},
            previousText: "",
            defaultTranslations: {
                "en_US": {
                    "common.item.limit.label": "Showing %s out of %s matches",
                    "common.item.selected": "Selected",
                    "common.item.show.all": "Show all contacts",
                    "common.item.show.all.button": "Show all",
                    "common.item.select.selected": "This item is already selected.",
                    "common.group.select.disabled": "This group is disabled and you can not select it.",
                    "common.item.add.number": "Add this phone number"
                }
            },
            translations: (translations === undefined) ? null : translations,
            contactServiceObject: contactServiceObj
        };

        var helpers = {
            parseOptions: function(options, defaultOptions) {
                if (!options) {
                    return defaultOptions;
                }

                for (var key in defaultOptions) {
                    if (!defaultOptions.hasOwnProperty(key)) {
                        continue;
                    }

                    if (!options.hasOwnProperty(key)) {
                        options[key] = defaultOptions[key];
                    }

                    if (options[key] && options[key].constructor === Object) {
                        for (var key2 in defaultOptions[key]) {
                            if (!defaultOptions[key].hasOwnProperty(key2)) {
                                continue;
                            }

                            if (!options[key].hasOwnProperty(key2)) {
                                options[key][key2] = defaultOptions[key][key2];
                            }
                        }
                    }
                }

                return options;
            },
            getGroupingByName: function(name) {
                var grouping = null;
                if (multiSelector.results.length) {
                    for (var i = 0; i < multiSelector.results.length; i++) {
                        if (multiSelector.results[i].displayName === name) {
                            return multiSelector.results[i];
                        }
                    }
                }
                return grouping;
            },
            createGroupChildElement: function(group, child) {
                if (child === undefined || child === null) {
                    return null;
                }

                var itemNameElement = $(document.createElement("span"))
                    .addClass("multiselector-list-item-name")
                    .text(child.name);
                var itemMetadataElement = $(document.createElement("span"))
                    .addClass("multiselector-list-item-metadata")
                    .text(child.metadata);
                var childElement = $(document.createElement("a"))
                    .addClass("multiselector-list-item")
                    .attr("href", "#")
                    .attr("role", "menuitem")
                    .mouseenter(function(event) {
                        $(".highlight").removeClass("highlight");
                        $(event.currentTarget).addClass("highlight");
                    })
                    .append(itemNameElement)
                    .append(itemMetadataElement);

                if($.inArray(child.id, helpers.getSelectedIDs().split(",")) !== -1) {
                    childElement.addClass("selected");
                    itemMetadataElement.text(helpers.getMessage("common.item.selected"));
                    childElement.attr("title", helpers.getMessage("common.item.select.selected"));
                }

                if (child.disabled !== undefined && child.disabled === true) {
                    childElement.addClass("disabled");
                    childElement.attr("title", helpers.getMessage("common.group.select.disabled"));
                    return childElement;
                }

                if (child.memberCount !== undefined) {
                    childElement.attr("data-member-count", child.memberCount);
                }

                childElement.click(helpers.addSelectedItem);
                return childElement;
            },
            createGroupElement: function(group, limit, showAll) {
                if (showAll === undefined) {
                    showAll = false;
                }
                if (group === undefined || group === null || limit < 0) {
                    return null;
                }

                var groupNameElement = $(document.createElement("span"))
                    .text(group.displayName)
                    .addClass("dropdown-header");
                var divider = $(document.createElement("li"))
                    .addClass("divider");
                var listItem = $(document.createElement("li"))
                    .append(groupNameElement);

                if (group.customCssClass !== undefined) {
                    listItem.addClass(group.customCssClass);
                    var icon = $(document.createElement("i"))
                        .addClass(multiSelector.options.icons[group.customCssClass]);
                    groupNameElement.prepend(icon);
                }

                var i;

                if (showAll) {
                    for (i = 0; i < group.members.length; i++) {
                        listItem.append(helpers.createGroupChildElement(group, group.members[i]));
                    }
                } else {
                    for (i = 0; i < group.members.length && i < limit; i++) {
                        listItem.append(helpers.createGroupChildElement(group, group.members[i]));
                    }
                    if (i === limit && group.members.length !== i) {
                        listItem.append(helpers.createItemLimitInfoElement(i, group.members.length));
                    }
                }
                listItem.append(divider);

                return listItem;
            },
            createInput: function() {
                return $(document.createElement("input"))
                    .addClass("multiselector-input form-control");
            },
            createShowAllButton: function() {
                var message = helpers.getMessage("common.item.show.all.button");
                var span = $(document.createElement("span"))
                    .addClass("caret");

                return $(document.createElement("button"))
                    .addClass("btn btn-default show-all")
                    .text(message)
                    .append(span)
                    .click(helpers.showAllContacts);
            },
            createSelectionList: function(input, showAllButton) {
                var selectionElement = $(document.createElement("ul"))
                    .addClass("multiselector-selection");
                var inputGroupButton = $(document.createElement("div"))
                    .addClass("input-group-btn")
                    .append(showAllButton);
                var inputGroup = $(document.createElement("div"))
                    .addClass("input-group");
                inputGroup.append(input);
                inputGroup.append(inputGroupButton);

                return selectionElement.append(inputGroup);
            },
            createMemberCountElement: function(count) {
                return $(document.createElement("span")).addClass("badge").text(count);
            },
            createSelectedItem: function(text, customClass, skipChecking, memberCount) {
                if (skipChecking) {
                    helpers.setAntiduplicateSelectionPolicy(false);
                } else {
                    helpers.setAntiduplicateSelectionPolicy(true);
                }
                var exists = $(".tokenfield").find(".multiselector-selected-item[data-value='" + text + "']").length;
                if (!exists) {
                    $(".multiselector-input").eq(0).tokenfield('createToken', {
                        value: text,
                        label: text
                    });
                    var token = $(".token").eq(-1);
                    if (token.attr("data-value") === text) {
                        if (!token.eq(-1).hasClass("multiselector-selected-item")) {
                            token.addClass("multiselector-selected-item");
                        }
                        token.addClass(customClass);
                        if (!token.find(".glyphicon").length) {
                            var span =  token.find(".token-label").eq(-1);
                            var icon = $(document.createElement("span"))
                                .addClass(multiSelector.options.icons[customClass]);

                            if (customClass === "groups" || customClass === "smartgroups") {
                                if (memberCount !== undefined) {
                                    span.after(helpers.createMemberCountElement(memberCount));
                                }
                            }

                            span.before(icon);
                        }
                    }
                    return true;
                }
                //Reset to default policy
                helpers.setAntiduplicateSelectionPolicy(true);
                return false;
            },
            createResultsDiv: function() {
                return $(document.createElement("ul"))
                    .addClass("multiselector-results")
                    .addClass("dropdown-menu")
                    .addClass("dropdown-toggle")
                    .addClass("hidden")
                    .attr("role", "menu")
                    .height(multiSelector.options.minResultsHeight);
            },
            clearList: function() {
                multiSelector.results.length = 0;
                $(".multiselector-results").empty();
            },
            createItemLimitInfoElement: function(count, max) {
                var message = sprintf(helpers.getMessage("common.item.limit.label") ,count, max);
                var span = $(document.createElement("span"))
                    .addClass("text-info")
                    .text(message);
                return $(document.createElement("a"))
                    .attr("href", "#")
                    .attr("role", "menuitem")
                    .addClass("multiselector-item-limit-info")
                    .addClass("multiselector-list-item")
                    .mouseenter(function(event) {
                        $(".highlight").removeClass("highlight");
                        $(event.currentTarget).addClass("highlight");
                    })
                    .click(helpers.extendSingleGrouping)
                    .append(span);
            },
            updateAllShowAllProperties: function(setAll) {
                properties.showAll.contacts = setAll;
                properties.showAll.groups = setAll;
                properties.showAll.smartgroups = setAll;
                properties.showAll.selected = setAll;
            },
            createShowAllContacts: function() {
                var message = helpers.getMessage("common.item.show.all");
                var a = $(document.createElement("a"))
                    .attr("href", "#")
                    .attr("role", "menuitem")
                    .addClass("show-all-contacts")
                    .addClass("multiselector-list-item")
                    .text(message)
                    .click(function(event) {
                        helpers.updateAllShowAllProperties(true);
                        $(".show-all").addClass("btn-primary");
                        helpers.refreshList("");
                        $(event.currentTarget).remove();
                        helpers.highlightItem();
                        $(".token-input").focus();
                    })
                    .mouseenter(function(event) {
                        $(".highlight").removeClass("highlight");
                        $(event.currentTarget).addClass("highlight");
                    });
                var li = $(document.createElement("li"))
                    .append(a);
                return $(".multiselector-results").append(li);
            },
            getMessage: function(code) {
                if (multiSelector.translations !== null &&
                    multiSelector.translations.hasOwnProperty(multiSelector.options.language) &&
                    multiSelector.translations[multiSelector.options.language].hasOwnProperty(code)) {
                    return multiSelector.translations[multiSelector.options.language][code];

                } else if (multiSelector.defaultTranslations.hasOwnProperty(multiSelector.options.language) &&
                    multiSelector.defaultTranslations[multiSelector.options.language].hasOwnProperty(code)) {

                    return multiSelector.defaultTranslations[multiSelector.options.language][code];
                }

                return sprintf("[%s]", code);
            },
            addSelectedItem: function(event) {
                var existingSelection = $(".multiselector-selected-item");

                if (existingSelection !== undefined) {
                    for (var i = 0; i < existingSelection.length; i++) {
                        if (existingSelection.eq(i).text() === $(event.currentTarget).find(".multiselector-list-item-name").text()) {
                            return;
                        }
                    }
                }

                var customClass = $(event.currentTarget).parents("li").eq(0).attr("class");
                var memberCount = $(event.currentTarget).data("member-count");

                helpers.createSelectedItem($(event.currentTarget).find(".multiselector-list-item-name").text(),
                    customClass, false, memberCount);

                for (var i = multiSelector.results.length - 1; i >= 0; i--) {
                    for (var j = 0; j < multiSelector.results[i].members.length; j++) {
                        if (multiSelector.results[i].members[j].name === $(event.currentTarget).find(".multiselector-list-item-name").text()) {
                            var objectId = multiSelector.results[i].members[j].id;
                            multiSelector.selected.push(multiSelector.results[i].members[j]);
                            multiSelector.results[i].members.splice(j, 1);

                            $(event.currentTarget).remove();
                            if ($(".show-all-contacts").length) {
                                helpers.refreshList($(".token-input").val());
                            } else {
                                helpers.refreshList("");
                            }
                            helpers.highlightItem();
                            $(".token-input").val("").focus();
                            helpers.toggleShowAllButton(false);
                            multiSelector.options.objectAdded(objectId);
                            helpers.updateInputWidth();
                            return;
                        }
                    }
                }
            },
            addPhoneNumber: function(number, selected) {
                var numberObject = {
                    name: number,
                    id: number,
                    metadata: number
                };
                if (helpers.addCustomContact(numberObject, selected, "phone-number") && multiSelector.options.objectAdded) {
                    multiSelector.options.objectAdded(numberObject.id);
                }
            },
            addPhoneNumberEvent: function(event) {
                var input = $(".token-input");
                var text = event.data.text;

                //Prevents from adding invalid number when input is manipulated by user using mouse actions cut-copy-paste
                if (text.match(constants.regExPatterns.phoneNumber) === null) {
                    $(event.currentTarget).remove();
                    input.val("");
                    helpers.hideResults();
                    return;
                }

                helpers.addPhoneNumber(text);
                $(event.currentTarget).remove();
                helpers.highlightItem();
            },
            deleteSelection: function(text) {
                for (var i = 0; i < multiSelector.selected.length; i++) {
                    if (text === multiSelector.selected[i].name) {
                        if (multiSelector.options.objectRemoved) {
                            multiSelector.options.objectRemoved(multiSelector.selected[i].id);
                        }
                        multiSelector.selected.splice(i, 1);
                        if (!$(".multiselector-results").hasClass("hidden")) {
                            if ($(".show-all-contacts").length) {
                                helpers.refreshList($(".token-input").val());
                            } else {
                                helpers.refreshList("");
                            }
                        }
                        helpers.updateInputWidth();
                        return;
                    }
                }
            },
            getSelectedIDs: function() {
                if (!multiSelector.selected.hasOwnProperty('length') || multiSelector.selected.length === 0) {
                    return "";
                }
                var selectedID = [];
                for (var i = 0; i < multiSelector.selected.length; i++) {
                    selectedID.push(multiSelector.selected[i].id);
                }
                return selectedID.toString();
            },
            populateList: function() {
                if (multiSelector.results.length) {
                    var contacts = helpers.getGroupingByName(constants.groupingNames.contacts);
                    var groups = helpers.getGroupingByName(constants.groupingNames.groups);
                    var smartgroups = helpers.getGroupingByName(constants.groupingNames.smartgroups);
                    var resultsUl = $(".multiselector-results");

                    resultsUl.append(helpers.createGroupElement(contacts, multiSelector.options.contactItemDisplayLimit, properties.showAll.contacts));
                    resultsUl.append(helpers.createGroupElement(groups, multiSelector.options.groupItemDisplayLimit, properties.showAll.groups));
                    resultsUl.append(helpers.createGroupElement(smartgroups, multiSelector.options.smartgroupItemDisplayLimit, properties.showAll.smartgroups));
                    resultsUl.scrollTop(0);
                }
            },
            toggleShowAllButton: function(show) {
                helpers.updateAllShowAllProperties(show);

                var showAllButton = $(".multiselector-selection button.show-all");
                if (show) {
                    showAllButton.addClass("btn-primary");
                    $(".multiselector-results").removeClass("hidden");
                } else {
                    showAllButton.removeClass("btn-primary");
                    helpers.hideResults();
                }
            },
            showAllContacts: function() {
                properties.showAll.contacts = true;
                properties.showAll.groups = true;
                properties.showAll.smartgroups = true;
                $('.dropdown-toggle').dropdown('toggle');
                if (!$(".multiselector-results").hasClass("hidden")) {
                    $(".multiselector-results").addClass("hidden");
                    $(".show-all").removeClass("btn-primary");
                } else {
                    properties.showAll.selected = true;
                    $(".show-all").addClass("btn-primary");
                    helpers.refreshList("");
                    $(".multiselector-results").removeClass("hidden");
                }
                $(".token-input").focus();
            },
            refreshList: function(text) {
                helpers.clearList();
                if (properties.showAll.selected) {
                    multiSelector.results = multiSelector.contactServiceObject.getAll();
                } else {
                    multiSelector.results =
                        multiSelector.contactServiceObject.getFilteredMatches(helpers.getSelectedIDs(), text);
                }
                helpers.populateList();
                if (!properties.showAll.selected) {
                    helpers.createShowAllContacts();
                }
            },
            getSelectionByIDs: function(IDs, fillList) {
                var selected = [];
                var isAddedToSelection = [];
                if (IDs && IDs.length) {
                    var contactBase = multiSelector.contactServiceObject.getAll();

                    if (contactBase) {
                        for (var i in IDs) {
                            for (var g in contactBase) {
                                var found = false;
                                for (var m in contactBase[g].members) {
                                    if (IDs[i] === contactBase[g].members[m].id) {
                                        contactBase[g].members[m].customCssClass = contactBase[g].customCssClass;
                                        selected.push(contactBase[g].members[m]);
                                        found = true;
                                        isAddedToSelection[i] = true;
                                        break;
                                    }
                                }
                                if (found) {
                                    break;
                                }
                            }
                        }
                    }

                    if (fillList) {
                        for (var i in IDs) {
                            if (!isAddedToSelection[i] && IDs[i].match(constants.regExPatterns.phoneNumber)) {
                                helpers.addPhoneNumber(IDs[i], selected);
                            }
                        }
                    }
                }
                return selected;
            },
            hideResults: function() {
                if ($(".multiselector-results").length) {
                    $(".multiselector-results").addClass("hidden");
                }
            },
            extendSingleGrouping: function(listElement) {
                if (listElement.hasOwnProperty("currentTarget")) {
                    listElement = $(listElement.currentTarget);
                    $(".token-input").focus();
                }

                var parentName = listElement.parents("li").find("span").eq(0).text();

                if(parentName === constants.groupingNames.contacts) {
                    properties.showAll.contacts = true;
                } else if(parentName === constants.groupingNames.groups) {
                    properties.showAll.groups = true;
                } else if(parentName === constants.groupingNames.smartgroups) {
                    properties.showAll.smartgroups = true;
                }

                helpers.refreshList($(".token-input").val());
                helpers.highlightItem();
            },
            highlightItem: function(lastItem) {
                var results = $(".multiselector-results").eq(0);
                var index = (lastItem === true) ? -1 : 0;
                var element = results.children().eq(index);

                $(".highlight").removeClass("highlight");

                if (element.prop("nodeName") === "LI" && $(".multiselector-list-item").length) {
                    $(".multiselector-list-item").eq(index).addClass("highlight");
                    return;
                }
                element.addClass("highlight");
            },
            addCustomContact: function(customContact, selected, customCssClass) {
                if (!customContact || !customContact.hasOwnProperty("name") || !customContact.hasOwnProperty("id") ||
                    !customContact.hasOwnProperty("metadata")) {
                    return false;
                }
                if (!selected) {
                    selected = multiSelector.selected;
                }

                for (var i = 0; i < selected.length; i++) {
                    if (selected[i].name === customContact.name) {
                        return false;
                    }
                }
                customContact.customCssClass = customCssClass;
                selected.push(customContact);
                if (helpers.createSelectedItem(customContact.name, customCssClass, true)) {
                    $(".token-input").val("").focus();
                    helpers.hideResults();
                    helpers.updateInputWidth();
                    return true;
                }
                return false;
            },
            setAntiduplicateSelectionPolicy: function(enable) {
                if (enable) {
                    duplicatePolicy = function(e) {
                        $(".token").eq(-1).addClass("multiselector-selected-item");
                        $(".token").eq(-1).addClass(e.token.customCss);
                        if ($(".highlight").length && $(".highlight").hasClass("add-phone-number")) {
                        } else if ($(".highlight").length && $(".highlight").hasClass("show-all-contacts")) {
                            $(".token").eq(-1).remove();
                        } else if ($(".highlight").length && $(".highlight").hasClass("multiselector-list-item")) {
                            if (e.token.value !== $(".highlight").find(".multiselector-list-item-name").text()) {
                                $(".token").eq(-1).remove();
                            }
                        } else {
                            $(".token").eq(-1).remove();
                        }
                    };
                } else {
                    duplicatePolicy = null;
                }
            },
            calculateStringWidth: function(str) {
                var body = $("body");
                var font = body.css("font-family");
                var str_object = $(document.createElement("div")).css({
                    "position": "absolute",
                    "float": "left",
                    "white-space": "nowrap",
                    "visibility": "hidden",
                    "font-family": font
                }).text(str).appendTo(body);
                var str_width = str_object.width();
                str_object.remove();
                return str_width;
            },
            getLastTokenLineWidth: function() {
                var wrapperWidth = $(".tokenfield").width();
                var width = 0;

                $("div.tokenfield div.token").each(function(index, element) {
                    var elementWidth = $(element).outerWidth(true);
                    width += elementWidth;
                    if (width >= wrapperWidth) {
                        width = elementWidth;
                    }
                });

                return width;
            },
            updateInputWidth: function() {
                var input = $(".token-input");
                var inputWidth = input.width();
                var parentWidth = input.parent().width();
                var text = input.val();
                var textWidth = helpers.calculateStringWidth(text);
                var lastLineWidth = helpers.getLastTokenLineWidth();
                var widthDifference = parentWidth - lastLineWidth;

                input.width(widthDifference);
                inputWidth = input.width();

                if (textWidth >= inputWidth) {
                    input.width(parentWidth);
                }
            }
        };

        multiSelector.options = helpers.parseOptions(options, defaultOptions);
        multiSelector.selected = helpers.getSelectionByIDs(defaultSelection, true);

        multiSelector.addObject = function(objectId) {
            var added = false;
            var results = multiSelector.contactServiceObject.getFilteredMatches(helpers.getSelectedIDs(), "");
            // for each grouping
            for (var i = 0; i < results.length && !added; i++) {
                for (var m = 0; m < results[i].members.length; m++) {
                    var id = results[i].members[m].id;
                    if (id === objectId) {
                        if (results[i].members[m].disabled === true) {
                            return false;
                        }

                        var contact = results[i].members[m];
                        helpers.addCustomContact(contact, null, results[i].customCssClass);
                        added = true;
                    }
                }
            }
            if (!added && objectId.match(constants.regExPatterns.phoneNumber)) {
                helpers.addPhoneNumber(objectId, this.selected);
                added = true;
            }

            if (added && this.options.objectAdded) {
                this.options.objectAdded(objectId);
            }

            return added;
        };

        multiSelector.removeObject = function(objectId) {
            for (var i = multiSelector.selected.length - 1; i >= 0; i--) {
                if (multiSelector.selected[i].id === objectId) {
                    if (multiSelector.options.objectRemoved) {
                        multiSelector.options.objectRemoved(objectId);
                    }
                    $(".token[data-value='" + multiSelector.selected[i].name + "']").remove();
                    multiSelector.selected.splice(i, 1);
                    helpers.updateInputWidth();
                    return true;
                }
            }
            return false;
        };

        // TODO : Decide if this is necessary, as it seems to be something that should be done in the ContactService itself
        /*multiSelector.toggleEnabled = function(objectId) {
            for (var i = 0; i < multiSelector.selected.length; i++) {
                if (multiSelector.selected[i].id === objectId) {
                    multiSelector.selected[i].disabled = (multiSelector.selected[i].disabled !== undefined) ?
                        !multiSelector.selected[i].disabled : true;
                    return multiSelector.selected[i].disabled;
                }
            }
            return false;
        };*/

        multiSelector.getSelectedCount = function() {
            return this.selected.length;
        };

        multiSelector.returnSelectedObjects = function() {
            return this.selected;
        };

        //Make public getGroupingByName()
        multiSelector.getHelperFunctions = function() {
            return helpers;
        };

        multiSelector.deepClean = function() {
            this.contactServiceObject = null;
            this.results = [];
            this.selected = [];
            $(".token").remove();
            $(".token-input").val("");
            multiSelector.previousText = "";

            var resultDiv = $(".multiselector-results");
            if (resultDiv.length) {
                if (!resultDiv.hasClass("hidden")) {
                    resultDiv.addClass("hidden");
                }
            }
        };

        // Function transforming the currently selected (with jQuery) element into the dropdown
        var transformElement = function() {

            var input = helpers.createInput();
            var showAllButton = helpers.createShowAllButton();
            var selection = helpers.createSelectionList(input, showAllButton);
            var results = helpers.createResultsDiv();

            input.on("tokenfield:createtoken", function(e) {
                if (duplicatePolicy) {
                    duplicatePolicy(e);
                }
                helpers.updateInputWidth();
            }).on("tokenfield:removetoken", function(e) {
                helpers.deleteSelection(e.token.value);
                helpers.updateInputWidth();
            }).tokenfield({
                minWidth: 0,
                allowEditing: false
            });

            var handleKeyUp = function(e) {
                var keyId = e.keyCode;
                input = $(".token-input");
                var text = input.val();

                if (keyId === 13 || keyId === 188) {
                    // Enter/Return and comma

                    if (text.search(",") >= 0) {
                        text = text.substring(0, text.search(","));
                        input.val(text);
                    }

                    if ((!text.length && !$(".highlight").length) || $(".multiselector-results").hasClass("hidden")) {
                        return;
                    }

                    if ($(".highlight").length) {
                        $(".highlight").eq(0).trigger("click");
                        helpers.highlightItem();
                        if (!properties.showAll.contacts && !properties.showAll.groups &&
                                !properties.showAll.smartgroups && !properties.showAll.selected) {
                            input.val("");
                            helpers.hideResults();
                            helpers.updateInputWidth();
                        }
                    }
                    input.focus();

                    multiSelector.previousText = "";
                    return;
                } else if (keyId === 9) {
                    //Handling Tab key that works for both web browsers(firefox and chrome)
                    $(".token-input").val("");
                    if (!$(".multiselector-results").hasClass("hidden")) {
                        $(".multiselector-results").addClass("hidden");
                        $(".show-all").removeClass("btn-primary");
                    }
                    return;
                } else if (keyId === 27 || keyId === 35 ||
                    keyId === 36 || keyId === 38 || keyId === 40) {
                    //Escape, Home, End, Arrow Up and Down
                    //Do nothing because they're handled on key down event
                    e.preventDefault();
                    return;
                }

                if (text !== multiSelector.previousText) {
                    helpers.updateAllShowAllProperties(false);
                    $('.dropdown-toggle').dropdown('toggle');
                    $(".show-all").removeClass("btn-primary");
                    helpers.refreshList(text);
                }

                if (!$(".add-phone-number").length && text.match(constants.regExPatterns.phoneNumber) !== null) {
                    var addNumberElement = $(document.createElement("a"))
                        .attr("href", "#")
                        .attr("role", "menuitem")
                        .addClass("add-phone-number")
                        .addClass("multiselector-list-item")
                        .click({ text: text }, helpers.addPhoneNumberEvent)
                        .mouseenter(function(event) {
                            $(".highlight").removeClass("highlight");
                            $(event.currentTarget)
                                .addClass("highlight");
                        })
                        .text(helpers.getMessage("common.item.add.number"));

                    var divider = $(document.createElement("li"))
                        .addClass("divider");
                    var li = $(document.createElement("li"))
                        .append(addNumberElement)
                        .append(divider);

                    $(".multiselector-results").prepend(li);
                } else if ($(".add-phone-number").length && text.match(constants.regExPatterns.phoneNumber) === null) {
                    $(".add-phone-number").eq(0).remove();
                }

                if (text.length > 0  && results.hasClass('hidden')) {
                    results.removeClass('hidden');
                } else if (!text.length) {
                    results.addClass('hidden');
                    $(".multiselector-selection button.show-all").removeClass("btn-primary");
                }

                if (text !== "") {
                    helpers.highlightItem();
                }

                multiSelector.previousText = text;

                if (text !== "") {
                    helpers.updateInputWidth();
                    $(".token-input").focus();
                }
            };

            var handleKeyDown = function(event) {
                var keyId = event.keyCode;

                if (keyId === 9 || keyId === 27) {
                    //Tab(works only with Firefox) or escape
                    $(".token-input").val("");
                    if (!$(".multiselector-results").hasClass("hidden")) {
                        $(".multiselector-results").addClass("hidden");
                        $(".show-all").removeClass("btn-primary");
                    }
                    return;
                } else if ($(".multiselector-results").hasClass("hidden")) {
                    if (keyId === 46) {
                        //Delete
                        var selection = $(".multiselector-selected-item.selected");
                        if (selection.length > 0) {
                            if (selection.prev().length > 0) {
                                selection.prev().addClass("selected");
                            } else if (selection.next().length > 0) {
                                selection.next().addClass("selected");
                            }
                            selection.click();
                        }
                    }
                } else {
                    if (keyId === 36) {
                        //Home
                        helpers.highlightItem();
                        if ($(".multiselector-results").length) {
                            $(".multiselector-results").eq(0).scrollTop(0);
                        }
                    } else if (keyId === 35) {
                        //End
                        helpers.highlightItem(true);
                        var results = $(".multiselector-results");
                        if (results.length) {
                            results.eq(0).scrollTop(results.eq(0).prop("scrollHeight"));
                        }
                    } else if (keyId === 38 || keyId === 40) {
                        //Arrow Up or Arrow Down
                        var direction = (keyId === 38) ? -1 : 1;
                        var index = (keyId === 38) ? 0 : -1;
                        var orderBy = (keyId === 38) ? ["show-all-contacts", ".add-phone-number"] :
                            ["add-phone-number", ".show-all-contacts"];

                        if (!$(".highlight").length) {
                            helpers.highlightItem(keyId === 40);
                        } else {
                            var currentHighlight = $(".highlight").eq(0);

                            if (currentHighlight.hasClass("multiselector-list-item")) {
                                var multiselectorList = $(".multiselector-list-item");
                                if (multiselectorList.eq(index).text() === currentHighlight.text()) {
                                    helpers.highlightItem(keyId === 40);
                                    return;
                                }

                                var i;
                                for (i = 0; i < multiselectorList.length; i++) {
                                    if (multiselectorList.eq(i).text() === currentHighlight.text()) {
                                        break;
                                    }
                                }
                                var listItem = multiselectorList.eq(i);
                                listItem.removeClass("highlight");
                                multiselectorList.eq(i + direction).addClass("highlight");
                                var parent = $(".multiselector-results");
                                var parentScroll = parent.scrollTop();
                                parent.scrollTop(parentScroll + direction * listItem.outerHeight(true));
                            } else if (currentHighlight.hasClass(orderBy[0])) {
                                if ($(".multiselector-list-item").length) {
                                    index = (index === 0) ? -1 : 0;
                                    $(".highlight").removeClass("highlight");
                                    $(".multiselector-list-item").eq(index).addClass("highlight");
                                } else if ($(orderBy[1]).length) {
                                    $(".highlight").removeClass("highlight");
                                    $(orderBy[1]).addClass("highlight");
                                }
                            }
                        }
                    }
                }
            };

            currentElement.html(selection);
            selection.after(results);

            for (var i in multiSelector.selected) {
                helpers.createSelectedItem(multiSelector.selected[i].name, multiSelector.selected[i].customCssClass,
                    true, multiSelector.selected[i].memberCount);
            }
            //Handling input
            selection.keyup(handleKeyUp);
            selection.keydown(handleKeyDown);
        };
        transformElement();

        // Return the selector object for public function access
        return multiSelector;
    };
}(jQuery));
