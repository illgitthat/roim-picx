<template>
	<div class="mx-auto max-w-6xl my-4 px-4">
		<div class="text-gray-800 text-lg">Upload Images</div>
		<div class="mb-4 text-sm text-gray-500">
			Each image should not exceed {{ formatBytes(imageSizeLimit) }}
		</div>

		<div class="border-2 border-dashed border-slate-400 rounded-md relative">
			<loading-overlay :loading="loading" />

			<div class="grid p-4 gap-4 grid-cols-4 min-h-[240px]" @drop.prevent="onFileDrop" @dragover.prevent>
				<div v-if="convertedImages.length === 0" class="absolute -z-10 left-0 top-0 w-full h-full flex items-center justify-center">
					<div class="text-gray-500">
						<font-awesome-icon :icon="faCopy" />
						Paste or drag images here
					</div>
				</div>

				<transition-group name="el-fade-in-linear">
					<div class="col-span-3 md:col-span-1" v-for="item in convertedImages" :key="item.tmpSrc">
						<image-box :src="item.tmpSrc" :size="item.file.size" :name="item.file.name" @delete="removeImage(item.tmpSrc)" mode="converted" />
					</div>
				</transition-group>
			</div>
		</div>
		<div class="w-full rounded-md shadow-xs overflow-hidden mt-4 grid grid-cols-8">
			<div class="md:col-span-1 col-span-8">
				<button type="button" class="flex h-10 w-full items-center justify-center bg-blue-500 text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60" :disabled="loading" @click="input?.click()">
					<font-awesome-icon :icon="faImages" class="mr-2" />
					Select Images
				</button>
			</div>

			<div class="md:col-span-4 col-span-8">
				<div class="w-full h-10 bg-slate-200 leading-10 px-4 text-center md:text-left">
					Selected {{ convertedImages.length }} images, total {{ formatBytes(imagesTotalSize) }}
				</div>
			</div>

			<div class="md:col-span-1 col-span-3">
				<button type="button" class="flex h-10 w-full items-center justify-center bg-red-500 text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60" :disabled="loading || convertedImages.length === 0" @click="clearInput">
					<font-awesome-icon :icon="faTrashAlt" class="mr-2" />
					Clear
				</button>
			</div>
			<div class="md:col-span-1 col-span-3">
				<button type="button" class="flex h-10 w-full items-center justify-center bg-sky-500 text-white hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60" :disabled="loading" @click="clipboardUpload">
					<font-awesome-icon :icon="faTrashAlt" class="mr-2" />
					Upload Clipboard
				</button>
			</div>
			<div class="md:col-span-1 col-span-5">
				<button type="button" class="flex h-10 w-full items-center justify-center bg-green-500 text-white hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60" :disabled="convertedImages.length === 0 || loading" @click="uploadImages">
					<font-awesome-icon :icon="faUpload" class="mr-2" />
					{{ loading ? 'Working...' : 'Upload' }}
				</button>
			</div>
		</div>
		<div v-if="uploadError" class="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
			{{ uploadError }}
		</div>
		<result-list v-show="imgResultList && imgResultList.length" :image-list="imgResultList" ref="resultList" class="mt-4" />
	</div>

	<input ref="input" type="file" accept="image/*" class="hidden" multiple @change="onInputChange" />
</template>

<script setup lang="ts">
import { faImages, faTrashAlt, faCopy } from '@fortawesome/free-regular-svg-icons'
import { faUpload } from '@fortawesome/free-solid-svg-icons'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import LoadingOverlay from '../components/LoadingOverlay.vue'
import formatBytes from '../utils/format-bytes'
import { ElNotification as elNotify, ElMessage } from 'element-plus'
import { requestUploadImages, getRequestErrorMessage } from '../utils/request'
import ImageBox from '../components/ImageBox.vue'
import ResultList from '../components/ResultList.vue'
import type { ConvertedImage, ImgItem } from '../utils/types'
const convertedImages = ref<ConvertedImage[]>([])
const imgResultList = ref<ImgItem[]>([])
const imagesTotalSize = computed(() =>
	convertedImages.value.reduce((total, item) => total + item.file.size, 0)
)

const imageSizeLimit = 20 * 1024 * 1024
const input = ref<HTMLInputElement>()
const loading = ref(false)
const uploadError = ref('')

const onInputChange = async () => {
	await appendConvertedImages(input.value?.files)
	if (input.value) input.value.value = ''
}
const onFileDrop = (e: DragEvent) => {
	if (loading.value) return
	appendConvertedImages(e.dataTransfer?.files)
}
const onPaste = (e: ClipboardEvent) => {
	if (loading.value) return
	appendConvertedImages(e.clipboardData?.files)
}

onMounted(() => {
	document.onpaste = onPaste
})

onUnmounted(() => {
	document.onpaste = null
	convertedImages.value.forEach((item) => URL.revokeObjectURL(item.tmpSrc))
})

const clearConvertedImages = () => {
	convertedImages.value.forEach((item) => URL.revokeObjectURL(item.tmpSrc))
	convertedImages.value = []
	if (input.value) input.value.value = ''
}

const clearInput = () => {
	if (loading.value) return
	clearConvertedImages()
	imgResultList.value = []
	uploadError.value = ''
}

const clipboardUpload = async () => {
	if (loading.value) return

	uploadError.value = ''
	loading.value = true
	try {
		if (!navigator.clipboard?.read) {
			throw new Error('Clipboard image access is not supported by this browser.')
		}

		const clipboardContents = await navigator.clipboard.read()
		let foundImage = false
		for (const item of clipboardContents) {
			if (item.types.includes("image/png")) {
				foundImage = true
				const blob = await item.getType("image/png")
				const file = new File([blob], "clipboard.png", {
					type: "image/png",
				})
				convertedImages.value = [
					...convertedImages.value,
					{
						file,
						tmpSrc: URL.createObjectURL(file)
					}
				]
			}
		}
		if (!foundImage) {
			ElMessage.warning('Clipboard does not contain a PNG image.')
		}
	} catch (error) {
		uploadError.value = error instanceof Error
			? error.message
			: 'Unable to read an image from the clipboard.'
	} finally {
		loading.value = false
	}
}

const appendConvertedImages = async (files: FileList | null | undefined) => {
	if (!files || loading.value) return

	uploadError.value = ''
	loading.value = true
	try {
		for (let i = 0; i < files.length; i++) {
			const file = files.item(i)
			if (!file) continue
			if (file.size > imageSizeLimit) {
				elNotify({
					message: `${file.name} is too large`,
					type: 'error'
				})
				continue
			}

			if (!file.type.startsWith('image/')) {
				elNotify({
					message: `${file.name} is not an image file`,
					type: 'error'
				})
				continue
			}

			convertedImages.value = [
				...convertedImages.value,
				{
					file,
					tmpSrc: URL.createObjectURL(file)
				}
			]
		}
	} finally {
		loading.value = false
	}
}

const removeImage = (tmpSrc: string) => {
	convertedImages.value = convertedImages.value.filter((item) => item.tmpSrc !== tmpSrc)
	URL.revokeObjectURL(tmpSrc)
}

const uploadImages = async () => {
	if (loading.value || convertedImages.value.length === 0) return

	uploadError.value = ''
	loading.value = true
	const formData = new FormData()
	for (let item of convertedImages.value) {
		formData.append('files', item.file)
	}
	const imageCount = convertedImages.value.length
	const totalSize = imagesTotalSize.value

	try {
		const res = await requestUploadImages(formData)
		elNotify({
			title: 'Upload Complete',
			message: `Total ${imageCount} images, ${formatBytes(totalSize)}`,
			type: 'success'
		})
		clearConvertedImages()
		imgResultList.value = res
	} catch (error) {
		uploadError.value = getRequestErrorMessage(error) || 'The upload could not be completed. Please try again.'
	} finally {
		loading.value = false
	}
}
</script>

<style>
.remove-now-btn .el-picker-panel__footer button:first-child {
	display: none;
}
</style>
