let nativeWindow = require('./nativewindow');
let tabs = require('sdk/tabs');
let urls = require('sdk/url');

//var _ = require("sdk/l10n").get;
function _(str) { return str; } //TODO: l10n

//TODO: move to extra module
const {Cu, Ci} = require("chrome");
const permissions = Cu.import("resource://gre/modules/Services.jsm", {}).Services.perms;
const netUtils = Cu.import("resource://gre/modules/NetUtil.jsm", {}).NetUtil;

//FIXME: remove this, too (e.g. on addon unload)
nativeWindow.addMenu({
    label: _("Cookie-Whitelist"),
    callback: function() {
        askCookieChange(tabs.activeTab.url);
    }
});

const doorhangerID = "cwa-doorhanger";

function askCookieChange(fullURL) {

    // prepare the host uri
    let hostUrl = null;
    let hostUrl_wrapped = null;
    try {
        // the original uri as sdk-url (javascript object)
        let urlObj = urls.URL(fullURL);
        // strip the path - get the host as uri
        hostUrl = urls.URL(urlObj.scheme + "://" + urlObj.host);
        if(hostUrl == null) {
            nativeWindow.showToast({message: _("Failed to get hostname.")});
            return false;
        }

        console.log("Asking for permissions of site " + hostUrl);
        // convert to nsIURI
        hostUrl_wrapped = netUtils.newURI(hostUrl);
    } catch (e) {
        console.warn("Error converting url to nsIURI: " + e);
    }

    // assemble the possible options
    buttons = [];
    button_allow = {
        label: _("Permanently"),
        callback: function() {
            console.info("Add permanently to cookie whitelist: \"" + hostUrl + "\"");
            permissions.add(hostUrl_wrapped, "cookie", Ci.nsICookiePermission.ACCESS_ALLOW);
            nativeWindow.showToast({message: _("Added Site permanently to Cookie Whitelist")});
        }
    };
    button_session = {
        label: _("Only this session"),
        callback: function() {
            console.info("Add temporarily to cookie whitelist: \"" + hostUrl + "\"");
            permissions.add(hostUrl_wrapped, "cookie", Ci.nsICookiePermission.ACCESS_SESSION);
            nativeWindow.showToast({message: _("Added Site for this session to Cookie Whitelist")});
        }
    };
    button_delete = {
        label: _("Delete permission"),
        callback: function() {
            console.info("Remove from cookie whitelist: \"" + hostUrl + "\"");
            permissions.add(hostUrl_wrapped, "cookie", Ci.nsICookiePermission.ACCESS_DEFAULT);
            nativeWindow.showToast({message: _("Removed Site from Cookie Whitelist")});
        }
    };

    // query current permissions
    let perm = null;
    try {
        perm = permissions.testPermission(hostUrl_wrapped, "cookie");
    } catch(e) {
        console.log("testPermission throws " + e);
    }

    // assemble options i.e. buttons to show, based on current permissions
    switch (perm) {
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

    // show query with above buttons
    nativeWindow.showDoorhanger({
        label: _("Allow Cookies for this site?"),
        id: doorhangerID,
        buttons: buttons,
        tabId: tabs.activeTab.id
    });
}

// vim:set ts=4 sts=4 sw=4 et :

