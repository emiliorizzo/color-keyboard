export class AudioInstrument {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
        this.oscillators = {}
        this.gainNodes = {}
    }

    noteToFrequency(note) {
        const noteMap = {
            'C': 261.63, // Frequency for Middle C
            'C#': 277.18,
            'D': 293.66,
            'D#': 311.13,
            'E': 329.63,
            'F': 349.23,
            'F#': 369.99,
            'G': 392.00,
            'G#': 415.30,
            'A': 440.00, // Frequency for A4
            'A#': 466.16,
            'B': 493.88,
        }
        return noteMap[note]
    }

    playNote(note) {
        if (!this.oscillators[note]) {
            const frequency = this.noteToFrequency(note)
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
            this.oscillators[note] = oscillator
            this.gainNodes[note] = gainNode
        }
    }

    stopNote(note) {
        if (this.oscillators[note]) {
            const gainNode = this.gainNodes[note]

            // Fade out
            gainNode.gain.setValueAtTime(1, this.audioContext.currentTime)
            gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.01)

            setTimeout(() => {
                this.oscillators[note].stop()
                this.oscillators[note].disconnect()
                gainNode.disconnect()
                delete this.oscillators[note]
                delete this.gainNodes[note]
            }, 20) // Wait for fade out to complete
        }
    }
} 