<template>
  <div class="mx-auto max-w-6xl my-4 px-4 relative">
    <div class="mx-auto max-w-2xl mt-10">
      <el-input v-model="token" size="large" class="h-12" placeholder="Please enter the authentication token" />
      <el-button :loading="loading" class="mt-4 w-full lg:w-6xl" size="large" type="primary" @click="saveToken">Save</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElInput, ElButton, ElMessage } from 'element-plus'
import storage from '../utils/storage'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { checkToken } from '../utils/request'
const token = ref('')
const loading = ref(false)
const router = useRouter()
const saveToken = () => {
  loading.value = true
  if (!token.value) {
    loading.value = false
    ElMessage.error('Please enter the token')
    return
  }
  checkToken({
    token: token.value
  }).then(res => {
    if (res) {
      // Check if the token is valid
      storage.local.set('auth-token', token.value)
      router.push('/')
    } else {
      ElMessage.error('Invalid token')
    }
  }).finally(() => {
    loading.value = false
  })

}
</script>

<style scoped></style>
