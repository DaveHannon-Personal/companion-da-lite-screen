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
        this.conn = null
        this.stream = null
        this.reconnectTimer = null
    }

    // ---------------------------------------------------------------------------
    // Lifecycle
    // ---------------------------------------------------------------------------

    async init(config) {
        this.config = config
        this.initActions()
        this.initPresets()
        this.connect()
    }

    async destroy() {
        this.cancelReconnect()
        if (this.conn) {
            this.conn.end()
            this.conn = null
            this.stream = null
        }
    }

    async configUpdated(config) {
        this.config = config
        this.cancelReconnect()
        if (this.conn) {
            this.conn.end()
            this.conn = null
            this.stream = null
        }
        this.connect()
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
    // Persistent SSH connection
    // ---------------------------------------------------------------------------

    cancelReconnect() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer)
            this.reconnectTimer = null
        }
    }

    connect() {
        if (!this.config.host) {
            this.updateStatus('bad_config', 'No host configured')
            return
        }

        this.updateStatus('connecting')
        this.log('info', `Connecting to ${this.config.host}:${this.config.port || 22}`)

        const conn = new Client()
        this.conn = conn

        conn.on('ready', () => {
            this.log('info', 'SSH connected — opening shell')
            conn.shell((err, stream) => {
                if (err) {
                    this.log('error', `Failed to open shell: ${err.message}`)
                    this.updateStatus('connection_failure', err.message)
                    this.scheduleReconnect()
                    return
                }

                this.stream = stream
                this.updateStatus('ok')
                this.log('info', 'Shell ready — commands will fire immediately')

                stream.on('data', (data) => {
                    this.log('debug', `Device: ${data.toString().replace(/[\r\n]+/g, ' ').trim()}`)
                })

                stream.stderr.on('data', (data) => {
                    this.log('warn', `Device stderr: ${data.toString().trim()}`)
                })

                stream.on('close', () => {
                    this.log('warn', 'Shell closed — will reconnect')
                    this.stream = null
                    this.conn = null
                    this.updateStatus('connection_failure', 'Shell closed')
                    this.scheduleReconnect()
                })
            })
        })

        conn.on('error', (err) => {
            this.log('error', `SSH error: ${err.message}`)
            this.stream = null
            this.conn = null
            this.updateStatus('connection_failure', err.message)
            this.scheduleReconnect()
        })

        conn.connect({
            host: this.config.host,
            port: this.config.port || 22,
            username: this.config.username || 'admin',
            password: this.config.password || '',
            readyTimeout: 5000,
            hostVerifier: () => true,
        })
    }

    scheduleReconnect() {
        this.cancelReconnect()
        this.log('info', 'Reconnecting in 5 seconds...')
        this.reconnectTimer = setTimeout(() => this.connect(), 5000)
    }

    // ---------------------------------------------------------------------------
    // Send command on persistent shell — no delay, fires immediately
    // ---------------------------------------------------------------------------

    sendCommand(command) {
        if (!this.stream) {
            this.log('warn', `Cannot send "${command}" — not connected`)
            return
        }
        this.log('info', `Sending: ${command}`)
        this.stream.write(command + '\n')
    }

    // ---------------------------------------------------------------------------
    // Actions
    // ---------------------------------------------------------------------------

    initActions() {
        this.setActionDefinitions({
            screen_up: {
                name: 'Screen Up',
                options: [],
                callback: () => { this.sendCommand('screen move up') },
            },

            screen_down: {
                name: 'Screen Down',
                options: [],
                callback: () => { this.sendCommand('screen move down') },
            },

            screen_stop: {
                name: 'Screen Stop',
                options: [],
                callback: () => { this.sendCommand('screen move stop') },
            },

            screen_preset1: {
                name: 'Screen Preset 1',
                options: [],
                callback: () => { this.sendCommand('screen preset recall 1') },
            },

            screen_preset2: {
                name: 'Screen Preset 2',
                options: [],
                callback: () => { this.sendCommand('screen preset recall 2') },
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
