<template>
  <div class="mx-auto max-w-6xl my-4 px-4 relative">
    <loading-overlay :loading="loading" />

    <div class="flex items-center justify-between mb-4">
      <div>
        <div class="text-gray-800 text-lg">Manage Images</div>
        <div class="text-sm text-gray-500">
          Loaded {{ uploadedImages.length }} images, totaling {{ formatBytes(imagesTotalSize) }}
        </div>
      </div>
      <div class="flex items-center gap-3">
        <button type="button" title="Add folder" class="text-3xl text-amber-400 disabled:cursor-not-allowed disabled:opacity-50" :disabled="loading || loadingMore || creatingFolder" @click="addFolder">
          <font-awesome-icon :icon="faFolderPlus" />
        </button>
        <button type="button" title="Refresh images" class="text-xl text-indigo-500 disabled:cursor-not-allowed disabled:opacity-50" :disabled="loading || loadingMore || creatingFolder" @click="listImages()">
          <font-awesome-icon :icon="faRedoAlt" />
        </button>
      </div>
    </div>

    <div v-if="prefixes.length" class="my-3 flex flex-wrap items-center gap-2">
      <button v-for="it in prefixes" :key="it" type="button" class="flex max-w-full items-center rounded-lg bg-white px-3 py-2 shadow-xs transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50" :disabled="loading || loadingMore" @click="changeFolder(it)">
        <font-awesome-icon :icon="faFolder" class="shrink-0 text-2xl text-amber-500" />
        <span class="truncate pl-2 text-sm text-gray-600">{{ it === '/' ? it : it.replaceAll('/', '') }}</span>
      </button>
    </div>

    <div v-if="loadError" class="my-6 rounded-lg border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">
      <div>{{ loadError }}</div>
      <button type="button" class="mt-3 rounded-md bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700" @click="listImages()">
        Try Again
      </button>
    </div>

    <div v-else-if="hasLoaded && uploadedImages.length === 0 && !hasMore" class="my-10 rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center">
      <div class="text-base font-medium text-gray-700">No images in this folder</div>
      <div class="mt-1 text-sm text-gray-500">Upload an image or choose another folder.</div>
    </div>

    <div v-else class="grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-4">
      <transition-group name="el-fade-in-linear">
        <div class="col-span-1" v-for="item in uploadedImages" :key="item.url">
          <image-box :src="item.url" :copyUrl="item.copyUrl" :name="item.key" :size="item.size" :deleting="deletingKeys.has(item.key)" @delete="deleteImage(item.key)" mode="uploaded" />
        </div>
      </transition-group>
    </div>

    <div v-if="loadMoreError" class="mt-6 rounded-lg border border-red-200 bg-red-50 p-3 text-center text-sm text-red-700">
      <div>{{ loadMoreError }}</div>
      <button type="button" class="mt-2 font-medium underline" @click="listImages(true)">
        Try loading more again
      </button>
    </div>

    <div v-else-if="hasMore && !loadError" class="mt-6 flex justify-center">
      <button type="button" class="rounded-md bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60" :disabled="loading || loadingMore" @click="listImages(true)">
        {{ loadingMore ? 'Loading...' : 'Load More' }}
      </button>
    </div>
    <div v-else-if="hasLoaded && uploadedImages.length > 0 && !loadError" class="mt-6 text-center text-sm text-gray-500">
      All images loaded
    </div>
  </div>
</template>

<script setup lang="ts">
import { requestListImages, requestDeleteImage, createFolder, getRequestErrorMessage } from '../utils/request'
import LoadingOverlay from '../components/LoadingOverlay.vue'
import formatBytes from '../utils/format-bytes'
import { computed, onMounted, ref } from 'vue'
import type { ImgItem, ImgReq, Folder } from '../utils/types'
import ImageBox from '../components/ImageBox.vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { faRedoAlt, faFolder, faFolderPlus } from '@fortawesome/free-solid-svg-icons'

const PAGE_SIZE = 100
const loading = ref(false)
const loadingMore = ref(false)
const creatingFolder = ref(false)
const hasLoaded = ref(false)
const hasMore = ref(false)
const loadError = ref('')
const loadMoreError = ref('')
const cursor = ref<string>()
const delimiter = ref('/')
const uploadedImages = ref<ImgItem[]>([])
const prefixes = ref<string[]>([])
const deletingKeys = ref(new Set<string>())
const imagesTotalSize = computed(() =>
  uploadedImages.value.reduce((total, item) => total + item.size, 0)
)

const updatePrefixes = (newPrefixes: string[] = [], append = false) => {
  const existing = append ? prefixes.value.filter((prefix) => prefix !== '/') : []
  const merged = [...new Set([...existing, ...newPrefixes])]
  prefixes.value = delimiter.value === '/' ? merged : ['/', ...merged]
}

const changeFolder = (path: string) => {
  if (loading.value || loadingMore.value || path === delimiter.value) return

  delimiter.value = path
  listImages()
}

const addFolder = () => {
  ElMessageBox.prompt('Please enter the folder name, only English names are supported', 'Add Folder', {
    confirmButtonText: 'Create',
    cancelButtonText: 'Cancel',
    inputPattern: /^[A-Za-z_]+$/,
    inputErrorMessage: 'Invalid folder name',
  }).then(async ({ value }) => {
    creatingFolder.value = true
    try {
      await createFolder(<Folder>{ name: value })
      ElMessage.success('Folder created successfully')
      await listImages()
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error) || 'Folder creation failed')
    } finally {
      creatingFolder.value = false
    }
  }).catch(() => {
    // Closing the prompt does not require an error message.
  })
}

const listImages = async (append = false) => {
  if (loading.value || loadingMore.value) return
  if (append && (!hasMore.value || !cursor.value)) return

  if (append) {
    loadMoreError.value = ''
    loadingMore.value = true
  } else {
    loadError.value = ''
    loadMoreError.value = ''
    loading.value = true
    cursor.value = undefined
    hasMore.value = false
  }

  try {
    const data = await requestListImages(<ImgReq>{
      limit: PAGE_SIZE,
      delimiter: delimiter.value,
      cursor: append ? cursor.value : undefined
    })

    uploadedImages.value = append
      ? [...uploadedImages.value, ...data.list]
      : data.list
    cursor.value = data.cursor
    hasMore.value = data.next && Boolean(data.cursor)
    updatePrefixes(data.prefixes, append)
    hasLoaded.value = true
  } catch (error) {
    const message = getRequestErrorMessage(error)
    if (append) {
      loadMoreError.value = message || 'Unable to load more images. Please try again.'
    } else {
      loadError.value = message || 'Unable to load images. Please check your connection and try again.'
    }
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

onMounted(() => {
  listImages()
})

const deleteImage = async (src: string) => {
  if (deletingKeys.value.has(src)) return

  deletingKeys.value.add(src)
  try {
    const deletedKey = await requestDeleteImage({ keys: src })
    uploadedImages.value = uploadedImages.value.filter((item) => item.key !== deletedKey)
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error) || 'Unable to delete the image. Please try again.')
  } finally {
    deletingKeys.value.delete(src)
  }
}
</script>
