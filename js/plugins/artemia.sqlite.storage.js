/**
 * Created by k33g_org.
 * User: k33g_org
 * Date: 5/1/11
 * --=>>>|:<
 */

/* 05/01/11
    jslint
        white: true, onevar: true, browser: true, undef: true,
        nomen: true, regexp: true, plusplus: true, bitwise: true,
        newcap: true, maxerr: 50, indent: 4

        Error:
        Problem at line 128 character 57: Unexpected '--'.

        for (i = recs.rows.length; i--;) {

        => but it is faster

        Unused variable: tx 98 "resultsHandler", tx 115 "resultsHandler", tx 126 "resultsHandler", callback 153 "drop"

        => tx (transaction is mandatory)
        => callback with drop : TODO

*/

var artemia = (function (cyste) {

    function getSqLiteStore(storeName, storeType) {
        return {
            storeType : storeType,
            storeName : storeName,
            dataBase : null,

            isAvailable : function () {
                try {
                    var that = this;
                    // instantiate the store only once time
                    if (!artemia[storeName]) { artemia[storeName] = window.openDatabase('Artemia', '1.0', 'ARTEMIADB', 65536); }
                    this.dataBase = artemia[storeName];

                    this.dataBase.transaction(function (tx) {
                        var s_create = "CREATE TABLE IF NOT EXISTS  " + that.storeName + "(UniqueId TEXT UNIQUE PRIMARY KEY,SerializedObject TEXT)";
                        tx.executeSql(s_create, [], null, null);
                    });
                } catch (err) {
                    if (err === 2) {
                        // Version number mismatch.
                        throw ("Invalid database version");

                    } else {
                        /*return false;*/ /*not available*/
                        throw ("Unknown error " + err);
                    }
                }
                return true;
            },

            save : function (obj, callback) {
                var update, insert, that = this;

                update = function (obj, callback) {
                    that.dataBase.transaction(function (tx) {
                        tx.executeSql(
                            "UPDATE " + that.storeName + " SET SerializedObject = ? WHERE UniqueId = ?;",
                            [JSON.stringify(obj), obj.key],
                            callback(obj),
                            null
                        );
                    });
                };

                insert = function (obj, callback) {
                    that.dataBase.transaction(function (tx) {
                        tx.executeSql(
                            "INSERT INTO " + that.storeName + " (UniqueId, SerializedObject) VALUES (?, ?);",
                            [obj.key || cyste.guidGenerator(), JSON.stringify(obj)],
                            callback(obj),
                            null
                        );
                    });
                };

                if (obj.key === undefined) {
                    /* --- insert --- */
                    insert(obj, callback);

                } else {
                    /* --- insert or update --- */
                    this.get(obj.key, function (r) {
                        if (r === null) {
                            /* --- insert --- */
                            insert(obj, callback);
                        } else {
                            /* --- update --- */
                            update(obj, callback);
                        }
                    });
                }
            },

            get : function (key, callback) {
                var that = this;
                that.dataBase.transaction(function (tx) {
                    var qString = "SELECT SerializedObject FROM " + that.storeName + " WHERE UniqueId= ?;",
                        resultsHandler = function (tx, recs) {
                            var obj = {};
                            if (recs.rows.length > 0) {
                                obj = JSON.parse(recs.rows.item(0).SerializedObject);
                            } else { obj = null; }
                            callback(obj);
                        };
                    tx.executeSql(qString, [key], resultsHandler, function () {});
                });
            },

            remove : function (keyOrObject, callback) {
                var that = this;
                /*TODO: have to verify if exists before delete*/
                that.database.transaction(function (tx) {
                    var qString = "DELETE FROM " + that.storeName + " WHERE UniqueId= ?;",
                        key = typeof keyOrObject === 'string' ? keyOrObject : keyOrObject.key,
                        resultsHandler = function (tx) {
                            callback(key);
                        };
                    tx.executeSql(qString, key, resultsHandler, function () {});
                });
            },

            all : function (callback) {
                var that = this;
                that.dataBase.transaction(function (tx) {
                    var qString = "SELECT * FROM " + that.storeName + ";",
                        resultsHandler = function (tx, recs) {
                            var results = [], obj = {}, i, row;
                            for (i = recs.rows.length; i--;) {
                                row = recs.rows.item(i);
                                //obj = JSON.parse(row['SerializedObject']);
                                obj = JSON.parse(row.SerializedObject);
                                results.push(obj);
                            }
                            //if (obj) {obj.key = key; callback(obj); } else { callback(null); }
                            callback(results);
                        };
                    tx.executeSql(qString, [], resultsHandler, function () {});
                });
            },

            nuke : function (callback) {
                var that = this;
                that.dataBase.transaction(function (tx) {
                    var qString = "DELETE FROM " + that.storeName + ";",
                        resultsHandler = function () {
                            callback();
                        };
                    tx.executeSql(qString, [], resultsHandler, function () {});
                });

            },

            drop : function (callback) {
                /* TODO: DROP ... */
            },


            query : function (map, callback) {
                var results = [], res;
                this.all(function (r) {
                    var m;
                    for (m in r) {
                        if (r.hasOwnProperty(m)) {
                            res = map(r[m]);
                            if (res) { results.push(res); }
                        }

                    }
                    callback(results);
                });
                //if (callback) { callback(results); }

                return {
                    sum : function (callback) {
                        res = cyste.sum(results);
                        if (callback) { callback(res); }
                        return res;
                    },
                    min : function (callback) {
                        res = cyste.min(results);
                        if (callback) { callback(res); }
                        return res;
                    },
                    max : function (callback) {
                        res = cyste.max(results);
                        if (callback) { callback(res); }
                        return res;
                    }
                };

            }

        };
    }

    /*===========================================
        Navigator : WebKit

        sqLiteStorage
    ===========================================*/

    /*the _UPPER_ is a convention*/
    cyste.get_SQLITE_store = function (baseName, storeType) {
        var store = getSqLiteStore(baseName, storeType);
        cyste.interfaceIsImplemented(store);
        if (!store.isAvailable()) { store = null; }
        return store;
    };

    return cyste;
}(artemia));
