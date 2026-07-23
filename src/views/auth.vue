<template>
  <div class="mx-auto max-w-6xl my-4 px-4 relative">
    <div class="mx-auto max-w-2xl mt-10">
      <el-input v-model="token" :disabled="loading" size="large" class="h-12" placeholder="Please enter the authentication token" show-password @input="errorMessage = ''" @keyup.enter="saveToken" />
      <div v-if="errorMessage" class="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
        {{ errorMessage }}
      </div>
      <el-button :loading="loading" :disabled="loading || !token.trim()" class="mt-4 w-full lg:w-6xl" size="large" type="primary" @click="saveToken">Save</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElInput, ElButton, ElMessage } from 'element-plus'
import storage from '../utils/storage'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { checkToken, getRequestErrorMessage } from '../utils/request'
const token = ref('')
const loading = ref(false)
const errorMessage = ref('')
const router = useRouter()
const saveToken = async () => {
  if (loading.value) return

  const trimmedToken = token.value.trim()
  errorMessage.value = ''
  if (!trimmedToken) {
    errorMessage.value = 'Please enter the token'
    ElMessage.error('Please enter the token')
    return
  }

  loading.value = true
  try {
    const res = await checkToken({
      token: trimmedToken
    })
    if (res) {
      storage.local.set('auth-token', trimmedToken)
      await router.push('/')
    } else {
      errorMessage.value = 'Invalid token'
      ElMessage.error('Invalid token')
    }
  } catch (error) {
    errorMessage.value = getRequestErrorMessage(error) || 'Unable to verify the token. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped></style>
