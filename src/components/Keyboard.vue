<template lang="pug">
  .keyboard-container
    .keyboard-header
      select(@change="onInstrumentTypeChange($event)" v-model="instrumentType")
        option(value="midi") MIDI
        option(value="simple") Simple Instrument

    .keyboard
      KeyNote(v-for="([note, {color}], index) in Object.entries(notes)" :key="note" :note="note" :color="color" :isBlack="isBlackKey(note)" :isActive="activeNotes.includes(note)" :class="{ black: isBlackKey(note) }"  @note-on="handleNoteOn" @note-off="handleNoteOff") @note-off="handleNoteOff")
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import KeyNote from './KeyNote.vue'
import { AudioInstrument } from '../utils/audioInstrument.js'

export default {
  components: {
    KeyNote,
  },
  setup() {
    const notes = ref({
      C: { color: 'rgb(255, 0, 0)', midi: 60 },
      'C#': { color: 'rgb(255,105, 180)', midi: 61 },
      D: { color: 'rgb(255, 165, 0)', midi: 62 },
      'D#': { color: 'rgb(255, 20, 147)', midi: 63 },
      E: { color: 'rgb(255, 255, 0)', midi: 64 },
      F: { color: 'rgb(0, 255, 0)', midi: 65 },
      'F#': { color: 'rgb(0, 191, 255)', midi: 66 },
      G: { color: 'rgb(0, 0, 255)', midi: 67 },
      'G#': { color: 'rgb(128, 0, 128)', midi: 68 },
      A: { color: 'rgb(75, 0, 130)', midi: 69 },
      'A#': { color: 'rgb(210, 180, 140)', midi: 70 },
      B: { color: 'rgb(238, 130, 238)', midi: 71 },
    })
    const activeNotes = ref([])
    const programs = ref(['Piano', 'Guitar', 'Violin', 'Flute', 'Drums']) // Example program names
    const selectedProgram = ref(0) // Default to the first program
    const instrumentType = ref('simple') // Default to MIDI
    let midiAccess = null
    let output = null
    const simpleInstrument = new AudioInstrument()

    onMounted(async () => {
      try {
        midiAccess = await navigator.requestMIDIAccess()
        output = Array.from(midiAccess.outputs.values())[0] // Get the first available MIDI output
      } catch (err) {
        console.error('Could not access MIDI devices:', err)
      }
    })

    const noteToMidi = (note) => notes.value[note].midi

    const handleNoteOn = (note) => {
      if (!activeNotes.value.includes(note)) {
        activeNotes.value.push(note)
        if (instrumentType.value === 'midi') {
          const midiNote = noteToMidi(note)
          if (output) {
            output.send([0x90, midiNote, 0x7f]) // Note on, velocity 127
          }
        } else {
          simpleInstrument.playNote(note)
        }
      }
    }

    const handleNoteOff = (note) => {
      activeNotes.value = activeNotes.value.filter((n) => n !== note)
      if (instrumentType.value === 'midi') {
        const midiNote = noteToMidi(note)
        if (output) {
          output.send([0x80, midiNote, 0x40]) // Note off, velocity 64
        }
      } else {
        simpleInstrument.stopNote(note)
      }
    }

    const changeInstrument = (programNumber) => {
      if (output) {
        output.send([0xc0, programNumber]) // Program change message
      }
    }

    const onProgramChange = (event) => {
      selectedProgram.value = parseInt(event.target.value)
      changeInstrument(selectedProgram.value)
    }

    const onInstrumentTypeChange = (event) => {
      instrumentType.value = event.target.value
    }

    const selectedProgramName = computed(() => programs.value[selectedProgram.value])

    const isBlackKey = (note) => note.length > 1

    return {
      notes,
      activeNotes,
      programs,
      selectedProgram,
      selectedProgramName,
      instrumentType,
      handleNoteOn,
      handleNoteOff,
      onProgramChange,
      onInstrumentTypeChange,
      isBlackKey,
    }
  },
}
</script>

<style lang="stylus">
.keyboard-container
  display flex
  flex-direction column
  align-items center
  justify-content center
  height 100vh
  width 100vw
  padding 20px
  box-sizing border-box

.keyboard-header
  margin-bottom 20px

.keyboard
  display flex
  flex-direction row
  justify-content center
  width 100%
  max-width 800px
  position relative

.key-note
  position relative
  width 40px
  height 150px
  border 1px solid #000
  z-index 1


.key-note.black
  width 30px
  height 100px
  background-color #000
  margin-left -15px
  margin-right -15px
  z-index 2
</style>
