export class AudioInstrument {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
        this.oscillators = {}
        this.gainNodes = {}
    }

    noteToFrequency(note) {
        if (!note || !note.midi) {
            throw new Error(`Invalid note object: ${note}`)
        }
        const midiNumber = note.midi // Access the MIDI number from the note object
        return 440 * Math.pow(2, (midiNumber - 69) / 12)
    }

    playNote(note) {
        if (!this.oscillators[note.name]) {
            const frequency = this.noteToFrequency(note) // Pass the entire note object
            const oscillator = this.audioContext.createOscillator()
            const gainNode = this.audioContext.createGain()

            oscillator.type = 'sine' // You can change this to 'square', 'sawtooth', 'triangle'
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime)
            oscillator.connect(gainNode)
            gainNode.connect(this.audioContext.destination)

            // Fade in
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime)
            gainNode.gain.linearRampToValueAtTime(1, this.audioContext.currentTime + 0.01)

            oscillator.start()
            this.oscillators[note.name] = oscillator
            this.gainNodes[note.name] = gainNode
        }
    }

    stopNote(note) {
        if (this.oscillators[note.name]) {
            const gainNode = this.gainNodes[note.name]

            // Fade out
            gainNode.gain.setValueAtTime(1, this.audioContext.currentTime)
            gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.01)

            setTimeout(() => {
                this.oscillators[note.name].stop()
                this.oscillators[note.name].disconnect()
                gainNode.disconnect()
                delete this.oscillators[note.name]
                delete this.gainNodes[note.name]
            }, 20) // Wait for fade out to complete
        }
    }
} 