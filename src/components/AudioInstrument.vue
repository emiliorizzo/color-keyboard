<template lang="pug">
    .audio-instrument
        .audio-instrument-controls
            .audio-instrument-controls-item
                label Preset
                select(v-model="selectedPreset" @change="onPresetChange")
                    option(v-for="preset in presets" :value="preset.name" :key="preset.name") {{ preset.name }}
            .audio-instrument-controls-item
                label Oscillator Type
                select(v-model="oscillatorType")
                    option(v-for="type in oscillatorTypes" :value="type" :key="type") {{ type }}
            .audio-instrument-controls-item
                label Detune
                input(type="range" min="-100" max="100" step="1" v-model.number="detune")
                span {{ detune }}
            .audio-instrument-controls-item
                label Attack
                input(type="range" min="0" max="1" step="0.01" v-model.number="attack")
                span {{ attack }}
            .audio-instrument-controls-item
                label Decay
                input(type="range" min="0" max="1" step="0.01" v-model.number="decay")
                span {{ decay }}
            .audio-instrument-controls-item
                label Sustain
                input(type="range" min="0" max="1" step="0.01" v-model.number="sustain")
                span {{ sustain }}
            .audio-instrument-controls-item
                label Release
                input(type="range" min="0" max="1" step="0.01" v-model.number="release")
            .audio-instrument-controls-item
                label Filter Frequency
                input(type="range" min="20" max="20000" step="1" v-model.number="filterFrequency")
                span {{ filterFrequency }}
            .audio-instrument-controls-item
                label Filter Q
                input(type="range" min="0.1" max="20" step="0.1" v-model.number="filterQ")
                span {{ filterQ }}
</template>

<script>
import { reactive, onMounted, onBeforeUnmount, ref, watch } from 'vue'

export default {
  name: 'AudioInstrument',
  props: {
    gainValue: {
      type: Number,
      default: 1,
    },
  },

  setup() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillators = reactive({})
    const gainNodes = reactive({})

    const noteToFrequency = (note) => {
      if (!note || !note.midi) {
        throw new Error(`Invalid note object: ${note}`)
      }
      const midiNumber = note.midi
      return 440 * Math.pow(2, (midiNumber - 69) / 12)
    }

    const oscillatorTypes = ['sine', 'square', 'sawtooth', 'triangle']
    const oscillatorType = ref(oscillatorTypes[0])

    // Presets for different instruments
    const presets = [
      {
        name: 'Guitar',
        oscillatorType: 'sawtooth',
        attack: 0.02,
        decay: 0.3,
        sustain: 0.5,
        release: 0.2,
        detune: 0,
      },
      {
        name: 'Piano',
        oscillatorType: 'triangle',
        attack: 0.01,
        decay: 0.2,
        sustain: 0.6,
        release: 0.3,
        detune: 0,
      },
      {
        name: 'Custom', // Custom preset
        oscillatorType: '',
        attack: 0,
        decay: 0,
        sustain: 0,
        release: 0,
        detune: 0,
      },
    ]

    // Reactive properties for sound controls
    const detune = ref(0) // Default detune
    const attack = ref(0.01)
    const decay = ref(0.1)
    const sustain = ref(0.7)
    const release = ref(0.1)
    const selectedPreset = ref('Custom')

    // Reactive properties for filter controls
    const filterFrequency = ref(1000) // Default filter frequency
    const filterQ = ref(1) // Default filter Q

    const validateEnvelopeValue = (value, defaultValue) => {
      return typeof value === 'number' && isFinite(value) && value >= 0 ? value : defaultValue
    }

    let isApplyingPreset = false

    const applyPreset = (presetName) => {
      const preset = presets.find((p) => p.name === presetName)
      if (preset) {
        isApplyingPreset = true
        oscillatorType.value = preset.oscillatorType || oscillatorType.value
        attack.value = preset.attack
        decay.value = preset.decay
        sustain.value = preset.sustain
        release.value = preset.release
        detune.value = preset.detune
        setTimeout(() => {
          isApplyingPreset = false
        }, 0) // Re-enable watcher after preset is applied
      }
    }

    const playNote = (note) => {
      if (!oscillators[note.name]) {
        const frequencyValue = noteToFrequency(note)
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        // Create a low-pass filter
        const filter = audioContext.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.setValueAtTime(filterFrequency.value, audioContext.currentTime)
        filter.Q.setValueAtTime(filterQ.value, audioContext.currentTime)

        oscillator.type = oscillatorType.value
        oscillator.frequency.setValueAtTime(frequencyValue, audioContext.currentTime)
        oscillator.detune.setValueAtTime(detune.value, audioContext.currentTime)

        // Connect nodes
        oscillator.connect(filter)
        filter.connect(gainNode)
        gainNode.connect(audioContext.destination)

        // Validate envelope values
        const validAttack = validateEnvelopeValue(attack.value, 0.01)
        const validDecay = validateEnvelopeValue(decay.value, 0.1)
        const validSustain = validateEnvelopeValue(sustain.value, 0.7)

        // Adjust gain to prevent clipping
        gainNode.gain.setValueAtTime(0, audioContext.currentTime)
        gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + validAttack) // Lower peak gain
        gainNode.gain.linearRampToValueAtTime(
          validSustain * 0.3,
          audioContext.currentTime + validAttack + validDecay,
        ) // Lower sustain gain

        oscillator.start()
        oscillators[note.name] = oscillator
        gainNodes[note.name] = gainNode
      }
    }

    const stopNote = (note) => {
      if (oscillators[note.name]) {
        const gainNode = gainNodes[note.name]
        const now = audioContext.currentTime

        // Validate release value
        const validRelease = validateEnvelopeValue(release.value, 0.1)

        // Release phase
        gainNode.gain.cancelScheduledValues(now)
        gainNode.gain.setValueAtTime(gainNode.gain.value, now)
        gainNode.gain.linearRampToValueAtTime(0, now + validRelease)

        setTimeout(() => {
          if (oscillators[note.name]) {
            oscillators[note.name].stop()
            oscillators[note.name].disconnect()
            gainNode.disconnect()
            delete oscillators[note.name]
            delete gainNodes[note.name]
          } else {
            console.warn(`Oscillator for note ${note.name} not found during stopNote cleanup.`)
          }
        }, validRelease * 1000)
      } else {
        console.warn(`Oscillator for note ${note.name} not found when attempting to stop.`)
      }
    }

    onMounted(() => {
      // Any setup logic that needs to run when the component is mounted
    })

    onBeforeUnmount(() => {
      // Clean up any active oscillators and gain nodes
      Object.keys(oscillators).forEach((name) => {
        if (oscillators[name]) {
          oscillators[name].stop()
          oscillators[name].disconnect()
        }
        if (gainNodes[name]) {
          gainNodes[name].disconnect()
        }
      })
    })

    const onOscillatorTypeChange = (event) => {
      oscillatorType.value = event.target.value
    }

    const onPresetChange = (event) => {
      applyPreset(event.target.value)
    }

    // Watch for changes in parameters and set preset to "Custom"
    watch([oscillatorType, attack, decay, sustain, release, detune], () => {
      if (!isApplyingPreset) {
        selectedPreset.value = 'Custom'
      }
    })

    return {
      playNote,
      stopNote,
      oscillatorTypes,
      onOscillatorTypeChange,
      onPresetChange,
      oscillatorType,
      detune,
      attack,
      decay,
      sustain,
      release,
      presets,
      selectedPreset,
      filterFrequency,
      filterQ,
    }
  },
}
</script>

<style scoped lang="stylus">
.audio-instrument-controls
   margin 2em
   font-size 0.8em
   border 1px solid #ccc
   border-radius 0.5em
   padding 1em
   label
    margin-right 0.5em
   .audio-instrument-controls-item
    margin .5em 1em
</style>
