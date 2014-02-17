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

    $.fn.multiselect = function(options, translations) {
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
                contacts: 'contacts',
                groups: 'groups',
                smartgroups: 'smartgroups'
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
                    .hover(function() {
                        $(this).toggleClass('hover');
                    })
                    .text(child.name);

                if (child.metadata === "0 members") {
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
                    .addClass("showAllContacts")
                    .text(message)
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
                            if ($(".multiselector-item-limit-info").length) {
                                helpers.refreshList($(".multiselector-input").val());
                            } else {
                                helpers.showAllContacts();
                            }
                            return;
                        }
                    }
                }
            },
            addUserDefinedSectionItem: function(input) {
                var existingSelection = $(".multiselector-selected-item");

                if (existingSelection !== undefined) {
                    for (var i = 0; i < existingSelection.length; i++) {
                        if (existingSelection.get(i).innerText === input) {
                            return;
                        }
                    }
                }

                $(".multiselector-new-item").before(
                    helpers.createSelectedItem(input).click(helpers.deleteClickedSelection)
                );
            },
            addPhoneNumber: function(number) {
                multiSelector.selected.push({
                    name: number,
                    id: number.substring(1),
                    metadata: number
                });
                $(".multiselector-new-item").before($(helpers.createSelectedItem(number))
                    .click(helpers.deleteClickedSelection));
            },
            deleteClickedSelection: function(event) {
                helpers.deleteSelection($(event.currentTarget).text());
                $(event.currentTarget).remove();
            },
            deleteSelection: function(text) {
                for (var i = 0; i < multiSelector.selected.length; i++) {
                    if (text === multiSelector.selected[i].name) {
                        multiSelector.selected.splice(i, 1);
                        if (!$(".multiselector-results").hasClass("hidden")) {
                            if ($(".multiselector-item-limit-info").length) {
                                helpers.refreshList($(".multiselector-input").val());
                            } else {
                                helpers.showAllContacts();
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
                } else if (!$(".multiselector-results").hasClass("hidden")) {
                    $(".multiselector-results").addClass("hidden");
                }
            },
            refreshList: function(text) {
                helpers.clearList();
                if (text.length > 0) {
                    multiSelector.results =
                        contactService.getFilteredMatches(helpers.getSelectedIDs(), text);
                }
                helpers.populateList();
            },
            showAllContacts: function() {
                helpers.clearList();
                multiSelector.results = contactService.getFilteredMatches(helpers.getSelectedIDs());
                helpers.populateList(false);
            }
        };

        var multiSelector = {
            version: "0.3-SNAPSHOT",
            targetElement: currentElement,
            options: helpers.parseOptions(options, defaultOptions),
            selected: [],
            results: {},
            previousText: "",
            defaultTranslations: {
                "en_US": {
                    "common.item.limit.label": "Showing %s out of %s matches",
                    "common.item.show.all": "Show all contacts",
                    "common.group.select.disabled": "This group is disabled and you can not select it."
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

            var handleKeys = function(e) {
                var keyId = e.keyCode;
                var text = input.val();

                if (keyId === 13 || keyId === 188) {
                    // Enter/Return and comma

                    input.val("");
                    if (text.search(",") >= 0) {
                        text = text.substring(0, text.search(","));
                    }

                    if (!text.length) {
                        return;
                    }

                    if (!$(".multiselector-results").hasClass("hidden")) {
                        $(".multiselector-list-item").eq(0).trigger("click");
                    } else if (text.match(/^\+[0-9]{3,}$/g)) {
                            helpers.addPhoneNumber(text);
                    }

                    multiSelector.previousText = "";
                    return;
                } else if (keyId === 8) {
                    // Backspace
                    var selection = $(".multiselector-selected-item");

                    if (selection.length > 0 && text.length === 0 &&
                        multiSelector.previousText.length === 0) {

                        helpers.deleteSelection(selection.eq(-1).text());
                        selection.eq(-1).remove();
                    }
                }

                if (text !== multiSelector.previousText) {
                    helpers.refreshList(text);
                }

                if (text.length > 0 && multiSelector.results.length > 0) {
                    results.removeClass('hidden');
                } else {
                    results.addClass('hidden');
                }

                multiSelector.previousText = text;
            };

            currentElement.html(selection);
            selection.after(results);
            //Handling input
            selection.keyup(handleKeys);
        };
        transformElement();
        helpers.createShowAllContacts();
        $('.showAllContacts').click(function() {
            helpers.showAllContacts();
        });

        // Return the selector object for public function access
        return multiSelector;
    };
}(jQuery));
