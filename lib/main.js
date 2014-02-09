let nativeWindow = require('./nativewindow');
let tabs = require('sdk/tabs');

//var _ = require("sdk/l10n").get;
function _(str) { return str; } //TODO: l10n

const {Cu} = require("chrome");
Cu.import("resource://gre/modules/Services.jsm");

nativeWindow.addMenu({
    label: _("Cookie-Whitelist"),
    callback: function() {
        askCookieChange(tabs.activeTab.url);
    }
})


const doorhangerID = "cwa-doorhanger";

function askCookieChange(url) {
    let siteURI = url;
    if(siteURI == null) {
        nativeWindow.showToast({message: _("Failed to get hostname.")});
        return false;
    }

    buttons = [];
    button_allow = {
        label: _("Permanently"),
        callback: function() {
            console.log("Add permanently to cookie whitelist: \"" + siteURI + "\"");
            Services.perms.add(siteURI, "cookie", Ci.nsICookiePermission.ACCESS_ALLOW);
            nativeWindow.showToast({message: _("Added Site permanently to Cookie Whitelist")});
        }
    };
    button_session = {
        label: _("Only this session"),
        callback: function() {
            console.log("Add temporarily to cookie whitelist: \"" + siteURI + "\"");
            Services.perms.add(siteURI, "cookie", Ci.nsICookiePermission.ACCESS_SESSION);
            nativeWindow.showToast({message: _("Added Site for this session to Cookie Whitelist")});
        }
    };
    button_delete = {
        label: _("Delete permission"),
        callback: function() {
            console.log("Remove from cookie whitelist: \"" + siteURI + "\"");
            Services.perms.add(siteURI, "cookie", Ci.nsICookiePermission.ACCESS_DEFAULT);
            nativeWindow.showToast({message: _("Removed Site from Cookie Whitelist")});
        }
    };

    switch (Services.perms.testPermission(siteURI, "cookie")) {
    case Ci.nsICookiePermission.ACCESS_SESSION:
        buttons.push(button_allow);
        buttons.push(button_delete);
        break;
    case Ci.nsICookiePermission.ACCESS_ALLOW:
        buttons.push(button_session);
        buttons.push(button_delete);
        break;
    default:
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

