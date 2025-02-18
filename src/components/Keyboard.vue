<template lang="pug">
  .keyboard-container
    .keyboard-header
      select(@change="onInstrumentTypeChange($event)" v-model="instrumentType")
        option(value="midi") MIDI
        option(value="simple") Simple Instrument

      select(@change="onProgramChange($event)" v-model="selectedProgram" v-if="instrumentType === 'midi'")
        option(v-for="(program, index) in programs" :key="index" :value="index") {{ program }}

    .keyboard
      KeyNote(v-for="(note, index) in notes" :key="note" :note="note" :isActive="activeNotes.includes(note)" :class="{ black: isBlackKey(note) }"  @note-on="handleNoteOn" @note-off="handleNoteOff") @note-off="handleNoteOff")
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
    const notes = ref(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']) // Add semitones
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
        changeInstrument(selectedProgram.value) // Set initial instrument
      } catch (err) {
        console.error('Could not access MIDI devices:', err)
      }
    })

    const noteToMidi = (note) => {
      const noteMap = {
        C: 60,
        D: 62,
        E: 64,
        F: 65,
        G: 67,
        A: 69,
        B: 71,
      }
      return noteMap[note]
    }

    const handleNoteOn = (note) => {
      if (instrumentType.value === 'midi') {
        if (!activeNotes.value.includes(note)) {
          activeNotes.value.push(note)
          const midiNote = noteToMidi(note)
          if (output) {
            output.send([0x90, midiNote, 0x7f]) // Note on, velocity 127
          }
        }
      } else {
        simpleInstrument.playNote(note)
      }
    }

    const handleNoteOff = (note) => {
      if (instrumentType.value === 'midi') {
        activeNotes.value = activeNotes.value.filter((n) => n !== note)
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
  background-color #fff
  z-index 1


.key-note.black
  width 30px
  height 100px
  background-color #000
  margin-left -15px
  margin-right -15px
  z-index 2
  color white

.key-note.active
  background-color #f00
</style>
