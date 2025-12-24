<template>
  <div id="app">
    <ModelPicker v-if="!showTrial" @trial-ready="handleTrialReady" />
    <Trial v-else :case-code="caseCode" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import ModelPicker from './components/ModelPicker.vue'
import Trial from './components/Trial.vue'
import axios from 'axios'

const showTrial = ref(false)
const caseCode = ref(null)

const checkCaseStatus = async () => {
  const urlParams = new URLSearchParams(window.location.search)
  const caseCodeFromUrl = urlParams.get('case')
  
  if (caseCodeFromUrl) {
    try {
      const response = await axios.get(`/api/cases/${caseCodeFromUrl}`)
      const caseData = response.data
      
      // If both models and judge are selected, show trial
      if (caseData.model_1 && caseData.model_2 && caseData.judge_model) {
        caseCode.value = caseCodeFromUrl
        showTrial.value = true
      }
    } catch (error) {
      console.error('Error checking case status:', error)
    }
  }
}

const handleTrialReady = (code) => {
  caseCode.value = code
  showTrial.value = true
}

onMounted(() => {
  checkCaseStatus()
})
</script>

<style>
#app {
  width: 100%;
  height: 100vh;
  margin: 0;
  padding: 0;
}
</style>
