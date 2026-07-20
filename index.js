/**
 * companion-module-dalite-screen
 * Da-Lite motorized projection screen — Up / Down / Stop via HTTP.
 *
 * The Da-Lite web controller accepts plain HTTP GET requests.
 * URL format: http://<host>:<port><path>&<pass_param>=<password>
 *
 * Because different Da-Lite firmware revisions use slightly different
 * URL paths, the paths are configurable in the module settings.
 * Use your browser's DevTools (F12 → Network tab) to discover the
 * exact paths your controller uses.
 */

const { InstanceBase, Regex, runEntrypoint } = require('@companion-module/base')

class DaLiteScreenInstance extends InstanceBase {
    constructor(internal) {
        super(internal)
    }

    // ---------------------------------------------------------------------------
    // Lifecycle
    // ---------------------------------------------------------------------------

    async init(config) {
        this.config = config
        this.updateStatus('ok')
        this.initActions()
        this.initPresets()
    }

    async destroy() {
        // Nothing persistent to clean up
    }

    async configUpdated(config) {
        this.config = config
        this.updateStatus('ok')
    }

    // ---------------------------------------------------------------------------
    // Config Fields
    // ---------------------------------------------------------------------------

    getConfigFields() {
        return [
            {
                type: 'textinput',
                id: 'host',
                label: 'IP Address / Hostname',
                width: 8,
                default: '',
                regex: Regex.SOMETHING,
            },
            {
                type: 'number',
                id: 'port',
                label: 'Port',
                width: 4,
                default: 80,
                min: 1,
                max: 65535,
            },
            {
                type: 'textinput',
                id: 'password',
                label: 'Password',
                width: 6,
                default: '',
            },
            {
                type: 'static-text',
                id: 'url_hint',
                label: 'URL Path Configuration',
                value:
                    'Enter the URL path for each screen command below. ' +
                    'The password will be appended automatically as ?<param>=<password> ' +
                    '(or &<param>=<password> if a ? already exists in the path). ' +
                    'Use F12 → Network tab in your browser on the screen\'s web page to discover the correct paths.',
                width: 12,
            },
            {
                type: 'textinput',
                id: 'up_path',
                label: 'Up Command Path',
                width: 12,
                default: '/cgi-bin/screen?cmd=up',
            },
            {
                type: 'textinput',
                id: 'dn_path',
                label: 'Down Command Path',
                width: 12,
                default: '/cgi-bin/screen?cmd=dn',
            },
            {
                type: 'textinput',
                id: 'st_path',
                label: 'Stop Command Path',
                width: 12,
                default: '/cgi-bin/screen?cmd=st',
            },
            {
                type: 'textinput',
                id: 'pass_param',
                label: 'Password Parameter Name',
                width: 4,
                default: 'pass',
            },
        ]
    }

    // ---------------------------------------------------------------------------
    // HTTP helper
    // ---------------------------------------------------------------------------

    /**
     * Build and send a GET request to the screen controller.
     * @param {string} path  URL path (may already contain query params)
     */
    async sendCommand(path) {
        if (!this.config.host) {
            this.log('warn', 'No host configured')
            return
        }

        const port = this.config.port || 80
        const passParam = this.config.pass_param || 'pass'
        const password = this.config.password || ''

        // Append password param — use & if path already has a ?, else use ?
        const separator = path.includes('?') ? '&' : '?'
        const url = `http://${this.config.host}:${port}${path}${separator}${encodeURIComponent(passParam)}=${encodeURIComponent(password)}`

        this.log('debug', `Sending: GET ${url}`)

        try {
            const response = await fetch(url, {
                method: 'GET',
                signal: AbortSignal.timeout(5000),
            })

            if (!response.ok) {
                this.log('warn', `HTTP ${response.status} from screen controller`)
            } else {
                this.log('debug', `HTTP ${response.status} OK`)
            }
        } catch (err) {
            this.log('error', `Request failed: ${err.message}`)
        }
    }

    // ---------------------------------------------------------------------------
    // Actions
    // ---------------------------------------------------------------------------

    initActions() {
        this.setActionDefinitions({
            screen_up: {
                name: 'Screen Up',
                options: [],
                callback: async () => {
                    await this.sendCommand(this.config.up_path || '/cgi-bin/screen?cmd=up')
                },
            },

            screen_down: {
                name: 'Screen Down',
                options: [],
                callback: async () => {
                    await this.sendCommand(this.config.dn_path || '/cgi-bin/screen?cmd=dn')
                },
            },

            screen_stop: {
                name: 'Screen Stop',
                options: [],
                callback: async () => {
                    await this.sendCommand(this.config.st_path || '/cgi-bin/screen?cmd=st')
                },
            },
        })
    }

    // ---------------------------------------------------------------------------
    // Presets
    // ---------------------------------------------------------------------------

    initPresets() {
        this.setPresetDefinitions([
            {
                type: 'button',
                category: 'Screen',
                name: 'Screen Up',
                style: {
                    text: 'SCREEN\n▲ UP',
                    size: '18',
                    color: 0xffffff,
                    bgcolor: 0x004400,
                },
                feedbacks: [],
                steps: [
                    {
                        down: [{ actionId: 'screen_up', options: {} }],
                        up: [],
                    },
                ],
            },
            {
                type: 'button',
                category: 'Screen',
                name: 'Screen Down',
                style: {
                    text: 'SCREEN\n▼ DOWN',
                    size: '18',
                    color: 0xffffff,
                    bgcolor: 0x000044,
                },
                feedbacks: [],
                steps: [
                    {
                        down: [{ actionId: 'screen_down', options: {} }],
                        up: [],
                    },
                ],
            },
            {
                type: 'button',
                category: 'Screen',
                name: 'Screen Stop',
                style: {
                    text: 'SCREEN\n■ STOP',
                    size: '18',
                    color: 0xffffff,
                    bgcolor: 0x444400,
                },
                feedbacks: [],
                steps: [
                    {
                        down: [{ actionId: 'screen_stop', options: {} }],
                        up: [],
                    },
                ],
            },
        ])
    }
}

runEntrypoint(DaLiteScreenInstance, [])
