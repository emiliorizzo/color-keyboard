<template>
  <div class="simple-instrument">
    <button
      v-for="note in notes"
      :key="note"
      @mousedown="handleNoteOn(note)"
      @mouseup="handleNoteOff(note)"
    >
      {{ note }}
    </button>
  </div>
</template>

<script>
import { ref } from 'vue'
import { AudioInstrument } from '../utils/audioInstrument.js'

export default {
  name: 'SimpleInstrument',
  setup() {
    const notes = ref(['C', 'D', 'E', 'F', 'G', 'A', 'B']) // Add more notes as needed
    const instrument = new AudioInstrument()

    const handleNoteOn = (note) => {
      instrument.playNote(note)
    }

    const handleNoteOff = (note) => {
      instrument.stopNote(note)
    }

    return {
      notes,
      handleNoteOn,
      handleNoteOff,
    }
  },
}
</script>

<style scoped>
.simple-instrument {
  display: flex;
  gap: 10px;
}

button {
  padding: 10px;
  font-size: 16px;
  cursor: pointer;
}
</style>
