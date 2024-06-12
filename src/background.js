'use strict';
chrome.runtime.onConnect.addListener(function (port) {
    if (port.name === "misadvc") {
        port.onMessage.addListener(function (msg) {
            if (msg) {
                switch (msg.type) {
                    case "insert":
                        port.postMessage({ type: msg.type, index: msg.index });
                        break;
                    case "deleteOldFinish":
                        port.postMessage({ type: msg.type });
                        break;
                }
            }
        });
    }
});