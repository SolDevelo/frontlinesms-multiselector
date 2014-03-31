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
        var multiSelector;
        // currently selected element === this
        // assigning it to a variable for use in inline functions
        var currentElement = this;
        var defaultOptions = {
            "minResultsHeight": 300,
            "displayLimit": {
                "contacts": 15,
                "groups": 5,
                "smartgroups": 5
            },
            "displayNames": {
                "contacts": "Contacts",
                "groups": "Groups",
                "smartgroups": "Smart Groups"
            },
            "objectAdded": null,
            "objectRemoved": null,
            "language": "en_US",
            "icons": {
                "contacts": "fa fa-user",
                "groups": "fa fa-group",
                "smartgroups": "fa fa-cog",
                "phone-number": "fa fa-mobile-phone"
            },
            "contactLoading": {
                // milliseconds between loading a batch of contacts
                "intervalMs": 5,
                "batchSize": 10
            }
        };

        var constants = {
            "regExPatterns": {
                "phoneNumber": /^\+?\d+$/g
            }
        };

        var properties = {
            "showAll": {
                "contacts": false,
                "groups": false,
                "smartgroups": false,
                "selected": false,
                all: function() {
                    return (this.contacts && this.groups && this.smartgroups && this.selected);
                }
            },
            "preventEnterKeyEvent": false,
            "loading": false,
            "lastKeypressTimeout": null,
            "progressbar": {
                "types": [ "contacts", "groups", "smartgroups" ],
                "typeIndex": 0,
                "interval": null,
                "totalCount": {
                    "contacts": 0,
                    "groups": 0,
                    "smartgroups": 0,
                    reset: function (type) {
                        this[type] = 0;
                    },
                    resetAll: function () {
                        this.reset("contacts");
                        this.reset("groups");
                        this.reset("smartgroups");
                    },
                    update: function() {
                        var keys = Object.keys(this);
                        for (var k = 0; k < keys.length; k++) {
                            var key = keys[k];
                            if ($.isFunction(this[key])) {
                                continue;
                            }
                            this[key] = multiSelector.contactServiceObject.getObjectCount(key);
                        }
                    }
                },
                "loadedCount": {
                    "contacts": 0,
                    "groups": 0,
                    "smartgroups": 0,
                    reset: function (type) {
                        this[type] = 0;
                    },
                    resetAll: function () {
                        this.reset("contacts");
                        this.reset("groups");
                        this.reset("smartgroups");
                    },
                    allLoaded: function () {
                        return (this.contacts === properties.progressbar.totalCount.contacts &&
                            this.groups === properties.progressbar.totalCount.groups &&
                            this.smartgroups === properties.progressbar.totalCount.smartgroups);
                    },
                    nextTypeIndex: function() {
                        var i = 0;
                        for (var key in this) {
                            if (this.hasOwnProperty(key) && this[key] < properties.progressbar.totalCount[key] &&
                                    (this[key] < options.displayLimit[key] || properties.showAll[key])) {
                                return i;
                            }
                            i++;
                        }
                        return -1;
                    },
                    totalPercent: function() {
                        var loaded = this.contacts + this.groups + this.smartgroups;
                        var total = properties.progressbar.totalCount.contacts +
                            properties.progressbar.totalCount.groups +
                            properties.progressbar.totalCount.smartgroups;

                        return (total > 0) ? ((loaded / total) * 100).toFixed(0) : 0;
                    }
                }
            },
            "mouseOnSelector": false
        };

        var duplicatePolicy = null;

        multiSelector = {
            version: "0.6",
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
                    "common.item.add.number": "Add this phone number",
                    "common.progressbar.label": "Loading, please wait..."
                }
            },
            "translations": (translations === undefined) ? null : translations,
            "contactServiceObject": contactServiceObj
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
                        options[key] = helpers.parseOptionsObjects(options[key], defaultOptions[key]);
                    }
                }

                return options;
            },
            parseOptionsObjects: function(optionsObject, defaultOptionsObject) {
                for (var key in defaultOptionsObject) {
                    if (!defaultOptionsObject.hasOwnProperty(key)) {
                        continue;
                    }

                    if (!optionsObject.hasOwnProperty(key)) {
                        optionsObject[key] = defaultOptionsObject[key];
                    }
                }
                return optionsObject;
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
            createGroupChildElement: function(child) {
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

                if (child.disabled) {
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
            createGroupElement: function(name, limit) {
                if (name === undefined || name === null || limit < 0) {
                    return null;
                }

                var groupNameElement = $(document.createElement("span"))
                    .text(options.displayNames[name])
                    .addClass("dropdown-header");
                var listItem = $(document.createElement("li"))
                    .addClass(name)
                    .append(groupNameElement);

                var icon = $(document.createElement("i"))
                    .addClass(multiSelector.options.icons[name]);
                groupNameElement.prepend(icon);

                return listItem;
            },
            createItemLimitElement: function(type, max) {
                var message = sprintf(helpers.getMessage("common.item.limit.label"),
                    properties.progressbar.loadedCount[type], max);
                var span = $(document.createElement("span"))
                    .addClass("text-info")
                    .text(message);
                return $(document.createElement("a"))
                    .attr("href", "#")
                    .attr("role", "menuitem")
                    .addClass("multiselector-item-limit-info")
                    .addClass("multiselector-list-item")
                    .mouseenter(function (event) {
                        $(".highlight").removeClass("highlight");
                        $(event.currentTarget).addClass("highlight");
                    })
                    .click(helpers.expandSingleGrouping)
                    .append(span);
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
                    .click(function() {
                        properties.mouseOnSelector = true;
                        helpers.showAllContacts();
                    });
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

                if (exists) {
                    helpers.setAntiduplicateSelectionPolicy(true);
                    return false;
                }

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

                        if ((customClass === "groups" || customClass === "smartgroups") &&
                            memberCount !== undefined) {

                            span.after(helpers.createMemberCountElement(memberCount));
                        }

                        span.before(icon);
                    }
                }
                helpers.setAntiduplicateSelectionPolicy(true);
                return true;
            },
            createLoadingBarContainer: function () {
                var loadingMessage = $(document.createElement("h5"))
                    .addClass("text-center")
                    .text(helpers.getMessage("common.progressbar.label"));

                var progressBar = $(document.createElement("div"))
                    .addClass("progress-bar multiselector-progress-bar")
                    .attr("role", "progressbar")
                    .attr("aria-valuenow", "0")
                    .attr("aria-valuemin", "0")
                    .attr("aria-valuemax", "100")
                    .text("0%")
                    .width("0%");

                var progressBarContainer = $(document.createElement("div"))
                    .addClass("progress progress-striped active")
                    .append(progressBar);

                return $(document.createElement("div"))
                    .attr("id", "multiselector-loading-container")
                    .addClass("multiselector-loading-container")
                    .addClass("center-block")
                    .append(loadingMessage)
                    .append(progressBarContainer);
            },
            updateProgressBarPercent: function(percent) {
                var progressBar = $(".multiselector-progress-bar");
                progressBar
                    .width(percent + "%")
                    .text(percent + "%");
            },
            createResultsList: function () {
                return $(document.createElement("ul"))
                    .addClass("multiselector-results")
                    .addClass("dropdown-menu")
                    .addClass("dropdown-toggle")
                    .addClass("hidden")
                    .attr("role", "menu")
                    .height(multiSelector.options.minResultsHeight);
            },
            createResultsDiv: function () {
                var results = helpers.createResultsList();
                var loadingBarContainer = helpers.createLoadingBarContainer();

                return $(document.createElement("div"))
                    .addClass("multiselector-results-container")
                    .addClass("hidden")
                    .append(results)
                    .append(loadingBarContainer);
            },
            clearList: function() {
                multiSelector.results.length = 0;
                $(".multiselector-results").empty();
            },
            createItemLimitInfoElement: function(count, max) {
                var message = sprintf(helpers.getMessage("common.item.limit.label"), count, max);
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
                    .click(helpers.expandSingleGrouping)
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
                $(".token-input").focus();
                var existingSelection = $(".multiselector-selected-item");

                if (existingSelection !== undefined) {
                    for (var it = 0; it < existingSelection.length; it++) {
                        if (existingSelection.eq(it).text() === $(event.currentTarget).find(".multiselector-list-item-name").text()) {
                            return;
                        }
                    }
                }

                var customClass = $(event.currentTarget).parents("li").eq(0).attr("class");
                var memberCount = $(event.currentTarget).data("member-count");

                var isCreatedItem = helpers.createSelectedItem($(event.currentTarget).find(".multiselector-list-item-name").text(),
                    customClass, false, memberCount);
                if (!isCreatedItem) {
                    return;
                }

                helpers.findAndAddObject(event);
            },
            findAndAddObject: function(event) {
                for (var i = multiSelector.results.length - 1; i >= 0; i--) {
                    for (var j = 0; j < multiSelector.results[i].members.length; j++) {
                        if (multiSelector.results[i].members[j].name === $(event.currentTarget).find(".multiselector-list-item-name").text()) {
                            var objectId = multiSelector.results[i].members[j].id;
                            multiSelector.selected.push(multiSelector.results[i].members[j]);
                            multiSelector.results[i].members.splice(j, 1);

                            $(event.currentTarget).remove();

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
                if (helpers.addCustomContact(numberObject, selected, "phone-number") &&
                        multiSelector.options.objectAdded && $.isFunction(multiSelector.options.objectAdded)) {
                    multiSelector.options.objectAdded(numberObject.id);
                } else {
                    helpers.clearList();
                    helpers.hideResults();
                    $(".token-input").focus();
                }
                clearTimeout(properties.lastKeypressTimeout);
            },
            addPhoneNumberEvent: function(event) {
                var input = $(".token-input");
                var text = input.val();

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
                input.val("");
            },
            deleteSelection: function(text) {
                for (var i = 0; i < multiSelector.selected.length; i++) {
                    if (text === multiSelector.selected[i].name) {
                        if (multiSelector.options.objectRemoved) {
                            multiSelector.options.objectRemoved(multiSelector.selected[i].id);
                        }
                        multiSelector.selected.splice(i, 1);

                        helpers.updateInputWidth();
                        break;
                    }
                }

                if (!$(".multiselector-results").hasClass("hidden")) {
                    if ($(".show-all-contacts").length) {
                        helpers.refreshList($(".token-input").val());
                    } else {
                        helpers.refreshList("");
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
            toggleShowAllButton: function(show) {
                helpers.updateAllShowAllProperties(show);

                var showAllButton = $(".multiselector-selection button.show-all");
                if (show) {
                    showAllButton.addClass("btn-primary");
                    $(".multiselector-results-container").removeClass("hidden");
                    $(".multiselector-results").removeClass("hidden");
                } else {
                    showAllButton.removeClass("btn-primary");
                    helpers.hideResults();
                }
            },
            showAllContacts: function() {
                var multiselectorResults = $(".multiselector-results-container");
                var showAll = $(".show-all");
                $(".token-input").val("").focus();

                $('.dropdown-toggle').dropdown('toggle');
                if (!multiselectorResults.hasClass("hidden") && showAll.hasClass("btn-primary")) {
                    helpers.updateAllShowAllProperties(false);
                    helpers.hideResults();
                    showAll.removeClass("btn-primary");
                } else {
                    helpers.updateAllShowAllProperties(true);
                    showAll.addClass("btn-primary");
                    helpers.refreshList("");
                }
                properties.preventEnterKeyEvent = true;
                helpers.highlightItem();
            },
            tryAddPhoneNumberSection: function () {
                var text = $(".token-input").val();
                var apn = $(".add-phone-number");

                if (!apn.length && text.match(constants.regExPatterns.phoneNumber) !== null) {
                    var addNumberElement = $(document.createElement("a"))
                        .attr("href", "#")
                        .attr("role", "menuitem")
                        .addClass("add-phone-number")
                        .addClass("multiselector-list-item")
                        .click(helpers.addPhoneNumberEvent)
                        .mouseenter(function (event) {
                            $(".highlight").removeClass("highlight");
                            $(event.currentTarget).addClass("highlight");
                        })
                        .text(helpers.getMessage("common.item.add.number"));

                    var divider = $(document.createElement("li"))
                        .addClass("divider");
                    var li = $(document.createElement("li"))
                        .append(addNumberElement)
                        .append(divider);

                    $(".multiselector-results").prepend(li);
                } else if (apn.length && text.match(constants.regExPatterns.phoneNumber) === null) {
                    apn.eq(0).remove();
                }
            },
            applyHideResultStatement: function (text) {
                var results = $(".multiselector-results");
                if (text.length > 0 && results.hasClass("hidden")) {
                    results.removeClass("hidden");
                } else if (!text.length) {
                    results.addClass("hidden");
                    $(".multiselector-selection button.show-all").removeClass("btn-primary");
                }
            },
            resetLoadedContacts: function() {
                helpers.clearList();
                properties.progressbar.loadedCount.resetAll();
                clearInterval(properties.progressbar.interval);
            },
            loadFilteredContacts: function() {
                var results = $(".multiselector-results");

                var contactBase = {
                    contacts: {},
                    groups: {},
                    smartgroups: {}
                };
                var text = $(".token-input").val();
                if (text !== "") {
                    multiSelector.results = multiSelector.contactServiceObject.getFilteredMatches(helpers.getSelectedIDs(), text);
                    contactBase.contacts = helpers.getGroupingByName(options.displayNames.contacts);
                    contactBase.groups = helpers.getGroupingByName(options.displayNames.groups);
                    contactBase.smartgroups = helpers.getGroupingByName(options.displayNames.smartgroups);
                    properties.progressbar.totalCount.contacts = (contactBase.contacts === null) ? 0 : contactBase.contacts.members.length;
                    properties.progressbar.totalCount.groups = (contactBase.groups === null) ? 0 : contactBase.groups.members.length;
                    properties.progressbar.totalCount.smartgroups = (contactBase.smartgroups === null) ? 0 : contactBase.smartgroups.members.length;

                    $.each(properties.progressbar.types, function(index, value) {
                        if (!contactBase[value]) {
                            return true;
                        }

                        var listElement = $("li." + value);
                        var divider = null;
                        text = $(".token-input").val();
                        if (!listElement.length) {
                            divider = $(document.createElement("li"))
                                .addClass("divider");
                            listElement = helpers.createGroupElement(value, options.displayLimit[value], false);
                            listElement.append(divider);
                            results.append(listElement);
                        } else {
                            divider = listElement.find(".divider");
                        }

                        for (var i = 0; i < contactBase[value].members.length; i++) {
                            if (i === options.displayLimit[value] && !properties.showAll[value]) {
                                var itemLimitElement = helpers.createItemLimitElement(value, contactBase[value].members.length);
                                divider.before(itemLimitElement);
                                break;
                            }

                            var contactObject = contactBase[value].members[i];
                            contactObject.name = contactObject.name.trim();
                            var groupMemberElement = helpers.createGroupChildElement(contactObject);
                            divider.before(groupMemberElement);
                            properties.progressbar.loadedCount[value]++;
                        }
                        return true;
                    });
                }

                helpers.tryAddPhoneNumberSection();
                helpers.applyHideResultStatement(text);
                results.append(helpers.createShowAllContacts());

                $("#multiselector-loading-container").addClass("hidden");
            },
            addToResults: function(objectType, objectData) {
                var groupingIndex = -1;
                $.each(multiSelector.results, function(index, element) {
                    if (element.customCssClass === objectType) {
                        groupingIndex = index;
                        return false;
                    }
                });

                if (groupingIndex === -1) {
                    multiSelector.results.push({
                        "displayName": options.displayNames[objectType],
                        "customCssClass": objectType,
                        "members": [
                            objectData
                        ]
                    });
                } else {
                    multiSelector.results[groupingIndex].members.push(objectData);
                }
            },
            loadContacts: function(resetAll) {
                var results = $(".multiselector-results");
                var progressBarContainer = $("#multiselector-loading-container");

                if (resetAll) {
                    helpers.resetLoadedContacts();
                    helpers.updateProgressBarPercent(0);
                    progressBarContainer.removeClass("hidden");
                }

                var highlightItemInterval = setInterval(function() {
                    if ($(".multiselector-results").length) {
                        helpers.highlightItem();
                        clearInterval(highlightItemInterval);
                    }
                }, 100);

                properties.progressbar.totalCount.update();
                if (properties.progressbar.loadedCount.allLoaded()) {
                    clearInterval(properties.progressbar.interval);
                    return;
                }

                properties.progressbar.interval = setInterval(function () {
                    var typeIndex = properties.progressbar.loadedCount.nextTypeIndex();
                    if (typeIndex === -1) {
                        clearInterval(properties.progressbar.interval);
                        return;
                    }

                    var type = properties.progressbar.types[typeIndex];
                    var listElement = $("li." + type);
                    var divider = null;
                    if (!listElement.length) {
                        divider = $(document.createElement("li"))
                            .addClass("divider");
                        listElement = helpers.createGroupElement(type, options.displayLimit[type], true);
                        listElement.append(divider);
                        results.append(listElement);
                    } else {
                        divider = listElement.find(".divider");
                    }

                    for (var i = 0; i < options.contactLoading.batchSize; i++) {
                        if (properties.progressbar.loadedCount[type] >= properties.progressbar.totalCount[type]) {
                            break;
                        }

                        var contactObject = multiSelector.contactServiceObject.getObject(
                            type, properties.progressbar.loadedCount[type]);
                        contactObject.name = contactObject.name.trim();
                        helpers.addToResults(type, contactObject);
                        var groupMemberElement = helpers.createGroupChildElement(contactObject);
                        divider.before(groupMemberElement);
                        properties.progressbar.loadedCount[type]++;
                        helpers.updateProgressBarPercent(properties.progressbar.loadedCount.totalPercent());
                    }

                    if (properties.progressbar.loadedCount.allLoaded()) {
                        helpers.updateProgressBarPercent(100);
                        clearInterval(properties.progressbar.interval);
                    }
                }, options.contactLoading.intervalMs);
            },
            refreshList: function(text) {
                if ((text === undefined || text === "") && !properties.showAll.selected) {
                    helpers.hideResults();
                    return;
                }

                helpers.clearList();
                helpers.showResults();

                var progressBar = $(".multiselector-progress-bar");
                var progressBarInterval = setInterval(function () {
                    if (progressBar.text() === "100%") {
                        progressBar.parents("#multiselector-loading-container").addClass("hidden");
                        clearInterval(progressBarInterval);
                    }
                }, 100);

                if (text === "") {
                    helpers.loadContacts(true);
                } else {
                    helpers.loadFilteredContacts();
                }
            },
            addSelectedPhoneNumbers: function(IDs, addedToSelectionArray, selected) {
                $.each(IDs, function(index, id) {
                    if (!addedToSelectionArray[index] && id.match(constants.regExPatterns.phoneNumber)) {
                        helpers.addPhoneNumber(id, selected);
                    }
                });
            },
            getSelectionByIDs: function(IDs, fillList) {
                var selected = [];
                var isAddedToSelection = [];

                if (!IDs || !IDs.length) {
                    return selected;
                }

                var contactBase = multiSelector.contactServiceObject.getAll();
                if (!contactBase) {
                    return selected;
                }

                $.each(contactBase, function(group_index, group) {
                    $.each(group.members, function(member_index, member) {
                        var idIndex = $.inArray(member.id, IDs);
                        if (idIndex !== -1) {
                            member.customCssClass = group.customCssClass;
                            selected.push(member);
                            isAddedToSelection[idIndex] = true;
                        }
                    });
                });

                if (fillList) {
                    helpers.addSelectedPhoneNumbers(IDs, isAddedToSelection, selected);
                }

                return selected;
            },
            showResults: function() {
                $(".multiselector-results-container").removeClass("hidden");
                $(".multiselector-results").removeClass("hidden");
            },
            hideResults: function() {
                var multiselectorResults = $(".multiselector-results-container");
                if (multiselectorResults.length) {
                    multiselectorResults.addClass("hidden");
                    helpers.resetLoadedContacts();
                    properties.mouseOnSelector = false;
                }
            },
            expandSingleGrouping: function(listElement) {
                var input = $(".token-input");

                if (listElement.hasOwnProperty("currentTarget")) {
                    listElement = $(listElement.currentTarget);
                    input.focus();
                }

                var parentName = listElement.parents("li").find("span").eq(0).text();

                if(parentName === options.displayNames.contacts) {
                    properties.showAll.contacts = true;
                } else if(parentName === options.displayNames.groups) {
                    properties.showAll.groups = true;
                } else if(parentName === options.displayNames.smartgroups) {
                    properties.showAll.smartgroups = true;
                }

                var grouping = listElement.parent().attr("class");
                var index = listElement.index();
                var resultsList = $(".multiselector-results");

                helpers.refreshList(input.val());
                resultsList
                    .find("li." + grouping)
                    .children().eq(index)
                    .addClass("highlight");
            },
            highlightItem: function(lastItem) {
                var results = $(".multiselector-results").eq(0);
                var index = (lastItem) ? -1 : 0;
                var element = results.children().eq(index);

                $(".highlight").removeClass("highlight");

                if (element.prop("nodeName") === "LI" && $(".multiselector-list-item").length) {
                    $(".multiselector-list-item").eq(index).addClass("highlight");
                    if (lastItem) {
                        results.eq(0).scrollTop(results.eq(0).prop("scrollHeight"));
                    } else {
                        results.eq(0).scrollTop(0);
                    }
                }
            },
            addCustomContact: function(customContact, selected, customCssClass) {
                selected = (!selected) ? multiSelector.selected : selected;

                if (customContact && $.inArray(false, [customContact.hasOwnProperty("name"),
                    customContact.hasOwnProperty("id"), customContact.hasOwnProperty("metadata"),
                    !helpers.isAlreadySelected(selected, customContact.name)]) === -1) {

                    customContact.customCssClass = customCssClass;
                    selected.push(customContact);

                    if (helpers.createSelectedItem(customContact.name, customCssClass, true)) {
                        $(".token-input").val("").focus();
                        helpers.hideResults();
                        helpers.updateInputWidth();
                        return true;
                    }
                }

                return false;
            },
            isAlreadySelected: function(selectionArray, contactName) {
                var found = false;
                $.each(selectionArray, function(contact_index, contact) {
                    if (contact.name === contactName) {
                        found = true;
                        return false;
                    }
                    // This is to stop JSHint from throwing an error
                    return true;
                });
                return found;
            },
            setAntiduplicateSelectionPolicy: function(enable) {
                if (enable) {
                    duplicatePolicy = function(e) {
                        var token = $(".token").eq(-1);
                        var highlight = $(".highlight");
                        token.addClass("multiselector-selected-item");
                        token.addClass(e.token.customCss);
                        if (!highlight.length) {
                            token.remove();
                        } else if (highlight.hasClass("show-all-contacts")) {
                            token.remove();
                        } else if (highlight.hasClass("multiselector-list-item")) {
                            if (e.token.value !== highlight.find(".multiselector-list-item-name").text()) {
                                token.remove();
                            }
                        } else if (!highlight.hasClass("add-phone-number")) {
                            token.remove();
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
            },
            callObjectAdded: function(added, objectId) {
                if (!added && objectId.match(constants.regExPatterns.phoneNumber)) {
                    helpers.addPhoneNumber(objectId, multiSelector.selected);
                    added = true;
                }

                if (added && multiSelector.options.objectAdded) {
                    multiSelector.options.objectAdded(objectId);
                }
                return added;
            },
            triggerHighlightedItem: function() {
                var highlight = $(".highlight");

                if (highlight.length) {
                    highlight.eq(0).trigger("click");
                    helpers.updateInputWidth();
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
                    if (id === objectId && !results[i].members[m].disabled) {
                        var contact = results[i].members[m];

                        helpers.addCustomContact(contact, null, results[i].customCssClass);
                        added = true;
                    } else if (id === objectId && results[i].members[m].disabled) {
                        return false;
                    }
                }
            }

            return helpers.callObjectAdded(added, objectId);
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
            properties.progressbar.loadedCount.resetAll();
            properties.progressbar.totalCount.resetAll();

            var resultDiv = $(".multiselector-results");
            if (resultDiv.length && !resultDiv.hasClass("hidden")) {
                resultDiv.addClass("hidden");
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
                helpers.setAntiduplicateSelectionPolicy(true);
            }).on("tokenfield:removetoken", function(e) {
                helpers.deleteSelection(e.token.value);
                helpers.updateInputWidth();
            }).tokenfield({
                minWidth: 0,
                allowEditing: false
            });

            var handleTabEscKeys = function() {
                $(".token-input").val("");
                if (!results.hasClass("hidden")) {
                    helpers.hideResults();
                    $(".show-all").removeClass("btn-primary");
                }
                multiSelector.previousText = "";
            };

            var handleEnterKey = function(text, inputToHandle) {
                var highlight = $(".highlight");

                if (properties.preventEnterKeyEvent) {
                    properties.preventEnterKeyEvent = false;
                    return;
                }

                if (text.search(",") >= 0) {
                    text = text.substring(0, text.search(","));
                    inputToHandle.val(text);
                }

                if ((!text.length && !highlight.length) || $(".multiselector-results").hasClass("hidden")) {
                    return;
                }

                helpers.triggerHighlightedItem(inputToHandle);
                inputToHandle.focus();

                multiSelector.previousText = "";
            };

            var handleHomeKey = function() {
                helpers.highlightItem();
            };

            var handleEndKey = function() {
                helpers.highlightItem(true);
            };

            var handleScrolling = function(currentHighlight, direction, index, multiselectorList) {
                var i = multiselectorList.index(currentHighlight);
                var listItem = multiselectorList.eq(i);

                listItem.removeClass("highlight");
                listItem = multiselectorList.eq(i + direction).addClass("highlight");

                var parent = $(".multiselector-results");
                var parentScroll = parent.scrollTop();
                var itemTop = listItem.position().top;

                if (direction === -1 && itemTop < listItem.outerHeight(true)) {
                    parent.scrollTop(parentScroll - listItem.outerHeight(true) + itemTop);
                } else if (direction === 1 && itemTop > parent.height() - 2 * listItem.outerHeight(true)) {
                    parent.scrollTop(parentScroll + itemTop - parent.height() + 2 * listItem.outerHeight(true));
                }
            };

            var handleArrowKeys = function(keyId) {
                var highlight = $(".highlight");
                var direction = (keyId === 38) ? -1 : 1;
                var index = (keyId === 38) ? 0 : -1;

                if (!highlight.length) {
                    helpers.highlightItem(keyId === 40);
                    return;
                }
                var currentHighlight = highlight.eq(0);

                if (currentHighlight.hasClass("multiselector-list-item")) {
                    var multiselectorList = $(".multiselector-list-item");
                    if (multiselectorList.eq(index).text() === currentHighlight.text()) {
                        helpers.highlightItem(keyId === 40);
                        return;
                    }

                    handleScrolling(currentHighlight, direction, index, multiselectorList);
                }
            };

            var onTextChangeRefreshList = function(text) {
                if (text !== multiSelector.previousText) {
                    helpers.updateAllShowAllProperties(false);
                    $('.dropdown-toggle').dropdown('toggle');
                    $(".show-all").removeClass("btn-primary");
                    helpers.refreshList(text);
                }
            };

            var fitInputSize = function(text) {
                if (text !== "") {
                    helpers.updateInputWidth();
                    $(".token-input").focus();
                }
            };

            var handleKeyUp = function(e) {
                var keyId = e.keyCode;
                input = $(".token-input");
                var text = input.val();

                if (keyId === 13 || keyId === 188) {
                    // Enter/Return and comma
                    if (keyId === 188) {
                        properties.preventEnterKeyEvent = false;
                    }
                    handleEnterKey(text, input);
                    return;
                } else if (keyId === 9) {
                    //Handling Tab key that works for both web browsers(firefox and chrome)
                   handleTabEscKeys();
                    return;
                } else if ($.inArray(keyId, [ 27, 35, 36, 38, 40 ]) !== -1) {
                    //Escape, Home, End, Arrow Up and Down
                    //Do nothing because they're handled on key down event
                    e.preventDefault();
                    return;
                }

                if (properties.lastKeypressTimeout) {
                    clearTimeout(properties.lastKeypressTimeout);
                }
                properties.lastKeypressTimeout = setTimeout(function() {
                    onTextChangeRefreshList(text);
                    if (text !== "") {
                        helpers.highlightItem();
                    }

                    multiSelector.previousText = "";
                }, 250);
                fitInputSize(text);
            };

            var handleKeyDown = function(event) {
                var keyId = event.keyCode;

                if (keyId === 9 || keyId === 27) {
                    //Tab(works only with Firefox) or escape
                    handleTabEscKeys();
                    return;
                } else if (keyId === 36) {
                    //Home
                    handleHomeKey();
                } else if (keyId === 35) {
                    //End
                    handleEndKey();
                } else if (keyId === 38 || keyId === 40) {
                    //Arrow Up or Arrow Down
                    handleArrowKeys(keyId);
                }
                properties.preventEnterKeyEvent = false;
            };

            currentElement.html(selection);
            selection.after(results);

            for (var i = 0; i < multiSelector.selected.length; i++) {
                helpers.createSelectedItem(multiSelector.selected[i].name, multiSelector.selected[i].customCssClass,
                    true, multiSelector.selected[i].memberCount);
            }
            //Handling input
            selection.keyup(handleKeyUp);
            selection.keydown(handleKeyDown);

            results.mouseenter(function() {
                properties.mouseOnSelector = true;
            });
            results.mouseleave(function() {
                properties.mouseOnSelector = false;
            });

            $(".show-all")
                .mouseenter(function() {
                    properties.mouseOnSelector = true;
                }).mouseleave(function() {
                    properties.mouseOnSelector = false;
                });

            $(".token-input").focusout(function () {
                if (!properties.mouseOnSelector) {
                    helpers.toggleShowAllButton(false);
                    helpers.clearList();
                    helpers.hideResults();
                }
            });
        };
        transformElement();

        // Return the selector object for public function access
        return multiSelector;
    };
}(jQuery));
