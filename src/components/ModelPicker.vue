<template>
  <div class="model-picker">
    <header class="main-header">
      <div class="header-content">
        <h1 class="header-logo">thecourthouse.ai</h1>
        <a href="/" class="new-case-btn">New Case</a>
        <a href="/leaderboard" class="leaderboard-btn">Leaderboard</a>
      </div>
    </header>

    <div class="draft-container">
      <div class="select-title-container">
        <h2 class="select-title">{{ caseData?.model_1 ? 'SELECT DEFENDANT MODEL' : 'SELECT PLANTIFF MODEL' }}</h2>
        <div class="case-code" v-if="caseCode">{{ caseCode }}</div>
      </div>
      <div class="models-grid" v-if="!loading && models.length > 0">
        <div
          v-for="model in models"
          :key="model.id"
          class="model-card"
          :class="{ selected: selectedModel?.id === model.id }"
          @click="selectModel(model)"
        >
          <div class="lawyer-image">
            <img 
              v-if="model.image_url" 
              :src="model.image_url" 
              :alt="model.lawyer_name"
              @error="handleImageError($event, model)"
            />
            <div 
              class="image-placeholder"
              :class="{ hidden: model.image_url && !imageErrors[model.id] }"
            >
              {{ model.lawyer_name.split(' ').map(n => n[0]).join('') }}
            </div>
            <div class="party-label plaintiff-label" v-if="caseData?.model_1 === model.id">
              PLAINTIFF
            </div>
            <div class="party-label defendant-label" v-if="caseData?.model_2 === model.id">
              DEFENDANT
            </div>
          </div>
          <div class="model-info">
            <div class="person-name">{{ model.lawyer_name }}</div>
            <div class="model-name">{{ model.name }}</div>
          </div>
          <div class="selection-indicator" v-if="selectedModel?.id === model.id">
            ✓
          </div>
        </div>
      </div>

      <div class="loading" v-if="loading">
        <div class="spinner"></div>
        <p>Loading models...</p>
      </div>

      <div class="error" v-if="error">
        <p>{{ error }}</p>
        <button @click="fetchModels" class="retry-btn">Retry</button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import api from '../api'

const emit = defineEmits(['trial-ready'])

const models = ref([])
const selectedModel = ref(null)
const loading = ref(true)
const error = ref(null)
const imageErrors = ref({})
const caseCode = ref(null)
const deviceId = ref(null)
const caseData = ref(null)

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

const initializeDeviceId = () => {
  let id = localStorage.getItem('device_id')
  if (!id) {
    id = generateUUID()
    localStorage.setItem('device_id', id)
  }
  deviceId.value = id
}

const checkUrlForCase = () => {
  const urlParams = new URLSearchParams(window.location.search)
  const caseCodeFromUrl = urlParams.get('case')
  
  if (caseCodeFromUrl) {
    caseCode.value = caseCodeFromUrl
    pollCase()
  } else {
    createCase()
  }
}

const createCase = async () => {
  try {
    const response = await api.post('/api/cases', {
      partyId: deviceId.value
    })
    caseCode.value = response.data.code
    caseData.value = response.data
    
    const url = new URL(window.location.href)
    url.searchParams.set('case', caseCode.value)
    window.history.pushState({ case: caseCode.value }, '', url.toString())
    
    pollCase()
  } catch (err) {
    console.error('Error creating case:', err)
  }
}

const pollCase = async () => {
  if (!caseCode.value) return
  
  try {
    const response = await api.get(`/api/cases/${caseCode.value}`, {
      params: { partyId: deviceId.value }
    })
    caseData.value = response.data
  } catch (err) {
    console.error('Error fetching case:', err)
  }
  
  setTimeout(() => pollCase(), 2000)
}

const fetchModels = async () => {
  loading.value = true
  error.value = null
  try {
    const response = await api.get('/api/models')
    models.value = response.data
  } catch (err) {
    console.error('Error fetching models:', err)
    error.value = 'Failed to load models. Please check your backend connection.'
  } finally {
    loading.value = false
  }
}

const selectModel = async (model) => {
  selectedModel.value = model
  
  if (caseCode.value && deviceId.value) {
    try {
      const response = await api.patch(`/api/cases/${caseCode.value}/model`, {
        partyId: deviceId.value,
        modelId: model.id
      })
      caseData.value = response.data
      const isDefendant = caseData.value?.model_1 !== null && caseData.value?.model_2 === model.id
      console.log(`Model selection saved as ${isDefendant ? 'defendant' : 'plaintiff'}:`, response.data)
    } catch (err) {
      console.error('Error saving model selection:', err)
    }
  }
}

const handleImageError = (event, model) => {
  imageErrors.value[model.id] = true
  event.target.style.display = 'none'
}

watch(caseData, (newData) => {
  if (newData && newData.model_1 && newData.model_2 && newData.judge_model) {
    emit('trial-ready', caseCode.value)
  }
}, { deep: true })

onMounted(() => {
  initializeDeviceId()
  checkUrlForCase()
  fetchModels()
})
</script>

<style scoped>
.model-picker {
  min-height: 100vh;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  position: relative;
  overflow-y: auto;
}

.main-header {
  position: absolute;
  top: 0;
  left: 0;
  padding: 1.5rem 2rem 1.5rem 2.5rem;
  padding-bottom: 0rem;
  z-index: 10;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.header-logo {
  font-size: 1.5rem;
  font-weight: 600;
  color: #fff;
  margin: 0;
  letter-spacing: 0.05em;
}

.new-case-btn {
  padding: 0.4rem 1rem;
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  color: #1a1a2e;
  text-decoration: none;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 10px rgba(255, 215, 0, 0.3);
}

.new-case-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(255, 215, 0, 0.5);
}

.new-case-btn:active {
  transform: translateY(0);
}

.leaderboard-btn {
  padding: 0.4rem 1rem;
  background: transparent;
  color: #ffd700;
  text-decoration: none;
  border-radius: 6px;
  border: 1px solid rgba(255, 215, 0, 0.5);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: background 0.2s, border-color 0.2s;
}

.leaderboard-btn:hover {
  background: rgba(255, 215, 0, 0.1);
  border-color: #ffd700;
}

.draft-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  padding-top: 5rem;
  width: 100%;
}

.select-title-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 1600px;
  padding: 0 1.25rem;
  margin-bottom: 1rem;
}

.select-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #fff;
  letter-spacing: 0.1em;
  margin: 0;
  text-align: left;
}

.case-code {
  font-size: 1.2rem;
  font-weight: 700;
  color: #ffd700;
  letter-spacing: 0.2em;
  font-family: 'Courier New', monospace;
  text-transform: uppercase;
}

.models-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1.5rem;
  width: 100%;
  max-width: 1600px;
  padding: 1rem;
}

.model-card {
  background: rgba(20, 20, 40, 0.8);
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.model-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 215, 0, 0) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.model-card:hover {
  transform: translateY(-5px) scale(1.03);
  border-color: rgba(255, 215, 0, 0.5);
  box-shadow: 0 8px 25px rgba(255, 215, 0, 0.3);
}

.model-card:hover::before {
  opacity: 1;
}

.model-card.selected {
  border-color: #ffd700;
  box-shadow: 0 0 30px rgba(255, 215, 0, 0.6);
  background: rgba(255, 215, 0, 0.1);
}

.model-card.selected::before {
  opacity: 1;
}

.lawyer-image {
  width: 100%;
  height: 180px;
  margin-bottom: 0.8rem;
  border-radius: 12px;
  overflow: hidden;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  border: 2px solid rgba(255, 215, 0, 0.3);
}

.lawyer-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
}

.image-placeholder {
  font-size: 3rem;
  font-weight: 900;
  color: rgba(0, 0, 0, 0.3);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-placeholder.hidden {
  display: none;
}

.model-info {
  color: #fff;
  text-align: center;
}

.person-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 0.4rem;
  text-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
  display: none;
}

.model-name {
  font-size: 0.9rem;
  font-weight: 500;
  color: #ffd700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.selection-indicator {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: #ffd700;
  color: #000;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.2rem;
  box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);
}

.party-label {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  padding: 0.4rem 0.8rem;
  border-radius: 15px;
  font-weight: 700;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
  z-index: 10;
}

.plaintiff-label {
  background: #4ade80;
  color: #000;
}

.defendant-label {
  background: #ef4444;
  color: #fff;
}

.loading, .error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #fff;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-top-color: #ffd700;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.retry-btn {
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  color: #000;
  border: none;
  padding: 1rem 2.5rem;
  font-size: 1.1rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);
}

.retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 215, 0, 0.6);
}

.retry-btn:active {
  transform: translateY(0);
}

@media (max-width: 1400px) {
  .models-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 1100px) {
  .models-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .draft-title {
    font-size: 2rem;
  }
  
  .models-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
  
  .model-picker {
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  .models-grid {
    grid-template-columns: 1fr;
  }
}
</style>
