


(function() {
    var originalRegisterFooterTabs = UI.registerFooterTabs;
    $.extend(UI, {
        registerFooterTabs: function () {
            originalRegisterFooterTabs.apply(this);
            SegmentActions.registerTab('messages', true, true);
        },
        getContextBefore: function(segmentId) {
            let $segment = $('#segment-' + segmentId);
            let segmentObj;
            let phraseKeyNote;
            try {
                segmentObj = SegmentStore.getSegmentByIdToJS(segmentId, UI.getSegmentFileId($segment));
                phraseKeyNote = segmentObj.notes.find((item) => {
                    return item.note.indexOf("phrase_key|¶|") >= 0;
                });
            } catch (e) {
                return null;
            }

            if (phraseKeyNote) {
                return phraseKeyNote.note
            } else {
                return null;
            }
        },
        getContextAfter: function(segmentId) {
            return ""
        },
        getIdBefore: function(segmentId) {
            var segment = $('#segment-' + segmentId);
            var originalId = segment.attr('data-split-original-id');
            var segmentBefore = (function  findBefore(segment) {
                var before = segment.prev();
                if (before.length === 0 ) {
                    return undefined;
                }
                else if (before.attr('data-split-original-id') !== originalId) {
                    return before;
                } else {
                    return findBefore(before);
                }

            })(segment);
            // var segmentBefore = findSegmentBefore();
            if (_.isUndefined(segmentBefore)) {
                return null;
            }
            var segmentBeforeId = UI.getSegmentId(segmentBefore);
            return segmentBeforeId;
        },
        getIdAfter: function(segmentId) {
            var segment = $('#segment-' + segmentId);
            var originalId = segment.attr('data-split-original-id');
            var segmentAfter = (function findAfter(segment) {
                var after = segment.next();
                if (after.length === 0 ) {
                    return undefined;
                }
                else if (after.attr('data-split-original-id') !== originalId) {
                    return after;
                } else {
                    return findAfter(after);
                }

            })(segment);
            if (_.isUndefined(segmentAfter)) {
                return null;
            }
            var segmentAfterId = UI.getSegmentId(segmentAfter);
            return segmentAfterId;
        },
    });
    function overrideTabMessages( SegmentTabMessages ) {
        SegmentTabMessages.prototype.getNotes = function (  ) {
            let notesHtml = [];
            let self = this;
            if (this.props.notes) {
                this.props.notes.forEach(function (item, index) {
                    if ( item.note && item.note !== "" ) {
                        if (item.note.indexOf("¶") === -1) {
                            let split = item.note.split(":");
                            if ( split.length > 1) {
                                let html = <div className="note" key={"note-" + index}>
                                    <span className="note-label">{split[0]}:</span>
                                    <span dangerouslySetInnerHTML={self.allowHTML( split[1] )}/>
                                </div>;
                                notesHtml.push( html );
                            }
                        }

                    }
                });
            }
            if (this.props.segmentSource.indexOf('||||') > -1) {
                let targetPrefix = config.target_rfc.split('-')[0];
                let langLike;
                _.forOwn(PLURAL_TYPE_NAME_TO_LANGUAGES, function(value, key) {
                    if ( value.indexOf(targetPrefix) !== -1 ) {
                        langLike = key;
                        return false;
                    }
                });
                if ( !_.isUndefined(langLike) && PLURAL_TYPES[langLike] ) {
                    let rules = PLURAL_TYPES[langLike];
                    let html = <div className="note" key="forms">
                        <span className="note-label">Plural forms: </span>
                        <span dangerouslySetInnerHTML={self.allowHTML(rules.num_forms)}/>
                    </div>;
                    notesHtml.push( html );
                    if ( rules.doc && rules.doc.length ) {
                        html = <div className="note" key="rules">
                            <span className="note-label">Rules for smart count: </span>
                            <span dangerouslySetInnerHTML={self.allowHTML(rules.doc.join(" |||| "))}/>
                        </div>;
                        notesHtml.push( html );
                    }
                }
            }
            if (notesHtml.length === 0) {
                let html = <div className="note" key={"note-0"}>
                    There are no notes available
                </div>;
                notesHtml.push(html);
            }
            return notesHtml;
        }

        var PLURAL_TYPES = {

            "chinese_like" : {

                "num_forms" : 1,

                "doc" : null,

                "rule" : "lambda { |n| 0 }"

            },

            "german_like" : {

                "num_forms": 2,

                "doc" : ["When count is 1", "Everything else (0, 2, 3, ...)"],


                "rule" : "lambda { |n| n != 1 ? 1 : 0 }",

            },


            "french_like" : {

                "num_forms" : 2,

                "doc" : ["When count is 0 or 1", "Everything else (2, 3, 4, ...)"],

                "rule" : "lambda { |n| n > 1 ? 1 : 0 }",

            },


            "russian_like" : {

                "num_forms" : 3,

                "doc" : ["When count ends in 1, excluding 11 (1, 21, 31, ...)", "When count ends in 2-4, excluding 12-14 (2, 3, 4, 22, ...)", "Everything else (0, 5, 6, ...)"],

                "rule" : "lambda { |n| n % 10 == 1 && n % 100 != 11 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2 }"

            },

            "czech_like" : {

                "num_forms" : 3,

                "doc" : ["When count is 1", "When count is 2, 3, 4", "Everything else (0, 5, 6, ...)"],

                "rule" : "lambda { |n| (n == 1) ? 0 : (n >= 2 && n <= 4) ? 1 : 2 }"

            },

            "polish_like" : {

                "num_forms" : 3,

                "doc" : ["When count is 1", "When count ends in 2-4, excluding 12-14 (2, 3, 4, 22, ...)", "Everything else (0, 5, 6, ...)"],

                "rule" : "lambda { |n| (n == 1 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2) }"

            },

            "icelandic_like" : {

                "num_forms" : 2,

                "doc" : ["When count ends in 1, excluding 11 (1, 21, 31, ...)", "Everything else (0, 2, 3, ...)"],

                "rule" : "lambda { |n| (n % 10 != 1 || n % 100 == 11) ? 1 : 0 }"

            },

            "arabic_like" : {

                "num_forms" : 6,

                "doc" : [

                    "When count is 0",

                    "When count is 1",

                    "When count is 2",

                    "When count is a number like 3~10, 103~110, 1003, …",

                    "When count is a number like 11~26, 111, 1011, …",

                    "When count is a number like 100~102, 200~202, 300~302, 400~402, 500~502, 600, 1000, 10000, 100000, 1000000, …",

                ],

                "rule" : "lambda { |n| n == 0 ? 0 : n == 1 ? 1 : n == 2 ? 2 : n % 100 >= 3 && n % 100 <= 10 ? 3 : n % 100 >= 11 ? 4 : 5"

            },

        }



        var PLURAL_TYPE_NAME_TO_LANGUAGES = {

            "chinese_like" : ["id", "ja", "ko", "ms", "th", "tr", "vi", "zh", "zh-TW"],

            "german_like" : ["da", "de", "en", "es", "fi", "el", "ca", "he", "hu", "it", "nl", "no", "nn", "nb", "pt", "sv"],

            "french_like" : ["fr", "tl"],

            "russian_like" : ["hr", "ru"],

            "czech_like" : ["cs"],

            "polish_like" : ["pl"],

            "icelandic_like" : ["is"],

            "arabic_like" : ["ar"],

        };
    }

    function overrideGetMessages( SegmentsContainer ) {
        SegmentsContainer.prototype.getSegments = function (  ) {
            let items = [];
            let collectionsTypeArray = [];
            let self = this;
            let isReviewImproved = !!(this.props.isReviewImproved);
            let isReviewExtended = !!(this.props.isReviewExtended);
            let getCollectionType = function ( segment ) {
                let collectionType;
                if (segment.notes) {
                    segment.notes.forEach(function (item, index) {
                        if ( item.note && item.note !== "" ) {
                            if (item.note.indexOf("Collection Name: ") !== -1) {
                                let split = item.note.split(": ");
                                if ( split.length > 1) {
                                    collectionType = split[1];
                                }
                            }
                        }
                    });
                }
                return collectionType;
            };
            this.state.segments.forEach(function (segImmutable, index) {
                let segment = segImmutable.toJS();
                let collectionType = getCollectionType(segment);
                if (collectionsTypeArray.indexOf(collectionType) === -1) {
                    let collectionTypeSeparator = <div id="" className="collection-type-separator" key={collectionType+index}>
                        Collection Name: <b>{collectionType}</b></div>;
                    items.push(collectionTypeSeparator);
                    collectionsTypeArray.push(collectionType);
                }
                let item = <Segment
                    key={segment.sid}
                    segment={segment}
                    timeToEdit={self.state.timeToEdit}
                    fid={self.props.fid}
                    isReviewImproved={isReviewImproved}
                    isReviewExtended={isReviewExtended}
                    enableTagProjection={self.props.enableTagProjection}
                    decodeTextFn={self.props.decodeTextFn}
                    tagLockEnabled={self.state.tagLockEnabled}
                    tagModesEnabled={self.props.tagModesEnabled}
                    speech2textEnabledFn={self.props.speech2textEnabledFn}
                    reviewType={self.props.reviewType}
                    setLastSelectedSegment={self.setLastSelectedSegment.bind(self)}
                    setBulkSelection={self.setBulkSelection.bind(self)}
                />;
                items.push(item);
            });
            return items;
        }
    }

    function overrideSetDefaultTabOpen( SegmentFooter ) {
        SegmentFooter.prototype.setDefaultTabOpen = function (  ) {
            return false;
        }
    }
    
    overrideTabMessages(SegmentTabMessages);
    overrideGetMessages(SegmentsContainer);
    overrideSetDefaultTabOpen(SegmentFooter);





})() ;