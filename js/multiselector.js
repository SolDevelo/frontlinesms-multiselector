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

    $.fn.multiselect = function(options, translations, defaultSelection, contactServiceObj, wrapperId) {
    	if (wrapperId == undefined){
    		wrapperId = "container";
    	}
    	
        var multiSelector;
        // currently selected element === this
        // assigning it to a variable for use in inline functions
        var currentElement = this;
        var defaultOptions = {
            "minResultsHeight": 300,
            "displayLimit": {},
            "objectAdded": null,
            "objectRemoved": null,
            "language": "en_US",
		"literals" : [
			{
				"name": "expression",
				"regex":  /^\${.*$/g,
				"allowCommas" : true,
				"encode": true
			},
			{
				"name": "phone-number",
				"regex":  /^\+?\d+$/g,
				"encode": false
			}
		],
            "icons": {},
            "contactLoading": {
                // milliseconds between loading a batch of contacts
                "intervalMs": 5,
                "batchSize": 10
            }
        };

        var properties = {
            "objectTypes": {},
            "objectTypeKeys": [],
            "showAll": {
                "selected": false,
                setAll: function(show) {
                    var self = this;
                    $.each(this, function(index, value) {
                        if ($.isFunction(self[index])) {
                            return true;
                        }
                        self[index] = show;
                    });
                },
                all: function() {
                    var allEnabled = true;
                    $.each(properties.objectTypeKeys, function(index, value) {
                        if (this[value] !== true) {
                            allEnabled = false;
                            return false;
                        }
                    });
                    return allEnabled;
                }
            },
            "preventEnterKeyEvent": false,
            "loading": false,
            "lastKeypressTimeout": null,
            "progressbar": {
                "typeIndex": 0,
                "interval": null,
                "totalCount": {
                    reset: function (type) {
                        this[type] = 0;
                    },
                    resetAll: function () {
                        var self = this;
                        $.each(properties.objectTypeKeys, function (index, value) {
                            if ($.isFunction(value)) {
                                return true;
                            }
                            self.reset(value);
                        });
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
                    reset: function(type) {
                        this[type] = 0;
                    },
                    resetAll: function() {
                        var self = this;
                        $.each(properties.objectTypeKeys, function(index, value) {
                            if ($.isFunction(value)) {
                                return true;
                            }
                            self.reset(value);
                        });
                    },
                    allLoaded: function () {
                        var isLoaded = true;
                        $.each(properties.objectTypeKeys, function(index, value) {
                            if (this[value] !== properties.progressbar.totalCount[value]) {
                                isLoaded = false;
                                return false;
                            }
                        });
                        return isLoaded;
                    },
                    nextType: function() {
                        var self = this;
                        var type = null;
                        $.each(properties.objectTypeKeys, function(index, value) {
                            if (self[value] < properties.progressbar.totalCount[value] &&
                                (self[value] < options.displayLimit[value] || properties.showAll[value])) {
                                type = value;
                                return false;
                            }
                        });
                        return type;
                    },
                    totalPercent: function() {
                        var self = this;
                        var loaded = 0;
                        var total = 0;
                        $.each(properties.objectTypeKeys, function(index, value) {

                            loaded += self[value];
                            total += properties.progressbar.totalCount[value];
                        });
                        return (total > 0) ? ((loaded / total) * 100).toFixed(0) : 0;
                    }
                }
            },
            "mouseOnSelector": false,
            "blockAdding": false,
            "focusedOnShowAll": false,
            "preventHidingRefreshedList": false,
            init: function () {
                var self = this;
                self.objectTypes = contactServiceObj.getTypes();
                $.each(this.objectTypes, function (key, value) {
                    self.objectTypeKeys.push(key);
                });
                self.objectTypeKeys.sort();

                $.each(this.objectTypeKeys, function(index, value) {
                    self.showAll[value] = false;
                    self.progressbar.totalCount[value] = 0;
                    self.progressbar.loadedCount[value] = 0;

                    defaultOptions.icons[value] = "";
                    defaultOptions.displayLimit[value] = 5;
                });
            }
        };

        properties.init();
        var duplicatePolicy = null;
        multiSelector = {
            "version": "0.6",
            "targetElement": currentElement,
            "options": {},
            "selected": {},
            "results": {},
            "previousText": "",
            "defaultTranslations": {
                "en_US": {
                    "common.item.limit.label": "Showing %s out of %s matches",
                    "common.item.selected": "Selected",
                    "common.item.show.all": "Show all contacts",
                    "common.item.show.all.button": "Show all",
                    "common.item.select.selected": "This item is already selected.",
                    "common.group.select.disabled": "This group is disabled and you can not select it.",
                    "common.item.add.phone-number": "Add this phone number",
                    "common.item.add.expression": "Add this expression",
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
                    .addClass("multiselector-list-item-"+wrapperId)
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
                    .text(properties.objectTypes[name].displayName)
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
                    .addClass("multiselector-list-item-"+wrapperId)
                    .mouseenter(function (event) {
                        $(".highlight").removeClass("highlight");
                        $(event.currentTarget).addClass("highlight");
                    })
                    .click(helpers.expandSingleGrouping)
                    .append(span);
            },
            createInput: function() {
                return $(document.createElement("input"))
                    .addClass("multiselector-input form-control multiselector-input-"+wrapperId);
            },
            createShowAllButton: function() {
                var message = helpers.getMessage("common.item.show.all.button");
                var span = $(document.createElement("span"))
                    .addClass("caret");

                return $(document.createElement("button"))
                    .addClass("btn btn-default show-all show-all-"+wrapperId)
		    .append($(document.createElement('i')).addClass(multiSelector.options.icons.showAll))
                    .append($(document.createElement('span')).text(message))
                    .append(span)
                    .click(function(event) {
                        properties.preventHidingRefreshedList = true;
                        properties.mouseOnSelector = true;
                        helpers.showAllContacts(); 
                    	event.preventDefault();
                        event.stopPropagation();
                    });
            },
            createSelectionList: function(input, showAllButton) {
                var selectionElement = $(document.createElement("ul"))
                    .addClass("multiselector-selection")
                    .addClass("multiselector-selection-"+wrapperId);
                var inputGroupButton = $(document.createElement("div"))
                    .addClass("input-group-btn")
                    .addClass("input-group-btn-"+wrapperId)
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

                if ($(".tokenfield").find(".multiselector-selected-item-"+wrapperId+"[data-value='" + text + "']").length) {
                    helpers.setAntiduplicateSelectionPolicy(true);
                    return false;
                }

                $(".multiselector-input-"+wrapperId).eq(0).tokenfield('createToken', {
                    value: text,
                    label: text
                });

                var token = $("ul.multiselector-selection-"+wrapperId).find(".token").eq(-1);
                if (token.attr("data-value") === text) {
                    if (!token.eq(-1).hasClass("multiselector-selected-item")) {
                        token.addClass("multiselector-selected-item").addClass("multiselector-selected-item-"+wrapperId);
                    }
                    token.addClass(customClass);
                    if (!token.find(".glyphicon").length) {
                        var span =  token.find(".token-label").eq(-1);
                        var icon = $(document.createElement("span"))
                            .addClass(multiSelector.options.icons[customClass]);

                        if (memberCount !== undefined) {
                            span.after(helpers.createMemberCountElement(memberCount));
                        }

                        if (multiSelector.options.icons.hasOwnProperty(customClass) &&
                                multiSelector.options.icons[customClass] !== null) {
                            span.before(icon);
                        }
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
                    .addClass("progress-bar multiselector-progress-bar multiselector-progress-bar-"+wrapperId) 
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
                    .attr("id", "multiselector-loading-container-"+wrapperId)
                    .addClass("multiselector-loading-container")
                    .addClass("multiselector-loading-container-"+wrapperId)
                    .addClass("center-block")
                    .append(loadingMessage)
                    .append(progressBarContainer);
            },
            updateProgressBarPercent: function(percent) {
                var progressBar = $(".multiselector-progress-bar-"+wrapperId);
                progressBar.width(percent + "%")
                    .text(percent + "%");
            },
            createResultsList: function () {
                return $(document.createElement("ul"))
                    .addClass("multiselector-results")
                    .addClass("multiselector-results-"+wrapperId)
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
                    .addClass("multiselector-results-container-"+wrapperId)
                    .addClass("hidden")
                    .append(results)
                    .append(loadingBarContainer);
            },
            clearList: function() {
                multiSelector.results.length = 0;
                $(".multiselector-results-"+wrapperId).empty();
            },
            createShowAllContacts: function() {
                var message = helpers.getMessage("common.item.show.all");
                var a = $(document.createElement("a"))
                    .attr("href", "#")
                    .attr("role", "menuitem")
                    .addClass("show-all-contacts")
                    .addClass("multiselector-list-item")
                    .addClass("multiselector-list-item-"+wrapperId)
                    .text(message)
                    .click(function(event) {
                        properties.showAll.setAll(true);
                        $(".show-all-"+wrapperId).addClass("btn-primary");
                        helpers.refreshList("");
                        $(event.currentTarget).remove();
                        helpers.highlightItem();
                        $("ul.multiselector-selection-"+wrapperId).find(".token-input").focus();
                    })
                    .mouseenter(function(event) {
                        $(".highlight").removeClass("highlight");
                        $(event.currentTarget).addClass("highlight");
                    });
                var li = $(document.createElement("li"))
                    .append(a);
                return li;
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
                var tokenInput = $("ul.multiselector-selection-"+wrapperId).find(".token-input");
                tokenInput.focus();
                var existingSelection = $(".multiselector-selected-item-"+wrapperId);
                if (properties.blockAdding) {
                    return;
                }

                if ($(event.currentTarget).hasClass("prevent-actions")) {
                    return;
                }

                if (existingSelection !== undefined) {
                    for (var it = 0; it < existingSelection.length; it++) {
                        if (existingSelection.eq(it).text() === $(event.currentTarget).find(".multiselector-list-item-name").text()) {
                            return;
                        }
                    }
                }

                var customClass = $(event.currentTarget).parents("li").eq(0).attr("class");
                var memberCount = $(event.currentTarget).data("member-count");
                var isCreatedItem = helpers.createSelectedItem($(event.currentTarget)
                    .find(".multiselector-list-item-name").text(), customClass, false, memberCount);

                if (!isCreatedItem) {
                    return;
                }
                tokenInput.val("");
                helpers.updateInputWidth();
                helpers.preventActionOnResults(function () {
                    helpers.findAndAddObject($(event.currentTarget));
                });
            },
            findAndAddObject: function(triggeredElement) {
                for (var i in multiSelector.results) {
                    if (!multiSelector.results.hasOwnProperty(i)) {
                        continue;
                    }
                    if (multiSelector.results[i].hasOwnProperty("members")) {
                        for (var j = 0; j < multiSelector.results[i].members.length; j++) {
                            if (multiSelector.results[i].members[j].name === triggeredElement.find(".multiselector-list-item-name").text()) {
                                var objectId = multiSelector.results[i].members[j].id;
                                multiSelector.selected.push(multiSelector.results[i].members[j]);
                                multiSelector.results[i].members.splice(j, 1);

                                triggeredElement.remove();
                                helpers.highlightItem();
                                $("ul.multiselector-selection-"+wrapperId).find(".token-input").val("").focus();
                                helpers.toggleShowAllButton(false);
				helpers.callObjectAdded(objectId);
                                helpers.updateInputWidth();

                                return;
                            }
                        }
                    }
                }
            },
	    getMatchedLiteralType: function(stringLiteral, propertyToReturn) {
		var i;
		propertyToReturn = typeof propertyToReturn !== 'undefined' ? propertyToReturn : 'name';
		for(i = 0; i < options.literals.length; i ++) {
			if(stringLiteral.match(options.literals[i].regex)) {
				return options.literals[i][propertyToReturn];
			}
		}
		return null;
	    },
            addStringLiteral: function(stringLiteral, selected, dontUpdate) {
                var literalObject = {
                    name: stringLiteral,
                    id: helpers.getMatchedLiteralType(stringLiteral, 'encode') ? encodeURIComponent(stringLiteral) : stringLiteral,
                    metadata: stringLiteral
                };
                if (helpers.addCustomContact(literalObject, selected, helpers.getMatchedLiteralType(stringLiteral)) && !dontUpdate &&
                        multiSelector.options.objectAdded && $.isFunction(multiSelector.options.objectAdded)) {
                     multiSelector.options.objectAdded(literalObject.id);
                } else {
                    helpers.clearList();
                    helpers.hideResults();
                    $("ul.multiselector-selection-"+wrapperId).find(".token-input").focus();
                }
                clearTimeout(properties.lastKeypressTimeout);
            },
            addStringLiteralEvent: function(event) {
                var input = $("ul.multiselector-selection-"+wrapperId).find(".token-input");
                var text = input.val();

                //Prevents from adding invalid number when input is manipulated by user using mouse actions cut-copy-paste
		if(text.indexOf(',') !== -1 && !helpers.getMatchedLiteralType(text, 'allowCommas')) {
			text = text.split(',')[0];
		}
		if(helpers.getMatchedLiteralType(text) === null) {
			$(event.currentTarget).remove();
			input.val("");
			helpers.hideResults();
			return;
                }

                helpers.addStringLiteral(text);
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

                if (!$(".multiselector-results-"+wrapperId).hasClass("hidden")) {
                    if ($(".show-all-contacts").length) {
                        helpers.refreshList($("ul.multiselector-selection-"+wrapperId).find(".token-input").val());
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
                properties.showAll.setAll(show);

                var showAllButton = $(".multiselector-selection-"+wrapperId+" button.show-all");
                if (show) {
                    showAllButton.addClass("btn-primary");
                    $(".multiselector-results-container-"+wrapperId).removeClass("hidden");
                    $(".multiselector-results-"+wrapperId).removeClass("hidden");
                } else {
                    showAllButton.removeClass("btn-primary");
                    helpers.hideResults();
                }
            },
            showAllContacts: function() {
            	$("ul.multiselector-selection-"+wrapperId).find(".token-input").val("").focus();

                var multiselectorResults = $(".multiselector-results-container-"+wrapperId);
                var showAll = $(".show-all-"+wrapperId);
                $('.multiselector-results.dropdown-toggle').dropdown('toggle');
                if (!multiselectorResults.hasClass("hidden") && showAll.hasClass("btn-primary")) {
                    properties.showAll.setAll(false);
                    helpers.preventActionOnResults(function() {
                        helpers.hideResults();
                    });
                    showAll.removeClass("btn-primary");
                } else {
                    properties.preventHidingRefreshedList = true;
                    properties.showAll.setAll(true);
                    showAll.addClass("btn-primary");
                    helpers.refreshList("");
                }

                properties.preventEnterKeyEvent = true;
                helpers.highlightItem();
            },
            tryAddStringLiteralSection: function () {
                var text = $("ul.multiselector-selection-"+wrapperId).find(".token-input").val();
                var addStringLiteral = $(".add-string-literal");
		var matchedLiteral = helpers.getMatchedLiteralType(text);

                if (!addStringLiteral.length && (matchedLiteral !== null)) {
		    var translationKey = "common.item.add." + matchedLiteral;
                    var addNumberElement = $(document.createElement("a"))
                        .attr("href", "#")
                        .attr("role", "menuitem")
                        .addClass("add-string-literal")
                        .addClass("multiselector-list-item")
                        .addClass("multiselector-list-item-"+wrapperId)
                        .click(helpers.addStringLiteralEvent)
                        .mouseenter(function (event) {
                            $(".highlight").removeClass("highlight");
                            $(event.currentTarget).addClass("highlight");
                        })
                        .text(helpers.getMessage(translationKey));

                    var divider = $(document.createElement("li"))
                        .addClass("divider");
                    var li = $(document.createElement("li"))
                        .append(addNumberElement)
                        .append(divider);

                    $(".multiselector-results-"+wrapperId).prepend(li);
                } else if (addStringLiteral.length && (matchedLiteral === null)) {
                    addStringLiteral.eq(0).remove();
                }
            },
            applyHideResultStatement: function (text) {
                var results = $(".multiselector-results-"+wrapperId);
                if (text.length > 0 && results.hasClass("hidden")) {
                    results.removeClass("hidden");
                } else if (!text.length) {
                    results.addClass("hidden");
                    $(".multiselector-selection-"+wrapperId+" button.show-all").removeClass("btn-primary");
                }
            },
            resetLoadedContacts: function() {
                helpers.clearList();
                properties.progressbar.loadedCount.resetAll();
                clearInterval(properties.progressbar.interval);
            },
            loadFilteredContacts: function() {
                helpers.resetLoadedContacts();
                var results = $(".multiselector-results-"+wrapperId);

                var text = $("ul.multiselector-selection-"+wrapperId).find(".token-input").val();
                if (text !== "") {
                    multiSelector.results = multiSelector.contactServiceObject.getFilteredMatches(helpers.getSelectedIDs(), text);
                    $.each(properties.objectTypeKeys, function(index, value) {
                        properties.progressbar.totalCount[value] = multiSelector.results[value].members.length;
                    });
                    $.each(properties.objectTypeKeys, function(index, value) {
                        if (!multiSelector.results[value]) {
                            return true;
                        }

                        var listElement = $("li." + value);
                        var divider = null;
                        text = $("ul.multiselector-selection-"+wrapperId).find(".token-input").val();
                        if (multiSelector.results[value].members.length > 0) {
                            if (!listElement.length) {
                                divider = $(document.createElement("li"))
                                    .addClass("divider");
                                listElement = helpers.createGroupElement(value, options.displayLimit[value]);
                                listElement.append(divider);
                                results.append(listElement);
                            } else {
                                divider = listElement.find(".divider");
                            }
                        }

                        for (var i = 0; i < multiSelector.results[value].members.length; i++) {
                            if (i === options.displayLimit[value] && !properties.showAll[value]) {
                                var itemLimitElement = helpers.createItemLimitElement(value, multiSelector.results[value].members.length);
                                divider.before(itemLimitElement);
                                break;
                            }

                            var contactObject = multiSelector.results[value].members[i];
                            contactObject.name = contactObject.name.trim();
                            var groupMemberElement = helpers.createGroupChildElement(contactObject);
                            divider.before(groupMemberElement);
                            properties.progressbar.loadedCount[value]++;
                        }
                        return true;
                    });
                }

                helpers.tryAddStringLiteralSection();
                helpers.applyHideResultStatement(text);
                results.append(helpers.createShowAllContacts());

                $("#multiselector-loading-container-"+wrapperId).addClass("hidden");
            },
            addToResults: function(objectType, objectData) {
                if (!multiSelector.results.hasOwnProperty(objectType)) {
                    multiSelector.results.push({
                        "displayName": properties.objectTypes[objectType].displayName,
                        "customCssClass": properties.objectTypes[objectType].customCssClass,
                        "members": [
                            objectData
                        ]
                    });
                } else {
                    multiSelector.results[objectType].members.push(objectData);
                }
            },
            loadContacts: function(resetAll) {
                var results = $(".multiselector-results-"+wrapperId);
                var progressBarContainer = $("#multiselector-loading-container-"+wrapperId);

                if (resetAll) {
                    helpers.resetLoadedContacts();
                    helpers.updateProgressBarPercent(0);
                    progressBarContainer.removeClass("hidden");
                }

                var highlightItemInterval = setInterval(function() {
                    if ($(".multiselector-results-"+wrapperId).length) {
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
                    var type = properties.progressbar.loadedCount.nextType();
                    if (type === null) {
                        clearInterval(properties.progressbar.interval);
                        return;
                    }

                    var listElement = $("li." + type);
                    var divider = null;
                    if (properties.progressbar.totalCount[type] > 0) {
                        if (!listElement.length) {
                            divider = $(document.createElement("li"))
                                .addClass("divider");
                            listElement = helpers.createGroupElement(type, options.displayLimit[type]);
                            listElement.append(divider);
                            results.append(listElement);
                        } else {
                            divider = listElement.find(".divider");
                        }
                    }

                    for (var i = 0; i < options.contactLoading.batchSize; i++) {
                        if (properties.progressbar.loadedCount[type] >= properties.progressbar.totalCount[type]) {
                            break;
                        }

                        var contactObject = multiSelector.results[type].members[properties.progressbar.loadedCount[type]];
                        if (contactObject !== undefined) {
                            contactObject.name = contactObject.name.trim();
                            helpers.addToResults(type, contactObject);
                            var groupMemberElement = helpers.createGroupChildElement(contactObject);
                            divider.before(groupMemberElement);
                        }
                        properties.progressbar.loadedCount[type]++;
                        helpers.updateProgressBarPercent(properties.progressbar.loadedCount.totalPercent());
                    }

                    if (properties.progressbar.loadedCount.allLoaded()) {
                        helpers.updateProgressBarPercent(100);
                        clearInterval(properties.progressbar.interval);
                    }
                }, multiSelector.options.contactLoading.intervalMs);
            },
            refreshList: function(text) {
                if ((text === undefined || text === "") && !properties.showAll.selected) {
                    helpers.hideResults();
                    return;
                }

                helpers.clearList();
                helpers.showResults();

                var progressBar = $(".multiselector-progress-bar-"+wrapperId);
                var progressBarInterval = setInterval(function () {
                    if (progressBar.text() === "100%") {
                        progressBar.parents("#multiselector-loading-container-"+wrapperId).addClass("hidden");
                        clearInterval(progressBarInterval);
                    }
                }, 100);

                if (text === "") {
                    multiSelector.results = multiSelector.contactServiceObject.getAll();
                    helpers.loadContacts(true);
                } else {
                    helpers.loadFilteredContacts();
                }
            },
            addSelectedLiterals: function(IDs, addedToSelectionArray, selected) {
                $.each(IDs, function(index, id) {
                    if (!addedToSelectionArray[index] && (helpers.getMatchedLiteralType(id))) {
                        helpers.addStringLiteral(id, selected, true);
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
                    helpers.addSelectedLiterals(IDs, isAddedToSelection, selected);
                }

                return selected;
            },
            showResults: function() {
                $(".multiselector-results-container-"+wrapperId).removeClass("hidden");
                $(".multiselector-results-"+wrapperId).removeClass("hidden");
            },
            hideResults: function() {
                var multiselectorResults = $(".multiselector-results-container-"+wrapperId);
                if (multiselectorResults.length) {
                    multiselectorResults.addClass("hidden");
                    helpers.resetLoadedContacts();
                    properties.mouseOnSelector = false;
                }
            },
            expandSingleGrouping: function(listElement) {
                var input = $("ul.multiselector-selection-"+wrapperId).find(".token-input");

                if (listElement.hasOwnProperty("currentTarget")) {
                    listElement = $(listElement.currentTarget);
                    input.focus();
                }

                var parentName = listElement.parents("li").find("span").eq(0).text();
                var types = properties.objectTypes;

                var key = null;
                for(key in types) {
                    if (!types.hasOwnProperty(key)) {
                        continue;
                    }
                    if (parentName === types[key].displayName) {
                        properties.showAll[key] = true;
                        break;
                    }
                }

                var grouping = listElement.parent().attr("class");
                var index = listElement.index();
                var resultsList = $(".multiselector-results-"+wrapperId);
                properties.mouseOnSelector = true;

                helpers.preventActionOnResults(function() {
                    helpers.refreshList($("ul.multiselector-selection-"+wrapperId).find(".token-input").val());
                    resultsList.find("li." + grouping)
                        .children().eq(index)
                        .addClass("highlight");
                    properties.mouseOnSelector = false;
                });
            },
            preventActionOnResults: function(codeToExecute, keepProgressbar) {
                var loadingContainer = $(".multiselector-loading-container-"+wrapperId).removeClass("hidden");
                var progressBar = loadingContainer.find(".progress");
                if (!keepProgressbar) {
                    progressBar.addClass("hidden");
                }
                var resultsContainer = $(".multiselector-results-container-"+wrapperId);

                var grey = $(document.createElement("div")).addClass("greyer greyer-"+wrapperId);
                resultsContainer.append(grey);
                grey.height(resultsContainer.outerHeight());

                var interval = setInterval(function() {
                    if ($(".greyer-"+wrapperId).length) {
                        clearInterval(interval);
                        var start = new Date();

                        codeToExecute();

                        if (!keepProgressbar) {
                            progressBar.removeClass("hidden");
                        }
                        grey.remove();
                        loadingContainer.addClass("hidden");
                        properties.blockAdding = true;

                        if ((new Date()) - start > 0) {
                            setTimeout(function() {
                                properties.blockAdding = false;
                            }, ((new Date()) - start)/2.0);
                        }
                    }
                }, 100);
            },
            highlightItem: function(lastItem) {
                var results = $(".multiselector-results-"+wrapperId).eq(0);
                var index = (lastItem) ? -1 : 0;
                var element = results.children().eq(index);

                $(".highlight").removeClass("highlight");

                if (element.prop("nodeName") === "LI" && $(".multiselector-list-item-"+wrapperId).length) {
                    $(".multiselector-list-item-"+wrapperId).eq(index).addClass("highlight");
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
                    	$("ul.multiselector-selection-"+wrapperId).find(".token-input").val("").focus();
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
                        var token = $("ul.multiselector-selection-"+wrapperId).find(".token").eq(-1);
                        var highlight = $(".highlight");
                        token.addClass("multiselector-selected-item").addClass("multiselector-selected-item-"+wrapperId);
                        token.addClass(e.token.customCss);
                        if (!highlight.length) {
                            token.remove();
                        } else if (highlight.hasClass("show-all-contacts")) {
                            token.remove();
                        } else if (highlight.hasClass("multiselector-list-item")) {
                            if (e.token.value !== highlight.find(".multiselector-list-item-name").text()) {
                                token.remove();
                            }
                        } else if (!highlight.hasClass("add-string-literal")) {
                            token.remove();
                        }
                    };
                } else {
                    duplicatePolicy = null;
                }
            },
            calculateStringWidth : function(str) {
				var body = $("body");
				var font = body.css("font-family");
				var str_object = $(document.createElement("div")).css({
					"position" : "absolute",
					"float" : "left",
					"white-space" : "nowrap",
					"visibility" : "hidden",
					"font-family" : font
				});
				
				str_object.text(str);
				str_object.appendTo(body);
				var str_width = str_object.width();
				str_object.remove();
				return str_width;				
			},
            getLastTokenLineWidth: function() {
                var wrapperWidth = $(".tokenfield").width();
                var width = 0;

                $("ul.multiselector-selection-"+wrapperId).find("div.tokenfield div.token").each(function(index, element) {
                    var elementWidth = $(element).outerWidth(true);
                    width += elementWidth;
                    if (width >= wrapperWidth) {
                        width = elementWidth;
                    }
                });

                return width;
            },
            updateInputWidth: function() {
                var input = $("ul.multiselector-selection-"+wrapperId).find(".token-input");
                var inputWidth = input.width();
                var parentWidth = input.parent().width();
                var text = input.val();
                var textWidth = helpers.calculateStringWidth(text);
                var lastLineWidth = helpers.getLastTokenLineWidth();
                var widthDifference = parentWidth - lastLineWidth;

                input.width(widthDifference - 50);
				input.css('display', 'inline');
                inputWidth = input.width();

                if (textWidth >= inputWidth) {
                    input.width(parentWidth);
                }
            },
            callObjectAdded: function(added, objectId, disable) {
                if (!added && helpers.getMatchedLiteralType(objectId)) {
                    helpers.addStringLiteral(objectId, multiSelector.selected);
                    added = true;
                }

                if (added && multiSelector.options.objectAdded) {
                    multiSelector.options.objectAdded(objectId);
                }

                if (added && disable) {
                    var token = $("ul.multiselector-selection-"+wrapperId).find(".token").eq(-1);
                    token.addClass("disabled");
                    token.find(".close").remove();
                    token.find(".token-label").addClass("disabled");
                }

                return added;
            },
            triggerHighlightedItem: function() {
                var highlight = $(".highlight");

                if (highlight.length) {
                    if (highlight.hasClass("multiselector-item-limit-info")) {
                        helpers.expandSingleGrouping(highlight.eq(0));
                    } else if (highlight.hasClass("show-all-contacts") || highlight.hasClass("add-string-literal")) {
                        highlight.eq(0).trigger("click");
                    } else {
                        var fakeEvent = {currentTarget: highlight.eq(0)};
                        helpers.addSelectedItem(fakeEvent);
                        helpers.updateInputWidth();
                    }
                }
            }
        };

        multiSelector.options = helpers.parseOptions(options, defaultOptions);
        multiSelector.selected = helpers.getSelectionByIDs(defaultSelection, true);

        multiSelector.addObject = function(objectId, disabled) {
            var added = false;
            var results = multiSelector.contactServiceObject.getFilteredMatches(helpers.getSelectedIDs(), "");

            // for each grouping
            for (var i in results) {
                if (!results.hasOwnProperty(i)) {
                    continue;
                }
                if (results[i].hasOwnProperty("members") && !added) {
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
            }

            return helpers.callObjectAdded(added, objectId, disabled);
        };

        multiSelector.removeObject = function(objectId) {
            for (var i = multiSelector.selected.length - 1; i >= 0; i--) {
                if (multiSelector.selected[i].id === objectId) {
                    if (multiSelector.options.objectRemoved) {
                        multiSelector.options.objectRemoved(objectId);
                    }
                    $("ul.multiselector-selection-"+wrapperId).find(".token[data-value='" + multiSelector.selected[i].name + "']").remove();
                    multiSelector.selected.splice(i, 1);
                    helpers.updateInputWidth();
                    return true;
                }
            }
            return false;
        };

        multiSelector.getSelectedCount = function() {
            return this.selected.length;
        };

        multiSelector.returnSelectedObjects = function() {
            return this.selected;
        };

        //Make public helper functions
        multiSelector.getHelperFunctions = function() {
            return helpers;
        };

        multiSelector.deepClean = function() {
            this.contactServiceObject = null;
            this.results = [];
            this.selected = [];
            $("ul.multiselector-selection-"+wrapperId).find(".token").remove();
            $("ul.multiselector-selection-"+wrapperId).find(".token-input").val("");
            multiSelector.previousText = "";
            properties.progressbar.loadedCount.resetAll();
            properties.progressbar.totalCount.resetAll();

            var resultDiv = $(".multiselector-results-"+wrapperId);
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
                var newToken = $(e.relatedTarget);
                newToken.click(function(e) {
                    var clickedSelection = $(e.currentTarget);
                    if (clickedSelection.hasClass("disabled")) {
                        clickedSelection.removeClass("active");
                    }
                });
                if (duplicatePolicy) {
                    duplicatePolicy(e);
                }
                helpers.updateInputWidth();
                helpers.setAntiduplicateSelectionPolicy(true);
            }).on("tokenfield:removetoken", function(e) {
                var activeToken = $("ul.multiselector-selection-"+wrapperId).find(".token.active");
                if (activeToken.length)
                {
                    activeToken = activeToken.eq(0);
                    if (activeToken.hasClass('disabled')) {
                        activeToken.removeClass("active");
                    }
                }
                helpers.deleteSelection(e.token.value);
                helpers.updateInputWidth();
            }).tokenfield({
		delimiter: false,
                minWidth: 0,
                allowEditing: false
            });

            var handleTabEscKeys = function() {
                properties.preventHidingRefreshedList = false;
                $("ul.multiselector-selection-"+wrapperId).find(".token-input").val("");
                helpers.preventActionOnResults(function() {
                    if (!results.hasClass("hidden") && !properties.preventHidingRefreshedList) {
                        helpers.hideResults();
                        $(".show-all-"+wrapperId).removeClass("btn-primary");
                    }
                });
                multiSelector.previousText = "";
            };

            var handleEnterKey = function(text, inputToHandle) {
                var highlight = $(".highlight");

                if (highlight.length && highlight.hasClass("disabled")) {
                    return;
                }

                if (properties.preventEnterKeyEvent) {
                    properties.preventEnterKeyEvent = false;
                    return;
                }

                if ((!text.length && !highlight.length) || $(".multiselector-results-"+wrapperId).hasClass("hidden")) {
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

                var parent = $(".multiselector-results-"+wrapperId);
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
                    var multiselectorList = $(".multiselector-list-item-"+wrapperId);
                    if (multiselectorList.eq(index).text() === currentHighlight.text()) {
                        helpers.highlightItem(keyId === 40);
                        return;
                    }

                    handleScrolling(currentHighlight, direction, index, multiselectorList);
                }
            };

            var onTextChangeRefreshList = function(text) {
                if (text !== multiSelector.previousText) {
                    properties.showAll.setAll(false);
                    $('.dropdown-toggle').filter(".multiselector-results-"+wrapperId).dropdown('toggle');
                    $(".show-all-"+wrapperId).removeClass("btn-primary");
                    helpers.refreshList(text);
                }
            };

            var fitInputSize = function(text) {
                if (text !== "") {
                    helpers.updateInputWidth();
                    $("ul.multiselector-selection-"+wrapperId).find(".token-input").focus();
                }
            };

            var preventLeftDisableSelection = function() {
                var activeToken = $("ul.multiselector-selection-"+wrapperId).find(".token.active").first();
                if (activeToken.length && activeToken.hasClass("disabled")) {
                    activeToken.removeClass("active");
                    var previous = activeToken.prevAll("div").not("[class*='disabled']").first();
                    var token = (previous.length) ? previous : activeToken.next();
                    token.addClass("active");
                }
            };

            var preventRightDisableSelection = function() {
                var activeToken = $("ul.multiselector-selection-"+wrapperId).find(".token.active").first();
                if (activeToken.length && activeToken.hasClass("disabled")) {
                    activeToken.removeClass("active");
                    var next = activeToken.nextAll("div").not("[class*='disabled']").first();
                    if (next.length) {
                        next.addClass("active");
                    } else {
                    	$("ul.multiselector-selection-"+wrapperId).find(".token-input").focus();
                    }
                }
            };

            var handleKeyUp = function(e) {
                var keyId = e.keyCode;
                input = $("ul.multiselector-selection-"+wrapperId).find(".token-input");
                var text = input.val();
                properties.blockAdding = false;

                if (keyId === 13 || keyId == 188) {
                    // Enter/Return and comma
                    if (keyId === 188) {
                        properties.preventEnterKeyEvent = false;
			if(helpers.getMatchedLiteralType(text, 'allowCommas')) {
			    return;
			}
			if(text.indexOf(',') !== -1) {
				text = text.split(',')[0];
			}
			if(helpers.getMatchedLiteralType(text) !== null) {
			    handleEnterKey(text, input);
			    return;
			}
                    }
                    handleEnterKey(text, input);
                    if (properties.preventEnterKeyEvent) {
                        properties.preventEnterKeyEvent = true;
                    }
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
                } else if (keyId === 37 || keyId === 8) {
                    //Left arrow or backspace
                    preventLeftDisableSelection();
                } else if (keyId === 39) {
                    //Right arrow
                    preventRightDisableSelection();
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

                if (keyId === 27) {
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
		helpers.callObjectAdded(multiSelector.selected[i].id);
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

            $(".show-all-"+wrapperId)
                .mouseenter(function() {
                    properties.mouseOnSelector = true;
                }).mouseleave(function() {
                    properties.mouseOnSelector = false;
                });

            $(".input-group-btn-"+wrapperId)
                .focusin(function() {
                    properties.focusedOnShowAll = true;
                }).focusout(function() {
                    properties.focusedOnShowAll = false;
                });

            $("ul.multiselector-selection-"+wrapperId).find(".token-input").focusout(function () {
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
