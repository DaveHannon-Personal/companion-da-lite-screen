## Da-Lite Screen

Control a Da-Lite motorized projection screen (Up, Down, Stop) via its built-in HTTP web controller.

### Requirements

- Companion 4.x or newer
- A Da-Lite screen with a network/web controller connected to your LAN
- The controller's IP address

### Setup

1. Add this module from the Connections page in Companion.
2. Enter the **IP Address** and **Port** (usually 80) of the screen controller.
3. Enter the **Password** (if your controller has one set).
4. Fill in the three URL paths — see **Discovering URL Paths** below.

### Discovering the URL Paths

Because different Da-Lite firmware versions use different URL formats, the paths are configurable. To find yours:

1. Open the screen controller's web page in Chrome or Edge: `http://<IP>`
2. Press **F12** and go to the **Network** tab.
3. Click the **Up**, **Down**, and **Stop** buttons in the web UI.
4. Note the URLs that appear in the Network tab — copy the path portion (everything after the hostname) into the corresponding field in Companion, leaving out the password parameter (Companion appends it automatically).

**Example paths** (your controller may differ):
- `/cgi-bin/screen?cmd=up`
- `/cgi-bin/screen?cmd=dn`
- `/cgi-bin/screen?cmd=st`

The **Password Parameter Name** field controls how the password is appended to the URL (e.g. `pass` → `?pass=yourpassword`). Check the network capture to confirm the correct parameter name.

### Actions

| Action | Description |
|--------|-------------|
| Screen Up | Raises the screen |
| Screen Down | Lowers the screen |
| Screen Stop | Stops the screen mid-travel |

### Notes

- The module has no status feedback — Da-Lite HTTP controllers are fire-and-forget.
- If commands are not working, check the debug log (Companion → Help → Logs) to see the exact URL being sent.
- If your controller uses Basic Authentication instead of a query-parameter password, contact support to adjust the module.
