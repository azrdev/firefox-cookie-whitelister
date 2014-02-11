let nativeWindow = require('./nativewindow');
let tabs = require('sdk/tabs');
let urls = require('sdk/url');

//var _ = require("sdk/l10n").get;
function _(str) { return str; } //TODO: l10n

const {Cu, Ci} = require("chrome");
let permissions = Cu.import("resource://gre/modules/Services.jsm").Services.perms;

nativeWindow.addMenu({
    label: _("Cookie-Whitelist"),
    callback: function() {
        askCookieChange(tabs.activeTab.url);
    }
})


const doorhangerID = "cwa-doorhanger";

function askCookieChange(fullURL) {
    let urlObj = urls.URL(fullURL);
    let hostURL = urls.URL(urlObj.scheme + "://" + urlObj.host);
    if(hostURL == null) {
        nativeWindow.showToast({message: _("Failed to get hostname.")});
        return false;
    }
    console.log("Asking for permissions of site " + hostURL);

    buttons = [];
    button_allow = {
        label: _("Permanently"),
        callback: function() {
            console.info("Add permanently to cookie whitelist: \"" + hostURL + "\"");
            permissions.add(hostURL, "cookie", Ci.nsICookiePermission.ACCESS_ALLOW);
            nativeWindow.showToast({message: _("Added Site permanently to Cookie Whitelist")});
        }
    };
    button_session = {
        label: _("Only this session"),
        callback: function() {
            console.info("Add temporarily to cookie whitelist: \"" + hostURL + "\"");
            permissions.add(hostURL, "cookie", Ci.nsICookiePermission.ACCESS_SESSION);
            nativeWindow.showToast({message: _("Added Site for this session to Cookie Whitelist")});
        }
    };
    button_delete = {
        label: _("Delete permission"),
        callback: function() {
            console.info("Remove from cookie whitelist: \"" + hostURL + "\"");
            permissions.add(hostURL, "cookie", Ci.nsICookiePermission.ACCESS_DEFAULT);
            nativeWindow.showToast({message: _("Removed Site from Cookie Whitelist")});
        }
    };

    //FIXME: testPermission seems not to return / silently abort - nothing below it is executed
    switch (permissions.testPermission(hostURL, "cookie")) {
    case Ci.nsICookiePermission.ACCESS_SESSION:
        console.log("current permission: session");
        buttons.push(button_allow);
        buttons.push(button_delete);
        break;
    case Ci.nsICookiePermission.ACCESS_ALLOW:
        console.log("current permission: allow");
        buttons.push(button_session);
        buttons.push(button_delete);
        break;
    default:
        console.log("current permission: default");
        buttons.push(button_allow);
        buttons.push(button_session);
        // button_delete here could be useful in case of errors
    }
    nativeWindow.showDoorhanger({
        label: _("Allow Cookies for this site?"),
        id: doorhangerID,
        buttons: buttons,
        tabId: tabs.activeTab.id
    });
}

// vim:set ts=4 sts=4 sw=4 et :

