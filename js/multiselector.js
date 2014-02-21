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

    $.fn.multiselect = function(options, translations, defaultSelection) {
        // currently selected element === this
        // assigning it to a variable for use in inline functions
        var currentElement = this;
        var defaultOptions = {
            width: 500,
            minResultsHeight: 300,
            contactItemDisplayLimit: 15,
            groupItemDisplayLimit: 5,
            smartgroupItemDisplayLimit: 5,
            objectAdded: null,
            objectRemoved: null,
            language: "en_US"
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

                var childElement = $(document.createElement("li"))
                    .addClass("multiselector-list-item")
                    .mouseenter(function(event) {
                        $(".highlight").removeClass("highlight");
                        $(event.currentTarget).addClass("highlight");
                    })
                    .text(child.name);

                if (child.disabled !== undefined && child.disabled === true) {
                    childElement.addClass("disabled");
                    childElement.attr("title", helpers.getMessage("common.group.select.disabled"));
                    return childElement;
                }

                childElement.click(helpers.addSelectedItem);
                return childElement;
            },
            createGroupElement: function(group, limit, useLimit) {
                if (useLimit === undefined) {
                    useLimit = true;
                }
                if (group === undefined || group === null || limit < 1) {
                    return null;
                }

                var groupElement = $(document.createElement("ul"));
                var groupNameElement = $(document.createElement("span")).text(group.displayName);
                var listItem = $(document.createElement("li"))
                    .append(groupNameElement)
                    .append(groupElement);

                if (group.customCssClass !== undefined) {
                    listItem.addClass(group.customCssClass);
                }

                var i;

                if (!useLimit) {
                    for (i = 0; i < group.members.length; i++) {
                        groupElement.append(helpers.createGroupChildElement(group, group.members[i]));
                    }
                } else {
                    for (i = 0; i < group.members.length && i < limit; i++) {
                        groupElement.append(helpers.createGroupChildElement(group, group.members[i]));
                    }
                    if (i === limit && group.members.length !== i) {
                        groupElement.append(helpers.createItemLimitInfoElement(i, group.members.length));
                    }
                }

                return listItem;
            },
            createInput: function() {
                return $(document.createElement("input"))
                    .addClass("multiselector-input");
            },
            createSelectionList: function(input) {
                var selectionElement = $(document.createElement("ul"))
                    .addClass("multiselector-selection")
                    .width(multiSelector.options.width);
                var li = $(document.createElement("li"))
                    .addClass("multiselector-new-item");

                li.append(input);

                return selectionElement.append(li);
            },
            createSelectedItem: function(text) {
                return $(document.createElement("li"))
                    .addClass('multiselector-selected-item')
                    .hover(function() {
                        $(this).toggleClass('hover');
                    })
                    .text(text);
            },
            createResultsDiv: function() {
                var ul = document.createElement("ul");

                return $(document.createElement("div"))
                    .addClass("multiselector-results")
                    .addClass("hidden")
                    .width(multiSelector.options.width)
                    .height(multiSelector.options.minResultsHeight)
                    .append(ul);
            },
            clearList: function() {
                multiSelector.results.length = 0;
                $(".multiselector-results").find("ul").empty();
            },
            createItemLimitInfoElement: function(count, max) {
                var message = sprintf(helpers.getMessage("common.item.limit.label") ,count, max);

                return $(document.createElement("li"))
                    .addClass("multiselector-item-limit-info")
                    .text(message);
            },
            createShowAllContacts: function() {
                var message = helpers.getMessage("common.item.show.all");
                return $(".multiselector-results").append(
                    $(document.createElement("div"))
                        .addClass("show-all-contacts")
                        .text(message)
                        .click(function(event) {
                            helpers.refreshList("", true);
                            $(event.currentTarget).remove();
                            helpers.highlightItem();
                            $(".multiselector-input").focus();
                        })
                        .mouseenter(function(event) {
                            $(".highlight").removeClass("highlight");
                            $(event.currentTarget).addClass("highlight");
                        })
                );
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
                        if (existingSelection.eq(i).text() === $(event.currentTarget).text()) {
                            return;
                        }
                    }
                }

                var item = $(helpers.createSelectedItem($(event.currentTarget).text()))
                    .click(helpers.deleteClickedSelection);
                $(".multiselector-new-item").before(item);

                for (var i = multiSelector.results.length - 1; i >= 0; i--) {
                    for (var j = 0; j < multiSelector.results[i].members.length; j++) {
                        if (multiSelector.results[i].members[j].name === $(event.currentTarget).text()) {
                            multiSelector.selected.push(multiSelector.results[i].members[j]);
                            multiSelector.results[i].members.splice(j, 1);

                            $(event.currentTarget).remove();
                            if ($(".show-all-contacts").length) {
                                helpers.refreshList($(".multiselector-input").val());
                            } else {
                                helpers.refreshList("", true);
                            }
                            helpers.highlightItem();
                            $(".multiselector-input").focus();
                            return;
                        }
                    }
                }
            },
            addPhoneNumber: function(number, selected) {
                if (!selected) {
                    selected = multiSelector.selected;
                }

                for (var i in selected) {
                    if (selected[i].name === number) {
                        return;
                    }
                }

                selected.push({
                    name: number,
                    id: number,
                    metadata: number
                });
                $(".multiselector-new-item").before($(helpers.createSelectedItem(number))
                    .click(helpers.deleteClickedSelection));
            },
            addPhoneNumberEvent: function(event) {
                var input = $(".multiselector-input");

                //Prevents from adding invalid number when input is manipulated by user using mouse actions cut-copy-paste
                if (input.val().match(constants.regExPatterns.phoneNumber) === null) {
                    $(event.currentTarget).remove();
                    return;
                }

                helpers.addPhoneNumber(input.val());
                $(event.currentTarget).remove();
                helpers.highlightItem();
                $(".multiselector-input").focus();
            },
            deleteClickedSelection: function(event) {
                helpers.deleteSelection($(event.currentTarget).text());
                $(event.currentTarget).remove();
                $(".multiselector-input").focus();
            },
            deleteSelection: function(text) {
                for (var i = 0; i < multiSelector.selected.length; i++) {
                    if (text === multiSelector.selected[i].name) {
                        multiSelector.selected.splice(i, 1);
                        if (!$(".multiselector-results").hasClass("hidden")) {
                            if ($(".show-all-contacts").length) {
                                helpers.refreshList($(".multiselector-input").val());
                            } else {
                                helpers.refreshList("", true);
                            }
                        }
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
            populateList: function(option) {
                if (option === undefined) {
                    option = true;
                }
                if (multiSelector.results.length) {
                    var contacts = helpers.getGroupingByName(constants.groupingNames.contacts);
                    var groups = helpers.getGroupingByName(constants.groupingNames.groups);
                    var smartgroups = helpers.getGroupingByName(constants.groupingNames.smartgroups);
                    var resultsUl = $(".multiselector-results").find("ul");
                    resultsUl.append(helpers.createGroupElement(contacts, multiSelector.options.contactItemDisplayLimit, option)).find("ul");
                    resultsUl.append(helpers.createGroupElement(groups, multiSelector.options.groupItemDisplayLimit, option));
                    resultsUl.append(helpers.createGroupElement(smartgroups, multiSelector.options.smartgroupItemDisplayLimit, option));
                }
            },
            refreshList: function(text, forceGetAll) {
                helpers.clearList();
                if (text.length > 0 || forceGetAll === true) {
                    multiSelector.results =
                        contactService.getFilteredMatches(helpers.getSelectedIDs(), text);
                }
                helpers.populateList(!forceGetAll);
            },
            getSelectionByIDs: function(IDs, fillList) {
                var selected = [];
                var isAddedToSelection = [];
                if (IDs && IDs.length) {
                    var contactBase = contactService.getAll();

                    if (contactBase) {
                        for (var i in IDs) {
                            for (var g in contactBase) {
                                var found = false;
                                for (var m in contactBase[g].members) {
                                    if (IDs[i] === contactBase[g].members[m].id) {
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
            highlightItem: function(lastItem) {
                var results = $(".multiselector-results").eq(0);
                var index = (lastItem === true) ? -1 : 0;
                var element = results.children().eq(index);

                $(".highlight").removeClass("highlight");

                if (element[0].nodeName === "UL") {
                    if ($(".multiselector-list-item").length) {
                        $(".multiselector-list-item").eq(index).addClass("highlight");
                    } else if (lastItem && $(".add-phone-number").length) {
                        $(".add-phone-number").addClass("highlight");
                    } else if (!lastItem && $(".show-all-contacts").length) {
                        $(".show-all-contacts").addClass("highlight");
                    }
                    return;
                }
                element.addClass("highlight");
            }
        };

        var multiSelector = {
            version: "0.3-SNAPSHOT",
            targetElement: currentElement,
            options: helpers.parseOptions(options, defaultOptions),
            selected: helpers.getSelectionByIDs(defaultSelection, true),
            results: {},
            previousText: "",
            defaultTranslations: {
                "en_US": {
                    "common.item.limit.label": "Showing %s out of %s matches",
                    "common.item.show.all": "Show all contacts",
                    "common.group.select.disabled": "This group is disabled and you can not select it.",
                    "common.item.add.number": "Add this phone number"
                }
            },
            translations: (translations === undefined) ? null : translations
        };

        multiSelector.addObject = function(objectJson) {
            var newObject = JSON.parse(objectJson);

            if (objectAdded === "function") {
                objectAdded(newObject.id);
            }
        };

        multiSelector.removeObject = function(objectId) {
            if (objectRemoved === "function") {
                objectRemoved(objectId);
            }
        };

        multiSelector.toggleEnabled = function(objectId) {

        };

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

        // Function transforming the currently selected (with jQuery) element into the dropdown
        var transformElement = function() {

            var input = helpers.createInput();
            var selection = helpers.createSelectionList(input);
            var results = helpers.createResultsDiv();

            var handleKeyUp = function(e) {
                var keyId = e.keyCode;
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
                    }
                    input.focus();

                    return;
                } else if (keyId === 8) {
                    // Backspace
                    var selection = $(".multiselector-selected-item");

                    if (selection.length > 0 && text.length === 0 &&
                        multiSelector.previousText.length === 0) {

                        helpers.deleteSelection(selection.eq(-1).text());
                        selection.eq(-1).remove();
                    }
                } else if (keyId === 9 || keyId === 27 || keyId === 35 ||
                    keyId == 36 || keyId === 38 || keyId === 40) {
                    //Escape, Tab, Home, End, Arrow Up and Down
                    //Do nothing because they're handled on key down event
                    return;
                }

                if (text !== multiSelector.previousText) {
                    helpers.refreshList(text);
                }

                if (!$(".add-phone-number").length && text.match(constants.regExPatterns.phoneNumber) !== null) {
                    var addNumberElement = $(document.createElement("div"))
                        .addClass("add-phone-number")
                        .click(helpers.addPhoneNumberEvent)
                        .mouseenter(function(event) {
                            $(".highlight").removeClass("highlight");
                            $(event.currentTarget).addClass("highlight");
                        })
                        .text(helpers.getMessage("common.item.add.number"));

                    $(".multiselector-results").prepend(addNumberElement);
                } else if ($(".add-phone-number").length && text.match(constants.regExPatterns.phoneNumber) === null) {
                    $(".add-phone-number").eq(0).remove();
                }

                if (text.length > 0  && results.hasClass('hidden')) {
                    results.removeClass('hidden');
                } else if (!text.length) {
                    results.addClass('hidden');
                }

                if (!$(".show-all-contacts").length) {
                    helpers.createShowAllContacts();
                }

                if (text !== "") {
                    helpers.highlightItem();
                }

                multiSelector.previousText = text;
            };

            var handleKeyDown = function(event) {
                var keyId = event.keyCode;

                if (keyId === 9 || keyId === 27) {
                    //Tab or escape
                    if (!$(".multiselector-results").hasClass("hidden")) {
                        $(".multiselector-results").addClass("hidden");
                    }
                } else if (!$(".multiselector-results").hasClass("hidden")) {
                    if (keyId === 36) {
                        //Home
                        helpers.highlightItem();
                    } else if (keyId === 35) {
                        //End
                        helpers.highlightItem(true);
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
                                multiselectorList.eq(i).removeClass("highlight");
                                multiselectorList.eq(i + direction).addClass("highlight");
                                return;
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

            for (var i in multiSelector.selected) {
                var selectedItem = helpers.createSelectedItem(multiSelector.selected[i].name)
                    .click(helpers.deleteClickedSelection);

                selection.find("li").eq(-1).before(selectedItem);
            }

            currentElement.html(selection);
            selection.after(results);
            //Handling input
            selection.keyup(handleKeyUp);
            selection.keydown(handleKeyDown);
        };
        transformElement();

        // Return the selector object for public function access
        return multiSelector;
    };
}(jQuery));
