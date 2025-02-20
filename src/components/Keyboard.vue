<template lang="pug">
  .keyboard-container
    .keyboard-header
      select(@change="onInstrumentTypeChange($event)" v-model="instrumentType")
        option(value="midi") MIDI
        option(value="simple") Simple Synthesizer
    AudioInstrument(v-if="instrumentType === 'simple'" ref="simpleInstrument")
    .keyboard
      KeyNote(v-for="(noteObj, note) in notes" :key="note" :note="{ name: note, key: getKeyFromNote(note), ...noteObj }" :isBlack="isBlackKey(note)" :isActive="activeNotes.includes(note)" :class="{ black: isBlackKey(note) }" @note-on="handleNoteOn" @note-off="handleNoteOff")
</template>

<script>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import KeyNote from './KeyNote.vue'
import AudioInstrument from './AudioInstrument.vue'

export default {
  components: {
    KeyNote,
    AudioInstrument,
  },
  setup() {
    const notes = ref({
      // Second octave
      C2: { color: 'rgb(255, 0, 0)', midi: 36 },
      'C#2': { color: 'rgb(255,105, 180)', midi: 37 },
      D2: { color: 'rgb(255, 165, 0)', midi: 38 },
      'D#2': { color: 'rgb(255, 20, 147)', midi: 39 },
      E2: { color: 'rgb(255, 255, 0)', midi: 40 },
      F2: { color: 'rgb(0, 255, 0)', midi: 41 },
      'F#2': { color: 'rgb(0, 191, 255)', midi: 42 },
      G2: { color: 'rgb(0, 0, 255)', midi: 43 },
      'G#2': { color: 'rgb(128, 0, 128)', midi: 44 },
      A2: { color: 'rgb(75, 0, 130)', midi: 45 },
      'A#2': { color: 'rgb(210, 180, 140)', midi: 46 },
      B2: { color: 'rgb(238, 130, 238)', midi: 47 },
      // Third octave
      C3: { color: 'rgb(255, 0, 0)', midi: 48 },
      'C#3': { color: 'rgb(255,105, 180)', midi: 49 },
      D3: { color: 'rgb(255, 165, 0)', midi: 50 },
      'D#3': { color: 'rgb(255, 20, 147)', midi: 51 },
      E3: { color: 'rgb(255, 255, 0)', midi: 52 },
      F3: { color: 'rgb(0, 255, 0)', midi: 53 },
      'F#3': { color: 'rgb(0, 191, 255)', midi: 54 },
      G3: { color: 'rgb(0, 0, 255)', midi: 55 },
      'G#3': { color: 'rgb(128, 0, 128)', midi: 56 },
      A3: { color: 'rgb(75, 0, 130)', midi: 57 },
      'A#3': { color: 'rgb(210, 180, 140)', midi: 58 },
      B3: { color: 'rgb(238, 130, 238)', midi: 59 },
      // Fourth octave
      C4: { color: 'rgb(255, 0, 0)', midi: 60 },
      'C#4': { color: 'rgb(255,105, 180)', midi: 61 },
      D4: { color: 'rgb(255, 165, 0)', midi: 62 },
      'D#4': { color: 'rgb(255, 20, 147)', midi: 63 },
      E4: { color: 'rgb(255, 255, 0)', midi: 64 },
      F4: { color: 'rgb(0, 255, 0)', midi: 65 },
      'F#4': { color: 'rgb(0, 191, 255)', midi: 66 },
      G4: { color: 'rgb(0, 0, 255)', midi: 67 },
      'G#4': { color: 'rgb(128, 0, 128)', midi: 68 },
      A4: { color: 'rgb(75, 0, 130)', midi: 69 },
      'A#4': { color: 'rgb(210, 180, 140)', midi: 70 },
      B4: { color: 'rgb(238, 130, 238)', midi: 71 },
      // Fifth octave
      C5: { color: 'rgb(255, 0, 0)', midi: 72 },
    })
    const activeNotes = ref([])
    const programs = ref(['Piano', 'Guitar', 'Violin', 'Flute', 'Drums']) // Example program names
    const selectedProgram = ref(0) // Default to the first program
    const instrumentType = ref('simple') // Default to MIDI
    let midiAccess = null
    let output = null
    const simpleInstrument = ref(null)

    const keyToNoteMap = {
      a: 'C3',
      w: 'C#3',
      s: 'D3',
      e: 'D#3',
      d: 'E3',
      f: 'F3',
      t: 'F#3',
      g: 'G3',
      y: 'G#3',
      h: 'A3',
      u: 'A#3',
      j: 'B3',
      k: 'C4',
      o: 'C#4',
      l: 'D4',
      p: 'D#4',
      ';': 'E4',
      "'": 'F4',
    }

    const getKeyFromNote = (note) => {
      return Object.keys(keyToNoteMap).find((key) => keyToNoteMap[key] === note)
    }

    onMounted(async () => {
      try {
        midiAccess = await navigator.requestMIDIAccess()
        output = Array.from(midiAccess.outputs.values())[0] // Get the first available MIDI output
      } catch (err) {
        console.error('Could not access MIDI devices:', err)
      }

      window.addEventListener('keydown', handleKeyDown)
      window.addEventListener('keyup', handleKeyUp)
    })

    const handleKeyDown = (event) => {
      const noteName = keyToNoteMap[event.key.toLowerCase()]
      if (noteName && !activeNotes.value.includes(noteName)) {
        handleNoteOn(noteName)
      }
    }

    const handleKeyUp = (event) => {
      const noteName = keyToNoteMap[event.key.toLowerCase()]
      if (noteName && activeNotes.value.includes(noteName)) {
        handleNoteOff(noteName)
      }
    }

    const handleNoteOn = (noteName) => {
      const note = notes.value[noteName] // Retrieve the full note object
      if (!activeNotes.value.includes(noteName)) {
        activeNotes.value.push(noteName)
        if (instrumentType.value === 'midi') {
          const midiNote = note.midi
          if (output) {
            output.send([0x90, midiNote, 0x7f]) // Note on, velocity 127
          }
        } else if (simpleInstrument.value) {
          simpleInstrument.value.playNote({ name: noteName, ...note })
        }
      }
    }

    const handleNoteOff = (noteName) => {
      activeNotes.value = activeNotes.value.filter((n) => n !== noteName)
      const note = notes.value[noteName] // Retrieve the full note object
      if (instrumentType.value === 'midi') {
        const midiNote = note.midi
        if (output) {
          output.send([0x80, midiNote, 0x40]) // Note off, velocity 64
        }
      } else if (simpleInstrument.value) {
        simpleInstrument.value.stopNote({ name: noteName, ...note })
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

    const isBlackKey = (note) => note.includes('#')

    onUnmounted(() => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    })

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
      getKeyFromNote,
      simpleInstrument,
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
  z-index 1

.key-note.black
  width 30px
  height 100px
  background-color #000
  margin-left -15px
  margin-right -15px
  z-index 2
</style>
