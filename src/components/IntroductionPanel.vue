<script setup lang="ts">
import { ref, onMounted } from 'vue'
import introductionMd from '@/assets/introduction.md?raw'

const markdownContent = ref('')

const loadMarkdown = () => {
  markdownContent.value = parseMarkdown(introductionMd)
}

// Simple markdown parser for basic formatting
const parseMarkdown = (text: string): string => {
  return text
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    // Code
    .replace(/`(.*?)`/gim, '<code>$1</code>')
    // Lists
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    .replace(/^(\d+)\. (.*$)/gim, '<li>$2</li>')
    // Line breaks
    .replace(/\n\n/gim, '</p><p>')
    .replace(/\n/gim, '<br>')
    // Wrap in paragraphs
    .replace(/^(?!<[hlu])(.+)/gim, '<p>$1</p>')
    // Clean up list formatting
    .replace(/(<li>.*<\/li>)/gims, '<ul>$1</ul>')
    .replace(/<\/ul>\s*<ul>/gim, '')
}

onMounted(() => {
  loadMarkdown()
})
</script>

<template>
  <div class="introduction-panel">
    <div class="introduction-content" v-html="markdownContent"></div>
  </div>
</template>

<style scoped>
.introduction-panel {
  height: 100%;
  overflow-y: auto;
  padding: 3rem 2rem;
  background: #ffffff;
}

.introduction-content {
  max-width: 900px;
  margin: 0 auto;
  line-height: 1.5;
  color: #1f2937;
  font-size: 1rem;
}

.introduction-content :deep(h1) {
  color: #111827;
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  border-bottom: 3px solid #e5e7eb;
  padding-bottom: 0.75rem;
  letter-spacing: -0.025em;
}

.introduction-content :deep(h2) {
  color: #1f2937;
  font-size: 1.875rem;
  font-weight: 600;
  margin-top: 2.5rem;
  margin-bottom: 1.25rem;
  letter-spacing: -0.025em;
}

.introduction-content :deep(h3) {
  color: #374151;
  font-size: 1.5rem;
  font-weight: 600;
  margin-top: 2rem;
  margin-bottom: 1rem;
  letter-spacing: -0.025em;
}

.introduction-content :deep(p) {
  margin-bottom: 1.25rem;
  font-size: 1.125rem;
  line-height: 1.6;
  color: #374151;
}

.introduction-content :deep(ul) {
  margin-left: 0;
  margin-bottom: 1.5rem;
  padding-left: 1.5rem;
}

.introduction-content :deep(li) {
  margin-bottom: 0.75rem;
  font-size: 1.125rem;
  line-height: 1.5;
  color: #4b5563;
  list-style-type: disc;
}

.introduction-content :deep(strong) {
  font-weight: 600;
  color: #111827;
  font-size: 1.125rem;
}

.introduction-content :deep(code) {
  background: #f1f5f9;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-family: 'SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  font-size: 1rem;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.introduction-content :deep(em) {
  font-style: italic;
  color: #6b7280;
}
</style>
