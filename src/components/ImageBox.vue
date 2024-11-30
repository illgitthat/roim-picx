<template>
	<div class="w-full bg-rose-100 rounded-md shadow-sm overflow-hidden relative">
		<loading-overlay :loading="loading" />

		<el-image class="block w-full h-40 lg:h-60" :src="src" fit="cover" hide-on-click-modal @load="loading = false" />
		<div class="w-full absolute left-0 bottom-0 bg-slate-800/70 backdrop-blur-sm">
			<div class="p-2">
				<div class="w-full flex items-center text-white">
					<div class="flex-1 w-full truncate">
						<el-tooltip :content="name" placement="top-start">
							{{ name }}
						</el-tooltip>
					</div>
					<div v-if="mode === 'converted'" class="w-6 h-6 flex items-center justify-center cursor-pointer" @click="emit('delete')">
						<font-awesome-icon :icon="faTimesCircle" />
					</div>
				</div>
				<span class="text-xs text-gray-300 flex items-center">
					{{ formatBytes(size) }}
					<el-divider v-if="uploadedAt" direction="vertical" />
					<span v-if="uploadedAt">
						{{ new Date(uploadedAt).toLocaleDateString() }}
					</span>
				</span>
			</div>
			<div v-if="mode === 'uploaded'">
				<el-divider class="m-0" />
				<div class="w-full flex text-white h-9 text-center text-sm">
					<el-tooltip :content="copyUrl" placement="top-start"></el-tooltip>
					<div class="flex-1 flex items-center justify-center cursor-pointer" @click="copyLink(copyUrl)">
						<font-awesome-icon :icon="faCopy" class="mr-2" />
						Copy Link
					</div>
					<el-divider direction="vertical" class="h-full" />
					<el-popconfirm title="Are you sure you want to delete this image?" confirm-button-type="danger" @confirm="() => {
						// (e: Event) => boolean ???
						loading = true
						emit('delete')
						return true
					}
						">
						<template #reference>
							<div class="flex-1 flex items-center justify-center cursor-pointer">
								<font-awesome-icon :icon="faTrashAlt" class="mr-2" />
								Delete
							</div>
						</template>
					</el-popconfirm>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { faTimesCircle, faTrashAlt, faCopy } from '@fortawesome/free-regular-svg-icons'
import copy from 'copy-to-clipboard'
import formatBytes from '../utils/format-bytes'
import { ElTooltip, ElDivider, ElPopconfirm, ElImage, ElMessage } from 'element-plus'
import { ref } from 'vue'
import LoadingOverlay from '../components/LoadingOverlay.vue'

const props = defineProps<{
	src: string
	copyUrl: string
	name: string
	size: number
	mode: 'converted' | 'uploaded'
	uploadedAt?: number
	expiresAt?: number
}>()
const emit = defineEmits(['delete'])

const imageError = ref(false)
const loading = ref(true)
const copyLink = (link: string) => {
	const res = copy(link)
	if (res) {
		ElMessage.success('Link copied successfully')
	} else {
		ElMessage.success('Link copy failed')
	}
}
</script>
