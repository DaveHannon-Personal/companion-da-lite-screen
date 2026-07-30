/**
 * companion-module-dalite-screen
 * Da-Lite motorized projection screen — Up / Down / Stop / Preset via SSH (clish).
 *
 * Connects to the screen controller over SSH and sends clish commands.
 */

const { InstanceBase, Regex, runEntrypoint } = require('@companion-module/base')
const { Client } = require('ssh2')

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
                type: 'static-text',
                id: 'conn_header',
                label: 'SSH Connection',
                value: 'Connection details for the screen controller.',
                width: 12,
            },
            {
                type: 'textinput',
                id: 'host',
                label: 'IP Address / Hostname',
                width: 8,
                default: '192.168.88.148',
                regex: Regex.SOMETHING,
            },
            {
                type: 'number',
                id: 'port',
                label: 'SSH Port',
                width: 4,
                default: 22,
                min: 1,
                max: 65535,
            },
            {
                type: 'textinput',
                id: 'username',
                label: 'Username',
                width: 6,
                default: 'admin',
            },
            {
                type: 'textinput',
                id: 'password',
                label: 'Password',
                width: 6,
                default: 'nhopecc6',
            },
        ]
    }

    // ---------------------------------------------------------------------------
    // SSH helper
    // ---------------------------------------------------------------------------

    /**
     * Open an SSH connection, execute a single clish command, then close.
     * @param {string} command  The clish command string to execute
     */
    sendCommand(command) {
        return new Promise((resolve, reject) => {
            if (!this.config.host) {
                this.log('warn', 'No host configured')
                return resolve()
            }

            const conn = new Client()

            conn.on('ready', () => {
                this.log('debug', `SSH connected — sending: ${command}`)
                conn.exec(command, (err, stream) => {
                    if (err) {
                        conn.end()
                        return reject(err)
                    }

                    let stderr = ''
                    stream.stderr.on('data', (data) => { stderr += data })

                    stream.on('close', (code) => {
                        conn.end()
                        if (code !== 0) {
                            this.log('warn', `Command exited with code ${code}${stderr ? ': ' + stderr.trim() : ''}`)
                        } else {
                            this.log('debug', `Command OK (exit 0)`)
                        }
                        resolve()
                    })
                })
            })

            conn.on('error', (err) => {
                this.log('error', `SSH error: ${err.message}`)
                reject(err)
            })

            conn.connect({
                host: this.config.host,
                port: this.config.port || 22,
                username: this.config.username || 'admin',
                password: this.config.password || '',
                readyTimeout: 5000,
                // Accept any host key — the controller may not have a known_hosts entry
                hostVerifier: () => true,
            })
        }).catch((err) => {
            this.log('error', `sendCommand failed: ${err.message}`)
        })
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
                    await this.sendCommand('screen move up\r')
                },
            },

            screen_down: {
                name: 'Screen Down',
                options: [],
                callback: async () => {
                    await this.sendCommand('screen move down\r')
                },
            },

            screen_stop: {
                name: 'Screen Stop',
                options: [],
                callback: async () => {
                    await this.sendCommand('screen move stop\r')
                },
            },

            screen_preset1: {
                name: 'Screen Preset 1',
                options: [],
                callback: async () => {
                    await this.sendCommand('screen preset recall 1\r')
                },
            },

            screen_preset2: {
                name: 'Screen Preset 2',
                options: [],
                callback: async () => {
                    await this.sendCommand('screen preset recall 2\r')
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
                steps: [{ down: [{ actionId: 'screen_up', options: {} }], up: [] }],
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
                steps: [{ down: [{ actionId: 'screen_down', options: {} }], up: [] }],
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
                steps: [{ down: [{ actionId: 'screen_stop', options: {} }], up: [] }],
            },
            {
                type: 'button',
                category: 'Screen',
                name: 'Screen Preset 1',
                style: {
                    text: 'SCREEN\nPRESET 1',
                    size: '18',
                    color: 0xffffff,
                    bgcolor: 0x003344,
                },
                feedbacks: [],
                steps: [{ down: [{ actionId: 'screen_preset1', options: {} }], up: [] }],
            },
            {
                type: 'button',
                category: 'Screen',
                name: 'Screen Preset 2',
                style: {
                    text: 'SCREEN\nPRESET 2',
                    size: '18',
                    color: 0xffffff,
                    bgcolor: 0x330044,
                },
                feedbacks: [],
                steps: [{ down: [{ actionId: 'screen_preset2', options: {} }], up: [] }],
            },
        ])
    }
}

runEntrypoint(DaLiteScreenInstance, [])
