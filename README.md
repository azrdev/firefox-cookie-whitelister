firefox-cookie-whitelister
=====

This is a copy/fork of the [Cookie Whitelist, With Buttons](https://addons.mozilla.org/en-US/firefox/addon/cookie-whitelist-with-buttons/) addon for Firefox, to Fennec / Firefox Mobile.
It allows users to easily add/remove sites to the whitelist of cookie-allowed sites maintained by the browser. They should generally disallow cookies by themselves, the addon doesn't do that.

The 'sdk' branch is a try to port the addon to mozillas addon-sdk, which should become the official way to build addons. The plain bootstrap.js method at least makes it a hassle to support l10n.
