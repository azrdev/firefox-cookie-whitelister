let nativeWindow = require('./nativewindow');
let tabs = require('sdk/tabs');
let urls = require('sdk/url');

//TODO: move to extra module
const {Cu, Ci} = require("chrome");
const permissions = Cu.import("resource://gre/modules/Services.jsm", {}).Services.perms;
const netUtils = Cu.import("resource://gre/modules/NetUtil.jsm", {}).NetUtil;

//var _ = require("sdk/l10n").get;
function _(str) { return str; } //TODO: l10n

let menuId = null;

/** main function - addon startup */
exports.main = function(options, callbacks) {
    //FIXME: how often is this called? for each getMostRecentBrowserWindow() ? if only once, why does every window have the menu item?
    // load menu item
    menuId = nativeWindow.addMenu({
        label: _("Cookie-Whitelist"),
        callback: function() {
            askCookieChange(tabs.activeTab.url);
        }
    });

    if(menuId == null) {
        console.warn("Could not add menu item: add() returned null");
    }
};

/** unLoad function - addon shutdown */
exports.onUnload = function(reason) {
    // remove menu item
    if(menuId != null) {
        nativeWindow.removeMenu(menuId);
    } else {
        console.debug("Could not remove menu item: menuId was null");
    }
};

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
        // button_delete here could be useful in case of errors, but as of FF41 at most 2 buttons are possible
    }
    /*
     * At most one non-positive button will be shown, so make the first option the "preferred" one
     * See https://developer.mozilla.org/en-US/Add-ons/Firefox_for_Android/API/NativeWindow/doorhanger#show%28%29
     */
    buttons[0].positive = true;

    // show query with above buttons
    nativeWindow.showDoorhanger({
        label: _("Allow Cookies for this site?"),
        id: doorhangerID,
        buttons: buttons,
        tabId: tabs.activeTab.id //FIXME: doorhanger is shown always on switching to a tab
    });
}

// vim:set ts=4 sts=4 sw=4 et :

