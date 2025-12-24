<template>
  <div class="trial">
    <header class="main-header">
      <div class="header-content">
        <h1 class="header-logo">thecourthouse.ai</h1>
        <a href="/" class="new-case-btn">New Case</a>
      </div>
    </header>
    
    <div class="trial-container">
      <div class="participants" v-if="caseData">
        <div class="participant plaintiff" v-if="plaintiffModel">
          <!-- {{  currentStateDef  }}
          {{  caseData  }} -->
          <h3>PLAINTIFF</h3> 
           <!--{{ showParty1Input? 'yes': 'no' }} -->
          <div class="model-card">
            <div class="model-image">
              <img v-if="plaintiffModel.image_url" :src="plaintiffModel.image_url" :alt="plaintiffModel.lawyer_name" />
              <img src="/images/deskphoto.png" alt="Desk" class="desk-overlay" />
              <div class="winner-badge" v-if="caseData?.winner === 1">
                <div class="winner-badge-content">WINNER</div>
              </div>
              <div class="response-box-overlay" v-if="latestParty1Response && !showParty1Input && !waitingForParty1">
                <div class="response-text">{{ latestParty1Response }}</div>
                <button @click="advanceTrial" class="next-btn" v-if="showNextButtonParty1">Next</button>
              </div>
              <div class="response-box-overlay waiting" v-else-if="waitingForParty1">
                <div class="response-text waiting-text">Waiting for response...</div>
              </div>
              <div class="input-box-overlay" v-if="showParty1Input">
                <div class="chat-input-container">
                  <input 
                    type="text"
                    v-model="party1Response" 
                    :placeholder="getParty1Placeholder()"
                    class="chat-input"
                    @keyup.enter="submitResponse('party_1')"
                  />
                  <button @click="submitResponse('party_1')" class="send-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            <div class="model-name">{{ plaintiffModel.name }}</div>
          </div>
        </div>
        
        <div class="participant judge" v-if="judgeModel">
          <h3>JUDGE</h3>
          <div class="model-card">
            <div class="model-image">
              <img v-if="judgeModel.image_url" :src="judgeModel.image_url" :alt="judgeModel.lawyer_name" />
              <img src="/images/judgedesk.png" alt="Judge Desk" class="judge-desk-overlay" />
              <div class="case-code-overlay" v-if="caseCode">{{ caseCode }}</div>
            </div>
            <div class="model-name">{{ judgeModel.name }}</div>
          </div>
          <div class="judge-question" v-if="latestJudgeQuestion">
            <div class="question-label">JUDGE SAYS:</div>
            <div class="question-content">{{ latestJudgeQuestion }}</div>
          </div>
        </div>
        
        <div class="participant defendant" v-if="defendantModel">
          <h3>DEFENDANT</h3> 
          <!-- {{ showParty2Input? 'yes': 'no' }} -->
          <div class="model-card">
            <div class="model-image">
              <img v-if="defendantModel.image_url" :src="defendantModel.image_url" :alt="defendantModel.lawyer_name" />
              <img src="/images/deskphoto.png" alt="Desk" class="desk-overlay" />
              <div class="winner-badge" v-if="caseData?.winner === 2">
                <div class="winner-badge-content">WINNER</div>
              </div>
              <div class="response-box-overlay" v-if="latestParty2Response && !showParty2Input && !waitingForParty2">
                <div class="response-text">{{ latestParty2Response }}</div>
                <button @click="advanceTrial" class="next-btn" v-if="showNextButtonParty2">Next</button>
              </div>
              <div class="response-box-overlay waiting" v-else-if="waitingForParty2">
                <div class="response-text waiting-text">Waiting for response...</div>
              </div>
             
              <div class="input-box-overlay" v-if="showParty2Input">
                <div class="chat-input-container">
                  <input 
                    type="text"
                    v-model="party2Response" 
                    :placeholder="getParty2Placeholder()"
                    class="chat-input"
                    @keyup.enter="submitResponse('party_2')"
                  />
                  <button @click="submitResponse('party_2')" class="send-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            <div class="model-name">{{ defendantModel.name }}</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Transcript Button -->
    <button class="transcript-btn" @click="showTranscriptOverlay = true">
      View Transcript
    </button>
    
    <!-- Transcript Overlay -->
    <div class="transcript-overlay" v-if="showTranscriptOverlay" @click.self="showTranscriptOverlay = false">
      <div class="transcript-modal">
        <div class="transcript-header">
          <h2>Transcript</h2>
          <button class="close-btn" @click="showTranscriptOverlay = false">×</button>
        </div>
        <div class="transcript-content">
          <div 
            v-for="entry in transcript" 
            :key="entry.id" 
            class="transcript-entry"
            :class="entry.role"
          >
            <div class="transcript-role">{{ getRoleLabel(entry.role) }}</div>
            <div class="transcript-text">{{ entry.content }}</div>
            <div class="transcript-time">{{ formatTime(entry.created_at) }}</div>
          </div>
          <div v-if="transcript.length === 0" class="transcript-empty">
            No transcript entries yet.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../api'

const props = defineProps({
  caseCode: {
    type: String,
    required: true
  }
})

const caseData = ref(null)
const models = ref([])
const states = ref([])
const deviceId = ref(null)
const transcript = ref([])
const party1Response = ref('')
const party2Response = ref('')
const showTranscriptOverlay = ref(false)

// Computed properties to assign models based on caseData IDs
const plaintiffModel = computed(() => {
  if (!caseData.value?.model_1 || !models.value.length) return null
  return models.value.find(m => m.id === caseData.value.model_1)
})

const defendantModel = computed(() => {
  if (!caseData.value?.model_2 || !models.value.length) return null
  return models.value.find(m => m.id === caseData.value.model_2)
})

const judgeModel = computed(() => {
  if (!caseData.value?.judge_model || !models.value.length) return null
  return models.value.find(m => m.id === caseData.value.judge_model)
})

// Computed property to get latest judge question
const latestJudgeQuestion = computed(() => {
  if (!transcript.value || transcript.value.length === 0) return null
  const judgeEntries = transcript.value.filter(t => t.role === 'judge')
  if (judgeEntries.length === 0) return null
  const latest = judgeEntries[judgeEntries.length - 1]
  return latest ? latest.content : null
})

// Get current state definition from states array
const currentStateDef = computed(() => {
  if (!caseData.value?.trial_state || !states.value.length) return null
  return states.value.find(s => s.name === caseData.value.trial_state)
})

// Computed property to check if party_1 input should be shown
const showParty1Input = computed(() => {
  if (!deviceId.value || !caseData.value) return false
  const isParty1 = caseData.value.party_device_1 === deviceId.value
  if (!isParty1) return false
  
  const stateDef = currentStateDef.value
  if (!stateDef) return false
  
  // Show input if current state is for party_1 and ai is false
  return stateDef.role === 'party_1' && stateDef.ai === false
})

// Computed property to check if party_2 input should be shown
const showParty2Input = computed(() => {
  if (!deviceId.value || !caseData.value) return false
  const isParty2 = caseData.value.party_device_2 === deviceId.value
  if (!isParty2) return false
  
  const stateDef = currentStateDef.value
  if (!stateDef) return false
  
  // Show input if current state is for party_2 and ai is false
  return stateDef.role === 'party_2' && stateDef.ai === false
})

// Computed property to check if we're waiting for party_1 response (for other viewers)
const waitingForParty1 = computed(() => {
  const stateDef = currentStateDef.value
  if (!stateDef) return false
  
  // State requires party_1 input but current device is not party_1
  if (stateDef.role === 'party_1' && stateDef.ai === false) {
    const isParty1 = caseData.value?.party_device_1 === deviceId.value
    return !isParty1
  }
  return false
})

// Computed property to check if we're waiting for party_2 response (for other viewers)
const waitingForParty2 = computed(() => {
  const stateDef = currentStateDef.value
  if (!stateDef) return false
  
  // State requires party_2 input but current device is not party_2
  if (stateDef.role === 'party_2' && stateDef.ai === false) {
    const isParty2 = caseData.value?.party_device_2 === deviceId.value
    return !isParty2
  }
  return false
})

// Computed property to get latest party_1 response
const latestParty1Response = computed(() => {
  if (!transcript.value || transcript.value.length === 0) return null
  const party1Entries = transcript.value.filter(t => t.role === 'party_1')
  if (party1Entries.length === 0) return null
  const latest = party1Entries[party1Entries.length - 1]
  return latest ? latest.content : null
})

// Computed property to get latest party_2 response
const latestParty2Response = computed(() => {
  if (!transcript.value || transcript.value.length === 0) return null
  const party2Entries = transcript.value.filter(t => t.role === 'party_2')
  if (party2Entries.length === 0) return null
  const latest = party2Entries[party2Entries.length - 1]
  return latest ? latest.content : null
})

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

const fetchCase = async () => {
  try {
    const response = await api.get(`/api/cases/${props.caseCode}`, {
      params: { partyId: deviceId.value }
    })
    caseData.value = JSON.parse(JSON.stringify(response.data))
    console.log('Case data fetched:', caseData.value)
  } catch (error) {
    console.error('Error fetching case:', error)
  }
}

const fetchModels = async () => {
  try {
    const response = await api.get('/api/models')
    models.value = response.data
    console.log('Models fetched:', models.value.length)
  } catch (error) {
    console.error('Error fetching models:', error)
  }
}

const fetchTranscript = async () => {
  if (!caseData.value?.id) return
  
  try {
    const response = await api.get(`/api/transcript/case/${caseData.value.id}`)
    transcript.value = response.data || []
    console.log('Transcript fetched:', transcript.value.length, 'entries')
  } catch (error) {
    console.error('Error fetching transcript:', error)
  }
}

const fetchStates = async () => {
  try {
    const response = await api.get('/api/state-machine/states')
    states.value = response.data || []
    console.log('States fetched:', states.value.length, 'states')
  } catch (error) {
    console.error('Error fetching states:', error)
  }
}

const submitResponse = async (role) => {
  if (!caseData.value?.id) {
    console.error('No case ID available')
    return
  }
  
  const content = role === 'party_1' ? party1Response.value.trim() : party2Response.value.trim()
  if (!content) {
    console.error('No content to submit')
    return
  }
  
  try {
    const response = await api.post('/api/transcript', {
      caseId: caseData.value.id,
      role,
      content
    })
    console.log('Response submitted:', response.data)
    
    // Clear the appropriate response field
    if (role === 'party_1') {
      party1Response.value = ''
    } else {
      party2Response.value = ''
    }
    
    await advanceTrial()
   
  } catch (error) {
    console.error('Error submitting response:', error)
    if (error.response) {
      console.error('Error response:', error.response.data)
    }
  }
}

const getRoleLabel = (role) => {
  const labels = {
    'judge': 'JUDGE',
    'party_1': 'PLAINTIFF',
    'party_2': 'DEFENDANT'
  }
  return labels[role] || role.toUpperCase()
}

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const advanceTrial = async () => {
  if (!caseData.value?.id) {
    console.error('No case ID available')
    return
  }
  
  try {
    const response = await api.post(`/api/state-machine/${caseData.value.id}`)
    console.log('State machine advanced:', response.data)
    
    await fetchCase()
    await fetchTranscript()
  } catch (error) {
    console.error('Error advancing trial:', error)
    if (error.response) {
      console.error('Error response:', error.response.data)
    }
  }
}

// Computed property to show Next button for party_1
const showNextButtonParty1 = computed(() => {
  if (!caseData.value || !deviceId.value) return false
  const isParty1 = caseData.value.party_device_1 === deviceId.value
  if (!isParty1) return false
  
  const stage = caseData.value.trial_state
  const party1Entries = transcript.value.filter(t => t.role === 'party_1')
  
  // Show Next button after party_1 responds to q1 (2 entries: complaint + q1)
  if (stage === 'party_1_q1' && party1Entries.length >= 2) {
    return true
  }
  
  // Show Next button after party_1 responds to q2 (3 entries: complaint + q1 + q2)
  if (stage === 'party_1_q2' && party1Entries.length >= 3) {
    return true
  }
  
  return false
})

// Computed property to show Next button for party_2
const showNextButtonParty2 = computed(() => {
  if (!caseData.value || !deviceId.value) return false
  const isParty2 = caseData.value.party_device_2 === deviceId.value
  if (!isParty2) return false
  
  const stage = caseData.value.trial_state
  const party2Entries = transcript.value.filter(t => t.role === 'party_2')
  
  // Show Next button after party_2 responds to q1 (2 entries: defense + q1)
  if (stage === 'party_2_q1' && party2Entries.length >= 2) {
    return true
  }
  
  // Show Next button after party_2 responds to q2 (3 entries: defense + q1 + q2)
  if (stage === 'party_2_q2' && party2Entries.length >= 3) {
    return true
  }
  
  return false
})

const showNextButton = computed(() => {
  return showNextButtonParty1.value || showNextButtonParty2.value
})

const getParty1Placeholder = () => {
  if (!caseData.value) return 'Enter your response...'
  const stage = caseData.value.trial_state
  if (stage === 'complaint') return 'Enter your complaint...'
  if (stage === 'party_1_q1') return 'Enter your response to the question...'
  if (stage === 'party_1_q2') return 'Enter your response to the question...'
  return 'Enter your response...'
}

const getParty2Placeholder = () => {
  if (!caseData.value) return 'Enter your response...'
  const stage = caseData.value.trial_state
  if (stage === 'defense') return 'Enter your defense...'
  if (stage === 'party_2_q1') return 'Enter your response to the question...'
  if (stage === 'party_2_q2') return 'Enter your response to the question...'
  return 'Enter your response...'
}

onMounted(async () => {
  initializeDeviceId()
  await fetchCase()
  await fetchModels()
  await fetchTranscript()
  await fetchStates()


  setInterval(function() {
    fetchTranscript()
    fetchCase()
  }, 2000)
})
</script>

<style scoped>
.trial {
  min-height: 100vh;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
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

.trial-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 2rem;
  width: 100%;
}

.participants {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  width: 100%;
  max-width: 1400px;
  padding: 2rem;
}

.participants .participant.plaintiff,
.participants .participant.defendant {
  padding-top: 6rem;
}

.participant {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.desk {
  width: 100%;
  height: 60px;
  margin-bottom: 1rem;
  border-radius: 8px;
  position: relative;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.normal-desk {
  background: linear-gradient(135deg, #8b7355 0%, #6b5d4f 100%);
  border: 2px solid #5a4a3a;
}

.judge-desk {
  background: linear-gradient(135deg, #d4af37 0%, #b8941f 100%);
  border: 2px solid #8b6914;
  height: 80px;
  box-shadow: 0 6px 20px rgba(212, 175, 55, 0.4);
}

.desk::before {
  content: '';
  position: absolute;
  top: -5px;
  left: 10%;
  right: 10%;
  height: 8px;
  background: inherit;
  border-radius: 4px;
  opacity: 0.8;
}

.participant h3 {
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 0.75rem;
}

.participant.plaintiff h3 {
  color: #4ade80;
}

.participant.defendant h3 {
  color: #ef4444;
}

.participant.judge h3 {
  color: #ffd700;
}

.model-card {
  background: rgba(20, 20, 40, 0.8);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1rem;
  width: 100%;
  text-align: center;
  backdrop-filter: blur(10px);
  position: relative;
  overflow: visible;
}

.model-image {
  width: 100%;
  height: 250px;
  margin-bottom: 1.5rem;
  border-radius: 15px;
  overflow: visible;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  border: 2px solid rgba(255, 215, 0, 0.3);
}

.model-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
}

.judge-desk-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  z-index: 10;
}

.case-code-overlay {
  position: absolute;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: #ffd700;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  font-family: 'Courier New', monospace;
  text-transform: uppercase;
  z-index: 20;
  border: 2px solid rgba(255, 215, 0, 0.5);
}

.desk-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  z-index: 10;
}

.winner-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 50%, #ffd700 100%);
  border: 4px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 4px 20px rgba(255, 215, 0, 0.6), 0 0 30px rgba(255, 215, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 25;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 4px 20px rgba(255, 215, 0, 0.6), 0 0 30px rgba(255, 215, 0, 0.4);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 6px 25px rgba(255, 215, 0, 0.8), 0 0 40px rgba(255, 215, 0, 0.6);
  }
}

.winner-badge-content {
  color: #1a1a2e;
  font-size: 0.7rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  text-align: center;
  line-height: 1.2;
}

.model-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: #ffd700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  margin-bottom: 0.25rem;
}

.lawyer-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #fff;
  margin-top: 0.5rem;
}

.input-box-overlay {
  position: absolute;
  bottom: 0.5rem;
  left: 0.5rem;
  right: 0.5rem;
  width: calc(100% - 1rem);
  padding: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  z-index: 30;
}

.chat-input-container {
  display: flex;
  align-items: center;
  background: #f5f5f0;
  border: 2px solid rgba(255, 215, 0, 0.4);
  border-radius: 25px;
  padding: 0.5rem 0.5rem 0.5rem 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.chat-input-container:focus-within {
  border-color: rgba(255, 215, 0, 0.8);
  box-shadow: 0 2px 8px rgba(255, 215, 0, 0.2);
}

.chat-input {
  flex: 1;
  background: transparent;
  border: none;
  color: #2a2a2a;
  font-size: 0.95rem;
  font-family: inherit;
  outline: none;
  padding: 0.25rem 0;
}

.chat-input::placeholder {
  color: #888;
}

.send-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  color: #1a1a2e;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  flex-shrink: 0;
}

.send-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
}

.send-btn:active {
  transform: scale(0.95);
}

.send-btn svg {
  margin-left: 2px;
}

.response-box-overlay {
  position: absolute;
  bottom: 0.5rem;
  left: 0.5rem;
  right: 0.5rem;
  width: calc(100% - 1rem);
  padding: 0;
  z-index: 15;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  box-sizing: border-box;
}

.response-text {
  color: #2a2a2a;
  font-size: 0.85rem;
  line-height: 1.4;
  margin-bottom: 0.5rem;
  padding: 0.75rem;
  background: #f5f5f0;
  border-radius: 12px;
  border: 2px solid rgba(255, 215, 0, 0.4);
}

.waiting-text {
  font-style: italic;
  color: #666;
  text-align: center;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.response-textarea {
  width: 100%;
  min-height: 100px;
  max-height: 150px;
  padding: 0.75rem;
  border-radius: 8px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  background: rgba(20, 20, 40, 0.95);
  color: #fff;
  font-size: 0.9rem;
  font-family: inherit;
  resize: vertical;
  margin-bottom: 0.5rem;
  box-sizing: border-box;
}

.response-textarea:focus {
  outline: none;
  border-color: #ffd700;
}

.response-textarea::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.next-btn {
  width: 100%;
  padding: 0.6rem 1.2rem;
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  color: #1a1a2e;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: transform 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.next-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
}

.next-btn:active {
  transform: translateY(0);
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
}

.submit-btn:active {
  transform: translateY(0);
}

.judge-question {
  margin-top: 0.75rem;
  width: 100%;
  max-width: 350px;
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 8px;
  padding: 0.75rem;
}

.question-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #ffd700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 0.35rem;
}

.question-content {
  font-size: 0.85rem;
  color: #fff;
  line-height: 1.4;
}

.transcript-btn {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  color: #1a1a2e;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);
  transition: transform 0.2s, box-shadow 0.2s;
  z-index: 100;
}

.transcript-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 215, 0, 0.6);
}

.transcript-btn:active {
  transform: translateY(0);
}

.transcript-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(5px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  overflow-y: auto;
}

.transcript-modal {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  border: 3px solid rgba(255, 215, 0, 0.3);
  border-radius: 20px;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.transcript-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 2px solid rgba(255, 215, 0, 0.3);
}

.transcript-header h2 {
  font-size: 1.8rem;
  font-weight: 700;
  color: #ffd700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin: 0;
}

.close-btn {
  background: transparent;
  border: none;
  color: #fff;
  font-size: 2.5rem;
  font-weight: 300;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.transcript-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem 2rem;
}

.transcript-entry {
  margin-bottom: 1.5rem;
  padding: 1.5rem;
  background: rgba(20, 20, 40, 0.6);
  border-radius: 10px;
  border-left: 4px solid;
}

.transcript-entry.judge {
  border-left-color: #ffd700;
}

.transcript-entry.party_1 {
  border-left-color: #4ade80;
}

.transcript-entry.party_2 {
  border-left-color: #ef4444;
}

.transcript-role {
  font-size: 0.9rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 0.5rem;
}

.transcript-entry.judge .transcript-role {
  color: #ffd700;
}

.transcript-entry.party_1 .transcript-role {
  color: #4ade80;
}

.transcript-entry.party_2 .transcript-role {
  color: #ef4444;
}

.transcript-text {
  font-size: 1rem;
  color: #fff;
  line-height: 1.6;
  margin-bottom: 0.5rem;
}

.transcript-time {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
  font-family: 'Courier New', monospace;
}

.transcript-empty {
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  padding: 3rem;
  font-size: 1.1rem;
}
</style>
