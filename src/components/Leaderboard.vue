<template>
  <div class="leaderboard">
    <header class="main-header">
      <div class="header-content">
        <h1 class="header-logo">thecourthouse.ai</h1>
        <a href="/" class="new-case-btn">New Case</a>
      </div>
    </header>

    <div class="leaderboard-container">
      <h2 class="leaderboard-title">AI Model Leaderboard</h2>
      <p class="leaderboard-subtitle">Win rates from AI arbitration cases</p>

      <div class="leaderboard-table">
        <div class="table-header">
          <div class="col rank">#</div>
          <div class="col model">Model</div>
          <div class="col wins">Wins</div>
          <div class="col losses">Losses</div>
          <div class="col cases">Cases</div>
          <div class="col winrate">Win Rate</div>
        </div>

        <div 
          v-for="(model, index) in leaderboard" 
          :key="model.id" 
          class="table-row"
          :class="{ 'top-3': index < 3 }"
        >
          <div class="col rank">
            <span v-if="index === 0" class="medal gold">🥇</span>
            <span v-else-if="index === 1" class="medal silver">🥈</span>
            <span v-else-if="index === 2" class="medal bronze">🥉</span>
            <span v-else>{{ index + 1 }}</span>
          </div>
          <div class="col model">
            <img v-if="model.image_url" :src="model.image_url" :alt="model.name" class="model-avatar" />
            <div class="model-info">
              <span class="model-name">{{ model.name }}</span>
              <span class="model-company">{{ model.company }}</span>
            </div>
          </div>
          <div class="col wins">{{ model.wins }}</div>
          <div class="col losses">{{ model.losses }}</div>
          <div class="col cases">{{ model.total_cases }}</div>
          <div class="col winrate">
            <div class="winrate-bar">
              <div class="winrate-fill" :style="{ width: model.win_rate + '%' }"></div>
            </div>
            <span class="winrate-text">{{ model.win_rate }}%</span>
          </div>
        </div>

        <div v-if="leaderboard.length === 0" class="no-data">
          No case data yet. Start some trials!
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../api'

const leaderboard = ref([])

const fetchLeaderboard = async () => {
  try {
    const response = await api.get('/api/leaderboard')
    leaderboard.value = response.data
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
  }
}

onMounted(() => {
  fetchLeaderboard()
})
</script>

<style scoped>
.leaderboard {
  min-height: 100vh;
  padding: 1.5rem;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
}

.main-header {
  padding: 1.5rem 2rem;
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
}

.leaderboard-container {
  max-width: 900px;
  margin: 2rem auto;
  padding: 0 1rem;
}

.leaderboard-title {
  font-size: 2rem;
  font-weight: 700;
  color: #ffd700;
  text-align: center;
  margin-bottom: 0.5rem;
}

.leaderboard-subtitle {
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  margin-bottom: 2rem;
}

.leaderboard-table {
  background: rgba(20, 20, 40, 0.8);
  border-radius: 12px;
  border: 2px solid rgba(255, 215, 0, 0.2);
  overflow: hidden;
}

.table-header {
  display: grid;
  grid-template-columns: 60px 1fr 80px 80px 80px 150px;
  padding: 1rem;
  background: rgba(255, 215, 0, 0.1);
  border-bottom: 1px solid rgba(255, 215, 0, 0.2);
}

.table-header .col {
  font-size: 0.75rem;
  font-weight: 600;
  color: #ffd700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.table-row {
  display: grid;
  grid-template-columns: 60px 1fr 80px 80px 80px 150px;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  align-items: center;
  transition: background 0.2s;
}

.table-row:hover {
  background: rgba(255, 255, 255, 0.05);
}

.table-row.top-3 {
  background: rgba(255, 215, 0, 0.05);
}

.col {
  color: #fff;
  font-size: 0.9rem;
}

.col.rank {
  font-weight: 600;
  text-align: center;
}

.medal {
  font-size: 1.2rem;
}

.col.model {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.model-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 215, 0, 0.3);
}

.model-info {
  display: flex;
  flex-direction: column;
}

.model-name {
  font-weight: 600;
  color: #fff;
}

.model-company {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}

.col.wins {
  color: #4ade80;
  font-weight: 600;
}

.col.losses {
  color: #ef4444;
  font-weight: 600;
}

.col.winrate {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.winrate-bar {
  flex: 1;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.winrate-fill {
  height: 100%;
  background: linear-gradient(90deg, #ffd700, #ffed4e);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.winrate-text {
  font-weight: 700;
  color: #ffd700;
  min-width: 45px;
  text-align: right;
}

.no-data {
  padding: 3rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
}
</style>

