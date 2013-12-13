/*jslint browser: true*/
/*global WebSocket, DOMParser, ActiveXObject, jQuery*/
(function ($) {
    "use strict";

    var ProstieZvonki, Event, Message;

    /**
     * Parse xml string to xml document
     * @link http://goessner.net/download/prj/jsonxml/
     * @param  string   xml
     * @return Document
     */
    function parseXml(a){var b=null;if(window.DOMParser)try{b=(new DOMParser).parseFromString(a,"text/xml")}catch(c){b=null}else if(window.ActiveXObject)try{b=new ActiveXObject("Microsoft.XMLDOM"),b.async=!1,b.loadXML(a)||(b=null)}catch(d){b=null}return b}

    /**
     * atob and btoa shim
     * Copyright (C) 1999 Masanao Izumo <iz@onicos.co.jp>
     * Version: 1.0
     * LastModified: Dec 25 1999
     * This library is free.  You can redistribute it and/or modify it.
     * @link http://code.google.com/p/gflot/source/browse/trunk/flot/base64.js?r=153
     */
    (function(){function c(b){var c,d,e,f,g,h;for(e=b.length,d=0,c="";e>d;){if(f=255&b.charCodeAt(d++),d==e){c+=a.charAt(f>>2),c+=a.charAt((3&f)<<4),c+="==";break}if(g=b.charCodeAt(d++),d==e){c+=a.charAt(f>>2),c+=a.charAt((3&f)<<4|(240&g)>>4),c+=a.charAt((15&g)<<2),c+="=";break}h=b.charCodeAt(d++),c+=a.charAt(f>>2),c+=a.charAt((3&f)<<4|(240&g)>>4),c+=a.charAt((15&g)<<2|(192&h)>>6),c+=a.charAt(63&h)}return c}function d(a){var c,d,e,f,g,h,i;for(h=a.length,g=0,i="";h>g;){do c=b[255&a.charCodeAt(g++)];while(h>g&&-1==c);if(-1==c)break;do d=b[255&a.charCodeAt(g++)];while(h>g&&-1==d);if(-1==d)break;i+=String.fromCharCode(c<<2|(48&d)>>4);do{if(e=255&a.charCodeAt(g++),61==e)return i;e=b[e]}while(h>g&&-1==e);if(-1==e)break;i+=String.fromCharCode((15&d)<<4|(60&e)>>2);do{if(f=255&a.charCodeAt(g++),61==f)return i;f=b[f]}while(h>g&&-1==f);if(-1==f)break;i+=String.fromCharCode((3&e)<<6|f)}return i}var a="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",b=Array(-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,62,-1,-1,-1,63,52,53,54,55,56,57,58,59,60,61,-1,-1,-1,-1,-1,-1,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,-1,-1,-1,-1,-1,-1,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,-1,-1,-1,-1,-1);window.btoa||(window.btoa=c),window.atob||(window.atob=d)})();

    Event = function () {
        this.type = null;
    };

    Event.prototype.isTransfer = function () {
        return this.type === '1';
    };

    Event.prototype.isIncoming = function () {
        return this.type === '2';
    };

    Event.prototype.isHistory = function () {
        return this.type === '4';
    };

    Event.prototype.isOutcoming = function () {
        return this.type === '8';
    };

    Event.prototype.isOutcomingAnswer = function () {
        return this.type === '16';
    };

    Event.prototype.isIncomingAnswer = function () {
        return this.type === '32';
    };

    Message = function (string, use_ssl) {
        if (!use_ssl) {
            string = atob(string);
        }

        this.body = $(parseXml(string));
    };

    Message.prototype.getEvents = function () {
        var events = [];

        this.body.find('Event').each(function () {
            var event = new Event();

            $.each(this.attributes, function (index, attr) {
                event[attr.name] = attr.value.trim();
            });

            events.push(event);
        });

        return events;
    };

    Message.prepareRequest = function (method_name, data_string, use_ssl) {
        var request = '<Request><ProtocolVersion>1</ProtocolVersion><Method>' + method_name + '</Method><RequestID>0</RequestID><Data>' + data_string + '</Data></Request>';

        if (!use_ssl) {
            request = btoa(request);
        }

        return request;
    };

    ProstieZvonki = function () {
        var user_phone = '',
            websocket  = null,
            host       = null,
            use_ssl    = false,
            callbacks  = {},
            max_password_length = 32;

        function normalizeHost(host) {
            var defaults = {
                port: '10150',
                prefix: 'wss'
            };

            if (host.match(/:\d+$/) === null) {
                host = host + ':' + defaults.port;
            }

            if (host.match(/^wss?p?:\/\//) === null) {
                host = defaults.prefix + '://' + host;
            }

            return host;
        }

        function normalizePassword(password) {
            return btoa(password || '');
        }

        this.version = '1.0.2';

        /**
         * Set user phone
         * 
         * @deprecated user phone should be set via params in connect method
         * @param string phone
         */
        this.setUserPhone = function (phone) {
            user_phone = phone;
        };

        this.connect = function (params) {
            host    = normalizeHost(params.host);
            use_ssl = host.indexOf('wss') === 0;

            if (params.client_id && params.client_id.length > max_password_length) {
                return {
                    result: 'error',
                    text: 'Password exceeds max length of ' + max_password_length
                };
            }

            user_phone = params.user_phone || user_phone;

            var connection_url = host
                                 + '?CID=' + normalizePassword(params.client_id)
                                 + '&CT=' + params.client_type
                                 + '&GID=' + user_phone
                                 + '&PhoneNumber=' + user_phone
                                 + '&BroadcastEventsMask=0'
                                 + '&BroadcastGroup=' + (params.broadcast_group || '')
                                 + '&PzProtocolVersion=1';

            websocket = new WebSocket(connection_url);

            websocket.onopen = function (e) {
                if (callbacks.onConnect && typeof callbacks.onConnect === 'function') {
                    callbacks.onConnect(e);
                }
            };

            websocket.onclose = function (e) {
                if (callbacks.onDisconnect && typeof callbacks.onDisconnect === 'function') {
                    callbacks.onDisconnect(e);
                }
            };

            websocket.onmessage = function (e) {
                var i, message, events;

                if (e.data === undefined) {
                    return false;
                }

                message = new Message(e.data, use_ssl);
                events  = message.getEvents();

                for (i = 0; i < events.length; i += 1) {
                    if (callbacks.onEvent && typeof callbacks.onEvent === 'function') {
                        callbacks.onEvent(events[i]);
                    }
                }
            };

            return {
                result: 'ok'
            };
        };

        this.disconnect = function () {
            websocket && websocket.close();
        };

        this.isConnected = function () {
            return websocket && websocket.readyState === 1;
        };

        this.onConnect = function (callback) {
            callbacks.onConnect = callback;
        };

        this.onDisconnect = function (callback) {
            callbacks.onDisconnect = callback;
        };

        this.onEvent = function (callback) {
            callbacks.onEvent = callback;
        };

        this.call = function (number) {
            websocket.send(Message.prepareRequest(
                'Call',
                '<From>' + user_phone + '</From><To>' + number + '</To>',
                use_ssl
            ));
        };

        this.transfer = function (call_id, number) {
            websocket.send(Message.prepareRequest(
                'Transfer',
                '<CallID>' + call_id + '</CallID><To>' + (number || '') + '</To>',
                use_ssl
            ));
        };
    };

    window.pz = window.prostiezvonki = new ProstieZvonki();
}(jQuery));