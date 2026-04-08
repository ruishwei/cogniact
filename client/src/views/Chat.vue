<template>
  <div class="chat-container">
    <div class="chat-sidebar">
      <div class="sidebar-header">
        <h3>Conversations</h3>
        <button @click="createConversation" class="btn btn-primary btn-sm">New</button>
      </div>

      <div class="conversation-list">
        <div
          v-for="conv in conversations"
          :key="conv.id"
          @click="selectConversation(conv.id)"
          :class="['conversation-item', { active: selectedConversationId === conv.id }]"
        >
          <div class="conversation-title">{{ conv.title || 'New Conversation' }}</div>
          <div class="conversation-meta">{{ formatDate(conv.updated_at) }}</div>
        </div>
      </div>
    </div>

    <div class="chat-main">
      <div v-if="!selectedConversationId" class="chat-empty">
        <div class="empty-icon">💬</div>
        <h2>Start a Conversation</h2>
        <p>Select a conversation or create a new one to begin chatting with your agent</p>
        <button @click="createConversation" class="btn btn-primary">New Conversation</button>
      </div>

      <div v-else class="chat-content">
        <div class="chat-header">
          <div>
            <h3>{{ currentConversation?.title || 'Conversation' }}</h3>
            <p>{{ currentConversation?.agents?.name || 'Agent' }}</p>
          </div>
          <button @click="showAgentSelector = true" class="btn btn-outline btn-sm">
            Change Agent
          </button>
        </div>

        <div class="messages-container" ref="messagesContainer">
          <div
            v-for="message in messages"
            :key="message.id"
            :class="['message', message.role]"
          >
            <div class="message-avatar">
              {{ message.role === 'user' ? '👤' : '🤖' }}
            </div>
            <div class="message-content">
              <div class="message-text" v-html="formatMessage(message.content)"></div>
              <div class="message-time">{{ formatTime(message.created_at) }}</div>
            </div>
          </div>

          <div v-if="loading" class="message assistant">
            <div class="message-avatar">🤖</div>
            <div class="message-content">
              <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>

        <div class="chat-input">
          <textarea
            v-model="newMessage"
            @keydown.enter.exact.prevent="sendMessage"
            placeholder="Type your message... (Press Enter to send)"
            class="textarea"
            rows="3"
          ></textarea>
          <button @click="sendMessage" :disabled="!newMessage.trim() || loading" class="btn btn-primary">
            Send
          </button>
        </div>
      </div>
    </div>

    <div v-if="showAgentSelector" class="modal-overlay" @click="showAgentSelector = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Select Agent</h3>
          <button @click="showAgentSelector = false" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div
            v-for="agent in agents"
            :key="agent.id"
            @click="changeAgent(agent.id)"
            class="agent-option"
          >
            <div class="agent-name">{{ agent.name }}</div>
            <div class="agent-model">{{ agent.model_name }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../lib/api';
import { marked } from 'marked';

const route = useRoute();
const router = useRouter();

const conversations = ref([]);
const messages = ref([]);
const agents = ref([]);
const selectedConversationId = ref(null);
const currentConversation = ref(null);
const newMessage = ref('');
const loading = ref(false);
const showAgentSelector = ref(false);
const messagesContainer = ref(null);

onMounted(async () => {
  await loadConversations();
  await loadAgents();

  if (route.params.conversationId) {
    await selectConversation(route.params.conversationId);
  }
});

watch(() => route.params.conversationId, async (newId) => {
  if (newId) {
    await selectConversation(newId);
  }
});

async function loadConversations() {
  try {
    conversations.value = await api.get('/conversations');
  } catch (error) {
    console.error('Failed to load conversations:', error);
  }
}

async function loadAgents() {
  try {
    agents.value = await api.get('/agents');
  } catch (error) {
    console.error('Failed to load agents:', error);
  }
}

async function selectConversation(conversationId) {
  try {
    selectedConversationId.value = conversationId;
    currentConversation.value = await api.get(`/conversations/${conversationId}`);
    messages.value = await api.get(`/conversations/${conversationId}/messages`);

    await nextTick();
    scrollToBottom();
  } catch (error) {
    console.error('Failed to load conversation:', error);
  }
}

async function createConversation() {
  try {
    if (agents.value.length === 0) {
      alert('Please create an agent first');
      router.push('/agents');
      return;
    }

    const conversation = await api.post('/conversations', {
      agent_id: agents.value[0].id,
      title: 'New Conversation',
    });

    await loadConversations();
    router.push(`/chat/${conversation.id}`);
  } catch (error) {
    console.error('Failed to create conversation:', error);
  }
}

async function sendMessage() {
  if (!newMessage.value.trim() || loading.value) return;

  const messageText = newMessage.value;
  newMessage.value = '';
  loading.value = true;

  try {
    const response = await api.post(`/conversations/${selectedConversationId.value}/messages`, {
      content: messageText,
      content_type: 'text',
    });

    messages.value.push(response.userMessage);
    messages.value.push(response.assistantMessage);

    await nextTick();
    scrollToBottom();
  } catch (error) {
    console.error('Failed to send message:', error);
    newMessage.value = messageText;
  } finally {
    loading.value = false;
  }
}

async function changeAgent(agentId) {
  try {
    await api.put(`/conversations/${selectedConversationId.value}`, {
      agent_id: agentId,
    });

    showAgentSelector.value = false;
    await selectConversation(selectedConversationId.value);
  } catch (error) {
    console.error('Failed to change agent:', error);
  }
}

function formatMessage(content) {
  return marked(content);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

function formatTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}
</script>

<style scoped>
.chat-container {
  display: flex;
  height: 100vh;
}

.chat-sidebar {
  width: 280px;
  background: white;
  border-right: 1px solid var(--gray-200);
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--gray-200);
}

.sidebar-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--gray-900);
}

.btn-sm {
  padding: 0.5rem 0.875rem;
  font-size: 0.8125rem;
}

.conversation-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-sm);
}

.conversation-item {
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition);
  margin-bottom: var(--spacing-xs);
}

.conversation-item:hover {
  background: var(--gray-50);
}

.conversation-item.active {
  background: var(--primary-50);
}

.conversation-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--gray-900);
  margin-bottom: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conversation-meta {
  font-size: 0.75rem;
  color: var(--gray-500);
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--gray-50);
}

.chat-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl);
  text-align: center;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-lg);
}

.chat-empty h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--gray-900);
  margin-bottom: var(--spacing-sm);
}

.chat-empty p {
  font-size: 1rem;
  color: var(--gray-600);
  margin-bottom: var(--spacing-xl);
}

.chat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-lg);
  background: white;
  border-bottom: 1px solid var(--gray-200);
}

.chat-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--gray-900);
}

.chat-header p {
  font-size: 0.875rem;
  color: var(--gray-600);
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-lg);
}

.message {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.message-content {
  flex: 1;
  max-width: 70%;
}

.message.user .message-content {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.message-text {
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  line-height: 1.5;
}

.message.user .message-text {
  background: var(--primary-600);
  color: white;
}

.message.assistant .message-text {
  background: white;
  color: var(--gray-900);
  border: 1px solid var(--gray-200);
}

.message-time {
  font-size: 0.75rem;
  color: var(--gray-500);
  margin-top: var(--spacing-xs);
  padding: 0 var(--spacing-sm);
}

.typing-indicator {
  display: flex;
  gap: 0.25rem;
  padding: var(--spacing-md);
}

.typing-indicator span {
  width: 0.5rem;
  height: 0.5rem;
  background: var(--gray-400);
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-0.5rem);
  }
}

.chat-input {
  padding: var(--spacing-lg);
  background: white;
  border-top: 1px solid var(--gray-200);
  display: flex;
  gap: var(--spacing-md);
  align-items: flex-end;
}

.chat-input .textarea {
  flex: 1;
  resize: none;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--gray-200);
}

.modal-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--gray-900);
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--gray-500);
  cursor: pointer;
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: var(--gray-900);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-lg);
}

.agent-option {
  padding: var(--spacing-md);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition);
  margin-bottom: var(--spacing-sm);
}

.agent-option:hover {
  background: var(--gray-50);
  border-color: var(--primary-300);
}

.agent-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--gray-900);
  margin-bottom: 0.25rem;
}

.agent-model {
  font-size: 0.75rem;
  color: var(--gray-600);
}
</style>
